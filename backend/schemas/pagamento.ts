import { z } from 'zod';

// =============================================
// SCHEMAS DE VALIDAÇÃO PARA PAGAMENTOS
// =============================================

/**
 * Schema para detalhe de pagamento (transação específica)
 */
export const detalhePagamentoSchema = z.object({
  transacao_id: z
    .number()
    .int('ID da transação deve ser um número inteiro')
    .positive('ID da transação deve ser maior que zero'),
  
  valor_aplicado: z
    .number()
    .positive('Valor aplicado deve ser maior que zero')
    .multipleOf(0.01, 'Valor aplicado deve ter no máximo 2 casas decimais')
    .max(999999.99, 'Valor aplicado não pode exceder R$ 999.999,99')
});

/**
 * Schema para criação de pagamento individual (compatibilidade)
 */
export const createPagamentoIndividualSchema = z.object({
  pessoa_id: z
    .number()
    .int('ID da pessoa deve ser um número inteiro')
    .positive('ID da pessoa deve ser maior que zero')
    .optional()
    .describe('ID da pessoa que está realizando o pagamento. Se não fornecido, usa o usuário logado.'),
  
  transacao_id: z
    .number()
    .int('ID da transação deve ser um número inteiro')
    .positive('ID da transação deve ser maior que zero'),
  
  valor_pago: z
    .number()
    .positive('Valor pago deve ser maior que zero')
    .multipleOf(0.01, 'Valor pago deve ter no máximo 2 casas decimais')
    .max(999999.99, 'Valor pago não pode exceder R$ 999.999,99'),
  
  data_pagamento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .refine(
      (date) => {
        const inputDate = new Date(date);
        return inputDate >= new Date('2020-01-01');
      },
      'Data deve estar a partir de 2020'
    ),
  
  forma_pagamento: z
    .enum(['PIX', 'DINHEIRO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'OUTROS'])
    .default('PIX'),
  
  observacoes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional()
    .or(z.literal(''))
});

/**
 * Schema para criação de pagamento composto (múltiplas transações)
 */
export const createPagamentoCompostoSchema = z.object({
  pessoa_id: z
    .number()
    .int('ID da pessoa deve ser um número inteiro')
    .positive('ID da pessoa deve ser maior que zero')
    .optional()
    .describe('ID da pessoa que está realizando o pagamento. Se não fornecido, usa o usuário logado.'),
  
  transacoes: z
    .array(detalhePagamentoSchema)
    .min(1, 'Deve haver pelo menos uma transação para pagar')
    .max(20, 'Máximo de 20 transações por pagamento')
    .refine(
      (transacoes) => {
        const ids = transacoes.map(t => t.transacao_id);
        return new Set(ids).size === ids.length;
      },
      'Não pode haver transações duplicadas no mesmo pagamento'
    ),
  
  valor_total: z
    .number()
    .positive('Valor total pago deve ser maior que zero')
    .multipleOf(0.01, 'Valor total pago deve ter no máximo 2 casas decimais')
    .max(999999.99, 'Valor total pago não pode exceder R$ 999.999,99')
    .optional()
    .describe('Valor total efetivamente pago. Se omitido, será a soma dos valores aplicados.'),
  
  data_pagamento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .refine(
      (date) => {
        const inputDate = new Date(date);
        return inputDate >= new Date('2020-01-01');
      },
      'Data deve estar a partir de 2020'
    ),
  
  forma_pagamento: z
    .enum(['PIX', 'DINHEIRO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'OUTROS'])
    .default('PIX'),
  
  observacoes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional()
    .or(z.literal('')),
  
  // Controle de excedente
  processar_excedente: z
    .boolean()
    .default(true)
    .describe('Se deve processar automaticamente valores excedentes como receita'),
  
  criar_receita_excedente: z
    .boolean()
    .default(true)
    .describe('Se deve criar receita automaticamente quando há excedente')
});

/**
 * Schema unificado para criação de pagamento (individual OU composto)
 */
export const createPagamentoSchema = z.union([
  // Pagamento individual
  createPagamentoIndividualSchema.extend({
    tipo_pagamento: z.literal('individual').optional()
  }),
  
  // Pagamento composto
  createPagamentoCompostoSchema.extend({
    tipo_pagamento: z.literal('composto').optional()
  })
]).refine(
  (data) => {
    // Validar que tem transacao_id OU transacoes, mas não ambos
    const temIndividual = 'transacao_id' in data && data.transacao_id;
    const temComposto = 'transacoes' in data && data.transacoes && data.transacoes.length > 0;
    
    return (temIndividual && !temComposto) || (!temIndividual && temComposto);
  },
  {
    message: 'Deve fornecer transacao_id para pagamento individual OU transacoes para pagamento composto, mas não ambos'
  }
);

/**
 * Schema para atualização de pagamento
 */
export const updatePagamentoSchema = z.object({
  data_pagamento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .refine(
      (date) => {
        const inputDate = new Date(date);
        const today = new Date();
        const maxFuture = new Date();
        maxFuture.setFullYear(today.getFullYear() + 1);
        
        return inputDate >= new Date('2020-01-01');
      },
      'Data deve estar a partir de 2020'
    )
    .optional(),
  
  forma_pagamento: z
    .enum(['PIX', 'DINHEIRO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'OUTROS'])
    .optional(),
  
  observacoes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional()
    .or(z.literal('')),
  
  processar_excedente: z
    .boolean()
    .optional()
});

/**
 * Schema para parâmetros de URL (ID do pagamento)
 */
export const pagamentoParamsSchema = z.object({
  id: z.union([z.string(), z.number()])
    .transform(val => typeof val === 'number' ? val : parseInt(val))
    .refine(val => val > 0, 'ID deve ser maior que zero')
});

/**
 * Schema para query parameters de listagem
 */
export const pagamentoQuerySchema = z.object({
  // Filtros
  pessoa_id: z
    .string()
    .regex(/^\d+$/, 'ID da pessoa deve ser um número válido')
    .transform(val => parseInt(val))
    .optional(),
  
  transacao_id: z
    .string()
    .regex(/^\d+$/, 'ID da transação deve ser um número válido')
    .transform(val => parseInt(val))
    .optional(),
  
  data_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data início deve estar no formato YYYY-MM-DD')
    .optional(),
  
  data_fim: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data fim deve estar no formato YYYY-MM-DD')
    .optional(),
  
  forma_pagamento: z
    .enum(['PIX', 'DINHEIRO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'OUTROS'])
    .optional(),
  
  tem_excedente: z
    .string()
    .regex(/^(true|false)$/, 'tem_excedente deve ser true ou false')
    .transform(val => val === 'true')
    .optional(),
  
  valor_min: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Valor mínimo deve ser um número válido')
    .transform(val => parseFloat(val))
    .optional(),
  
  valor_max: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Valor máximo deve ser um número válido')
    .transform(val => parseFloat(val))
    .optional(),
  
  // Paginação
  page: z
    .union([z.string(), z.number()])
    .transform(val => {
      if (typeof val === 'number') return val;
      return parseInt(val);
    })
    .refine(val => val >= 1, 'Página deve ser maior ou igual a 1')
    .default('1'),
  
  limit: z
    .union([z.string(), z.number()])
    .transform(val => {
      if (typeof val === 'number') return val;
      return parseInt(val);
    })
    .refine(val => val >= 1 && val <= 1000, 'Limite deve estar entre 1 e 1000')
    .default('20'),
  
  // Ordenação
  sort_by: z
    .enum(['data_pagamento', 'valor_total', 'criado_em'])
    .default('data_pagamento')
    .optional(),
  
  sort_order: z
    .enum(['asc', 'desc'])
    .default('desc')
    .optional()
}).refine(
  (data) => {
    // Se tem data_inicio e data_fim, validar que data_inicio <= data_fim
    if (data.data_inicio && data.data_fim) {
      return new Date(data.data_inicio) <= new Date(data.data_fim);
    }
    return true;
  },
  {
    message: 'Data início deve ser anterior ou igual à data fim',
    path: ['data_inicio']
  }
).refine(
  (data) => {
    // Se tem valor_min e valor_max, validar que valor_min <= valor_max
    if (data.valor_min !== undefined && data.valor_max !== undefined) {
      return data.valor_min <= data.valor_max;
    }
    return true;
  },
  {
    message: 'Valor mínimo deve ser menor ou igual ao valor máximo',
    path: ['valor_min']
  }
);

/**
 * Schema para configurações de excedente
 */
export const configuracaoExcedenteSchema = z.object({
  auto_criar_receita_excedente: z
    .boolean()
    .describe('Se deve criar receita automaticamente quando há excedente'),
  
  valor_minimo_excedente: z
    .number()
    .min(0, 'Valor mínimo deve ser maior ou igual a zero')
    .max(1000, 'Valor mínimo não pode exceder R$ 1.000,00')
    .multipleOf(0.01, 'Valor mínimo deve ter no máximo 2 casas decimais'),
  
  descricao_receita_excedente: z
    .string()
    .min(1, 'Descrição não pode estar vazia')
    .max(200, 'Descrição deve ter no máximo 200 caracteres')
    .default('Excedente de pagamento')
});

// =============================================
// TIPOS INFERIDOS DOS SCHEMAS
// =============================================

export type DetalhePagamentoInput = z.infer<typeof detalhePagamentoSchema>;
export type CreatePagamentoIndividualInput = z.infer<typeof createPagamentoIndividualSchema>;
export type CreatePagamentoCompostoInput = z.infer<typeof createPagamentoCompostoSchema>;
export type CreatePagamentoInput = z.infer<typeof createPagamentoSchema>;
export type UpdatePagamentoInput = z.infer<typeof updatePagamentoSchema>;
export type PagamentoParamsInput = z.infer<typeof pagamentoParamsSchema>;
export type PagamentoQueryInput = z.infer<typeof pagamentoQuerySchema>;
export type ConfiguracaoExcedenteInput = z.infer<typeof configuracaoExcedenteSchema>;

// =============================================
// SCHEMAS AUXILIARES PARA RESPONSES
// =============================================

/**
 * Schema para validar dados de resposta (opcional - para garantir consistência)
 */
export const pagamentoResponseSchema = z.object({
  id: z.number(),
  pessoa_id: z.number(),
  valor_total: z.number(),
  valor_excedente: z.number().optional(),
  data_pagamento: z.string(),
  forma_pagamento: z.string(),
  observacoes: z.string().optional(),
  receita_excedente_id: z.number().optional(),
  criado_em: z.string(),
  
  // Relacionamentos incluídos
  pessoa: z.object({
    id: z.number(),
    nome: z.string(),
    email: z.string()
  }).optional(),
  
  transacoes_pagas: z.array(z.object({
    transacao_id: z.number(),
    valor_aplicado: z.number(),
    descricao: z.string(),
    status_pagamento: z.string()
  })).optional(),
  
  receita_excedente: z.object({
    id: z.number(),
    descricao: z.string(),
    valor_total: z.number()
  }).optional()
});

export type PagamentoResponse = z.infer<typeof pagamentoResponseSchema>; 