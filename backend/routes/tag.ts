import { Router } from 'express';
import { 
  listTags, 
  createTag, 
  getTag, 
  updateTag, 
  deleteTag 
} from '../controllers/tagController';
import { 
  createTagSchema, 
  updateTagSchema, 
  tagParamsSchema, 
  tagQuerySchema 
} from '../schemas/tag';
import { 
  requireAuth, 
  requireHubRole,
  validateSchema, 
  validateParams, 
  validateQuery 
} from '../middleware/auth';
import { injectPrismaClient } from '../middleware/prisma';

const router = Router();

// =============================================
// ROTAS PÚBLICAS (INFORMAÇÕES)
// =============================================

/**
 * Documentação das rotas de tags
 * GET /api/tags/info
 */
router.get('/info', (req, res) => {
  res.json({
    message: '📋 API de Tags - Personal Expense Hub',
    description: 'Sistema de categorização e organização de transações',
    version: '1.0.0',
    baseUrl: '/api/tags',
    endpoints: {
      'GET /': {
        description: 'Lista todas as tags com filtros opcionais',
        auth: false,
        params: 'Query: ativo, criado_por, page, limit',
        example: '/api/tags?ativo=true&page=1&limit=10'
      },
      'POST /': {
        description: 'Cria nova tag (apenas proprietário)',
        auth: true,
        body: 'nome (obrigatório), cor (opcional), icone (opcional)',
        example: '{"nome": "Casa", "cor": "#3B82F6", "icone": "casa"}'
      },
      'GET /:id': {
        description: 'Busca detalhes de uma tag específica',
        auth: false,
        params: 'Path: id (number)',
        example: '/api/tags/1'
      },
      'PUT /:id': {
        description: 'Atualiza dados de uma tag (apenas proprietário)',
        auth: true,
        body: 'nome, cor, icone (todos opcionais)',
        example: '{"nome": "Casa Nova", "cor": "#10B981"}'
      },
      'DELETE /:id': {
        description: 'Desativa uma tag (apenas proprietário)',
        auth: true,
        params: 'Path: id (number)',
        note: 'Não remove tags em uso por transações'
      }
    },
    features: [
      'Cores em formato hexadecimal (#RRGGBB)',
      'Soft delete (desativação)',
      'Estatísticas de uso automáticas',
      'Validação de nomes únicos',
      'Proteção de tags em uso'
    ],
    constraints: {
      nome: 'Máximo 50 caracteres, único',
      cor: 'Formato hexadecimal (#RRGGBB)',
      icone: 'Máximo 10 caracteres'
    }
  });
});

// =============================================
// ROTAS PROTEGIDAS
// =============================================

/**
 * Lista todas as tags (com filtros)
 * GET /api/tags
 */
router.get(
  '/',
  requireAuth,
  injectPrismaClient,
  validateQuery(tagQuerySchema),
  listTags
);

/**
 * Cria nova tag
 * POST /api/tags
 */
router.post(
  '/',
  (req, res, next) => {
    console.log(`\n🔍 [ROTA POST /tags] INÍCIO - Middleware de rota`);
    console.log(`   URL: ${req.url}`);
    console.log(`   Method: ${req.method}`);
    console.log(`   Headers:`, JSON.stringify(req.headers, null, 2));
    next();
  },
  requireAuth,
  (req, res, next) => {
    console.log(`\n🔍 [ROTA POST /tags] APÓS requireAuth`);
    console.log(`   req.auth presente: ${!!req.auth}`);
    if (req.auth) {
      console.log(`   Papel: ${req.auth.role}`);
      console.log(`   Hub ID: ${req.auth.hubId}`);
    }
    next();
  },
  requireHubRole(['PROPRIETARIO', 'ADMINISTRADOR', 'COLABORADOR']),
  (req, res, next) => {
    console.log(`\n🔍 [ROTA POST /tags] APÓS requireHubRole`);
    console.log(`   req.auth presente: ${!!req.auth}`);
    if (req.auth) {
      console.log(`   Papel: ${req.auth.role}`);
    }
    next();
  },
  injectPrismaClient,
  (req, res, next) => {
    console.log(`\n🔍 [ROTA POST /tags] APÓS injectPrismaClient`);
    console.log(`   req.prisma presente: ${!!req.prisma}`);
    next();
  },
  validateSchema(createTagSchema),
  (req, res, next) => {
    console.log(`\n🔍 [ROTA POST /tags] APÓS validateSchema`);
    console.log(`   req.body validado:`, JSON.stringify(req.body, null, 2));
    next();
  },
  createTag
);

/**
 * Busca tag específica
 * GET /api/tags/:id
 */
router.get(
  '/:id',
  requireAuth,
  injectPrismaClient,
  validateParams(tagParamsSchema),
  getTag
);

/**
 * Atualiza tag
 * PUT /api/tags/:id
 */
router.put(
  '/:id',
  requireAuth,
  requireHubRole(['PROPRIETARIO', 'ADMINISTRADOR', 'COLABORADOR']),
  injectPrismaClient,
  validateParams(tagParamsSchema),
  validateSchema(updateTagSchema),
  updateTag
);

/**
 * Remove tag
 * DELETE /api/tags/:id
 */
router.delete(
  '/:id',
  requireAuth,
  requireHubRole(['PROPRIETARIO', 'ADMINISTRADOR']),
  injectPrismaClient,
  validateParams(tagParamsSchema),
  deleteTag
);

export default router; 