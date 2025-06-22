import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { JWTPayload } from '../types';

// =============================================
// EXTENSÃO DO REQUEST PARA INCLUIR USER
// =============================================

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// =============================================
// MIDDLEWARE DE AUTENTICAÇÃO
// =============================================

/**
 * Middleware para verificar se o usuário está autenticado
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        error: 'Token não fornecido',
        message: 'Acesso negado. Token de autenticação é obrigatório.',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    
    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Token inválido';
    res.status(401).json({
      error: 'Token inválido',
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware para verificar se o usuário é proprietário
 */
export const requireOwner = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Usuário não autenticado',
      message: 'Token de autenticação é obrigatório',
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (!req.user.eh_proprietario) {
    res.status(403).json({
      error: 'Acesso negado',
      message: 'Apenas proprietários podem acessar este recurso',
      timestamp: new Date().toISOString()
    });
    return;
  }

  next();
};

/**
 * Middleware opcional de autenticação (não falha se não houver token)
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyToken(token);
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // Ignora erros de token em auth opcional
    next();
  }
};

/**
 * Middleware para verificar se o usuário pode acessar seus próprios dados ou é proprietário
 */
export const requireSelfOrOwner = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Usuário não autenticado',
      message: 'Token de autenticação é obrigatório',
      timestamp: new Date().toISOString()
    });
    return;
  }

  const targetUserId = parseInt(req.params.id || req.params.userId || '0');
  const currentUserId = req.user.user_id;
  const isOwner = req.user.eh_proprietario;

  if (currentUserId === targetUserId || isOwner) {
    next();
    return;
  }

  res.status(403).json({
    error: 'Acesso negado',
    message: 'Você só pode acessar seus próprios dados',
    timestamp: new Date().toISOString()
  });
};

// =============================================
// MIDDLEWARE DE VALIDAÇÃO
// =============================================

/**
 * Cria middleware de validação para schemas Zod
 */
export const validateSchema = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        res.status(400).json({
          error: 'Dados inválidos',
          message: 'Verifique os campos e tente novamente',
          details: errors,
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.status(400).json({
        error: 'Erro de validação',
        message: 'Dados fornecidos são inválidos',
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Middleware para validar parâmetros da URL
 */
export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedParams = schema.parse(req.params);
      req.params = validatedParams;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        res.status(400).json({
          error: 'Parâmetros inválidos',
          message: 'Verifique os parâmetros da URL',
          details: errors,
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.status(400).json({
        error: 'Erro de validação',
        message: 'Parâmetros fornecidos são inválidos',
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Middleware para validar query parameters
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedQuery = schema.parse(req.query);
      req.query = validatedQuery;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        res.status(400).json({
          error: 'Query parameters inválidos',
          message: 'Verifique os parâmetros de consulta',
          details: errors,
          timestamp: new Date().toISOString()
        });
        return;
      }

      res.status(400).json({
        error: 'Erro de validação',
        message: 'Query parameters fornecidos são inválidos',
        timestamp: new Date().toISOString()
      });
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