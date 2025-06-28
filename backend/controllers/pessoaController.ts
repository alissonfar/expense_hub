import { Request, Response } from 'express';
import { CreateMembroInput, UpdateMembroInput, MembroParamsInput, ListMembrosQueryInput } from '../schemas/pessoa';
import { prisma as globalPrisma } from '../utils/prisma';
import { Prisma } from '@prisma/client';

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
    const { page = 1, limit = 20, ativo, role } = req.query as unknown as ListMembrosQueryInput;
    const { hubId } = req.auth;

    const where: Prisma.MembroHubWhereInput = { hubId };
    if (ativo !== undefined) where.ativo = ativo;
    if (role) where.role = role;

    const offset = (page - 1) * limit;

    const [membros, total] = await req.prisma.$transaction([
      req.prisma.membroHub.findMany({
        where,
        include: {
          pessoa: {
            select: { id: true, nome: true, email: true, telefone: true, ativo: true }
          }
        },
        orderBy: { pessoa: { nome: 'asc' } },
        skip: offset,
        take: limit,
      }),
      req.prisma.membroHub.count({ where })
    ]);

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

    const membroExistente = await req.prisma.membroHub.findFirst({
      where: { hubId, pessoa: { email } }
    });

    if (membroExistente) {
      res.status(409).json({ error: 'MembroJaExiste', message: 'Uma pessoa com este email já é membro deste Hub.' });
      return;
    }
    
    const novoMembro = await globalPrisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const pessoa = await tx.pessoas.upsert({
        where: { email },
        update: {},
        create: {
          email,
          nome,
          senha_hash: 'CONVITE_PENDENTE_' + new Date().toISOString(), 
        }
      });

      return tx.membroHub.create({
        data: {
          hubId,
          pessoaId: pessoa.id,
          role,
          dataAccessPolicy: (role === 'COLABORADOR' ? dataAccessPolicy : null) as any,
        },
        include: {
          pessoa: { select: { id: true, nome: true, email: true }}
        }
      });
    });

    res.status(201).json({
      success: true,
      message: 'Membro convidado com sucesso para o Hub.',
      data: novoMembro,
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

    const membro = await req.prisma.membroHub.findUnique({
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
    const proprietario = await req.prisma.membroHub.findFirst({
      where: { hubId, role: 'PROPRIETARIO', ativo: true },
      select: { pessoaId: true }
    });

    if (proprietario?.pessoaId === pessoaId) {
      res.status(403).json({ error: 'AcaoProibida', message: 'O proprietário do Hub não pode ser modificado.' });
      return;
    }

    const dataToUpdate: Prisma.MembroHubUpdateInput = {};
    if (role !== undefined) dataToUpdate.role = role;
    if (ativo !== undefined) dataToUpdate.ativo = ativo;
    if (dataAccessPolicy !== undefined) {
      dataToUpdate.dataAccessPolicy = role === 'COLABORADOR' ? dataAccessPolicy : null;
    }

    const membroAtualizado = await req.prisma.membroHub.update({
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
    const proprietario = await req.prisma.membroHub.findFirst({
        where: { hubId, role: 'PROPRIETARIO', ativo: true },
        select: { pessoaId: true }
    });

    if (proprietario?.pessoaId === pessoaId) {
      res.status(403).json({ error: 'AcaoProibida', message: 'O proprietário do Hub não pode ser removido.' });
      return;
    }

    await req.prisma.membroHub.update({
      where: { hubId_pessoaId: { hubId, pessoaId } },
      data: { ativo: false }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao remover membro:', error);
    res.status(500).json({ error: 'ErroInterno', message: 'Não foi possível remover o membro do Hub.' });
  }
}; 