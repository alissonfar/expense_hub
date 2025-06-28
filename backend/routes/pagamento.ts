import { Router } from 'express';
import {
  listPagamentos,
  getPagamento,
  createPagamento,
  updatePagamento,
  deletePagamento,
  getConfiguracaoExcedente,
  updateConfiguracaoExcedente
} from '../controllers/pagamentoController';
import {
  createPagamentoSchema,
  updatePagamentoSchema,
  pagamentoParamsSchema,
  pagamentoQuerySchema,
  configuracaoExcedenteSchema
} from '../schemas/pagamento';
import {
  requireAuth,
  validateSchema,
  validateParams,
  validateQuery
} from '../middleware/auth';
import { injectPrismaClient } from '../middleware/prisma';

// =============================================
// CONFIGURAÇÃO DAS ROTAS DE PAGAMENTOS
// =============================================

const router = Router();

// =============================================
// ROTA DE INFORMAÇÕES (DEVE VIR ANTES DE /:id)
// =============================================

/**
 * GET /api/pagamentos/info
 * Retorna informações sobre as rotas de pagamentos
 */
router.get('/info', (req, res) => {
  res.json({
    message: '💳 Sistema de Pagamentos Compostos - Personal Expense Hub',
    description: 'Sistema avançado de pagamentos que permite quitar múltiplas transações simultaneamente com processamento automático de excedente',
    version: '2.0.0',
    status: 'Operacional',
    baseUrl: '/api/pagamentos',
    features: [
      '🔄 Pagamentos compostos (múltiplas transações)',
      '🔍 Pagamentos individuais (compatibilidade)',
      '💰 Processamento automático de excedente',
      '📊 Filtros avançados e paginação',
      '⚙️ Configurações personalizáveis',
      '🛡️ Validações robustas de participação',
      '📈 Criação automática de receitas de excedente',
      '🔐 Controle de permissões granular'
    ],
    businessRules: {
      pagamentoComposto: [
        'Permite pagar múltiplas transações em uma única operação',
        'Calcula automaticamente excedentes quando valor pago > valor devido',
        'Cria receita automática para excedentes acima do mínimo configurado',
        'Valida participação em todas as transações antes de processar'
      ],
      validacoes: [
        'Usuário deve participar de todas as transações que quer pagar',
        'Valor aplicado não pode exceder valor devido por transação',
        'Apenas transações do tipo GASTO podem ser pagas',
        'Pagamentos já quitados não podem ser alterados'
      ],
      excedente: [
        'Excedentes são processados automaticamente se >= valor mínimo',
        'Receitas de excedente são vinculadas ao pagamento original',
        'Configurações de excedente são controladas pelo proprietário'
      ]
    },
    endpoints: {
      list: {
        method: 'GET',
        path: '/api/pagamentos',
        description: 'Lista pagamentos com filtros avançados',
        auth: 'Requerida',
        query: {
          pessoa_id: 'number (opcional) - Filtrar por pessoa que pagou',
          transacao_id: 'number (opcional) - Filtrar por transação específica',
          data_inicio: 'YYYY-MM-DD (opcional) - Data inicial do pagamento',
          data_fim: 'YYYY-MM-DD (opcional) - Data final do pagamento',
          forma_pagamento: 'PIX|DINHEIRO|TRANSFERENCIA|DEBITO|CREDITO|OUTROS (opcional)',
          tem_excedente: 'boolean (opcional) - Filtrar pagamentos com/sem excedente',
          valor_min: 'number (opcional) - Valor mínimo do pagamento',
          valor_max: 'number (opcional) - Valor máximo do pagamento',
          page: 'number (opcional) - Página (padrão: 1)',
          limit: 'number (opcional) - Itens por página (padrão: 20, máx: 100)',
          sort_by: 'data_pagamento|valor_total|criado_em (opcional, padrão: data_pagamento)',
          sort_order: 'asc|desc (opcional, padrão: desc)'
        },
        response: {
          success: 'boolean',
          data: 'array de pagamentos com relacionamentos',
          pagination: 'informações de paginação',
          message: 'string',
          timestamp: 'string'
        }
      },
      create: {
        method: 'POST',
        path: '/api/pagamentos',
        description: 'Cria pagamento individual ou composto',
        auth: 'Requerida',
        body: {
          // Para pagamento individual (compatibilidade)
          individual: {
            transacao_id: 'number (obrigatório) - ID da transação a pagar',
            valor_pago: 'number (obrigatório) - Valor sendo pago',
            data_pagamento: 'YYYY-MM-DD (obrigatório) - Data do pagamento',
            forma_pagamento: 'PIX|DINHEIRO|TRANSFERENCIA|DEBITO|CREDITO|OUTROS (opcional, padrão: PIX)',
            observacoes: 'string (opcional) - Observações sobre o pagamento'
          },
          // Para pagamento composto (novo)
          composto: {
            transacoes: 'array (obrigatório) - Lista de transações a pagar',
            'transacoes[].transacao_id': 'number (obrigatório) - ID da transação',
            'transacoes[].valor_aplicado': 'number (obrigatório) - Valor aplicado nesta transação',
            data_pagamento: 'YYYY-MM-DD (obrigatório) - Data do pagamento',
            forma_pagamento: 'PIX|DINHEIRO|TRANSFERENCIA|DEBITO|CREDITO|OUTROS (opcional, padrão: PIX)',
            observacoes: 'string (opcional) - Observações sobre o pagamento',
            processar_excedente: 'boolean (opcional, padrão: true) - Se deve processar excedente automaticamente',
            criar_receita_excedente: 'boolean (opcional, padrão: true) - Se deve criar receita para excedente'
          }
        },
        examples: {
          individual: {
            transacao_id: 123,
            valor_pago: 50.00,
            data_pagamento: '2024-01-15',
            forma_pagamento: 'PIX',
            observacoes: 'Pagamento via PIX'
          },
          composto: {
            transacoes: [
              { transacao_id: 123, valor_aplicado: 30.00 },
              { transacao_id: 124, valor_aplicado: 45.50 },
              { transacao_id: 125, valor_aplicado: 24.50 }
            ],
            data_pagamento: '2024-01-15',
            forma_pagamento: 'PIX',
            observacoes: 'Pagamento mensal conjunto',
            processar_excedente: true,
            criar_receita_excedente: true
          }
        }
      },
      details: {
        method: 'GET',
        path: '/api/pagamentos/:id',
        description: 'Busca detalhes completos de um pagamento',
        auth: 'Requerida',
        params: {
          id: 'number (obrigatório) - ID do pagamento'
        },
        response: {
          success: 'boolean',
          data: 'objeto pagamento com detalhes completos e relacionamentos',
          message: 'string',
          timestamp: 'string'
        }
      },
      update: {
        method: 'PUT',
        path: '/api/pagamentos/:id',
        description: 'Atualiza informações de um pagamento',
        auth: 'Requerida (próprio usuário ou proprietário)',
        params: {
          id: 'number (obrigatório) - ID do pagamento'
        },
        body: {
          data_pagamento: 'YYYY-MM-DD (opcional) - Nova data do pagamento',
          forma_pagamento: 'PIX|DINHEIRO|TRANSFERENCIA|DEBITO|CREDITO|OUTROS (opcional)',
          observacoes: 'string (opcional) - Novas observações',
          processar_excedente: 'boolean (opcional) - Alterar processamento de excedente'
        },
        restrictions: [
          'Apenas quem registrou o pagamento ou proprietário podem editar',
          'Não é possível alterar valores ou transações pagas',
          'Pagamentos que geraram quitação total não podem ser editados'
        ]
      },
      delete: {
        method: 'DELETE',
        path: '/api/pagamentos/:id',
        description: 'Remove um pagamento do sistema',
        auth: 'Requerida (próprio usuário ou proprietário)',
        params: {
          id: 'number (obrigatório) - ID do pagamento'
        },
        restrictions: [
          'Apenas quem registrou o pagamento ou proprietário podem remover',
          'Pagamentos que geraram quitação total não podem ser removidos',
          'Remove automaticamente receitas de excedente vinculadas'
        ],
        response: {
          success: 'boolean',
          data: 'informações sobre remoção realizada',
          message: 'string',
          timestamp: 'string'
        }
      },
      configuracoes: {
        get: {
          method: 'GET',
          path: '/api/pagamentos/configuracoes/excedente',
          description: 'Busca configurações de processamento de excedente',
          auth: 'Requerida',
          response: {
            auto_criar_receita_excedente: 'boolean',
            valor_minimo_excedente: 'number',
            descricao_receita_excedente: 'string'
          }
        },
        update: {
          method: 'PUT',
          path: '/api/pagamentos/configuracoes/excedente',
          description: 'Atualiza configurações de processamento de excedente',
          auth: 'Proprietário',
          body: {
            auto_criar_receita_excedente: 'boolean (obrigatório) - Se deve criar receita automaticamente',
            valor_minimo_excedente: 'number (obrigatório) - Valor mínimo para processamento (0-1000)',
            descricao_receita_excedente: 'string (obrigatório) - Descrição padrão para receitas'
          }
        }
      }
    },
    security: {
      authentication: 'JWT Token obrigatório em todas as rotas',
      authorization: [
        'Usuários podem ver seus próprios pagamentos',
        'Proprietários podem ver todos os pagamentos',
        'Apenas quem registrou pode editar/remover pagamentos',
        'Configurações só podem ser alteradas pelo proprietário'
      ],
      validation: [
        'Validação com Zod em todos os inputs',
        'Verificação de participação em transações',
        'Controle de valores e saldos',
        'Prevenção de duplicatas e inconsistências'
      ]
    },
    integration: {
      triggers: [
        'atualizar_saldo_participante_pagamento - Atualiza saldos automaticamente',
        'validar_participacao_pagamento - Verifica participação obrigatória',
        'processar_excedente_pagamento - Processa excedentes automaticamente',
        'atualizar_status_transacao_pagamento - Atualiza status das transações'
      ],
      tables: [
        'pagamentos - Registro principal do pagamento',
        'pagamento_transacoes - Detalhamento por transação',
        'configuracoes_sistema - Configurações de excedente',
        'transacoes - Receitas de excedente criadas automaticamente'
      ]
    },
    examples: {
      cenarioComum: {
        descricao: 'Maria deve R$ 64 na transação 123, R$ 78 na 124 e R$ 50 na 125. Total: R$ 192. Ela paga R$ 200.',
        request: {
          method: 'POST',
          url: '/api/pagamentos',
          body: {
            transacoes: [
              { transacao_id: 123, valor_aplicado: 64.00 },
              { transacao_id: 124, valor_aplicado: 78.00 },
              { transacao_id: 125, valor_aplicado: 50.00 }
            ],
            data_pagamento: '2024-01-15',
            forma_pagamento: 'PIX',
            processar_excedente: true
          }
        },
        result: {
          pagamento_criado: 'ID 456 com valor_total R$ 200,00',
          valor_aplicado: 'R$ 192,00 distribuído nas 3 transações',
          excedente_processado: 'R$ 8,00 convertido em receita automática',
          receita_criada: 'Transação tipo RECEITA vinculada ao pagamento'
        }
      }
    },
    timestamp: new Date().toISOString()
  });
});

