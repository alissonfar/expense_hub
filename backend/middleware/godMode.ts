import { Request, Response, NextFunction } from 'express';
import { getLogger } from '../utils/logger';

const logger = getLogger('GodModeMiddleware');

export const requireGodMode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.auth) {
      res.status(401).json({ 
        error: 'NaoAutenticado', 
        message: 'Autenticação necessária para Modo Deus.' 
      });
      return;
    }

    // Verificar se o usuário tem privilégio de Deus (independente do Hub)
    const user = await req.prisma.pessoas.findUnique({
      where: { id: req.auth.pessoaId },
      select: { is_god: true }
    });

    if (!user?.is_god) {
      logger.warn(`Tentativa de acesso ao Modo Deus por usuário ${req.auth.pessoaId} sem privilégios`);
      res.status(403).json({ 
        error: 'AcessoNegado', 
        message: 'Acesso negado - Modo Deus necessário.' 
      });
      return;
    }

    // Para Modo Deus, não precisamos validar contexto de Hub
    logger.info(`Acesso ao Modo Deus concedido para usuário ${req.auth.pessoaId}`);
    next();
  } catch (error) {
    logger.error('[requireGodMode] Erro:', error);
    res.status(500).json({ 
      error: 'ErroInterno', 
      message: 'Erro ao verificar privilégios de Deus.' 
    });
  }
}; 