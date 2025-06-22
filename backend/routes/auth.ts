import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout
} from '../controllers/authController';
import {
  requireAuth,
  validateSchema,
  strictRateLimit
} from '../middleware/auth';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema
} from '../schemas/auth';

// =============================================
// CONFIGURAÇÃO DAS ROTAS DE AUTENTICAÇÃO
// =============================================

const router = Router();

// =============================================
// ROTAS PÚBLICAS (SEM AUTENTICAÇÃO)
// =============================================

/**
 * POST /api/auth/register
 * Registra um novo usuário
 */
router.post('/register', 
  strictRateLimit,
  validateSchema(registerSchema),
  register
);

/**
 * POST /api/auth/login
 * Faz login do usuário
 */
router.post('/login',
  strictRateLimit,
  validateSchema(loginSchema),
  login
);

// =============================================
// ROTAS PROTEGIDAS (REQUEREM AUTENTICAÇÃO)
// =============================================

/**
 * GET /api/auth/me
 * Retorna dados do usuário logado
 */
router.get('/me',
  requireAuth,
  getProfile
);

/**
 * PUT /api/auth/profile
 * Atualiza perfil do usuário logado
 */
router.put('/profile',
  requireAuth,
  validateSchema(updateProfileSchema),
  updateProfile
);

/**
 * PUT /api/auth/change-password
 * Altera senha do usuário logado
 */
router.put('/change-password',
  requireAuth,
  strictRateLimit,
  validateSchema(changePasswordSchema),
  changePassword
);

/**
 * POST /api/auth/logout
 * Faz logout do usuário (invalida token)
 */
router.post('/logout',
  requireAuth,
  logout
);

// =============================================
// ROTA DE INFORMAÇÕES (PARA DEBUG/DESENVOLVIMENTO)
// =============================================

/**
 * GET /api/auth/info
 * Retorna informações sobre as rotas de autenticação
 */
router.get('/info', (req, res) => {
  res.json({
    message: '🔐 Sistema de Autenticação - Personal Expense Hub',
    version: '1.0.0',
    status: 'Operacional',
    endpoints: {
      public: {
        register: {
          method: 'POST',
          path: '/api/auth/register',
          description: 'Registra um novo usuário',
          body: {
            nome: 'string (obrigatório)',
            email: 'string (obrigatório)',
            password: 'string (obrigatório)',
            telefone: 'string (opcional)'
          }
        },
        login: {
          method: 'POST',
          path: '/api/auth/login',
          description: 'Faz login do usuário',
          body: {
            email: 'string (obrigatório)',
            password: 'string (obrigatório)'
          }
        }
      },
      protected: {
        profile: {
          method: 'GET',
          path: '/api/auth/me',
          description: 'Retorna dados do usuário logado',
          headers: {
            Authorization: 'Bearer <token>'
          }
        },
        updateProfile: {
          method: 'PUT',
          path: '/api/auth/profile',
          description: 'Atualiza perfil do usuário',
          headers: {
            Authorization: 'Bearer <token>'
          },
          body: {
            nome: 'string (opcional)',
            email: 'string (opcional)',
            telefone: 'string (opcional)'
          }
        },
        changePassword: {
          method: 'PUT',
          path: '/api/auth/change-password',
          description: 'Altera senha do usuário',
          headers: {
            Authorization: 'Bearer <token>'
          },
          body: {
            currentPassword: 'string (obrigatório)',
            newPassword: 'string (obrigatório)',
            confirmPassword: 'string (obrigatório)'
          }
        },
        logout: {
          method: 'POST',
          path: '/api/auth/logout',
          description: 'Faz logout do usuário',
          headers: {
            Authorization: 'Bearer <token>'
          }
        }
      }
    },
    security: {
      passwordRequirements: [
        'Mínimo 8 caracteres',
        'Pelo menos 1 letra minúscula',
        'Pelo menos 1 letra maiúscula',
        'Pelo menos 1 número',
        'Pelo menos 1 caractere especial',
        'Sem espaços em branco'
      ],
      tokenExpiration: '7 dias',
      refreshTokenExpiration: '30 dias',
      rateLimiting: 'Aplicado em rotas sensíveis'
    },
    features: [
      '✅ Registro de usuários',
      '✅ Login com JWT',
      '✅ Perfil do usuário',
      '✅ Atualização de dados',
      '✅ Mudança de senha',
      '✅ Validação de dados',
      '✅ Hash de senhas',
      '✅ Rate limiting',
      '✅ Primeiro usuário = proprietário'
    ],
    timestamp: new Date().toISOString()
  });
});

export default router; 