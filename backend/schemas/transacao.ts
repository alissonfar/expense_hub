import { z } from 'zod';

// =============================================
// SCHEMAS DE VALIDAÇÃO PARA TRANSAÇÕES
// =============================================

/**
 * Função utilitária para validação robusta de datas
 */
const validarDataTransacao = (date: string): boolean => {
  const inputDate = new Date(date);
  
  // Verificar se a data é válida (não é NaN)
  if (isNaN(inputDate.getTime())) {
    return false;
  }
  
  // Verificar se está dentro de uma faixa razoável (2000-2050)
  const year = inputDate.getFullYear();
  if (year < 2000 || year > 2050) {
    return false;
  }
  
  // Verificar se não é futura
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return inputDate <= today;
};

/**
 * Schema para participante na transação (GASTOS)
 */
export const participanteSchema = z.object({
  pessoa_id: z
    .number()
    .int('ID da pessoa deve ser um número inteiro')
    .positive('ID da pessoa deve ser maior que zero'),
  
  valor_devido: z
    .number()
    .positive('Valor devido deve ser maior que zero')
    .multipleOf(0.01, 'Valor devido deve ter no máximo 2 casas decimais')
    .max(999999.99, 'Valor devido não pode exceder R$ 999.999,99')
});

/**
 * Schema para criação de gasto
 */
