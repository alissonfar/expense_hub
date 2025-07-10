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
}

export interface DashboardResumo {
  total_gastos: number;
  total_receitas: number;
  saldo_periodo: number;
  transacoes_pendentes: number;
  pessoas_devedoras: number;
}

export interface DashboardComparativo {
  gastos_variacao: number;
  receitas_variacao: number;
  transacoes_variacao: number;
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

export interface DashboardGraficos {
  gastosPorDia: GastoPorDia[];
  gastosPorCategoria: GastoPorCategoria[];
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
  const { accessToken } = useAuth();

  const defaultParams: DashboardParams = {
    periodo: '30_dias',
    incluir_graficos: true,
    incluir_comparativo: true,
    ...params,
  };

  return useQuery<DashboardData>({
    queryKey: ['dashboard', defaultParams],
    queryFn: async () => {
      const response = await api.get('/relatorios/dashboard', {
        params: defaultParams,
      });
      return response.data.data;
    },
    enabled: !!accessToken,
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
  tag?: {
    id: number;
    nome: string;
    cor: string;
  };
}

export function useTransacoesRecentes(limit = 5) {
  const { accessToken } = useAuth();

  return useQuery<TransacaoRecente[]>({
    queryKey: ['transacoes-recentes', limit],
    queryFn: async () => {
      const response = await api.get('/transacoes', {
        params: {
          limit,
          ordenar_por: 'data',
          ordem: 'desc',
        },
      });
      return response.data.data.transacoes;
    },
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
} 