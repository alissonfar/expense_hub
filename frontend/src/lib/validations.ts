import { z } from 'zod';
import { VALIDATION_MESSAGES } from './constants';

// Regex patterns conforme backend
const senhaRegex = {
  minuscula: /[a-z]/,
  maiuscula: /[A-Z]/,
  numero: /\d/,
  especial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
  semEspacos: /^\S*$/
};

const telefoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;

// Validações básicas
export const emailSchema = z
  .string()
  .email(VALIDATION_MESSAGES.EMAIL_INVALID)
  .toLowerCase()
  .transform(email => email.trim());

export const senhaSchema = z
  .string()
  .min(8, VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH)
  .refine(senha => senhaRegex.minuscula.test(senha), {
    message: VALIDATION_MESSAGES.PASSWORD_REQUIREMENTS
  })
  .refine(senha => senhaRegex.maiuscula.test(senha), {
    message: VALIDATION_MESSAGES.PASSWORD_REQUIREMENTS
  })
  .refine(senha => senhaRegex.numero.test(senha), {
    message: VALIDATION_MESSAGES.PASSWORD_REQUIREMENTS
  })
  .refine(senha => senhaRegex.especial.test(senha), {
    message: VALIDATION_MESSAGES.PASSWORD_REQUIREMENTS
  })
  .refine(senha => senhaRegex.semEspacos.test(senha), {
    message: 'Senha não pode conter espaços'
  });

export const telefoneSchema = z
  .string()
  .regex(telefoneRegex, VALIDATION_MESSAGES.PHONE_INVALID)
  .optional()
  .or(z.literal(''));

export const nomeSchema = z
  .string()
  .min(2, 'Nome deve ter pelo menos 2 caracteres')
  .max(100, 'Nome deve ter no máximo 100 caracteres')
  .trim();

export const valorSchema = z
  .number({ message: 'Valor deve ser numérico' })
  .positive(VALIDATION_MESSAGES.MIN_VALUE)
  .max(999999999.99, 'Valor muito alto');

export const descricaoSchema = z
  .string()
  .min(3, 'Descrição deve ter pelo menos 3 caracteres')
  .max(500, 'Descrição deve ter no máximo 500 caracteres')
  .trim();

// Schemas de autenticação
export const registerSchema = z
  .object({
    nome: nomeSchema,
    email: emailSchema,
    senha: senhaSchema,
    confirmarSenha: z.string(),
    telefone: telefoneSchema,
    nomeHub: z
      .string()
      .min(2, 'Nome do Hub deve ter pelo menos 2 caracteres')
      .max(100, 'Nome do Hub deve ter no máximo 100 caracteres')
      .trim()
  })
  .refine(data => data.senha === data.confirmarSenha, {
    message: VALIDATION_MESSAGES.CONFIRM_PASSWORD,
    path: ['confirmarSenha']
  });

export const loginSchema = z.object({
  email: emailSchema,
  senha: z.string().min(1, VALIDATION_MESSAGES.REQUIRED)
});

export const selectHubSchema = z.object({
  hubId: z.number({ message: 'Hub deve ser selecionado' }).positive()
});

export const activateInviteSchema = z
  .object({
    token: z.string().min(1, VALIDATION_MESSAGES.REQUIRED),
    nome: nomeSchema,
    senha: senhaSchema,
    confirmarSenha: z.string(),
    telefone: telefoneSchema
  })
  .refine(data => data.senha === data.confirmarSenha, {
    message: VALIDATION_MESSAGES.CONFIRM_PASSWORD,
    path: ['confirmarSenha']
  });

export const changePasswordSchema = z
  .object({
    senhaAtual: z.string().min(1, VALIDATION_MESSAGES.REQUIRED),
    novaSenha: senhaSchema,
    confirmarNovaSenha: z.string()
  })
  .refine(data => data.novaSenha === data.confirmarNovaSenha, {
    message: VALIDATION_MESSAGES.CONFIRM_PASSWORD,
    path: ['confirmarNovaSenha']
  });

// Schemas de pessoas
export const updateProfileSchema = z.object({
  nome: nomeSchema,
  email: emailSchema,
  telefone: telefoneSchema
});

export const inviteMemberSchema = z.object({
  email: emailSchema,
  role: z.enum(['ADMINISTRADOR', 'COLABORADOR', 'VISUALIZADOR'] as const, {
    message: 'Role inválido'
  }),
  dataAccessPolicy: z.enum(['GLOBAL', 'INDIVIDUAL']).optional()
});

export const updateMemberSchema = z.object({
  nome: nomeSchema.optional(),
  email: emailSchema.optional(),
  telefone: telefoneSchema.optional(),
  role: z.enum(['PROPRIETARIO', 'ADMINISTRADOR', 'COLABORADOR', 'VISUALIZADOR'] as const).optional(),
  dataAccessPolicy: z.enum(['GLOBAL', 'INDIVIDUAL']).optional()
});

