import { Router } from 'express';
import {
  listPessoas,
  createPessoa,
  getPessoa,
  updatePessoa,
  deletePessoa
} from '../controllers/pessoaController';
import {
  requireAuth,
  requireOwner,
  validateSchema,
  validateParams,
  validateQuery
} from '../middleware/auth';
import {
  createPessoaSchema,
  updatePessoaSchema,
  pessoaParamsSchema,
  pessoaQuerySchema
} from '../schemas/pessoa';

// =============================================
// CONFIGURAÇÃO DAS ROTAS DE PESSOAS
// =============================================

const router = Router();

// =============================================
// TODAS AS ROTAS REQUEREM AUTENTICAÇÃO
// =============================================

// =============================================
// ROTA DE INFORMAÇÕES (DEVE VIR ANTES DE /:id)
// =============================================

/**
 * GET /api/pessoas/info
 * Retorna informações sobre as rotas de pessoas
 */
router.get('/info', (req, res) => {
  res.json({
    message: '👥 Sistema de Gestão de Pessoas - Personal Expense Hub',
    version: '1.0.0',
    status: 'Operacional',
    permissions: {
      viewing: 'Usuários autenticados podem visualizar pessoas',
      management: 'Apenas proprietário pode criar/editar/desativar pessoas'
    },
    endpoints: {
      list: {
        method: 'GET',
        path: '/api/pessoas',
        description: 'Lista todas as pessoas',
        auth: 'Requerida',
        query: {
          ativo: 'boolean (opcional) - Filtrar por status ativo',
          proprietario: 'boolean (opcional) - Filtrar por proprietário',
          page: 'number (opcional) - Página (padrão: 1)',
          limit: 'number (opcional) - Itens por página (padrão: 20, máx: 100)'
        }
      },
      create: {
        method: 'POST',
        path: '/api/pessoas',
        description: 'Cria uma nova pessoa',
        auth: 'Proprietário',
        body: {
          nome: 'string (obrigatório) - Nome completo',
          email: 'string (obrigatório) - Email único',
          telefone: 'string (opcional) - Formato: (XX) XXXXX-XXXX',
          eh_proprietario: 'boolean (opcional) - Apenas um proprietário permitido'
        }
      },
      details: {
        method: 'GET',
        path: '/api/pessoas/:id',
        description: 'Busca detalhes de uma pessoa',
        auth: 'Requerida',
        params: {
          id: 'number (obrigatório) - ID da pessoa'
        }
      },
      update: {
        method: 'PUT',
        path: '/api/pessoas/:id',
        description: 'Atualiza dados de uma pessoa',
        auth: 'Proprietário',
        params: {
          id: 'number (obrigatório) - ID da pessoa'
        },
        body: {
          nome: 'string (opcional) - Nome completo',
          email: 'string (opcional) - Email único',
          telefone: 'string (opcional) - Formato: (XX) XXXXX-XXXX'
        }
      },
      delete: {
        method: 'DELETE',
        path: '/api/pessoas/:id',
        description: 'Desativa uma pessoa (soft delete)',
        auth: 'Proprietário',
        params: {
          id: 'number (obrigatório) - ID da pessoa'
        },
        restrictions: [
          'Não pode desativar proprietário',
          'Não pode desativar pessoa com pendências'
        ]
      }
    },
    businessRules: [
      '✅ Email único no sistema',
      '✅ Apenas um proprietário permitido',
      '✅ Soft delete (ativo = false)',
      '✅ Não permite desativar proprietário',
      '✅ Não permite desativar com pendências',
      '✅ Telefone opcional mas formato específico',
      '✅ Participantes não têm login inicialmente'
    ],
    features: [
      '✅ Listagem com paginação',
      '✅ Filtros por status e role',
      '✅ Validação completa de dados',
      '✅ Estatísticas por pessoa',
      '✅ Controle de permissões',
      '✅ Auditoria de mudanças'
    ],
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/pessoas
 * Lista todas as pessoas (com filtros opcionais)
 */
router.get('/',
  requireAuth,
  validateQuery(pessoaQuerySchema),
  listPessoas
);

/**
 * POST /api/pessoas
 * Cria uma nova pessoa (apenas proprietário)
 */
router.post('/',
  requireAuth,
  requireOwner,
  validateSchema(createPessoaSchema),
  createPessoa
);

/**
 * GET /api/pessoas/:id
 * Busca detalhes de uma pessoa específica
 */
router.get('/:id',
  requireAuth,
  validateParams(pessoaParamsSchema),
  getPessoa
);

/**
 * PUT /api/pessoas/:id
 * Atualiza dados de uma pessoa (apenas proprietário)
 */
router.put('/:id',
  requireAuth,
  requireOwner,
  validateParams(pessoaParamsSchema),
  validateSchema(updatePessoaSchema),
  updatePessoa
);

/**
 * DELETE /api/pessoas/:id
 * Desativa uma pessoa (apenas proprietário)
 */
router.delete('/:id',
  requireAuth,
  requireOwner,
  validateParams(pessoaParamsSchema),
  deletePessoa
);

export default router; 