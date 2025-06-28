import { z } from 'zod';

// =============================================
// SCHEMAS DE VALIDAÇÃO PARA AUTENTICAÇÃO
// =============================================

// Schema base para senha
const senhaSchema = z
  .string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .max(128, 'Senha deve ter no máximo 128 caracteres')
  .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
  .regex(/\d/, 'Senha deve conter pelo menos um número')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Senha deve conter pelo menos um caractere especial')
  .refine(password => !/\s/.test(password), 'Senha não pode conter espaços');

/**
 * Schema para registro de usuário
 */
export const registerSchema = z.object({
  nome: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  
  email: z
    .string()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres')
    .toLowerCase()
    .transform(email => email.trim()),
  
  senha: senhaSchema,
  
  telefone: z
    .string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX')
    .optional()
    .or(z.literal('')),

  nomeHub: z
    .string()
    .min(3, 'O nome do Hub deve ter pelo menos 3 caracteres')
    .max(50, 'O nome do Hub deve ter no máximo 50 caracteres')
});

/**
 * Schema para login
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .toLowerCase()
    .transform(email => email.trim()),
  
  senha: z
    .string()
    .min(1, 'Senha é obrigatória')
});

/**
 * Schema para atualização de perfil
 */
export const updateProfileSchema = z.object({
  nome: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços')
    .optional(),
  
  email: z
    .string()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres')
    .toLowerCase()
    .transform(email => email.trim())
    .optional(),
  
  telefone: z
    .string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX')
    .optional()
    .or(z.literal(''))
});

/**
 * Schema para mudança de senha
 */
export const changePasswordSchema = z.object({
  senhaAtual: z
    .string()
    .min(1, 'Senha atual é obrigatória'),
  
  novaSenha: senhaSchema,
  
  confirmarSenha: z
    .string()
    .min(1, 'Confirmação de senha é obrigatória')
}).refine(data => data.novaSenha === data.confirmarSenha, {
  message: 'Senhas não coincidem',
  path: ['confirmarSenha']
});

/**
 * Schema para reset de senha (solicitação)
 */
export const requestPasswordResetSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .toLowerCase()
    .transform(email => email.trim())
});

/**
 * Schema para reset de senha (confirmação)
 */
export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, 'Token é obrigatório'),
  
  novaSenha: senhaSchema,
  
  confirmarSenha: z
    .string()
    .min(1, 'Confirmação de senha é obrigatória')
}).refine(data => data.novaSenha === data.confirmarSenha, {
  message: 'Senhas não coincidem',
  path: ['confirmarSenha']
});

/**
 * Schema para refresh token
 */
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token é obrigatório')
});

/**
 * Schema para selecionar um Hub
 */
export const selectHubSchema = z.object({
  hubId: z
    .number()
    .int()
    .positive('ID do Hub deve ser um número positivo')
});

/**
 * Schema para ativação de convite
 */
export const ativarConviteSchema = z.object({
  token: z
    .string()
    .min(1, 'Token é obrigatório')
    .max(255, 'Token deve ter no máximo 255 caracteres'),
  
  novaSenha: senhaSchema,
  
  confirmarSenha: z
    .string()
    .min(1, 'Confirmação de senha é obrigatória')
}).refine(data => data.novaSenha === data.confirmarSenha, {
  message: 'Senhas não coincidem',
  path: ['confirmarSenha']
});

/**
 * Schema para reenvio de convite
 */
export const reenviarConviteSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .toLowerCase()
    .transform(email => email.trim())
});

// =============================================
// TIPOS INFERIDOS DOS SCHEMAS
// =============================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type SelectHubInput = z.infer<typeof selectHubSchema>;
export type AtivarConviteInput = z.infer<typeof ativarConviteSchema>;
export type ReenviarConviteInput = z.infer<typeof reenviarConviteSchema>; 