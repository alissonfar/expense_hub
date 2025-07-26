import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

// Tipos específicos para Relatórios (baseados no useDashboard)
export type PeriodoTipo = '7_dias' | '30_dias' | '90_dias' | '1_ano' | 'personalizado';

export interface FiltroRelatorio {
  periodo: PeriodoTipo;
  dataInicio?: string;
  dataFim?: string;
  categorias: string[];
  pessoas: string[];
  valorMinimo?: number;
  valorMaximo?: number;
  status: 'TODOS' | 'CONFIRMADO' | 'PENDENTE';
  ordenacao: {
    campo: 'data' | 'valor' | 'categoria' | 'pessoa';
    direcao: 'asc' | 'desc';
  };
}

export interface RelatoriosParams {
  periodo?: PeriodoTipo;
  data_inicio?: string;
  data_fim?: string;
  incluir_graficos?: boolean;
  incluir_comparativo?: boolean;
  pessoa_id?: number;
  categorias?: string[];
  ordenar_por?: string;
  ordem?: 'asc' | 'desc';
}

export interface RelatoriosResumo {
  total_gastos: number;
  total_receitas: number;
  saldo_periodo: number;
  transacoes_pendentes: number;
  pessoas_devedoras: number;
  transacoes_vencidas: number;
  valor_vencido: number;
  proximos_vencimentos: number;
}

export interface RelatoriosComparativo {
  gastos_variacao: number;
  receitas_variacao: number;
  transacoes_variacao: number;
  transacoes_vencidas_variacao: number;
  valor_vencido_variacao: number;
}

export interface GastoPorCategoria {
  nome: string;
  valor: number;
  cor: string;
}

export interface GastoPorDia {
  data: string;
  valor: number;
}

export interface RelatoriosGraficos {
  gastosPorCategoria: GastoPorCategoria[];
  gastosPorDia: GastoPorDia[];
}

export interface RelatoriosPeriodo {
  tipo: PeriodoTipo;
  data_inicio: string;
  data_fim: string;
}

export interface RelatoriosData {
  resumo: RelatoriosResumo;
  comparativo?: RelatoriosComparativo;
  graficos?: RelatoriosGraficos;
  periodo: RelatoriosPeriodo;
}

/**
 * Hook principal para dados de relatórios
 * Baseado no padrão do useDashboard existente
 */
export function useRelatorios(params: RelatoriosParams = {}) {
  const { accessToken, hubAtual } = useAuth();

  const defaultParams: RelatoriosParams = {
    periodo: '30_dias',
    incluir_graficos: true,
    incluir_comparativo: true,
    ...params,
  };

  // Se o período for personalizado, garantir que data_inicio e data_fim estejam presentes
  if (defaultParams.periodo === 'personalizado' && (!defaultParams.data_inicio || !defaultParams.data_fim)) {
    // Se não tiver datas, mudar para 30_dias como fallback
    defaultParams.periodo = '30_dias';
    delete defaultParams.data_inicio;
    delete defaultParams.data_fim;
  }

  return useQuery<RelatoriosData>({
    queryKey: ['relatorios', hubAtual?.id, defaultParams],
    queryFn: async () => {
      const response = await api.get('/relatorios/dashboard', {
        params: defaultParams,
      });
      const data = response.data.data;
      
      // Mapeamento snake_case → camelCase para compatibilidade
      return {
        resumo: {
          total_gastos: data.resumo?.total_gastos ?? 0,
          total_receitas: data.resumo?.total_receitas ?? 0,
          saldo_periodo: data.resumo?.saldo_periodo ?? 0,
          transacoes_pendentes: data.resumo?.transacoes_pendentes ?? 0,
          pessoas_devedoras: data.resumo?.pessoas_devedoras ?? 0,
          transacoes_vencidas: data.resumo?.transacoes_vencidas ?? 0,
          valor_vencido: data.resumo?.valor_vencido ?? 0,
          proximos_vencimentos: data.resumo?.proximos_vencimentos ?? 0,
        },
        comparativo: data.comparativo && {
          gastos_variacao: data.comparativo.gastos_variacao ?? 0,
          receitas_variacao: data.comparativo.receitas_variacao ?? 0,
          transacoes_variacao: data.comparativo.transacoes_variacao ?? 0,
          transacoes_vencidas_variacao: data.comparativo.transacoes_vencidas_variacao ?? 0,
          valor_vencido_variacao: data.comparativo.valor_vencido_variacao ?? 0,
        },
        graficos: data.graficos && {
          gastosPorCategoria: data.graficos.gastos_por_categoria ?? [],
          gastosPorDia: data.graficos.gastos_por_dia ?? [],
        },
        periodo: {
          tipo: data.periodo?.tipo ?? 'personalizado',
          data_inicio: data.periodo?.data_inicio ?? '',
          data_fim: data.periodo?.data_fim ?? '',
        },
      };
    },
    enabled: !!accessToken && !!hubAtual,
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchInterval: 1000 * 60 * 5, // Atualiza a cada 5 minutos
  });
}

/**
 * Hook para relatórios de saldos por pessoa
 */
export function useRelatoriosSaldos(params: { 
  pessoa_id?: number; 
  apenas_ativos?: boolean;
  data_inicio?: string;
  data_fim?: string;
} = {}) {
  const { accessToken, hubAtual } = useAuth();

  return useQuery({
    queryKey: ['relatorios-saldos', hubAtual?.id, params],
    queryFn: async () => {
      const response = await api.get('/relatorios/saldos', { params });
      return response.data.data;
    },
    enabled: !!accessToken && !!hubAtual,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook para relatórios de transações com filtros avançados
 */
export function useRelatoriosTransacoes(params: {
  tipo?: 'GASTO' | 'RECEITA' | 'TODOS';
  status_pagamento?: 'PENDENTE' | 'PAGO_PARCIAL' | 'PAGO_TOTAL' | 'TODOS';
  data_inicio?: string;
  data_fim?: string;
  ordenar_por?: string;
  ordem?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
} = {}) {
  const { accessToken, hubAtual } = useAuth();

  return useQuery({
    queryKey: ['relatorios-transacoes', hubAtual?.id, params],
    queryFn: async () => {
      const response = await api.get('/relatorios/transacoes', { params });
      return response.data.data;
    },
    enabled: !!accessToken && !!hubAtual,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Hook para relatórios de categorias
 */
export function useRelatoriosCategorias(params: {
  periodo?: PeriodoTipo;
  data_inicio?: string;
  data_fim?: string;
  ordenar_por?: string;
  ordem?: 'asc' | 'desc';
} = {}) {
  const { accessToken, hubAtual } = useAuth();

  return useQuery({
    queryKey: ['relatorios-categorias', hubAtual?.id, params],
    queryFn: async () => {
      const response = await api.get('/relatorios/categorias', { params });
      return response.data.data;
    },
    enabled: !!accessToken && !!hubAtual,
    staleTime: 1000 * 60 * 5,
  });
}