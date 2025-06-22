import { z } from 'zod';

// =============================================
// SCHEMAS DE VALIDAÇÃO PARA RELATÓRIOS
// =============================================

/**
 * Schema para parâmetros de query dos relatórios de saldos
 */
export const saldosQuerySchema = z.object({
  // Filtros de pessoas
  pessoa_id: z
    .union([z.string(), z.number()])
    .transform(val => {
      if (typeof val === 'number') return val;
      return parseInt(val);
    })
    .optional(),
  
  apenas_ativos: z
    .union([z.string(), z.boolean()])
    .default('true')
    .transform(val => {
      if (typeof val === 'boolean') return val;
      return val === 'true';
    })
    .describe('Incluir apenas pessoas ativas'),
  
  // Filtros de data
  data_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início deve estar no formato YYYY-MM-DD')
    .optional(),
  
  data_fim: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de fim deve estar no formato YYYY-MM-DD')
    .optional(),
  
  // Filtros de status
  status_saldo: z
    .enum(['DEVEDOR', 'CREDOR', 'QUITADO', 'TODOS'])
    .default('TODOS')
    .describe('Filtrar por status do saldo'),
  
  // Filtros de valor
  valor_minimo: z
    .union([z.string(), z.number()])
    .transform(val => {
      if (typeof val === 'number') return val;
      return parseFloat(val);
    })
    .optional(),
  
  // Ordenação
  ordenar_por: z
    .enum(['nome', 'saldo', 'total_deve', 'total_pago'])
    .default('nome')
    .describe('Campo para ordenação'),
  
  ordem: z
    .enum(['asc', 'desc'])
    .default('asc')
    .describe('Direção da ordenação'),
  
  // Formato de resposta
  incluir_detalhes: z
    .union([z.string(), z.boolean()])
    .default('false')
    .transform(val => {
      if (typeof val === 'boolean') return val;
      return val === 'true';
    })
    .describe('Incluir detalhes das transações')
});

/**
 * Schema para parâmetros de query dos relatórios de transações
 */
export const transacoesQuerySchema = z.object({
  // Filtros básicos
  tipo: z
    .enum(['GASTO', 'RECEITA', 'TODOS'])
    .default('TODOS')
    .describe('Tipo de transação'),
  
  status_pagamento: z
    .enum(['PENDENTE', 'PAGO_PARCIAL', 'PAGO_TOTAL', 'TODOS'])
    .default('TODOS')
    .describe('Status do pagamento'),
  
  // Filtros de data
  data_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início deve estar no formato YYYY-MM-DD')
    .optional(),
  
  data_fim: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de fim deve estar no formato YYYY-MM-DD')
    .optional(),
  
    // Filtros de pessoas
  proprietario_id: z
    .union([z.string(), z.number()])
    .transform(val => {
      if (typeof val === 'number') return val;
      return parseInt(val);
    })
    .optional(),

  participante_id: z
    .union([z.string(), z.number()])
    .transform(val => {
      if (typeof val === 'number') return val;
      return parseInt(val);
    })
    .optional(),

  // Filtros de tags
  tag_id: z
    .union([z.string(), z.number()])
    .transform(val => {
      if (typeof val === 'number') return val;
      return parseInt(val);
    })
    .optional(),
  
    // Filtros de valor
  valor_min: z
    .union([z.string(), z.number()])
    .transform(val => {
      if (typeof val === 'number') return val;
      return parseFloat(val);
    })
    .optional(),

  valor_max: z
    .union([z.string(), z.number()])
    .transform(val => {
      if (typeof val === 'number') return val;
      return parseFloat(val);
    })
    .optional(),
  
  // Filtros de parcelamento
  eh_parcelado: z
    .union([z.string(), z.boolean()])
    .transform(val => {
      if (typeof val === 'boolean') return val;
      return val === 'true';
    })
    .optional(),
  
  grupo_parcela: z
    .string()
    .uuid('Grupo de parcela deve ser um UUID válido')
    .optional(),
  
    // Paginação
  page: z
    .union([z.string(), z.number()])
    .default(1)
    .transform(val => {
      if (typeof val === 'number') return val;
      return parseInt(val);
    })
    .refine(val => val >= 1, 'Página deve ser maior que zero'),

  limit: z
    .union([z.string(), z.number()])
    .default(20)
    .transform(val => {
      if (typeof val === 'number') return val;
      return parseInt(val);
    })
    .refine(val => val >= 1 && val <= 100, 'Limite deve estar entre 1 e 100'),
  
  // Ordenação
  ordenar_por: z
    .enum(['data_transacao', 'valor_total', 'descricao', 'criado_em'])
    .default('data_transacao')
    .describe('Campo para ordenação'),
  
  ordem: z
    .enum(['asc', 'desc'])
    .default('desc')
    .describe('Direção da ordenação'),
  
  // Agrupamento
  agrupar_por: z
    .enum(['mes', 'tag', 'pessoa', 'tipo', 'nenhum'])
    .default('nenhum')
    .describe('Agrupamento dos resultados'),
  
  // Incluir relacionamentos
  incluir_participantes: z
    .union([z.string(), z.boolean()])
    .default('true')
    .transform(val => {
      if (typeof val === 'boolean') return val;
      return val === 'true';
    })
    .describe('Incluir dados dos participantes'),
  
  incluir_tags: z
    .union([z.string(), z.boolean()])
    .default('true')
    .transform(val => {
      if (typeof val === 'boolean') return val;
      return val === 'true';
    })
    .describe('Incluir dados das tags'),
  
  incluir_pagamentos: z
    .union([z.string(), z.boolean()])
    .default('false')
    .transform(val => {
      if (typeof val === 'boolean') return val;
      return val === 'true';
    })
    .describe('Incluir histórico de pagamentos')
});

