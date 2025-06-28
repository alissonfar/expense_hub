import bcrypt from 'bcrypt';

// =============================================
// CONFIGURAÇÕES DE SENHA
// =============================================

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

// =============================================
// FUNÇÕES DE SENHA
// =============================================

/**
 * Gera hash da senha usando bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    throw new Error('Erro ao processar senha');
  }
};

/**
 * Verifica se a senha fornecida corresponde ao hash
 */
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error('Erro na verificação da senha');
  }
};

/**
 * Valida força da senha
 */
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Mínimo 8 caracteres
  if (password.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres');
  }

  // Máximo 128 caracteres (segurança)
  if (password.length > 128) {
    errors.push('Senha deve ter no máximo 128 caracteres');
  }

  // Pelo menos uma letra minúscula
  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }

  // Pelo menos uma letra maiúscula
  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }

  // Pelo menos um número
  if (!/\d/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }

  // Pelo menos um caractere especial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial');
  }

  // Não pode ter espaços
  if (/\s/.test(password)) {
    errors.push('Senha não pode conter espaços');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Gera uma senha temporária segura
 */
export const generateTemporaryPassword = (length: number = 12): string => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = '';
  
  // Garantir pelo menos um de cada tipo
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Preencher o resto aleatoriamente
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Embaralhar a senha
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Verifica se a senha não foi comprometida (lista básica)
 */
export const isCommonPassword = (password: string): boolean => {
  const commonPasswords = [
    '123456', 'password', '123456789', '12345678', '12345',
    '1234567', '1234567890', 'qwerty', 'abc123', 'million2',
    '000000', '1234', 'iloveyou', 'aaron431', 'password1',
    'qqww1122', '123', 'omgpop', '123321', '654321'
  ];
  
  return commonPasswords.includes(password.toLowerCase());
};

/**
 * Gera um token de convite seguro e único
 */
export const generateInviteToken = (): string => {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Verifica se um token de convite é válido (formato)
 */
export const isValidInviteToken = (token: string): boolean => {
  // Token deve ter 64 caracteres hexadecimais
  return /^[a-f0-9]{64}$/.test(token);
}; 