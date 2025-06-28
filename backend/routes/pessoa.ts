import { Router } from 'express';
import {
  listMembros,
  convidarMembro,
  getMembro,
  updateMembro,
  removerMembro
} from '../controllers/pessoaController';
import {
  requireAuth,
  requireHubRole,
  validateSchema,
  validateParams,
  validateQuery
} from '../middleware/auth';
import { injectPrismaClient } from '../middleware/prisma';
import {
  createMembroSchema,
  updateMembroSchema,
  membroParamsSchema,
  listMembrosQuerySchema
} from '../schemas/pessoa';

// =============================================
// CONFIGURAÇÃO DAS ROTAS DE MEMBROS DO HUB
// =============================================
const router = Router();

// Todas as rotas de membros requerem autenticação em um Hub.
router.use(requireAuth);
router.use(injectPrismaClient);

// =============================================
// ROTA DE INFORMAÇÕES (DEVE VIR ANTES DE /:id)
// =============================================
router.get('/info', (req, res) => {
  res.json({
    message: '👥 API de Gestão de Membros do Hub',
    version: '2.0.0',
    status: 'Operacional',
    endpoints: {
      list: {
        method: 'GET',
        path: '/api/membros',
        description: 'Lista todos os membros do Hub atual.',
        auth: 'Membro do Hub',
      },
      invite: {
        method: 'POST',
        path: '/api/membros',
        description: 'Convida um novo membro para o Hub. Cria a pessoa se não existir.',
        auth: 'PROPRIETARIO ou ADMINISTRADOR do Hub',
      },
      details: {
        method: 'GET',
        path: '/api/membros/:id',
        description: 'Busca detalhes de um membro específico do Hub pelo ID da Pessoa.',
        auth: 'Membro do Hub',
      },
      update: {
        method: 'PUT',
        path: '/api/membros/:id',
        description: 'Atualiza o role ou status de um membro.',
        auth: 'PROPRIETARIO ou ADMINISTRADOR do Hub',
      },
      remove: {
        method: 'DELETE',
        path: '/api/membros/:id',
        description: 'Desativa um membro do Hub (soft delete).',
        auth: 'PROPRIETARIO ou ADMINISTRADOR do Hub',
      }
    }
  });
});

// =============================================
// ROTAS PRINCIPAIS
// =============================================

/**
 * GET /
 * Lista todos os membros do Hub.
 */
router.get('/',
  validateQuery(listMembrosQuerySchema),
  listMembros
);

/**
 * POST /
 * Convida um novo membro para o Hub.
 */
router.post('/',
  requireHubRole(['PROPRIETARIO', 'ADMINISTRADOR']),
  validateSchema(createMembroSchema),
  convidarMembro
);

/**
 * GET /:id
 * Busca detalhes de um membro específico.
 */
router.get('/:id',
  validateParams(membroParamsSchema),
  getMembro
);

/**
 * PUT /:id
 * Atualiza um membro (role, status).
 */
router.put('/:id',
  requireHubRole(['PROPRIETARIO', 'ADMINISTRADOR']),
  validateParams(membroParamsSchema),
  validateSchema(updateMembroSchema),
  updateMembro
);

/**
 * DELETE /:id
 * Remove um membro do Hub (soft delete).
 */
router.delete('/:id',
  requireHubRole(['PROPRIETARIO', 'ADMINISTRADOR']),
  validateParams(membroParamsSchema),
  removerMembro
);

export default router; 