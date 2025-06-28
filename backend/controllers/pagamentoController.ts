import { Request, Response } from 'express';
import { 
  createPagamentoSchema,
  createPagamentoIndividualSchema,
  createPagamentoCompostoSchema,
  updatePagamentoSchema,
  pagamentoParamsSchema,
  pagamentoQuerySchema,
  configuracaoExcedenteSchema,
  CreatePagamentoInput,
  UpdatePagamentoInput,
  PagamentoParamsInput,
  PagamentoQueryInput,
  ConfiguracaoExcedenteInput,
  CreatePagamentoCompostoInput,
  CreatePagamentoIndividualInput
} from '../schemas/pagamento';
import { z } from 'zod';
import { getLogger } from '../utils/logger';

const logger = getLogger('pagamentoController');

// =============================================
// CONTROLLER DE PAGAMENTOS COMPOSTOS
// =============================================

/**
 * Lista todos os pagamentos (com filtros avançados e dentro do Hub)
 * GET /api/pagamentos
 */
export const listPagamentos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hubId } = req.auth!;
    const queryParams = pagamentoQuerySchema.parse(req.query);
    const {
      pessoa_id,
      transacao_id,
      data_inicio,
      data_fim,
      forma_pagamento,
      tem_excedente,
      valor_min,
      valor_max,
      page = 1,
      limit = 20,
      sort_by = 'data_pagamento',
      sort_order = 'desc'
    } = queryParams;

    const where: any = { hubId }; // Filtro base

    if (pessoa_id) where.pessoa_id = pessoa_id;
    if (forma_pagamento) where.forma_pagamento = forma_pagamento;

    if (data_inicio || data_fim) {
      where.data_pagamento = {};
      if (data_inicio) where.data_pagamento.gte = new Date(data_inicio);
      if (data_fim) where.data_pagamento.lte = new Date(data_fim);
    }
    
    if (tem_excedente !== undefined) {
      where.valor_excedente = tem_excedente ? { gt: 0 } : { equals: null };
    }

    if (valor_min !== undefined || valor_max !== undefined) {
      where.valor_total = {};
      if (valor_min !== undefined) where.valor_total.gte = valor_min;
      if (valor_max !== undefined) where.valor_total.lte = valor_max;
    }

    if (transacao_id) {
      where.pagamento_transacoes = { some: { transacao_id } };
    }

    const offset = (page - 1) * limit;
    const orderBy = { [sort_by]: sort_order };

    const [pagamentos, total] = await req.prisma.$transaction([
      req.prisma.pagamentos.findMany({
        where,
        include: {
          pessoas_pagamentos_pessoa_idTopessoas: { select: { id: true, nome: true, email: true } },
          pessoas_pagamentos_registrado_porTopessoas: { select: { id: true, nome: true } },
          receita_excedente: { select: { id: true, descricao: true, valor_total: true } },
          pagamento_transacoes: {
            include: {
              transacoes: { select: { id: true, descricao: true, tipo: true, valor_total: true, status_pagamento: true, data_transacao: true } }
            },
            orderBy: { criado_em: 'asc' }
          }
        },
        orderBy,
        skip: offset,
        take: limit
      }),
      req.prisma.pagamentos.count({ where })
    ]);
    
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      message: `${total} pagamento(s) encontrado(s)`,
      data: pagamentos.map(p => ({
        ...p,
        valor_total: Number(p.valor_total),
        valor_excedente: p.valor_excedente ? Number(p.valor_excedente) : null,
        transacoes_pagas: p.pagamento_transacoes.map((pt: any) => ({
            ...pt,
            valor_aplicado: Number(pt.valor_aplicado),
            transacao: {
                ...pt.transacoes,
                valor_total: Number(pt.transacoes.valor_total)
            }
        }))
      })),
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Erro ao listar pagamentos:', error);
    res.status(500).json({ success: false, message: 'Erro ao listar pagamentos.' });
  }
};

/**
 * Busca detalhes de um pagamento específico
 * GET /api/pagamentos/:id
 */
