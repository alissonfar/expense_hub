import { Request, Response } from 'express';
import { CreateMembroInput, UpdateMembroInput, MembroParamsInput, ListMembrosQueryInput } from '../schemas/pessoa';
import { AtivarConviteInput, ReenviarConviteInput } from '../schemas/auth';
import { prisma as globalPrisma } from '../utils/prisma';
import { Prisma } from '@prisma/client';
import { generateInviteToken, hashPassword, validatePasswordStrength } from '../utils/password';
import { getEmailService } from '../services/emailService';

// =============================================
// CONTROLLER DE MEMBROS DO HUB
// =============================================

/**
 * Lista todos os membros do Hub atual.
 */
export const listMembros = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.auth) {
      res.status(401).json({ error: 'NaoAutenticado', message: 'Autenticação necessária.' });
      return;
    }
    const { page = 1, limit = 1000, ativo, role } = req.query as unknown as ListMembrosQueryInput;
    const { hubId } = req.auth;

    // FORÇAR FILTRO PADRÃO: Sempre mostrar membros ativos e convites pendentes
    const where: Prisma.membros_hubWhereInput = { 
      hubId, 
      ativo: true,
      pessoa: {
        OR: [
          { ativo: true },
          { conviteAtivo: true }
        ]
      }
    };
    
    // Ignorar filtro 'ativo' vindo da query para evitar inconsistências
    // if (ativo === false) {
    //   where.ativo = false;
    // }
    
    if (role) where.role = role;

    const offset = (page - 1) * limit;

    const [membros, total] = await req.prisma.$transaction([
      req.prisma.membros_hub.findMany({
        where,
        include: {
          pessoa: {
            select: { id: true, nome: true, email: true, telefone: true, ativo: true, conviteAtivo: true, conviteToken: true }
          }
        },
        orderBy: { pessoa: { nome: 'asc' } },
        skip: offset,
        take: limit,
      }),
      req.prisma.membros_hub.count({ where })
    ]);

    // Log de depuração
    console.log('DEBUG_LIST_MEMBROS', {
      hubId,
      where,
      membrosCount: membros.length,
      membrosPreview: membros.map(m => ({
        pessoaId: m.pessoaId,
        nome: m.pessoa?.nome,
        email: m.pessoa?.email,
        conviteAtivo: m.pessoa?.conviteAtivo,
        conviteToken: m.pessoa?.conviteToken
      }))
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: membros,
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao listar membros:', error);
    res.status(500).json({ error: 'ErroInterno', message: 'Não foi possível listar os membros do Hub.' });
  }
};

/**
 * Convida/adiciona um novo membro a um Hub.
 */