export const createGastoSchema = z.object({
  descricao: z
    .string()
    .min(3, 'Descrição deve ter pelo menos 3 caracteres')
    .max(200, 'Descrição deve ter no máximo 200 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-\.,:()]+$/, 'Descrição contém caracteres inválidos'),
  
  local: z
    .string()
    .max(150, 'Local deve ter no máximo 150 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-\.,:()]*$/, 'Local contém caracteres inválidos')
    .optional()
    .or(z.literal('')),
  
  valor_total: z
    .number()
    .positive('Valor total deve ser maior que zero')
    .multipleOf(0.01, 'Valor total deve ter no máximo 2 casas decimais')
    .max(999999.99, 'Valor total não pode exceder R$ 999.999,99'),
  
  data_transacao: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .refine(
      validarDataTransacao,
      'Data deve estar entre os anos 2000-2050 e não pode ser futura'
    ),
  
  observacoes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional()
    .or(z.literal('')),
  
  // Parcelamento
  eh_parcelado: z
    .boolean()
    .default(false)
    .optional(),
  
  total_parcelas: z
    .number()
    .int('Total de parcelas deve ser um número inteiro')
    .min(1, 'Total de parcelas deve ser pelo menos 1')
    .max(36, 'Total de parcelas não pode exceder 36')
    .default(1)
    .optional(),
  
  // Participantes (obrigatório pelo menos 1)
  participantes: z
    .array(participanteSchema)
    .min(1, 'Deve haver pelo menos um participante')
    .max(10, 'Máximo de 10 participantes por transação')
    .refine(
      (participantes) => {
        const pessoas = participantes.map(p => p.pessoa_id);
        return new Set(pessoas).size === pessoas.length;
      },
      'Não pode haver pessoas duplicadas nos participantes'
    ),
  
  // Tags (opcionais)
  tags: z
    .array(z.number().int().positive())
    .max(5, 'Máximo de 5 tags por transação')
    .optional()
    .default([])
})
.refine(
  (data) => {
    // Validar se soma dos valores tem tolerância de centavos
    const somaParticipantes = data.participantes.reduce((acc, p) => acc + p.valor_devido, 0);
    const diferenca = Math.abs(data.valor_total - somaParticipantes);
    return diferenca < 0.01;
  },
  {
    message: 'A soma dos valores dos participantes deve ser igual ao valor total (tolerância de 1 centavo)',
    path: ['participantes']
  }
);

/**
 * Schema para criação de receita
 * Receitas são exclusivas do proprietário e não têm parcelamento
 */
export const createReceitaSchema = z.object({
  descricao: z
    .string()
    .min(3, 'Descrição deve ter pelo menos 3 caracteres')
    .max(200, 'Descrição deve ter no máximo 200 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-\.,:()]+$/, 'Descrição contém caracteres inválidos'),
  
  local: z
    .string()
    .max(150, 'Fonte da receita deve ter no máximo 150 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-\.,:()]*$/, 'Fonte da receita contém caracteres inválidos')
    .optional()
    .or(z.literal(''))
    .describe('Fonte da receita (ex: Salário, Freelance, Venda, Investimentos)'),
  
  valor_recebido: z
    .number()
    .positive('Valor recebido deve ser maior que zero')
    .multipleOf(0.01, 'Valor recebido deve ter no máximo 2 casas decimais')
    .max(999999.99, 'Valor recebido não pode exceder R$ 999.999,99'),
  
  data_transacao: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .refine(
      validarDataTransacao,
      'Data deve estar entre os anos 2000-2050 e não pode ser futura'
    ),
  
  observacoes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional()
    .or(z.literal('')),
  
  // Tags (opcionais)
  tags: z
    .array(z.number().int().positive())
    .max(5, 'Máximo de 5 tags por transação')
    .optional()
    .default([])
});

/**
 * Schema para edição de gasto
 */
export const updateGastoSchema = z.object({
  descricao: z
    .string()
    .min(3, 'Descrição deve ter pelo menos 3 caracteres')
    .max(200, 'Descrição deve ter no máximo 200 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-\.,:()]+$/, 'Descrição contém caracteres inválidos')
    .optional(),
  
  local: z
    .string()
    .max(150, 'Local deve ter no máximo 150 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-\.,:()]*$/, 'Local contém caracteres inválidos')
    .optional()
    .or(z.literal('')),
  
  observacoes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional()
    .or(z.literal('')),
  
  // Tags (opcionais)
  tags: z
    .array(z.number().int().positive())
    .max(5, 'Máximo de 5 tags por transação')
    .optional()
});

/**
 * Schema para atualização de receita (todos os campos opcionais)
 */
export const updateReceitaSchema = z.object({
  descricao: z
    .string()
    .min(3, 'Descrição deve ter pelo menos 3 caracteres')
    .max(200, 'Descrição deve ter no máximo 200 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-\.,:()]+$/, 'Descrição contém caracteres inválidos')
    .optional(),
  
  local: z
    .string()
    .max(150, 'Fonte da receita deve ter no máximo 150 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ0-9\s\-\.,:()]*$/, 'Fonte da receita contém caracteres inválidos')
    .optional()
    .or(z.literal(''))
    .describe('Fonte da receita (ex: Salário, Freelance, Venda, Investimentos)'),
  
  valor_recebido: z
    .number()
    .positive('Valor recebido deve ser maior que zero')
    .multipleOf(0.01, 'Valor recebido deve ter no máximo 2 casas decimais')
    .max(999999.99, 'Valor recebido não pode exceder R$ 999.999,99')
    .optional(),
  
  data_transacao: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .refine(
      validarDataTransacao,
      'Data deve estar entre os anos 2000-2050 e não pode ser futura'
    )
    .optional(),
  
  observacoes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional()
    .or(z.literal('')),
  
  tags: z
    .array(z.number().int().positive())
    .max(5, 'Máximo de 5 tags por transação')
    .optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  'Pelo menos um campo deve ser fornecido para atualização'
);

/**
 * Schema para validação de parâmetros
 */
export const transacaoParamsSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'ID deve ser um número válido')
    .transform(id => parseInt(id, 10))
    .refine(id => id > 0, 'ID deve ser maior que zero')
});

/**
 * Schema para filtros de consulta
 */
export const transacaoQuerySchema = z.object({
  tipo: z
    .enum(['GASTO', 'RECEITA'])
    .optional(),
  
  status_pagamento: z
    .enum(['PENDENTE', 'PAGO_PARCIAL', 'PAGO_TOTAL'])
    .optional(),
  
  data_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data início deve estar no formato YYYY-MM-DD')
    .optional(),
  
  data_fim: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data fim deve estar no formato YYYY-MM-DD')
    .optional(),
  
  pessoa_id: z
    .string()
    .regex(/^\d+$/, 'ID da pessoa deve ser um número válido')
    .transform(id => parseInt(id, 10))
    .refine(id => id > 0, 'ID da pessoa deve ser maior que zero')
    .optional(),
  
  tag_id: z
    .string()
    .regex(/^\d+$/, 'ID da tag deve ser um número válido')
    .transform(id => parseInt(id, 10))
    .refine(id => id > 0, 'ID da tag deve ser maior que zero')
    .optional(),
  
  eh_parcelado: z
    .string()
    .optional()
    .transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  
  grupo_parcela: z
    .string()
    .uuid('UUID do grupo de parcela inválido')
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
    .refine(limit => limit > 0 && limit <= 100, 'Limite deve ser entre 1 e 100')
    .optional()
})
.refine(
  (data) => {
    if (data.data_inicio && data.data_fim) {
      return new Date(data.data_inicio) <= new Date(data.data_fim);
    }
    return true;
  },
  {
    message: 'Data início deve ser anterior ou igual à data fim',
    path: ['data_inicio']
  }
);

// =============================================
// TIPOS TYPESCRIPT EXPORTADOS
// =============================================

export type CreateGastoInput = z.infer<typeof createGastoSchema>;
export type CreateReceitaInput = z.infer<typeof createReceitaSchema>;
export type UpdateGastoInput = z.infer<typeof updateGastoSchema>;
export type UpdateReceitaInput = z.infer<typeof updateReceitaSchema>;
export type TransacaoParamsInput = z.infer<typeof transacaoParamsSchema>;
export type TransacaoQueryInput = z.infer<typeof transacaoQuerySchema>;
export type ParticipanteInput = z.infer<typeof participanteSchema>; 