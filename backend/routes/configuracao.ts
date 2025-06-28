import express from 'express';
import {
  getConfiguracaoInterface,
  updateConfiguracaoInterface,
  getConfiguracaoComportamento,
  getConfiguracaoAlertas,
  getConfiguracaoRelatorios
} from '../controllers/configuracaoController';
import {
  configuracaoInterfaceSchema
} from '../schemas/configuracao';
import {
  requireAuth,
  requireHubRole,
  validateSchema
} from '../middleware/auth';
import { injectPrismaClient } from '../middleware/prisma';

// =============================================
// CONFIGURAÇÃO DAS ROTAS DE CONFIGURAÇÕES
// =============================================

const router = express.Router();

// =============================================
// ROTA DE INFORMAÇÕES (DEVE VIR ANTES DE OUTRAS)
// =============================================

/**
 * GET /api/configuracoes/info
 * Retorna informações sobre as rotas de configurações
 */
router.get('/info', (req, res) => {
  res.json({
    message: '⚙️ Sistema de Configurações - Personal Expense Hub',
    version: '1.0.0',
    status: 'Operacional',
    description: 'Gerenciamento de configurações personalizáveis do sistema',
    categories: {
      interface: {
        implemented: true,
        description: 'Configurações de tema e aparência da interface'
      },
      comportamento: {
        implemented: false,
        description: 'Configurações de comportamento do sistema (futuro)'
      },
      alertas: {
        implemented: false,
        description: 'Configurações de notificações e alertas (futuro)'
      },
      relatorios: {
        implemented: false,
        description: 'Configurações padrão para relatórios (futuro)'
      }
    },
    endpoints: {
      interface: {
        get: {
          method: 'GET',
          path: '/api/configuracoes/interface',
          description: 'Busca configurações de interface',
          auth: 'Requerida',
          response: {
            theme_interface: 'light | dark | auto (padrão: light)'
          }
        },
        update: {
          method: 'PUT',
          path: '/api/configuracoes/interface',
          description: 'Atualiza configurações de interface',
          auth: 'Proprietário',
          body: {
            theme_interface: 'string (obrigatório) - light, dark ou auto'
          }
        }
      },
      future_endpoints: {
        comportamento: {
          path: '/api/configuracoes/comportamento',
          status: 'Planejado',
          description: 'Configurações de comportamento automático'
        },
        alertas: {
          path: '/api/configuracoes/alertas',
          status: 'Planejado',
          description: 'Configurações de alertas e notificações'
        },
        relatorios: {
          path: '/api/configuracoes/relatorios',
          status: 'Planejado',
          description: 'Configurações padrão para relatórios'
        }
      }
    },
    usage: {
      get_theme: 'GET /api/configuracoes/interface',
      set_dark_theme: 'PUT /api/configuracoes/interface { "theme_interface": "dark" }',
      set_auto_theme: 'PUT /api/configuracoes/interface { "theme_interface": "auto" }'
    },
    security: {
      authentication: 'JWT Token obrigatório em todas as rotas',
      authorization: [
        'Usuários podem visualizar configurações',
        'Apenas proprietários podem alterar configurações',
        'Configurações afetam todo o sistema'
      ],
      validation: [
        'Validação com Zod em todos os inputs',
        'Valores padrão seguros definidos',
        'Transações atômicas para consistência'
      ]
    }
  });
});

// =============================================
// ROTAS DE CONFIGURAÇÕES DE INTERFACE
// =============================================

/**
 * GET /api/configuracoes/interface
 * Busca configurações de interface (tema, aparência)
 */
router.get('/interface',
  requireAuth,
  injectPrismaClient,
  getConfiguracaoInterface
);

/**
 * PUT /api/configuracoes/interface
 * Atualiza configurações de interface (apenas proprietário)
 */
router.put('/interface',
  requireAuth,
  requireHubRole(['PROPRIETARIO', 'ADMINISTRADOR']),
  injectPrismaClient,
  validateSchema(configuracaoInterfaceSchema),
  updateConfiguracaoInterface
);

// =============================================
// ROTAS PREPARADAS PARA FUTURAS CONFIGURAÇÕES
// =============================================

/**
 * GET /api/configuracoes/comportamento
 * Futuras configurações de comportamento do sistema
 */
router.get('/comportamento',
  requireAuth,
  getConfiguracaoComportamento
);

/**
 * GET /api/configuracoes/alertas
 * Futuras configurações de alertas e notificações
 */
router.get('/alertas',
  requireAuth,
  getConfiguracaoAlertas
);

/**
 * GET /api/configuracoes/relatorios
 * Futuras configurações de relatórios
 */
router.get('/relatorios',
  requireAuth,
  getConfiguracaoRelatorios
);

// =============================================
// MIDDLEWARES DE DOCUMENTAÇÃO E DEBUG
// =============================================

/**
 * Middleware para log de acessos às configurações (desenvolvimento)
 */
router.use((req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[CONFIG] ${req.method} ${req.path} - User: ${(req as any).user?.user_id || 'Anonymous'}`);
  }
  next();
});

export default router; 