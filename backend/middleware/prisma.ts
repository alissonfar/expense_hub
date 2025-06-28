import { Request, Response, NextFunction } from 'express';
import { getExtendedPrismaClient } from '../utils/prisma';

/**
 * Middleware para criar e injetar uma instância do Prisma Client estendido no objeto `req`.
 * Esta instância é específica da requisição e contém o contexto de autorização do usuário
 * (hubId, role, etc.), garantindo o isolamento de dados automático.
 * 
 * DEVE ser usado DEPOIS do middleware `requireAuth`.
 */
export const injectPrismaClient = (req: Request, res: Response, next: NextFunction) => {
  if (!req.auth) {
    res.status(401).json({
      error: 'NaoAutenticado',
      message: 'O contexto de autenticação não foi encontrado. O middleware `requireAuth` deve ser executado primeiro.',
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Cria uma nova instância do PrismaClient estendida com o contexto do usuário atual
  req.prisma = getExtendedPrismaClient(req.auth) as any;
  
  next();
}; 