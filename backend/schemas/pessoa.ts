import { z } from 'zod';

// =============================================
// SCHEMAS DE VALIDAÇÃO PARA PESSOAS
// =============================================

/**
 * Schema para criação de pessoa
 */
export const createPessoaSchema = z.object({
  nome: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres')
    .toLowerCase()
    .transform(email => email.trim()),
  
  telefone: z
    .string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX')
    .optional()
    .or(z.literal('')),
  
  eh_proprietario: z
    .boolean()
    .default(false)
    .optional()
});

/**
 * Schema para edição de pessoa
 */
export const updatePessoaSchema = z.object({
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
 * Schema para validação de parâmetros (ID)
 */
export const pessoaParamsSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'ID deve ser um número válido')
    .transform(id => parseInt(id, 10))
    .refine(id => id > 0, 'ID deve ser maior que zero')
});

/**
 * Schema para query parameters (filtros)
 */
export const pessoaQuerySchema = z.object({
  ativo: z
    .string()
    .optional()
    .transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  
  proprietario: z
    .string()
    .optional()
    .transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  
  page: z
    .string()
    .regex(/^\d+$/, 'Página deve ser um número válido')
    .transform(page => parseInt(page, 10))
    .refine(page => page > 0, 'Página deve ser maior que zero')
    .optional(),
  
  limit: z
    .string()
    .regex(/^\d+$/, 'Limite deve ser um número válido')
    .transform(limit => parseInt(limit, 10))
    .refine(limit => limit > 0 && limit <= 100, 'Limite deve ser entre 1 e 100')
    .optional()
});

// =============================================
// TIPOS INFERIDOS DOS SCHEMAS
// =============================================

export type CreatePessoaInput = z.infer<typeof createPessoaSchema>;
export type UpdatePessoaInput = z.infer<typeof updatePessoaSchema>;
export type PessoaParamsInput = z.infer<typeof pessoaParamsSchema>;
export type PessoaQueryInput = z.infer<typeof pessoaQuerySchema>; 