/**
 * Schema para parâmetros de query dos relatórios de pendências
 */
export const pendenciasQuerySchema = z.object({
  // Filtros de pessoas
  pessoa_id: z
    .union([z.string(), z.number()])
    .transform(val => {
      if (typeof val === 'number') return val;
      return parseInt(val);
    })
    .optional(),
  
  apenas_ativos: z
    .union([z.string(), z.boolean()])
    .default('true')
    .transform(val => {
      if (typeof val === 'boolean') return val;
      return val === 'true';
    })
    .describe('Incluir apenas pessoas ativas'),
  
  // Filtros de valor
  valor_minimo: z
    .union([z.string(), z.number()])
    .default(0.01)
    .transform(val => {
      if (typeof val === 'number') return val;
      return parseFloat(val);
    })
    .describe('Valor mínimo da pendência'),
  
  // Filtros de data
  vencimento_ate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de vencimento deve estar no formato YYYY-MM-DD')
    .optional()
    .describe('Mostrar pendências vencidas até esta data'),
  
  data_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início deve estar no formato YYYY-MM-DD')
    .optional(),
  
  data_fim: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de fim deve estar no formato YYYY-MM-DD')
    .optional(),
  
  // Filtros de urgência
  urgencia: z
    .enum(['VENCIDA', 'VENCE_HOJE', 'VENCE_SEMANA', 'VENCE_MES', 'TODAS'])
    .default('TODAS')
    .describe('Filtrar por urgência da pendência'),
  
  // Ordenação
  ordenar_por: z
    .enum(['valor_devido', 'data_transacao', 'pessoa_nome', 'dias_atraso'])
    .default('valor_devido')
    .describe('Campo para ordenação'),
  
  ordem: z
    .enum(['asc', 'desc'])
    .default('desc')
    .describe('Direção da ordenação'),
  
  // Agrupamento
  agrupar_por: z
    .enum(['pessoa', 'urgencia', 'tag', 'nenhum'])
    .default('pessoa')
    .describe('Agrupamento das pendências'),
  
  // Incluir detalhes
  incluir_historico_pagamentos: z
    .union([z.string(), z.boolean()])
    .default('false')
    .transform(val => {
      if (typeof val === 'boolean') return val;
      return val === 'true';
    })
    .describe('Incluir histórico de pagamentos parciais')
});

/**
 * Schema para parâmetros de query do dashboard
 */
export const dashboardQuerySchema = z.object({
  // Período de análise
  periodo: z
    .enum(['7_dias', '30_dias', '90_dias', '1_ano', 'personalizado'])
    .default('30_dias')
    .describe('Período para análise do dashboard'),
  
  // Para período personalizado
  data_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início deve estar no formato YYYY-MM-DD')
    .optional(),
  
  data_fim: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de fim deve estar no formato YYYY-MM-DD')
    .optional(),
  
  // Métricas a incluir
  incluir_graficos: z
    .union([z.string(), z.boolean()])
    .default('true')
    .transform(val => {
      if (typeof val === 'boolean') return val;
      return val === 'true';
    })
    .describe('Incluir dados para gráficos'),
  
  incluir_comparativo: z
    .union([z.string(), z.boolean()])
    .default('true')
    .transform(val => {
      if (typeof val === 'boolean') return val;
      return val === 'true';
    })
    .describe('Incluir comparativo com período anterior'),
  
  // Filtros
  apenas_confirmadas: z
    .union([z.string(), z.boolean()])
    .default('true')
    .transform(val => {
      if (typeof val === 'boolean') return val;
      return val === 'true';
    })
    .describe('Incluir apenas transações confirmadas')
})
.refine(
  (data) => {
    if (data.periodo === 'personalizado') {
      return data.data_inicio && data.data_fim;
    }
    return true;
  },
  {
    message: 'Para período personalizado, data_inicio e data_fim são obrigatórias'
  }
);

