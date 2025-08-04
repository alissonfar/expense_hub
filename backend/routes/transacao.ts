import { Router } from 'express';
import { 
  listTransacoes, 
  createGasto, 
  getTransacao, 
  updateTransacao, 
  deleteTransacao,
  createReceita,
  updateReceita 
} from '../controllers/transacaoController';
import { 
  createGastoSchema,
  createReceitaSchema, 
  updateGastoSchema,
  updateReceitaSchema, 
  transacaoParamsSchema, 
  transacaoQuerySchema 
} from '../schemas/transacao';
import { 
  requireAuth, 
  requireHubRole,
  validateSchema, 
  validateParams, 
  validateQuery,
  autoRefreshToken,
  validateHubContext
} from '../middleware/auth';
import { injectPrismaClient } from '../middleware/prisma';

const router = Router();

// =============================================
// ROTAS PÚBLICAS (INFORMAÇÕES)
// =============================================

/**
 * Documentação das rotas de transações
 * GET /api/transacoes/info
 */
router.get('/info', (req, res) => {
  res.json({
    message: '💰 API de Transações - Personal Expense Hub',
    description: 'Sistema de gestão de gastos e receitas compartilhadas com divisão por valores fixos',
    version: '1.0.0',
    baseUrl: '/api/transacoes',
    endpoints: {
      'GET /': {
        description: 'Listar transações com filtros e paginação',
        auth: false,
        params: {
          tipo: 'GASTO | RECEITA (padrão: GASTO)',
          status_pagamento: 'PENDENTE | PAGO_PARCIAL | PAGO_TOTAL',
          data_inicio: 'YYYY-MM-DD',
          data_fim: 'YYYY-MM-DD',
          pessoa_id: 'number',
          tag_id: 'number',
          eh_parcelado: 'boolean',
          grupo_parcela: 'uuid',
          page: 'number (padrão: 1)',
          limit: 'number (padrão: 20, máx: 1000)'
        }
      },
      'POST /': {
        description: 'Criar novo gasto (com parcelamento opcional)',
        auth: true,
        body: {
          descricao: 'string (obrigatório)',
          local: 'string (opcional)',
          valor_total: 'number (obrigatório)',
          data_transacao: 'YYYY-MM-DD (obrigatório)',
          observacoes: 'string (opcional)',
          eh_parcelado: 'boolean (padrão: false)',
          total_parcelas: 'number (padrão: 1, máx: 36)',
          participantes: 'array (obrigatório, min: 1, máx: 10)',
          tags: 'array de numbers (opcional, máx: 5)'
        }
      },
      'POST /receita': {
        description: 'Criar nova receita (apenas proprietário)',
        auth: true,
        restrictions: 'Apenas proprietários',
        body: {
          descricao: 'string (obrigatório)',
          local: 'string (opcional)',
          valor_recebido: 'number (obrigatório)',
          data_transacao: 'YYYY-MM-DD (obrigatório)',
          fonte: 'string (opcional)',
          observacoes: 'string (opcional)',
          tags: 'array de numbers (opcional, máx: 5)'
        }
      },
      'GET /:id': {
        description: 'Detalhes de uma transação específica',
        auth: false,
        response: 'Transação com participantes, tags, pagamentos e parcelas relacionadas'
      },
      'PUT /:id': {
        description: 'Editar transação existente (gasto)',
        auth: true,
        body: {
          descricao: 'string (opcional)',
          local: 'string (opcional)',
          observacoes: 'string (opcional)',
          tags: 'array de numbers (opcional)'
        }
      },
      'PUT /receita/:id': {
        description: 'Editar receita existente (apenas proprietário)',
        auth: true,
        restrictions: 'Apenas proprietários',
        body: {
          descricao: 'string (opcional)',
          local: 'string (opcional)',
          fonte: 'string (opcional)',
          observacoes: 'string (opcional)',
          tags: 'array de numbers (opcional)'
        }
      },
      'DELETE /:id': {
        description: 'Excluir transação (apenas se não houver pagamentos)',
        auth: true,
        restrictions: 'Não pode ter pagamentos registrados'
      }
    },
    features: {
      gastos: {
        description: 'Sistema de gastos compartilhados',
        details: [
          'Parcelamento flexível com valores diferentes por parcela',
          'Datas automáticas (dia 1 do mês seguinte)',
          'Participantes e tags podem variar por parcela',
          'Agrupamento por UUID para controle',
          'Suporte a datas futuras para planejamento'
        ]
      },
      receitas: {
        description: 'Sistema de receitas do proprietário',
        details: [
          'Apenas proprietário pode criar/editar receitas',
          'Valor recebido automaticamente atribuído ao proprietário',
          'Status automaticamente marcado como PAGO_TOTAL',
          'Sem parcelamento (transação única)',
          'Suporte a datas futuras para planejamento'
        ]
      },
      validacoes: {
        description: 'Validações implementadas',
        details: [
          'Gastos: Soma de participantes = valor total (±1 centavo)',
          'Receitas: Apenas proprietário participa',
          'Pessoas devem existir e estar ativas',
          'Tags devem existir e estar ativas',
          'Data pode ser futura (para planejamento)',
          'Máximo 36 parcelas, 10 participantes, 5 tags'
        ]
      }
    },
    status: '🚀 Implementado e funcional - Gastos e Receitas'
  });
});

