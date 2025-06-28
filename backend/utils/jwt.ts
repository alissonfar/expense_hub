import * as jwt from 'jsonwebtoken';
import { JWTPayload, AuthContext, UserIdentifier } from '../types';

// =============================================
// CONFIGURAÇÕES JWT
// =============================================

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-dev-env';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'fallback-refresh-secret-for-dev-env';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h'; // Token de acesso curto
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '30d'; // Refresh token longo

// =============================================
// FUNÇÕES DE TOKEN
// =============================================

/**
 * Gera um token de acesso JWT com o contexto completo de autorização do Hub.
 * @param context O contexto de autorização do usuário para um Hub específico.
 * @returns O token JWT assinado.
 */
export const generateAccessToken = (context: AuthContext): string => {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    pessoaId: context.pessoaId,
    hubId: context.hubId,
    role: context.role,
    dataAccessPolicy: context.dataAccessPolicy,
    ehAdministrador: context.ehAdministrador,
  };

  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  } catch (error) {
    // Log do erro real em um sistema de produção
    throw new Error('Erro ao gerar token de acesso');
  }
};

/**
 * Gera um refresh token contendo apenas a identidade do usuário.
 * @param user A identidade básica do usuário.
 * @returns O refresh token JWT assinado.
 */
export const generateRefreshToken = (user: UserIdentifier): string => {
  const payload = {
    pessoaId: user.pessoaId,
    ehAdministrador: user.ehAdministrador
  };

  try {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
  } catch (error) {
    throw new Error('Erro ao gerar refresh token');
  }
};

/**
 * Verifica e decodifica um token de acesso JWT.
 * @param token O token a ser verificado.
 * @returns O payload decodificado se o token for válido.
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token de acesso expirado');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Token de acesso inválido');
    }
    throw new Error('Erro na verificação do token de acesso');
  }
};

/**
 * Verifica e decodifica um refresh token.
 * @param token O refresh token a ser verificado.
 * @returns O payload decodificado se o token for válido.
 */
export const verifyRefreshToken = (token: string): { pessoaId: number; ehAdministrador: boolean } => {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET) as { pessoaId: number, ehAdministrador: boolean };
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expirado. Faça login novamente.');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Refresh token inválido.');
    }
    throw new Error('Erro na verificação do refresh token');
  }
};

/**
 * Decodifica um token sem verificar a assinatura (útil para obter dados do payload rapidamente).
 * @param token O token a ser decodificado.
 * @returns O payload decodificado ou null se houver erro.
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch {
    return null;
  }
};

/**
 * Extrai o token do header 'Authorization'.
 * @param authHeader O conteúdo do header.
 * @returns O token ou null se não encontrado ou mal formatado.
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