// Schemas de tags
export const createTagSchema = z.object({
  nome: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .trim(),
  cor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser um código hexadecimal válido')
    .default('#6B7280'),
  icone: z
    .string()
    .max(10, 'Ícone deve ter no máximo 10 caracteres')
    .optional()
    .or(z.literal(''))
});

export const updateTagSchema = createTagSchema.partial();

// Schemas de transações
export const createTransacaoSchema = z.object({
  tipo: z.enum(['GASTO', 'RECEITA'] as const, {
    message: 'Tipo de transação inválido'
  }),
  descricao: descricaoSchema,
  local: z
    .string()
    .max(200, 'Local deve ter no máximo 200 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),
  valor_total: valorSchema,
  data_transacao: z
    .string()
    .min(1, 'Data é obrigatória')
    .refine(date => !isNaN(Date.parse(date)), {
      message: 'Data inválida'
    }),
  data_vencimento: z // ✅ NOVO: Data de vencimento (opcional)
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de vencimento deve estar no formato YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
  forma_pagamento: z // ✅ NOVO: Forma de pagamento (opcional)
    .enum(['PIX', 'DINHEIRO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'OUTROS'] as const, {
      message: 'Forma de pagamento inválida'
    })
    .optional(),
  eh_parcelado: z.boolean().default(false),
  total_parcelas: z
    .number()
    .min(1, 'Número de parcelas deve ser maior que 0')
    .max(36, 'Máximo de 36 parcelas')
    .default(1),
  observacoes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional()
    .or(z.literal('')),
  proprietario_id: z.number().positive('Proprietário deve ser selecionado'),
  tags: z
    .array(z.number().positive())
    .max(5, 'Máximo de 5 tags por transação')
    .optional(),
  participantes: z
    .array(
      z.object({
        pessoa_id: z.number().positive(),
        valor_individual: valorSchema
      })
    )
    .max(10, 'Máximo de 10 participantes por transação')
    .optional()
}).refine((data) => {
  // ✅ NOVO: Validação específica para gastos - data de vencimento >= data da transação
  if (data.tipo === 'GASTO' && data.data_vencimento && data.data_vencimento !== '') {
    const dataTransacao = new Date(data.data_transacao);
    const dataVencimento = new Date(data.data_vencimento);
    return dataVencimento >= dataTransacao;
  }
  return true;
}, {
  message: 'Data de vencimento deve ser maior ou igual à data da transação',
  path: ['data_vencimento']
}).refine((data) => {
  // ✅ NOVO: Validação específica para receitas - não devem ter data de vencimento
  if (data.tipo === 'RECEITA' && data.data_vencimento && data.data_vencimento !== '') {
    return false;
  }
  return true;
}, {
  message: 'Receitas não podem ter data de vencimento',
  path: ['data_vencimento']
});

export const updateTransacaoSchema = z.object({
  tipo: z.enum(['GASTO', 'RECEITA'] as const).optional(),
  descricao: z.string().min(3, 'Descrição obrigatória (mínimo 3 caracteres)').optional(),
  local: z.string().optional().or(z.literal('')),
  valor_total: valorSchema.optional(),
  data_transacao: z
    .string()
    .min(1, 'Data é obrigatória')
    .refine(date => !isNaN(Date.parse(date)), {
      message: 'Data inválida'
    })
    .optional(),
  data_vencimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de vencimento deve estar no formato YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
  forma_pagamento: z
    .enum(['PIX', 'DINHEIRO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'OUTROS'] as const, {
      message: 'Forma de pagamento inválida'
    })
    .optional(),
  eh_parcelado: z.boolean().optional(),
  total_parcelas: z
    .number()
    .min(1, 'Número de parcelas deve ser maior que 0')
    .max(36, 'Máximo de 36 parcelas')
    .optional(),
  observacoes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional()
    .or(z.literal('')),
  proprietario_id: z.number().positive('Proprietário deve ser selecionado').optional(),
  tags: z
    .array(z.number().positive())
    .max(5, 'Máximo de 5 tags por transação')
    .optional(),
  participantes: z
    .array(
      z.object({
        pessoa_id: z.number().positive(),
        valor_individual: valorSchema
      })
    )
    .max(10, 'Máximo de 10 participantes por transação')
    .optional()
});

// Schemas de pagamentos
export const createPagamentoIndividualSchema = z.object({
  pessoa_id: z.number().positive('Pessoa deve ser selecionada'),
  valor_total: valorSchema,
  data_pagamento: z
    .string()
    .min(1, 'Data é obrigatória')
    .refine(date => !isNaN(Date.parse(date)), {
      message: 'Data inválida'
    }),
  forma_pagamento: z.enum([
    'PIX',
    'DINHEIRO',
    'TRANSFERENCIA',
    'DEBITO',
    'CREDITO',
    'OUTROS'
  ] as const, {
    message: 'Forma de pagamento inválida'
  }),
  observacoes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional()
    .or(z.literal('')),
  processar_excedente: z.boolean().default(true)
});

export const createPagamentoCompostoSchema = z.object({
  pessoa_id: z.number().positive('Pessoa deve ser selecionada'),
  valor_total: valorSchema,
  data_pagamento: z
    .string()
    .min(1, 'Data é obrigatória')
    .refine(date => !isNaN(Date.parse(date)), {
      message: 'Data inválida'
    }),
  forma_pagamento: z.enum([
    'PIX',
    'DINHEIRO',
    'TRANSFERENCIA',
    'DEBITO',
    'CREDITO',
    'OUTROS'
  ] as const, {
    message: 'Forma de pagamento inválida'
  }),
  observacoes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional()
    .or(z.literal('')),
  processar_excedente: z.boolean().default(true),
  transacoes: z
    .array(z.number().positive())
    .min(1, 'Pelo menos uma transação deve ser selecionada')
    .max(20, 'Máximo de 20 transações por pagamento composto')
});

export const updatePagamentoSchema = createPagamentoIndividualSchema.partial();

// Schemas de configurações
export const updateExcedenteConfigSchema = z.object({
  processar_automaticamente: z.boolean(),
  valor_minimo: z.number().min(0, 'Valor mínimo deve ser positivo'),
  distribuir_igualmente: z.boolean(),
  priorizar_mais_antigo: z.boolean()
});

export const updateInterfaceConfigSchema = z.object({
  tema: z.enum(['light', 'dark', 'system']).default('system'),
  idioma: z.string().default('pt-BR'),
  moeda: z.string().default('BRL'),
  formato_data: z.string().default('dd/MM/yyyy'),
  formato_hora: z.string().default('HH:mm'),
  notificacoes_email: z.boolean().default(true),
  notificacoes_push: z.boolean().default(true)
});

// Schemas de filtros
export const transacaoFiltersSchema = z.object({
  tipo: z.enum(['GASTO', 'RECEITA'] as const).optional(),
  pessoa_id: z.number().positive().optional(),
  tag_id: z.number().positive().optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  data_vencimento_inicio: z.string().optional(), // ✅ NOVO: Filtro por vencimento
  data_vencimento_fim: z.string().optional(), // ✅ NOVO: Filtro por vencimento
  forma_pagamento: z.enum(['PIX', 'DINHEIRO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'OUTROS'] as const).optional(), // ✅ NOVO
  vencimento_status: z.enum(['VENCIDA', 'VENCE_HOJE', 'VENCE_SEMANA', 'VENCE_MES', 'NAO_VENCE'] as const).optional(), // ✅ NOVO
  status_pagamento: z.enum(['PENDENTE', 'PAGO_PARCIAL', 'PAGO_TOTAL'] as const).optional(),
  valor_min: z.number().positive().optional(),
  valor_max: z.number().positive().optional(),
  search: z.string().optional(),
  page: z.number().positive().default(1),
  limit: z.number().positive().max(1000).default(10)
});

export const pagamentoFiltersSchema = z.object({
  pessoa_id: z.number().positive().optional(),
  forma_pagamento: z.enum([
    'PIX',
    'DINHEIRO',
    'TRANSFERENCIA',
    'DEBITO',
    'CREDITO',
    'OUTROS'
  ] as const).optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  valor_min: z.number().positive().optional(),
  valor_max: z.number().positive().optional(),
  tem_excedente: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().positive().default(1),
  limit: z.number().positive().max(1000).default(10)
});

// Tipos derivados dos schemas
export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type SelectHubFormData = z.infer<typeof selectHubSchema>;
export type ActivateInviteFormData = z.infer<typeof activateInviteSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type InviteMemberFormData = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberFormData = z.infer<typeof updateMemberSchema>;
export type CreateTagFormData = z.infer<typeof createTagSchema>;
export type UpdateTagFormData = z.infer<typeof updateTagSchema>;
export type CreateTransacaoFormData = z.infer<typeof createTransacaoSchema>;
export type UpdateTransacaoFormData = z.infer<typeof updateTransacaoSchema>;
export type CreatePagamentoIndividualFormData = z.infer<typeof createPagamentoIndividualSchema>;
export type CreatePagamentoCompostoFormData = z.infer<typeof createPagamentoCompostoSchema>;
export type UpdatePagamentoFormData = z.infer<typeof updatePagamentoSchema>;
export type UpdateExcedenteConfigFormData = z.infer<typeof updateExcedenteConfigSchema>;
export type UpdateInterfaceConfigFormData = z.infer<typeof updateInterfaceConfigSchema>;
export type TransacaoFiltersFormData = z.infer<typeof transacaoFiltersSchema>;
export type PagamentoFiltersFormData = z.infer<typeof pagamentoFiltersSchema>; 