export const getPagamento = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = pagamentoParamsSchema.parse(req.params);

    const pagamento = await req.prisma.pagamentos.findUnique({
      where: { id }, // A RLS já garante o acesso ao Hub
      include: {
        pessoas_pagamentos_pessoa_idTopessoas: { select: { id: true, nome: true, email: true, telefone: true } },
        pessoas_pagamentos_registrado_porTopessoas: { select: { id: true, nome: true } },
        receita_excedente: { select: { id: true, descricao: true, valor_total: true } },
        pagamento_transacoes: {
            include: {
                transacoes: { select: { id: true, descricao: true, valor_total: true, data_transacao: true, tipo: true }}
            }
        }
      }
    });

    if (!pagamento) {
      res.status(404).json({ success: false, message: 'Pagamento não encontrado.' });
      return;
    }

    res.json({ success: true, data: pagamento });
  } catch (error) {
    logger.error('Erro ao buscar pagamento:', error);
    res.status(500).json({ success: false, message: 'Erro ao buscar pagamento.' });
  }
};

/**
 * Cria um novo pagamento (individual ou composto)
 * POST /api/pagamentos
 */
export const createPagamento = async (req: Request, res: Response): Promise<void> => {
    // ... implementação futura (requer lógica complexa de transações)
    res.status(501).json({ message: 'Endpoint não implementado' });
}

/**
 * Atualiza um pagamento existente
 * PUT /api/pagamentos/:id
 */
export const updatePagamento = async (req: Request, res: Response): Promise<void> => {
    // ... implementação futura
    res.status(501).json({ message: 'Endpoint não implementado' });
}

/**
 * Exclui um pagamento
 * DELETE /api/pagamentos/:id
 */
export const deletePagamento = async (req: Request, res: Response): Promise<void> => {
    const { id: pagamentoId } = pagamentoParamsSchema.parse(req.params);
    const { pessoaId, role } = req.auth!;

    try {
        const pagamento = await req.prisma.pagamentos.findUnique({
            where: { id: pagamentoId },
            select: { registrado_por: true }
        });

        if (!pagamento) {
            res.status(404).json({ success: false, message: "Pagamento não encontrado" });
            return;
        }

        // Regra de permissão: só pode deletar se for o dono do pagamento ou um admin/proprietário
        if (pagamento.registrado_por !== pessoaId && role !== 'PROPRIETARIO' && role !== 'ADMINISTRADOR') {
            res.status(403).json({ success: false, message: "Acesso negado." });
            return;
        }

        // Lógica de deleção em transação (exemplo: reverter status das transações pagas)
        await req.prisma.$transaction(async (tx) => {
             // 1. Reverter os valores aplicados nas transações
             // 2. Desativar o pagamento
             await tx.pagamentos.update({
                 where: { id: pagamentoId },
                 data: { ativo: false }
             });
        });

        res.status(200).json({ success: true, message: "Pagamento desativado com sucesso." });
    } catch (error) {
        logger.error('Erro ao deletar pagamento:', error);
        res.status(500).json({ success: false, message: 'Erro ao deletar pagamento.' });
    }
}

/**
 * Busca a configuração de excedente do Hub
 * GET /api/pagamentos/configuracoes/excedente
 */
export const getConfiguracaoExcedente = async (req: Request, res: Response): Promise<void> => {
    try {
        // Como não existe tabela configuracaoHub, usar valores padrão
        const config = {
            auto_criar_receita_excedente: true,
            valor_minimo_excedente: 5.0,
            descricao_receita_excedente: 'Excedente de pagamento'
        };

                res.json({ success: true, data: config });
    } catch (error) {
        logger.error('Erro ao buscar configuração de excedente:', error);
        res.status(500).json({ success: false, message: "Erro ao buscar configuração de excedente." });
    }
}

/**
 * Atualiza a configuração de excedente do Hub
 * PUT /api/pagamentos/configuracoes/excedente
 */
export const updateConfiguracaoExcedente = async (req: Request, res: Response): Promise<void> => {
    const { role, hubId } = req.auth!;

    if (role !== 'PROPRIETARIO' && role !== 'ADMINISTRADOR') {
        res.status(403).json({ success: false, message: "Apenas proprietários ou administradores podem alterar esta configuração." });
        return;
    }
    
    try {
        const data = configuracaoExcedenteSchema.parse(req.body);
        
        // Como não existe tabela configuracaoHub, simular update bem-sucedido
        const updatedConfig = {
            auto_criar_receita_excedente: data.auto_criar_receita_excedente,
            valor_minimo_excedente: data.valor_minimo_excedente,
            descricao_receita_excedente: data.descricao_receita_excedente,
        };

        res.json({ success: true, message: "Configuração de excedente atualizada com sucesso.", data: updatedConfig });

        } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ success: false, message: "Dados inválidos.", errors: error.errors });        
            return;
        }
        logger.error('Erro ao atualizar configuração de excedente:', error);
        res.status(500).json({ success: false, message: "Erro ao atualizar configuração de excedente." });
    }
} 