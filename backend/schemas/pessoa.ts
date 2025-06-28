import { z } from 'zod';
import { Role, DataAccessPolicy } from '@prisma/client';

// =============================================
// SCHEMAS DE VALIDAÇÃO PARA MEMBROS
// =============================================

const roleEnum = z.enum([Role.PROPRIETARIO, Role.ADMINISTRADOR, Role.COLABORADOR, Role.VISUALIZADOR]);
const dataAccessPolicyEnum = z.enum([DataAccessPolicy.GLOBAL, DataAccessPolicy.INDIVIDUAL]);

/**
 * Schema para convidar/criar um novo membro para um Hub.
 */
export const createMembroSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres')
    .toLowerCase()
    .transform(email => email.trim()),
  
  nome: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),

  role: roleEnum.refine(role => role !== Role.PROPRIETARIO, {
    message: "Não é possível atribuir o papel de 'PROPRIETARIO'. Apenas um proprietário é permitido e é definido na criação do Hub."
  }),

  dataAccessPolicy: dataAccessPolicyEnum.optional().nullable()
}).refine(data => {
    // Se o role for COLABORADOR, a política de acesso é obrigatória.
    if (data.role === Role.COLABORADOR) {
        return data.dataAccessPolicy != null;
    }
    return true;
}, {
    message: "A Política de Acesso (dataAccessPolicy) é obrigatória para o papel 'COLABORADOR'.",
    path: ["dataAccessPolicy"],
});

/**
 * Schema para atualização de um membro.
 */
export const updateMembroSchema = z.object({
  role: roleEnum.optional(),
  
  ativo: z.boolean().optional(),
  
  dataAccessPolicy: dataAccessPolicyEnum.optional().nullable()
}).refine(data => {
    if (data.role === Role.COLABORADOR && data.dataAccessPolicy === undefined) {
        return false; // Se está mudando para colaborador, a política é necessária
    }
    return true;
}, {
    message: "Ao definir o papel como 'COLABORADOR', a Política de Acesso (dataAccessPolicy) deve ser fornecida.",
    path: ["dataAccessPolicy"],
});

/**
 * Schema para validação de parâmetros de rota (ID do membro).
 */
export const membroParamsSchema = z.object({
  id: z.coerce.number().int().positive('O ID do membro deve ser um número inteiro positivo.')
});

/**
 * Schema para query parameters na listagem de membros.
 */
export const listMembrosQuerySchema = z.object({
  ativo: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
  
  role: roleEnum.optional(),
  
  page: z.coerce.number().int().positive().optional().default(1),
  
  limit: z.coerce.number().int().positive().max(100).optional().default(20)
});

// =============================================
// TIPOS INFERIDOS DOS SCHEMAS
// =============================================

export type CreateMembroInput = z.infer<typeof createMembroSchema>;
export type UpdateMembroInput = z.infer<typeof updateMembroSchema>;
export type MembroParamsInput = z.infer<typeof membroParamsSchema>;
export type ListMembrosQueryInput = z.infer<typeof listMembrosQuerySchema>;