/**
 * Schema para parâmetros de query dos relatórios por categoria
 */
export const categoriasQuerySchema = z.object({
  // Filtros de data
  data_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início deve estar no formato YYYY-MM-DD')
    .optional(),
  
  data_fim: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de fim deve estar no formato YYYY-MM-DD')
    .optional(),
  
  // Filtros de tipo
  tipo: z
    .enum(['GASTO', 'RECEITA', 'TODOS'])
    .default('GASTO')
    .describe('Tipo de transação para análise'),
  
  // Filtros de tags
  tag_ids: z
    .string()
    .regex(/^(\d+)(,\d+)*$/, 'IDs das tags devem ser números separados por vírgula')
    .transform(val => val.split(',').map(id => parseInt(id)))
    .optional(),
  
  // Métricas
  metrica: z
    .enum(['valor_total', 'quantidade', 'valor_medio'])
    .default('valor_total')
    .describe('Métrica para análise'),
  
  // Ordenação
  ordenar_por: z
    .enum(['valor', 'quantidade', 'nome_tag'])
    .default('valor')
    .describe('Campo para ordenação'),
  
  ordem: z
    .enum(['asc', 'desc'])
    .default('desc')
    .describe('Direção da ordenação'),
  
  // Limite de resultados
  limite: z
    .union([z.string(), z.number()])
    .default(10)
    .transform(val => {
      if (typeof val === 'number') return val;
      return parseInt(val);
    })
    .refine(val => val >= 1 && val <= 50, 'Limite deve estar entre 1 e 50')
    .describe('Número máximo de categorias a retornar'),
  
  // Incluir sem categoria
  incluir_sem_categoria: z
    .union([z.string(), z.boolean()])
    .default('true')
    .transform(val => {
      if (typeof val === 'boolean') return val;
      return val === 'true';
    })
    .describe('Incluir transações sem categoria/tag')
});

// =============================================
// TIPOS INFERIDOS DOS SCHEMAS
// =============================================

export type SaldosQueryInput = z.infer<typeof saldosQuerySchema>;
export type TransacoesQueryInput = z.infer<typeof transacoesQuerySchema>;
export type PendenciasQueryInput = z.infer<typeof pendenciasQuerySchema>;
export type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>;
export type CategoriasQueryInput = z.infer<typeof categoriasQuerySchema>;

// =============================================
// SCHEMAS DE RESPOSTA (PARA DOCUMENTAÇÃO)
// =============================================

export const saldoResponseSchema = z.object({
  pessoa_id: z.number(),
  pessoa_nome: z.string(),
  pessoa_email: z.string(),
  total_deve: z.number(),
  total_pago: z.number(),
  saldo_final: z.number(),
  status: z.enum(['DEVEDOR', 'CREDOR', 'QUITADO']),
  transacoes_pendentes: z.number(),
  ultima_transacao: z.string().optional(),
  detalhes: z.array(z.object({
    transacao_id: z.number(),
    descricao: z.string(),
    valor_devido: z.number(),
    valor_pago: z.number(),
    data_transacao: z.string()
  })).optional()
});

export const dashboardResponseSchema = z.object({
  resumo: z.object({
    total_gastos: z.number(),
    total_receitas: z.number(),
    saldo_periodo: z.number(),
    transacoes_pendentes: z.number(),
    pessoas_devedoras: z.number()
  }),
  comparativo: z.object({
    gastos_variacao: z.number(),
    receitas_variacao: z.number(),
    transacoes_variacao: z.number()
  }).optional(),
  graficos: z.object({
    gastos_por_dia: z.array(z.object({
      data: z.string(),
      valor: z.number()
    })),
    gastos_por_categoria: z.array(z.object({
      categoria: z.string(),
      valor: z.number(),
      cor: z.string()
    })),
    status_pagamentos: z.object({
      pendente: z.number(),
      pago_parcial: z.number(),
      pago_total: z.number()
    })
  }).optional()
});

export type SaldoResponse = z.infer<typeof saldoResponseSchema>;
export type DashboardResponse = z.infer<typeof dashboardResponseSchema>; 