// =============================================
// ROTAS DE CONFIGURAÇÕES (DEVEM VIR ANTES DE /:id)
// =============================================

/**
 * GET /api/pagamentos/configuracoes/excedente
 * Busca configurações de processamento de excedente
 */
router.get('/configuracoes/excedente',
  requireAuth,
  injectPrismaClient,
  getConfiguracaoExcedente
);

/**
 * PUT /api/pagamentos/configuracoes/excedente
 * Atualiza configurações de processamento de excedente (apenas proprietário)
 */
router.put('/configuracoes/excedente',
  requireAuth,
  injectPrismaClient,
  validateSchema(configuracaoExcedenteSchema),
  updateConfiguracaoExcedente
);

// =============================================
// ROTAS PRINCIPAIS DE PAGAMENTOS
// =============================================

/**
 * GET /api/pagamentos
 * Lista todos os pagamentos com filtros avançados e paginação
 */
router.get('/',
  requireAuth,
  injectPrismaClient,
  validateQuery(pagamentoQuerySchema),
  listPagamentos
);

/**
 * POST /api/pagamentos
 * Cria um novo pagamento (individual ou composto)
 */
router.post('/',
  requireAuth,
  injectPrismaClient,
  validateSchema(createPagamentoSchema),
  createPagamento
);

/**
 * GET /api/pagamentos/:id
 * Busca detalhes completos de um pagamento específico
 */
router.get('/:id',
  requireAuth,
  injectPrismaClient,
  validateParams(pagamentoParamsSchema),
  getPagamento
);

/**
 * PUT /api/pagamentos/:id
 * Atualiza informações de um pagamento existente
 */
router.put('/:id',
  requireAuth,
  injectPrismaClient,
  validateParams(pagamentoParamsSchema),
  validateSchema(updatePagamentoSchema),
  updatePagamento
);

/**
 * DELETE /api/pagamentos/:id
 * Remove um pagamento do sistema (com validações de segurança)
 */
router.delete('/:id',
  requireAuth,
  injectPrismaClient,
  validateParams(pagamentoParamsSchema),
  deletePagamento
);

export default router; 