// =============================================
// ROTAS PÚBLICAS (CONSULTAS)
// =============================================

/**
 * Listar transações
 * GET /api/transacoes
 */
router.get(
  '/',
  validateQuery(transacaoQuerySchema),
  listTransacoes
);

/**
 * Detalhes de uma transação
 * GET /api/transacoes/:id
 */
router.get(
  '/:id',
  validateParams(transacaoParamsSchema),
  getTransacao
);

// =============================================
// ROTAS PROTEGIDAS (AUTENTICAÇÃO OBRIGATÓRIA)
// =============================================

/**
 * Criar novo gasto
 * POST /api/transacoes
 */
router.post(
  '/',
  requireAuth,
  autoRefreshToken,
  validateHubContext,
  requireHubRole(['PROPRIETARIO', 'ADMINISTRADOR', 'COLABORADOR']),
  injectPrismaClient,
  validateSchema(createGastoSchema),
  createGasto
);

/**
 * Criar nova receita (apenas proprietário)
 * POST /api/transacoes/receita
 */
router.post(
  '/receita',
  requireAuth,
  autoRefreshToken,
  validateHubContext,
  requireHubRole(['PROPRIETARIO']),
  injectPrismaClient,
  validateSchema(createReceitaSchema),
  createReceita
);

/**
 * Editar transação (gasto)
 * PUT /api/transacoes/:id
 */
router.put(
  '/:id',
  requireAuth,
  autoRefreshToken,
  validateHubContext,
  requireHubRole(['PROPRIETARIO', 'ADMINISTRADOR', 'COLABORADOR']),
  injectPrismaClient,
  validateParams(transacaoParamsSchema),
  validateSchema(updateGastoSchema),
  updateTransacao
);

/**
 * Editar receita (apenas proprietário)
 * PUT /api/transacoes/receita/:id
 */
router.put(
  '/receita/:id',
  requireAuth,
  autoRefreshToken,
  validateHubContext,
  requireHubRole(['PROPRIETARIO']),
  injectPrismaClient,
  validateParams(transacaoParamsSchema),
  validateSchema(updateReceitaSchema),
  updateReceita
);

/**
 * Excluir transação
 * DELETE /api/transacoes/:id
 */
router.delete(
  '/:id',
  requireAuth,
  autoRefreshToken,
  validateHubContext,
  requireHubRole(['PROPRIETARIO', 'ADMINISTRADOR']),
  injectPrismaClient,
  validateParams(transacaoParamsSchema),
  deleteTransacao
);

export default router; 