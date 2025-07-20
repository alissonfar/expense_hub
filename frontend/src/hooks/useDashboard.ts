import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

// Tipos para o Dashboard
export type PeriodoTipo = '7_dias' | '30_dias' | '90_dias' | '1_ano' | 'personalizado';

export interface DashboardParams {
  periodo?: PeriodoTipo;
  data_inicio?: string;
  data_fim?: string;
  incluir_graficos?: boolean;
  incluir_comparativo?: boolean;
  incluir_vencimentos?: boolean; // ✅ NOVO
  incluir_forma_pagamento?: boolean; // ✅ NOVO
}

export interface DashboardResumo {
  total_gastos: number;
  total_receitas: number;
  saldo_periodo: number;
  transacoes_pendentes: number;
  pessoas_devedoras: number;
  transacoes_vencidas: number; // ✅ NOVO: Contador de vencidas
  valor_vencido: number; // ✅ NOVO: Valor total vencido
  proximos_vencimentos: number; // ✅ NOVO: Contador próximos
}

export interface DashboardComparativo {
  gastos_variacao: number;
  receitas_variacao: number;
  transacoes_variacao: number;
  transacoes_vencidas_variacao?: number; // ✅ NOVO: Variação vencidas
  valor_vencido_variacao?: number; // ✅ NOVO: Variação valor vencido
}

export interface GastoPorDia {
  data: string;
  valor: number;
}

export interface GastoPorCategoria {
  nome: string;
  valor: number;
  cor: string;
}

// ✅ NOVO: Interface para gastos por forma de pagamento
export interface GastoPorFormaPagamento {
  forma: string;
  valor: number;
  cor: string;
}

// ✅ NOVO: Interface para vencimentos por período
export interface VencimentoPorPeriodo {
  periodo: string;
  vencidas: number;
  vencendo: number;
}

export interface DashboardGraficos {
  gastosPorDia: GastoPorDia[];
  gastosPorCategoria: GastoPorCategoria[];
  gastosPorFormaPagamento?: GastoPorFormaPagamento[]; // ✅ NOVO
  vencimentosPorPeriodo?: VencimentoPorPeriodo[]; // ✅ NOVO
}

export interface DashboardPeriodo {
  tipo: PeriodoTipo;
  data_inicio: string;
  data_fim: string;
}

export interface DashboardData {
  resumo: DashboardResumo;
  comparativo?: DashboardComparativo;
  graficos?: DashboardGraficos;
  periodo: DashboardPeriodo;
}

