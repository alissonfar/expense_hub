import { Request, Response } from 'express';
import { CreatePessoaInput, UpdatePessoaInput, PessoaParamsInput, PessoaQueryInput } from '../schemas/pessoa';

// =============================================
// CONTROLLER DE PESSOAS
// =============================================

/**
 * Lista todas as pessoas (com filtros opcionais)
 * GET /api/pessoas
 */
export const listPessoas = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ativo, proprietario, page = 1, limit = 20 }: PessoaQueryInput = req.query;

    // Construir filtros
    const where: any = {};
    
    if (ativo !== undefined) {
      where.ativo = ativo;
    }
    
    if (proprietario !== undefined) {
      where.eh_proprietario = proprietario;
    }

    // Calcular offset para paginação
    const offset = (page - 1) * limit;

    // Buscar pessoas com paginação
    const [pessoas, total] = await Promise.all([
      req.prisma.pessoas.findMany({
        where,
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          eh_proprietario: true,
          ativo: true,
          data_cadastro: true,
          atualizado_em: true
        },
        orderBy: [
          { eh_proprietario: 'desc' }, // Proprietários primeiro
          { nome: 'asc' }
        ],
        skip: offset,
        take: limit
      }),
      req.prisma.pessoas.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      message: `${pessoas.length} pessoa(s) encontrada(s)`,
      data: pessoas,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao listar pessoas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível listar as pessoas',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Cria uma nova pessoa (apenas proprietário)
 * POST /api/pessoas
 */
export const createPessoa = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nome, email, telefone, eh_proprietario }: CreatePessoaInput = req.body;

    // Verificar se email já existe
    if (email) {
      const existingUser = await req.prisma.pessoas.findUnique({
        where: { email }
      });

      if (existingUser) {
        res.status(409).json({
          error: 'Email já cadastrado',
          message: 'Este email já está sendo usado por outra pessoa',
          timestamp: new Date().toISOString()
        });
        return;
      }
    }

    // Verificar se já existe um proprietário (se tentando criar outro)
    if (eh_proprietario) {
      const existingOwner = await req.prisma.pessoas.findFirst({
        where: { eh_proprietario: true }
      });

      if (existingOwner) {
        res.status(400).json({
          error: 'Proprietário já existe',
          message: 'Já existe um proprietário no sistema. Apenas um proprietário é permitido.',
          timestamp: new Date().toISOString()
        });
        return;
      }
    }

    // Verificar se email foi fornecido (obrigatório no schema)
    if (!email) {
      res.status(400).json({
        error: 'Email obrigatório',
        message: 'Email é obrigatório para criar uma pessoa',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Criar pessoa
    const novaPessoa = await req.prisma.pessoas.create({
      data: {
        nome,
        email,
        telefone: telefone || null,
        eh_proprietario: eh_proprietario || false,
        ativo: true,
        data_cadastro: new Date(),
        atualizado_em: new Date(),
        senha_hash: '' // Participantes não têm acesso ao sistema inicialmente
      },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        eh_proprietario: true,
        ativo: true,
        data_cadastro: true,
        atualizado_em: true
      }
    });

    res.status(201).json({
      success: true,
      message: eh_proprietario ? 'Proprietário criado com sucesso!' : 'Pessoa adicionada com sucesso!',
      data: novaPessoa,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao criar pessoa:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível criar a pessoa',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Busca detalhes de uma pessoa específica
 * GET /api/pessoas/:id
 */
export const getPessoa = async (req: Request, res: Response): Promise<void> => {
  try {
    const idParam = req.params.id;
    if (!idParam) {
      res.status(400).json({
        error: 'ID não fornecido',
        message: 'ID da pessoa é obrigatório',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      res.status(400).json({
        error: 'ID inválido',
        message: 'ID deve ser um número válido',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const pessoa = await req.prisma.pessoas.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        eh_proprietario: true,
        ativo: true,
        data_cadastro: true,
        atualizado_em: true
      }
    });

    if (!pessoa) {
      res.status(404).json({
        error: 'Pessoa não encontrada',
        message: 'A pessoa solicitada não existe ou foi removida',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Buscar estatísticas da pessoa (transações relacionadas)
    const [totalTransacoes, totalDevendo, totalRecebendo, totalPago] = await Promise.all([
      req.prisma.transacao_participantes.count({
        where: { pessoa_id: id }
      }),
      req.prisma.transacao_participantes.aggregate({
        where: {
          pessoa_id: id,
          transacoes: { tipo: 'GASTO' }
        },
        _sum: { valor_devido: true }
      }),
      req.prisma.transacao_participantes.aggregate({
        where: {
          pessoa_id: id,
          transacoes: { tipo: 'RECEITA' }
        },
        _sum: { valor_recebido: true }
      }),
      req.prisma.transacao_participantes.aggregate({
        where: { pessoa_id: id },
        _sum: { valor_pago: true }
      })
    ]);

    const estatisticas = {
      total_transacoes: totalTransacoes,
      total_devendo: Number(totalDevendo._sum.valor_devido || 0),
      total_recebendo: Number(totalRecebendo._sum.valor_recebido || 0),
      total_pago: Number(totalPago._sum.valor_pago || 0),
      saldo_liquido: Number(totalRecebendo._sum.valor_recebido || 0) - Number(totalDevendo._sum.valor_devido || 0)
    };

    res.json({
      success: true,
      message: 'Pessoa encontrada com sucesso',
      data: {
        ...pessoa,
        estatisticas
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao buscar pessoa:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar os dados da pessoa',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Atualiza dados de uma pessoa
 * PUT /api/pessoas/:id
 */
export const updatePessoa = async (req: Request, res: Response): Promise<void> => {
  try {
    const idParam = req.params.id;
    if (!idParam) {
      res.status(400).json({
        error: 'ID não fornecido',
        message: 'ID da pessoa é obrigatório',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      res.status(400).json({
        error: 'ID inválido',
        message: 'ID deve ser um número válido',
        timestamp: new Date().toISOString()
      });
      return;
    }
    const { nome, email, telefone }: UpdatePessoaInput = req.body;

    // Verificar se pessoa existe
    const pessoaExistente = await req.prisma.pessoas.findUnique({
      where: { id }
    });

    if (!pessoaExistente) {
      res.status(404).json({
        error: 'Pessoa não encontrada',
        message: 'A pessoa que você está tentando editar não existe',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Se email está sendo alterado, verificar se não existe
    if (email && email !== pessoaExistente.email) {
      const existingUser = await req.prisma.pessoas.findFirst({
        where: {
          email,
          id: { not: id }
        }
      });

      if (existingUser) {
        res.status(409).json({
          error: 'Email já cadastrado',
          message: 'Este email já está sendo usado por outra pessoa',
          timestamp: new Date().toISOString()
        });
        return;
      }
    }

    // Preparar dados para atualização
    const dataToUpdate: any = {
      atualizado_em: new Date()
    };

    if (nome) dataToUpdate.nome = nome;
    if (email !== undefined) dataToUpdate.email = email;
    if (telefone !== undefined) dataToUpdate.telefone = telefone || null;

    // Atualizar dados
    const pessoaAtualizada = await req.prisma.pessoas.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        eh_proprietario: true,
        ativo: true,
        data_cadastro: true,
        atualizado_em: true
      }
    });

    res.json({
      success: true,
      message: 'Pessoa atualizada com sucesso!',
      data: pessoaAtualizada,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao atualizar pessoa:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível atualizar os dados da pessoa',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Desativa uma pessoa (soft delete)
 * DELETE /api/pessoas/:id
 */
export const deletePessoa = async (req: Request, res: Response): Promise<void> => {
  try {
    const idParam = req.params.id;
    if (!idParam) {
      res.status(400).json({
        error: 'ID não fornecido',
        message: 'ID da pessoa é obrigatório',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      res.status(400).json({
        error: 'ID inválido',
        message: 'ID deve ser um número válido',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verificar se pessoa existe
    const pessoa = await req.prisma.pessoas.findUnique({
      where: { id }
    });

    if (!pessoa) {
      res.status(404).json({
        error: 'Pessoa não encontrada',
        message: 'A pessoa que você está tentando remover não existe',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Não permitir desativar proprietário
    if (pessoa.eh_proprietario) {
      res.status(400).json({
        error: 'Operação não permitida',
        message: 'Não é possível desativar o proprietário do sistema',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Verificar se pessoa tem transações pendentes
    const transacoesPendentes = await req.prisma.transacao_participantes.findFirst({
      where: {
        pessoa_id: id,
        transacoes: {
          status_pagamento: { in: ['PENDENTE', 'PAGO_PARCIAL'] }
        }
      }
    });

    if (transacoesPendentes) {
      res.status(400).json({
        error: 'Pessoa com pendências',
        message: 'Não é possível desativar pessoa com transações pendentes. Quite as dívidas primeiro.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Desativar pessoa (soft delete)
    const pessoaDesativada = await req.prisma.pessoas.update({
      where: { id },
      data: {
        ativo: false,
        atualizado_em: new Date()
      },
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
        atualizado_em: true
      }
    });

    res.json({
      success: true,
      message: 'Pessoa desativada com sucesso!',
      data: pessoaDesativada,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao desativar pessoa:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível desativar a pessoa',
      timestamp: new Date().toISOString()
    });
  }
}; 