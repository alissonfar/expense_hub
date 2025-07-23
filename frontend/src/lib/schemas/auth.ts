import { z } from 'zod';

// =============================================
// SCHEMAS DE VALIDAÇÃO PARA AUTENTICAÇÃO
// =============================================

// Schema base para senha (IDÊNTICO AO BACKEND)
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
 * Schema para registro de usuário (SINCRONIZADO COM BACKEND)
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
    .max(255, 'Email deve ter no máximo 255 caracteres'),
  
  telefone: z
    .string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX')
    .optional()
    .or(z.literal('')),
  
  nomeHub: z
    .string()
    .min(3, 'O nome do Hub deve ter pelo menos 3 caracteres')
    .max(50, 'O nome do Hub deve ter no máximo 50 caracteres'),
  
  senha: senhaSchema,
  
  confirmarSenha: z
    .string()
    .min(1, 'Confirmação de senha é obrigatória')
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "Senhas não coincidem",
  path: ["confirmarSenha"]
});

/**
 * Schema para login
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email('Email inválido'),
  
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

// =============================================
// TIPOS INFERIDOS DOS SCHEMAS
// =============================================

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>; 