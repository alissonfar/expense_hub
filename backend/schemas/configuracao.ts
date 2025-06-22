import { z } from 'zod';

// =============================================
// SCHEMAS DE CONFIGURAÇÕES DO SISTEMA
// =============================================

/**
 * Schema para configurações de interface (tema, aparência)
 */
export const configuracaoInterfaceSchema = z.object({
  theme_interface: z
    .enum(['light', 'dark', 'auto'])
    .default('light')
    .describe('Tema da interface do sistema')
});

// =============================================
// SCHEMAS PREPARADOS PARA FUTURAS CONFIGURAÇÕES
// =============================================

/**
 * Schema para futuras configurações de comportamento
 * (ex: transacao_confirmar_automatico, divisao_centavos_estrategia)
 */
export const configuracaoComportamentoSchema = z.object({
  // TODO: Implementar quando necessário
  // transacao_confirmar_automatico: z.boolean().default(false),
  // divisao_centavos_estrategia: z.enum(['distribuir', 'ignorar', 'proprietario']).default('distribuir')
});

/**
 * Schema para futuras configurações de alertas
 * (ex: alertar_dividas_altas, valor_alerta_divida)
 */
export const configuracaoAlertasSchema = z.object({
  // TODO: Implementar quando necessário
  // alertar_dividas_altas: z.boolean().default(true),
  // valor_alerta_divida: z.number().min(0).default(100)
});

/**
 * Schema para futuras configurações de relatórios
 * (ex: relatorio_periodo_padrao, dashboard_mostrar_graficos)
 */
export const configuracaoRelatoriosSchema = z.object({
  // TODO: Implementar quando necessário
  // relatorio_periodo_padrao: z.enum(['7_dias', '30_dias', '90_dias', '1_ano']).default('30_dias'),
  // dashboard_mostrar_graficos: z.boolean().default(true)
});

/**
 * Schema para futuras configurações de aparência adicionais
 * (ex: mostrar_centavos, formato_data)
 */
export const configuracaoAparenciaSchema = z.object({
  // TODO: Implementar quando necessário
  // mostrar_centavos: z.boolean().default(true),
  // formato_data: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).default('DD/MM/YYYY')
});

// =============================================
// TIPOS INFERIDOS DOS SCHEMAS
// =============================================

export type ConfiguracaoInterfaceInput = z.infer<typeof configuracaoInterfaceSchema>;
export type ConfiguracaoComportamentoInput = z.infer<typeof configuracaoComportamentoSchema>;
export type ConfiguracaoAlertasInput = z.infer<typeof configuracaoAlertasSchema>;
export type ConfiguracaoRelatoriosInput = z.infer<typeof configuracaoRelatoriosSchema>;
export type ConfiguracaoAparenciaInput = z.infer<typeof configuracaoAparenciaSchema>;

// =============================================
// SCHEMAS DE VALIDAÇÃO PARA RESPONSES (OPCIONAL)
// =============================================

/**
 * Schema para validar resposta de configurações de interface
 */
export const configuracaoInterfaceResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: configuracaoInterfaceSchema,
  timestamp: z.string()
});

export type ConfiguracaoInterfaceResponse = z.infer<typeof configuracaoInterfaceResponseSchema>; 