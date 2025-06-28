import { Router } from 'express';
import {
  register,
  login,
  selectHub,
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
  selectHubSchema,
  updateProfileSchema,
  changePasswordSchema
} from '../schemas/auth';

// =============================================
// CONFIGURAÇÃO DAS ROTAS DE AUTENTICAÇÃO
// =============================================

const router = Router();

// =============================================
// ROTAS PÚBLICAS (NÃO REQUEREM ACCESS TOKEN)
// =============================================

/**
 * POST /api/auth/register
 * Registra um novo usuário e seu primeiro Hub.
 */
router.post('/register', 
  strictRateLimit,
  validateSchema(registerSchema),
  register
);

/**
 * POST /api/auth/login
 * Autentica o usuário e retorna a lista de Hubs disponíveis.
 * Retorna um Refresh Token.
 */
router.post('/login',
  strictRateLimit,
  validateSchema(loginSchema),
  login
);

/**
 * POST /api/auth/select-hub
 * Recebe um hubId e um Refresh Token, retorna um Access Token para aquele Hub.
 */
router.post('/select-hub',
    strictRateLimit,
    validateSchema(selectHubSchema),
    selectHub
);


// =============================================
// ROTAS PROTEGIDAS (REQUEREM ACCESS TOKEN DE UM HUB)
// =============================================

/**
 * GET /api/auth/me
 * Retorna dados do usuário logado, com base no contexto do token.
 */
router.get('/me',
  requireAuth,
  getProfile
);

/**
 * PUT /api/auth/profile
 * Atualiza perfil do usuário logado.
 */
router.put('/profile',
  requireAuth,
  validateSchema(updateProfileSchema),
  updateProfile
);

/**
 * PUT /api/auth/change-password
 * Altera senha do usuário logado.
 */
router.put('/change-password',
  requireAuth,
  strictRateLimit,
  validateSchema(changePasswordSchema),
  changePassword
);

/**
 * POST /api/auth/logout
 * Ação de logout do lado do servidor (atualmente um placeholder).
 */
router.post('/logout', logout);

// =============================================
// ROTA DE INFORMAÇÕES (PARA DEBUG/DESENVOLVIMENTO)
// =============================================

/**
 * GET /api/auth/info
 * Retorna informações sobre as rotas de autenticação (atualizado para Multi-Tenant).
 */
router.get('/info', (req, res) => {
  res.json({
    message: '🔐 Sistema de Autenticação Multi-Tenant - Hub',
    version: '2.0.0',
    status: 'Operacional',
    authFlow: [
        "1. POST /api/auth/register: Cria usuário e o primeiro Hub.",
        "2. POST /api/auth/login: Fornece credenciais, recebe lista de Hubs e um Refresh Token.",
        "3. POST /api/auth/select-hub: Envia o Refresh Token (Header) e um hubId (Body), recebe um Access Token específico para o Hub.",
        "4. Em todas as outras requisições protegidas: Envia o Access Token no Header 'Authorization: Bearer <token>'."
    ],
    endpoints: {
      public: {
        register: { method: 'POST', path: '/api/auth/register' },
        login: { method: 'POST', path: '/api/auth/login' },
        selectHub: { method: 'POST', path: '/api/auth/select-hub' }
      },
      protected: {
        profile: { method: 'GET', path: '/api/auth/me' },
        updateProfile: { method: 'PUT', path: '/api/auth/profile' },
        changePassword: { method: 'PUT', path: '/api/auth/change-password' },
        logout: { method: 'POST', path: '/api/auth/logout' },
      }
    },
    timestamp: new Date().toISOString()
  });
});

export default router; 