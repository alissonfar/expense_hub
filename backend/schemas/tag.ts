import { z } from 'zod';

// =============================================
// SCHEMAS DE VALIDAÇÃO PARA TAGS
// =============================================

/**
 * Schema para criação de tag
 */
export const createTagSchema = z.object({
  nome: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s0-9]+$/, 'Nome deve conter apenas letras, números e espaços'),
  
  cor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar no formato hexadecimal (#RRGGBB)')
    .default('#6B7280')
    .optional(),
  
  icone: z
    .string()
    .max(10, 'Ícone deve ter no máximo 10 caracteres')
    .optional()
    .or(z.literal(''))
});

/**
 * Schema para edição de tag
 */
export const updateTagSchema = z.object({
  nome: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s0-9]+$/, 'Nome deve conter apenas letras, números e espaços')
    .optional(),
  
  cor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar no formato hexadecimal (#RRGGBB)')
    .optional(),
  
  icone: z
    .string()
    .max(10, 'Ícone deve ter no máximo 10 caracteres')
    .optional()
    .or(z.literal(''))
});

/**
 * Schema para validação de parâmetros (ID)
 */
export const tagParamsSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'ID deve ser um número válido')
    .transform(id => parseInt(id, 10))
    .refine(id => id > 0, 'ID deve ser maior que zero')
});

/**
 * Schema para query parameters (filtros)
 */
export const tagQuerySchema = z.object({
  ativo: z
    .string()
    .optional()
    .transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  
  criado_por: z
    .string()
    .regex(/^\d+$/, 'Criado por deve ser um número válido')
    .transform(id => parseInt(id, 10))
    .refine(id => id > 0, 'Criado por deve ser maior que zero')
    .optional(),
  
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
    .refine(limit => limit > 0 && limit <= 1000, 'Limite deve ser entre 1 e 1000')
    .optional()
});

// =============================================
// TIPOS INFERIDOS DOS SCHEMAS
// =============================================

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type TagParamsInput = z.infer<typeof tagParamsSchema>;
export type TagQueryInput = z.infer<typeof tagQuerySchema>; 