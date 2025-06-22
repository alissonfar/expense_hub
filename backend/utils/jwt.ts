import * as jwt from 'jsonwebtoken';
import { JWTPayload, AuthUser } from '../types';

// =============================================
// CONFIGURAÇÕES JWT
// =============================================

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// =============================================
// FUNÇÕES DE TOKEN
// =============================================

/**
 * Gera um token JWT para o usuário
 */
export const generateToken = (user: AuthUser): string => {
  const payload = {
    user_id: user.id,
    email: user.email,
    eh_proprietario: user.eh_proprietario
  };

  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  } catch (error) {
    throw new Error('Erro ao gerar token');
  }
};

/**
 * Verifica e decodifica um token JWT
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expirado');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Token inválido');
    }
    throw new Error('Erro na verificação do token');
  }
};

/**
 * Decodifica um token sem verificar (para debug)
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
};

/**
 * Extrai token do header Authorization
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1] || null;
};

/**
 * Verifica se o token está próximo do vencimento (menos de 1 dia)
 */
export const isTokenExpiringSoon = (token: string): boolean => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    
    const now = Math.floor(Date.now() / 1000);
    const timeToExpiry = decoded.exp - now;
    
    // Retorna true se expira em menos de 24 horas (86400 segundos)
    return timeToExpiry < 86400;
  } catch {
    return true;
  }
};

/**
 * Gera um refresh token (versão mais longa)
 */
export const generateRefreshToken = (user: AuthUser): string => {
  const payload = {
    user_id: user.id,
    email: user.email,
    eh_proprietario: user.eh_proprietario
  };

  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
  } catch (error) {
    throw new Error('Erro ao gerar refresh token');
  }
}; 