export function useDashboard(params: DashboardParams = {}) {
  const { accessToken, hubAtual } = useAuth();

  const defaultParams: DashboardParams = {
    periodo: '30_dias',
    incluir_graficos: true,
    incluir_comparativo: true,
    ...params,
  };

  return useQuery<DashboardData>({
    queryKey: ['dashboard', hubAtual?.id, defaultParams],
    queryFn: async () => {
      const response = await api.get('/relatorios/dashboard', {
        params: defaultParams,
      });
      const data = response.data.data;
      // Mapeamento snake_case -> camelCase para compatibilidade
      return {
        resumo: {
          total_gastos: data.resumo?.total_gastos ?? data.resumo?.totalGastos ?? 0,
          total_receitas: data.resumo?.total_receitas ?? data.resumo?.totalReceitas ?? 0,
          saldo_periodo: data.resumo?.saldo_periodo ?? data.resumo?.saldoPeriodo ?? 0,
          transacoes_pendentes: data.resumo?.transacoes_pendentes ?? data.resumo?.transacoesPendentes ?? 0,
          pessoas_devedoras: data.resumo?.pessoas_devedoras ?? data.resumo?.pessoasDevedoras ?? 0,
          transacoes_vencidas: data.resumo?.transacoes_vencidas ?? 0, // ✅ NOVO
          valor_vencido: data.resumo?.valor_vencido ?? 0, // ✅ NOVO
          proximos_vencimentos: data.resumo?.proximos_vencimentos ?? 0, // ✅ NOVO
        },
        comparativo: data.comparativo && {
          gastos_variacao: data.comparativo.gastos_variacao ?? data.comparativo.gastosVariacao ?? 0,
          receitas_variacao: data.comparativo.receitas_variacao ?? data.comparativo.receitasVariacao ?? 0,
          transacoes_variacao: data.comparativo.transacoes_variacao ?? data.comparativo.transacoesVariacao ?? 0,
          transacoes_vencidas_variacao: data.comparativo.transacoes_vencidas_variacao ?? 0, // ✅ NOVO
          valor_vencido_variacao: data.comparativo.valor_vencido_variacao ?? 0, // ✅ NOVO
        },
        graficos: data.graficos && {
          gastosPorDia: data.graficos.gastos_por_dia ?? data.graficos.gastosPorDia ?? [],
          gastosPorCategoria: data.graficos.gastos_por_categoria ?? data.graficos.gastosPorCategoria ?? [],
          gastosPorFormaPagamento: data.graficos.gastos_por_forma_pagamento ?? [], // ✅ NOVO
          vencimentosPorPeriodo: data.graficos.vencimentos_por_periodo ?? [], // ✅ NOVO
        },
        periodo: {
          tipo: data.periodo?.tipo,
          data_inicio: data.periodo?.data_inicio ?? data.periodo?.dataInicio,
          data_fim: data.periodo?.data_fim ?? data.periodo?.dataFim,
        },
      };
    },
    enabled: !!accessToken && !!hubAtual,
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchInterval: 1000 * 60 * 5, // Atualiza a cada 5 minutos
  });
}

// Hook auxiliar para buscar transações recentes
export interface TransacaoRecente {
  id: number;
  descricao: string;
  valor: number;
  data: string;
  tipo: 'GASTO' | 'RECEITA';
  data_vencimento?: string; // ✅ NOVO: Data de vencimento
  forma_pagamento?: string; // ✅ NOVO: Forma de pagamento
  tag?: {
    id: number;
    nome: string;
    cor: string;
  };
}

export function useTransacoesRecentes(limit = 5) {
  const { accessToken, hubAtual } = useAuth();

  return useQuery<TransacaoRecente[]>({
    queryKey: ['transacoes-recentes', hubAtual?.id, limit],
    queryFn: async () => {
      const response = await api.get('/transacoes', {
        params: {
          limit,
          ordenar_por: 'data',
          ordem: 'desc',
        },
      });
      // Mapear dados do backend para o formato esperado pelo frontend
      return response.data.data.transacoes.map((transacao: unknown) => {
        if (typeof transacao === 'object' && transacao !== null) {
          type TransacaoBackend = { 
            valor?: number; 
            valor_total?: number; 
            data_transacao?: string;
            data_vencimento?: string; // ✅ NOVO
            forma_pagamento?: string; // ✅ NOVO
            id?: number;
            descricao?: string;
            tipo?: string;
            tag?: { id: number; nome: string; cor: string } | null;
          };
          const t = transacao as TransacaoBackend;
          const valor = t.valor !== undefined ? Number(t.valor) : (t.valor_total !== undefined ? Number(t.valor_total) : 0);
          return {
            id: t.id || 0,
            descricao: t.descricao || '',
            valor,
            data: t.data_transacao || '', // ✅ Mapeamento correto: data_transacao → data
            data_vencimento: t.data_vencimento, // ✅ NOVO
            forma_pagamento: t.forma_pagamento, // ✅ NOVO
            tipo: (t.tipo as 'GASTO' | 'RECEITA') || 'GASTO',
            tag: t.tag,
          };
        }
        return { 
          id: 0, 
          descricao: '', 
          valor: 0, 
          data: '', 
          tipo: 'GASTO' as const 
        };
      });
    },
    enabled: !!accessToken && !!hubAtual,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
} 