export const convidarMembro = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.auth) {
      res.status(401).json({ error: 'NaoAutenticado', message: 'Autenticação necessária.' });
      return;
    }
    const { email, nome, role, dataAccessPolicy }: CreateMembroInput = req.body;
    const { hubId } = req.auth;

    const membroExistente = await req.prisma.membros_hub.findFirst({
      where: { hubId, pessoa: { email } }
    });

    if (membroExistente) {
      res.status(409).json({ error: 'MembroJaExiste', message: 'Uma pessoa com este email já é membro deste Hub.' });
      return;
    }
    
    // Buscar informações do Hub e do convidador
    const [hub, convidador] = await Promise.all([
      req.prisma.hub.findUnique({ where: { id: hubId }, select: { nome: true } }),
      req.prisma.pessoas.findUnique({ where: { id: req.auth.pessoaId }, select: { nome: true } })
    ]);

    if (!hub) {
      res.status(404).json({ error: 'HubNaoEncontrado', message: 'Hub não encontrado.' });
      return;
    }

    const novoMembro = await globalPrisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Gerar token de convite seguro
      const conviteToken = generateInviteToken();
      const conviteExpiraEm = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

      const pessoa = await tx.pessoas.upsert({
        where: { email },
        update: {
          // Se a pessoa já existe mas não tem senha, gerar novo convite
          conviteToken,
          conviteExpiraEm,
          conviteAtivo: true,
          senha_hash: null, // SEMPRE null quando há convite ativo
          ...(nome && { nome }) // Só atualizar nome se fornecido
        },
        create: {
          email,
          nome,
          senha_hash: null, // Sem senha até ativação
          conviteToken,
          conviteExpiraEm,
          conviteAtivo: true
        }
      });

      return tx.membros_hub.create({
        data: {
          hubId,
          pessoaId: pessoa.id,
          role,
          ativo: true,
          dataAccessPolicy: (role === 'COLABORADOR' ? dataAccessPolicy : null) as any,
        },
        include: {
          pessoa: { select: { id: true, nome: true, email: true, conviteToken: true }}
        }
      });
    });

    // ENVIAR EMAIL DE CONVITE
    let emailResult: { success: boolean; error?: string } = { success: false, error: 'Sistema de email não configurado' };
    try {
      const emailService = getEmailService();
      emailResult = await emailService.sendInviteEmail({
        to: email,
        nome: nome || 'Usuário',
        hubNome: hub.nome,
        conviteToken: novoMembro.pessoa.conviteToken!,
        convidadorNome: convidador?.nome || 'Administrador'
      });

      if (emailResult.success) {
        console.log(`✅ Email de convite enviado com sucesso para ${email}`);
      } else {
        console.error('❌ Falha no envio de email de convite:', emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Erro inesperado no envio de email:', emailError);
      emailResult = { success: false, error: 'Erro interno no envio de email' };
    }

    res.status(201).json({
      success: true,
      message: emailResult.success 
        ? 'Membro convidado com sucesso para o Hub. Um convite foi enviado para o email.'
        : 'Membro convidado com sucesso, mas houve um problema no envio do email. O convite pode ser reenviado posteriormente.',
      data: {
        ...novoMembro,
        conviteToken: novoMembro.pessoa.conviteToken, // Incluir token para testes
        emailSent: emailResult.success,
        emailError: emailResult.error
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao convidar membro:', error);
    res.status(500).json({ error: 'ErroInterno', message: 'Não foi possível convidar o membro.' });
  }
};

/**
 * Busca detalhes de um membro específico do Hub.
 */
export const getMembro = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.auth) {
      res.status(401).json({ error: 'NaoAutenticado', message: 'Autenticação necessária.' });
      return;
    }
    const { id: pessoaId } = req.params as unknown as MembroParamsInput;
    const { hubId } = req.auth;

    const membro = await req.prisma.membros_hub.findUnique({
      where: { hubId_pessoaId: { hubId, pessoaId } },
      include: {
        pessoa: { select: { id: true, nome: true, email: true, telefone: true, ativo: true } }
      }
    });

    if (!membro) {
      res.status(404).json({ error: 'MembroNaoEncontrado', message: 'Membro não encontrado neste Hub.' });
      return;
    }
    
    res.json({ success: true, data: membro, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Erro ao buscar membro:', error);
    res.status(500).json({ error: 'ErroInterno', message: 'Não foi possível obter detalhes do membro.' });
  }
};

/**
 * Atualiza dados de um membro do Hub (role, status).
 */
export const updateMembro = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.auth) {
      res.status(401).json({ error: 'NaoAutenticado', message: 'Autenticação necessária.' });
      return;
    }
    const { id: pessoaId } = req.params as unknown as MembroParamsInput;
    const { role, ativo, dataAccessPolicy }: UpdateMembroInput = req.body;
    const { hubId } = req.auth;

    // Verificar se o usuário é proprietário através do MembroHub
    const proprietario = await req.prisma.membros_hub.findFirst({
      where: { hubId, role: 'PROPRIETARIO', ativo: true },
      select: { pessoaId: true }
    });

    if (proprietario?.pessoaId === pessoaId) {
      res.status(403).json({ error: 'AcaoProibida', message: 'O proprietário do Hub não pode ser modificado.' });
      return;
    }

    const dataToUpdate: Prisma.membros_hubUpdateInput = {};
    if (role !== undefined) dataToUpdate.role = role;
    if (ativo !== undefined) dataToUpdate.ativo = ativo;
    if (dataAccessPolicy !== undefined) {
      dataToUpdate.dataAccessPolicy = role === 'COLABORADOR' ? dataAccessPolicy : null;
    }

    const membroAtualizado = await req.prisma.membros_hub.update({
      where: { hubId_pessoaId: { hubId, pessoaId } },
      data: dataToUpdate,
      include: {
        pessoa: { select: { id: true, nome: true, email: true } }
      }
    });

    res.json({ success: true, message: 'Membro atualizado com sucesso.', data: membroAtualizado, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Erro ao atualizar membro:', error);
    res.status(500).json({ error: 'ErroInterno', message: 'Não foi possível atualizar o membro.' });
  }
};

/**
 * Remove um membro de um Hub (soft delete).
 */
export const removerMembro = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.auth) {
      res.status(401).json({ error: 'NaoAutenticado', message: 'Autenticação necessária.' });
      return;
    }
    const { id: pessoaId } = req.params as unknown as MembroParamsInput;
    const { hubId } = req.auth;

    // Verificar se o usuário é proprietário através do MembroHub
    const proprietario = await req.prisma.membros_hub.findFirst({
        where: { hubId, role: 'PROPRIETARIO', ativo: true },
        select: { pessoaId: true }
    });

    if (proprietario?.pessoaId === pessoaId) {
      res.status(403).json({ error: 'AcaoProibida', message: 'O proprietário do Hub não pode ser removido.' });
      return;
    }

    // Verificar se a pessoa tem transações associadas
    const transacoesAssociadas = await req.prisma.transacao_participantes.count({
      where: {
        pessoa_id: pessoaId,
        transacoes: {
          hubId: hubId,
          ativo: true
        }
      }
    });

    if (transacoesAssociadas > 0) {
      res.status(400).json({
        error: 'PESSOA_COM_TRANSACOES',
        message: `Não é possível remover este membro porque ele possui ${transacoesAssociadas} transação(ões) associada(s). Primeiro remova ou transfira as transações relacionadas e depois tente remover o membro novamente.`,
        transacoesAssociadas: transacoesAssociadas
      });
      return;
    }

    // Verificar se a pessoa tem pagamentos associados
    const pagamentosAssociados = await req.prisma.pagamentos.count({
      where: {
        pessoa_id: pessoaId,
        hubId: hubId,
        ativo: true
      }
    });

    if (pagamentosAssociados > 0) {
      res.status(400).json({
        error: 'PESSOA_COM_PAGAMENTOS',
        message: `Não é possível remover este membro porque ele possui ${pagamentosAssociados} pagamento(s) associado(s). Primeiro remova os pagamentos relacionados e depois tente remover o membro novamente.`,
        pagamentosAssociados: pagamentosAssociados
      });
      return;
    }

    await req.prisma.$transaction(async (tx) => {
      // 1. Desativar o membro do Hub
      await tx.membros_hub.update({
        where: { hubId_pessoaId: { hubId, pessoaId } },
        data: { ativo: false }
      });

      // 2. Desativar a pessoa também (soft delete completo)
      await tx.pessoas.update({
        where: { id: pessoaId },
        data: { ativo: false }
      });
    });

    res.status(200).json({
      success: true,
      message: 'Membro removido com sucesso.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao remover membro:', error);
    res.status(500).json({ error: 'ErroInterno', message: 'Não foi possível remover o membro do Hub.' });
  }
};

