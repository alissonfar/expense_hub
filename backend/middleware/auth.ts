import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt';
import { Role } from '../types';

// =============================================
// MIDDLEWARE DE AUTENTICAÇÃO E CONTEXTO
// =============================================

/**
 * Middleware para verificar se o usuário está autenticado via JWT de acesso.
 * Injeta o `AuthContext` (payload do token) no objeto `req`.
 * Essencial para todas as rotas protegidas.
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        error: 'TokenNãoFornecido',
        message: 'Acesso negado. Token de autenticação é obrigatório.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // `verifyAccessToken` agora retorna o AuthContext completo
    const decoded = verifyAccessToken(token);
    
    // Injeta o contexto de autorização no request para uso posterior
    req.auth = decoded;
    
    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Token inválido';
    res.status(401).json({
      error: 'TokenInvalido',
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
};

// =============================================
// MIDDLEWARE DE AUTORIZAÇÃO (RBAC)
// =============================================

/**
 * Factory de middleware para verificar se o usuário possui um dos papéis (roles) permitidos no Hub atual.
 * DEVE ser usado DEPOIS de `requireAuth`.
 * @param allowedRoles Array de papéis permitidos para acessar o recurso.
 */
export const requireHubRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // req.auth é injetado pelo middleware 'requireAuth'
    if (!req.auth) {
      res.status(401).json({
        error: 'NaoAutenticado',
        message: 'Este recurso requer autenticação prévia.',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    const { role: userRole } = req.auth;
    
    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        error: 'AcessoNegado',
        message: `Acesso negado. Requer um dos seguintes papéis: ${allowedRoles.join(', ')}.`,
        seuPapel: userRole,
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    next();
  };
};

/**
 * Middleware para verificar se o usuário é um Administrador do Sistema.
 * Concede acesso irrestrito a recursos, sobrepondo-se às regras de Hub.
 * DEVE ser usado DEPOIS de `requireAuth`.
 */
export const requireAdminSystem = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.auth) {
    res.status(401).json({
      error: 'NaoAutenticado',
      message: 'Este recurso requer autenticação prévia.',
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (!req.auth.ehAdministrador) {
    res.status(403).json({
      error: 'AcessoNegado',
      message: 'Acesso restrito a Administradores do Sistema.',
      timestamp: new Date().toISOString()
    });
    return;
  }

  next();
};

// =============================================
// MIDDLEWARE DE VALIDAÇÃO (SCHEMA)
// =============================================

/**
 * Cria middleware de validação para o corpo (body) da requisição usando Zod.
 */
export const validateSchema = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'DadosInvalidos',
          message: 'Verifique os campos e tente novamente.',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          })),
          timestamp: new Date().toISOString()
        });
        return; // CRITICAL: Adicionar return aqui!
      }
      res.status(500).json({ error: 'ErroInterno', message: 'Erro ao processar validação.' });
    }
  };
};

/**
 * Cria middleware de validação para parâmetros da URL usando Zod.
 */
export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'ParametrosInvalidos',
          message: 'Verifique os parâmetros da URL.',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          })),
          timestamp: new Date().toISOString()
        });
        return; // CRITICAL: Adicionar return aqui!
      }
      res.status(500).json({ error: 'ErroInterno', message: 'Erro ao processar validação de parâmetros.' });
    }
  };
};

/**
 * Cria middleware de validação para query parameters usando Zod.
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'QueryParametersInvalidos',
          message: 'Verifique os parâmetros de consulta.',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          })),
          timestamp: new Date().toISOString()
        });
        return; // CRITICAL: Adicionar return aqui!
      }
      res.status(500).json({ error: 'ErroInterno', message: 'Erro ao processar validação de query.' });
    }
  };
};

// =============================================
// MIDDLEWARE DE RATE LIMITING ESPECÍFICO
// =============================================

/**
 * Rate limiting mais restritivo para operações sensíveis
 */
export const strictRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  // Este middleware pode ser expandido com Redis ou implementação mais sofisticada
  // Por enquanto, passa direto - implementação básica já está no app.ts
  next();
}; 