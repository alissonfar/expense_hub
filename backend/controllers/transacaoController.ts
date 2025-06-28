import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { getExtendedPrismaClient } from '../utils/prisma';
import { 
  createGastoSchema, 
  updateGastoSchema,
  createReceitaSchema,
  updateReceitaSchema
} from '../schemas/transacao';
import { CreateGastoInput, CreateReceitaInput, UpdateGastoInput, UpdateReceitaInput, TransacaoQueryInput } from '../schemas/transacao';
import { randomUUID } from 'crypto';
import { z } from 'zod';

// =============================================
// CONTROLLER DE TRANSAÇÕES (GASTOS)
// =============================================

/**
 * Lista todos os gastos (com filtros opcionais)
 * GET /api/transacoes
 */
export const listTransacoes = async (req: Request, res: Response): Promise<void> => {
  const prisma = getExtendedPrismaClient(req.auth!);
  try {
    const {
      tipo,
      status_pagamento,
      data_inicio,
      data_fim,
      pessoa_id,
      tag_id,
      eh_parcelado,
      grupo_parcela,
      page = 1,
      limit = 20
    }: TransacaoQueryInput = req.query;

    const where: Prisma.transacoesWhereInput = {};

    if (tipo) where.tipo = tipo;
    if (status_pagamento) where.status_pagamento = status_pagamento;
    if (data_inicio) where.data_transacao = { ...where.data_transacao as object, gte: new Date(data_inicio) };
    if (data_fim) where.data_transacao = { ...where.data_transacao as object, lte: new Date(data_fim) };
    if (eh_parcelado !== undefined) where.eh_parcelado = eh_parcelado;
    if (grupo_parcela) where.grupo_parcela = grupo_parcela;
    if (pessoa_id) where.transacao_participantes = { some: { pessoa_id } };
    if (tag_id) where.transacao_tags = { some: { tag_id } };

    const offset = (page - 1) * limit;

    const [transacoes, total] = await prisma.$transaction([
      prisma.transacoes.findMany({
        where,
        include: {
          pessoas_transacoes_proprietario_idTopessoas: { select: { id: true, nome: true } },
          pessoas_transacoes_criado_porTopessoas: { select: { id: true, nome: true } },
          transacao_participantes: { include: { pessoas: { select: { id: true, nome: true } } } },
          transacao_tags: { include: { tags: { select: { id: true, nome: true, cor: true } } } }
        },
        orderBy: [{ data_transacao: 'desc' }, { id: 'desc' }],
        skip: offset,
        take: limit
      }),
      prisma.transacoes.count({ where })
    ]);

    const stats = await prisma.transacoes.aggregate({
      where,
      _sum: { valor_total: true },
      _count: { id: true }
    });

    res.json({
      success: true,
      message: 'Transações listadas com sucesso',
      data: {
        transacoes,
        paginacao: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        estatisticas: {
          total_transacoes: stats._count.id || 0,
          valor_total: stats._sum.valor_total || 0,
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao listar transações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao listar transações',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Cria um novo gasto
 * POST /api/transacoes
 */
export const createGasto = async (req: Request, res: Response): Promise<void> => {
  const prisma = getExtendedPrismaClient(req.auth!);
  const { hubId, pessoaId: userId } = req.auth!;
  const data: CreateGastoInput = req.body;

  try {
    // Verificação de papel - Camada 2 de segurança
    const allowedRoles = ['PROPRIETARIO', 'ADMINISTRADOR', 'COLABORADOR'];
    if (!allowedRoles.includes(req.auth!.role)) {
      res.status(403).json({
        error: 'AcessoNegado',
        message: `Acesso negado. Requer um dos seguintes papéis: ${allowedRoles.join(', ')}.`,
        seuPapel: req.auth!.role,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { descricao, local, valor_total, data_transacao, observacoes, participantes, tags = [], eh_parcelado, total_parcelas } = data;

    // VALIDAÇÃO DE TAGS - Garantir que todas pertencem ao mesmo Hub
    if (tags && tags.length > 0) {
      const tagsValidas = await prisma.tags.findMany({
        where: { 
          id: { in: tags },
          hubId: hubId // ✅ VALIDAÇÃO DE HUB
        },
        select: { id: true }
      });

      if (tagsValidas.length !== tags.length) {
        res.status(400).json({
          error: 'TagsInvalidas',
          message: 'Algumas tags não pertencem a este Hub ou não existem.',
          timestamp: new Date().toISOString()
        });
        return;
      }
    }

    // Garantir valores padrão para parcelamento
    const totalParcelas = total_parcelas || 1;
    const ehParcelado = eh_parcelado || false;

    const pessoasIds = participantes.map(p => p.pessoa_id);
    const grupoParcela = ehParcelado ? randomUUID() : null;

    // Verificar se todos os participantes pertencem ao Hub
    const membrosValidos = await prisma.membros_hub.findMany({
      where: {
        hubId,
        pessoaId: { in: pessoasIds },
        ativo: true
      }
    });

    if (membrosValidos.length !== pessoasIds.length) {
      res.status(400).json({
        error: 'ParticipantesInvalidos',
        message: 'Alguns participantes não pertencem a este Hub.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const transacoesCriadas: any[] = [];

    await prisma.$transaction(async (tx) => {
      const extendedTx = getExtendedPrismaClient(req.auth!).$extends({
        client: { $transaction: tx }
      });

      if (ehParcelado && totalParcelas > 1) {
        const valorParcela = parseFloat((valor_total / totalParcelas).toFixed(2));
        const somaOriginalParticipantes = participantes.reduce((acc, p) => acc + p.valor_devido, 0);

        for (let i = 1; i <= totalParcelas; i++) {
          const dataParcela = new Date(data_transacao);
          dataParcela.setMonth(dataParcela.getMonth() + (i - 1));

          const transacaoData = {
            hubId,
            descricao: `${descricao} (Parc. ${i}/${totalParcelas})`,
            local: local || null,
            valor_total: valorParcela,
            valor_parcela: valorParcela,
            data_transacao: dataParcela,
            observacoes: observacoes || null,
            eh_parcelado: true,
            parcela_atual: i,
            total_parcelas: totalParcelas,
            grupo_parcela: grupoParcela,
            tipo: 'GASTO',
            proprietario_id: userId,
            criado_por: userId,
            transacao_participantes: {
              create: participantes.map(p => {
                const proporcao = p.valor_devido / somaOriginalParticipantes;
                const valorDevidoParcela = parseFloat((valorParcela * proporcao).toFixed(2));
                return {
                  pessoa_id: p.pessoa_id,
                  valor_devido: valorDevidoParcela,
                  eh_proprietario: p.pessoa_id === userId
                };
              })
            },
            transacao_tags: {
              create: tags.map(tagId => ({ tag_id: tagId }))
            }
          };
          const novaTransacao = await extendedTx.transacoes.create({ data: transacaoData });
          transacoesCriadas.push(novaTransacao);
        }
      } else {
        const transacaoData = {
          hubId,
          descricao,
          local: local || null,
          valor_total,
          valor_parcela: valor_total,
          data_transacao: new Date(data_transacao),
          observacoes: observacoes || null,
          eh_parcelado: false,
          parcela_atual: 1,
          total_parcelas: 1,
          grupo_parcela: grupoParcela,
          tipo: 'GASTO',
          proprietario_id: userId,
          criado_por: userId,
          transacao_participantes: {
            create: participantes.map(p => ({
              pessoa_id: p.pessoa_id,
              valor_devido: p.valor_devido,
              eh_proprietario: p.pessoa_id === userId,
            }))
          },
          transacao_tags: {
            create: tags.map(tagId => ({ tag_id: tagId }))
          }
        };
        const novaTransacao = await extendedTx.transacoes.create({ data: transacaoData });
        transacoesCriadas.push(novaTransacao);
      }
    });

    res.status(201).json({
      success: true,
      message: ehParcelado ? `Gasto parcelado em ${totalParcelas}x criado com sucesso` : 'Gasto criado com sucesso',
      data: {
        transacoes: transacoesCriadas,
        grupo_parcela: transacoesCriadas[0]?.grupo_parcela,
        total_parcelas: transacoesCriadas.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao criar gasto:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao criar gasto',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Detalhes de uma transação
 * GET /api/transacoes/:id
 */
export const getTransacao = async (req: Request, res: Response): Promise<void> => {
  const prisma = getExtendedPrismaClient(req.auth!);
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: 'ID da transação é obrigatório.' });
    return;
  }

  try {
    const transacao = await prisma.transacoes.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        transacao_participantes: { include: { pessoas: { select: { id: true, nome: true } } } },
        transacao_tags: { include: { tags: true } },
        pagamento_transacoes: { include: { pagamentos: true } },
        pessoas_transacoes_criado_porTopessoas: { select: { id: true, nome: true } }
      }
    });

    if (!transacao) {
      res.status(404).json({ success: false, message: 'Transação não encontrada' });
      return;
    }

    const total_pago = transacao.transacao_participantes.reduce((sum, p) => sum + Number(p.valor_pago || 0), 0);
    const total_devido = transacao.transacao_participantes.reduce((sum, p) => sum + Number(p.valor_devido || 0), 0);
    const saldo_devedor = total_devido - total_pago;

    res.json({
      success: true,
      data: {
        ...transacao,
        estatisticas: {
          total_pago,
          total_devido,
          saldo_devedor
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Erro ao buscar transação ${id}:`, error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

/**
 * Edita uma transação existente
 * PUT /api/transacoes/:id
 */
export const updateTransacao = async (req: Request, res: Response): Promise<void> => {
  const prisma = getExtendedPrismaClient(req.auth!);
  const { id } = req.params;
  const data: UpdateGastoInput = req.body;
  const { hubId } = req.auth!;

  if (!id) {
    res.status(400).json({ success: false, message: 'ID da transação é obrigatório.' });
    return;
  }

  try {
    // Verificação de papel - Camada 2 de segurança
    const allowedRoles = ['PROPRIETARIO', 'ADMINISTRADOR', 'COLABORADOR'];
    if (!allowedRoles.includes(req.auth!.role)) {
      res.status(403).json({
        error: 'AcessoNegado',
        message: `Acesso negado. Requer um dos seguintes papéis: ${allowedRoles.join(', ')}.`,
        seuPapel: req.auth!.role,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const transacaoExistente = await prisma.transacoes.findUnique({ where: { id: parseInt(id, 10) } });
    if (!transacaoExistente) {
      res.status(404).json({ success: false, message: 'Transação não encontrada' });
      return;
    }

    // VALIDAÇÃO DE TAGS - Garantir que todas pertencem ao mesmo Hub
    if (data.tags && data.tags.length > 0) {
      const tagsValidas = await prisma.tags.findMany({
        where: { 
          id: { in: data.tags },
          hubId: hubId // ✅ VALIDAÇÃO DE HUB
        },
        select: { id: true }
      });

      if (tagsValidas.length !== data.tags.length) {
        res.status(400).json({
          error: 'TagsInvalidas',
          message: 'Algumas tags não pertencem a este Hub ou não existem.',
          timestamp: new Date().toISOString()
        });
        return;
      }
    }

    // Constrói o objeto de atualização dinamicamente para evitar 'undefined'
    const updateData: Prisma.transacoesUpdateInput = {};
    if (data.descricao !== undefined) updateData.descricao = data.descricao;
    if (data.local !== undefined) updateData.local = data.local || null;
    if (data.observacoes !== undefined) updateData.observacoes = data.observacoes || null;
    if (data.tags !== undefined) {
      updateData.transacao_tags = {
        deleteMany: {},
        create: data.tags.map(tagId => ({ tag_id: tagId }))
      };
    }

    const transacaoAtualizada = await prisma.transacoes.update({
      where: { id: parseInt(id, 10) },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Transação atualizada com sucesso',
      data: transacaoAtualizada,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Erro ao atualizar transação ${id}:`, error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

/**
 * Remove uma transação (soft delete)
 * DELETE /api/transacoes/:id
 */
export const deleteTransacao = async (req: Request, res: Response): Promise<void> => {
  const prisma = getExtendedPrismaClient(req.auth!);
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ success: false, message: 'ID da transação é obrigatório.' });
    return;
  }

  try {
    // Verificação de papel - Camada 2 de segurança
    const allowedRoles = ['PROPRIETARIO', 'ADMINISTRADOR'];
    if (!allowedRoles.includes(req.auth!.role)) {
      res.status(403).json({
        error: 'AcessoNegado',
        message: `Acesso negado. Requer um dos seguintes papéis: ${allowedRoles.join(', ')}.`,
        seuPapel: req.auth!.role,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const transacao = await prisma.transacoes.findUnique({
      where: { id: parseInt(id, 10) },
      include: { pagamento_transacoes: true }
    });

    if (!transacao) {
      res.status(404).json({ success: false, message: 'Transação não encontrada' });
      return;
    }

    if (transacao.pagamento_transacoes.length > 0) {
      res.status(400).json({ success: false, message: 'Não é possível excluir transações com pagamentos associados.' });
      return;
    }

    await prisma.transacoes.update({
      where: { id: parseInt(id, 10) },
      data: { ativo: false }
    });

    res.json({
      success: true,
      message: 'Transação removida com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Erro ao excluir transação ${id}:`, error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

// =============================================
// CONTROLLER DE TRANSAÇÕES (RECEITAS)
// =============================================

/**
 * Cria uma nova receita
 * POST /api/transacoes/receita
 */
export const createReceita = async (req: Request, res: Response): Promise<void> => {
  const { pessoaId: userId, hubId } = req.auth!;
  const prisma = getExtendedPrismaClient(req.auth!);

  try {
    // Verificação de papel - Camada 2 de segurança
    const allowedRoles = ['PROPRIETARIO'];
    if (!allowedRoles.includes(req.auth!.role)) {
      res.status(403).json({
        error: 'AcessoNegado',
        message: `Acesso negado. Requer um dos seguintes papéis: ${allowedRoles.join(', ')}.`,
        seuPapel: req.auth!.role,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const {
      descricao,
      local,
      valor_recebido,
      data_transacao,
      observacoes,
      tags = []
    }: CreateReceitaInput = req.body;

    const novaReceita = await prisma.transacoes.create({
      data: {
        hubId,
        tipo: 'RECEITA',
        proprietario_id: userId,
        descricao,
        local: local || null,
        valor_total: valor_recebido,
        data_transacao: new Date(data_transacao),
        observacoes: observacoes || null,
        status_pagamento: 'PAGO_TOTAL',
        criado_por: userId,
        valor_parcela: valor_recebido,
        transacao_participantes: {
          create: {
            pessoa_id: userId,
            valor_devido: valor_recebido,
            valor_pago: valor_recebido,
            eh_proprietario: true
          }
        },
        transacao_tags: {
          create: tags.map(tagId => ({ tag_id: tagId }))
        }
      }
    });
    res.status(201).json({ success: true, message: 'Receita criada com sucesso', data: novaReceita });
  } catch (error) {
    console.error('Erro ao criar receita:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

/**
 * Edita uma receita
 * PUT /api/transacoes/receita/:id
 */
export const updateReceita = async (req: Request, res: Response): Promise<void> => {
  const prisma = getExtendedPrismaClient(req.auth!);
  const { id } = req.params;
  const data: UpdateReceitaInput = req.body;

  if (!id) {
    res.status(400).json({ success: false, message: 'ID da receita é obrigatório.' });
    return;
  }

  try {
    // Verificação de papel - Camada 2 de segurança
    const allowedRoles = ['PROPRIETARIO'];
    if (!allowedRoles.includes(req.auth!.role)) {
      res.status(403).json({
        error: 'AcessoNegado',
        message: `Acesso negado. Requer um dos seguintes papéis: ${allowedRoles.join(', ')}.`,
        seuPapel: req.auth!.role,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const receitaExistente = await prisma.transacoes.findUnique({
      where: { id: parseInt(id, 10), tipo: 'RECEITA' },
    });

    if (!receitaExistente) {
      res.status(404).json({ success: false, message: 'Receita não encontrada' });
      return;
    }
    
    // Constrói o objeto de atualização dinamicamente para evitar 'undefined'
    const updateData: Prisma.transacoesUpdateInput = {};
    if (data.descricao !== undefined) updateData.descricao = data.descricao;
    if (data.local !== undefined) updateData.local = data.local || null;
    if (data.valor_recebido !== undefined) updateData.valor_total = data.valor_recebido;
    if (data.data_transacao !== undefined) updateData.data_transacao = new Date(data.data_transacao);
    if (data.observacoes !== undefined) updateData.observacoes = data.observacoes || null;
    if (data.tags !== undefined) {
      updateData.transacao_tags = {
        deleteMany: {},
        create: data.tags.map(tagId => ({ tag_id: tagId }))
      };
    }

    const receitaAtualizada = await prisma.transacoes.update({
      where: { id: parseInt(id, 10) },
      data: updateData
    });

    res.json({ success: true, message: 'Receita atualizada com sucesso', data: receitaAtualizada });
  } catch (error) {
    console.error('Erro ao atualizar receita:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
}; 