/**
 * Ativa um convite e define a senha do usuário.
 */
export const ativarConvite = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, novaSenha }: AtivarConviteInput = req.body;

    // Validar força da senha
    const passwordValidation = validatePasswordStrength(novaSenha);
    if (!passwordValidation.isValid) {
      res.status(400).json({ error: 'SenhaInvalida', message: passwordValidation.errors.join(' ') });
      return;
    }

    // Buscar pessoa com o token
    const pessoa = await globalPrisma.pessoas.findUnique({
      where: { conviteToken: token }
    });

    if (!pessoa) {
      res.status(404).json({ error: 'ConviteInvalido', message: 'Token de convite inválido ou não encontrado.' });
      return;
    }

    if (!pessoa.conviteAtivo) {
      res.status(400).json({ error: 'ConviteInativo', message: 'Este convite já foi utilizado ou está inativo.' });
      return;
    }

    if (pessoa.conviteExpiraEm && pessoa.conviteExpiraEm < new Date()) {
      res.status(400).json({ error: 'ConviteExpirado', message: 'Este convite expirou. Solicite um novo convite.' });
      return;
    }

    // Gerar hash da nova senha
    const senhaHash = await hashPassword(novaSenha);

    // Ativar a conta e limpar dados do convite
    await globalPrisma.pessoas.update({
      where: { id: pessoa.id },
      data: {
        senha_hash: senhaHash,
        conviteToken: null,
        conviteExpiraEm: null,
        conviteAtivo: false,
        ativo: true,
        emailVerificado: true, // ✅ Marcar como verificado ao ativar convite
        emailVerificadoEm: new Date() // ✅ Registrar quando foi verificado
      }
    });

    res.json({
      success: true,
      message: 'Conta ativada com sucesso! Você já pode fazer login.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao ativar convite:', error);
    res.status(500).json({ error: 'ErroInterno', message: 'Não foi possível ativar o convite.' });
  }
};

/**
 * Reenvia um convite para um email.
 */
export const reenviarConvite = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.auth) {
      res.status(401).json({ error: 'NaoAutenticado', message: 'Autenticação necessária.' });
      return;
    }
    const { email }: ReenviarConviteInput = req.body;
    const { hubId } = req.auth;

    // Buscar informações do Hub e do convidador
    const [hub, convidador] = await Promise.all([
      req.prisma.hub.findUnique({ where: { id: hubId }, select: { nome: true } }),
      req.prisma.pessoas.findUnique({ where: { id: req.auth.pessoaId }, select: { nome: true } })
    ]);

    if (!hub) {
      res.status(404).json({ error: 'HubNaoEncontrado', message: 'Hub não encontrado.' });
      return;
    }

    // Verificar se o usuário é membro do Hub
    const membro = await req.prisma.membros_hub.findFirst({
      where: { hubId, pessoa: { email } },
      include: { pessoa: true }
    });

    if (!membro) {
      res.status(404).json({ error: 'MembroNaoEncontrado', message: 'Membro não encontrado neste Hub.' });
      return;
    }

    // Verificar se tem convite ativo
    if (!membro.pessoa.conviteAtivo) {
      res.status(400).json({ error: 'ConviteInativo', message: 'Este membro não possui convite ativo.' });
      return;
    }

    // Verificar se o membro já foi ativado (tem senha_hash)
    if (membro.pessoa.senha_hash) {
      res.status(400).json({ error: 'MembroJaAtivado', message: 'Este membro já foi ativado e não precisa de novo convite.' });
      return;
    }

    // Gerar novo token e data de expiração
    const novoToken = generateInviteToken();
    const novaExpiraEm = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Atualizar convite
    await globalPrisma.pessoas.update({
      where: { id: membro.pessoa.id },
      data: {
        conviteToken: novoToken,
        conviteExpiraEm: novaExpiraEm,
        conviteAtivo: true
      }
    });

    // ENVIAR EMAIL DE REENVIO
    let emailResult: { success: boolean; error?: string } = { success: false, error: 'Sistema de email não configurado' };
    try {
      const emailService = getEmailService();
      emailResult = await emailService.sendReinviteEmail({
        to: email,
        nome: membro.pessoa.nome || 'Usuário',
        hubNome: hub.nome,
        conviteToken: novoToken,
        convidadorNome: convidador?.nome || 'Administrador'
      });

      if (emailResult.success) {
        console.log(`✅ Email de reenvio enviado com sucesso para ${email}`);
      } else {
        console.error('❌ Falha no envio de email de reenvio:', emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Erro inesperado no envio de email de reenvio:', emailError);
      emailResult = { success: false, error: 'Erro interno no envio de email' };
    }

    res.json({
      success: true,
      message: emailResult.success 
        ? 'Convite reenviado com sucesso.'
        : 'Convite reenviado, mas houve um problema no envio do email. O convite pode ser reenviado novamente.',
      data: {
        conviteToken: novoToken, // Incluir token para testes
        emailSent: emailResult.success,
        emailError: emailResult.error
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao reenviar convite:', error);
    res.status(500).json({ error: 'ErroInterno', message: 'Não foi possível reenviar o convite.' });
  }
}; 