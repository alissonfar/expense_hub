import { useQuery } from '@tanstack/react-query';
import { transacoesApi } from '@/lib/api';
import type { Transacao } from '@/lib/types';

interface TransacoesParams {
  limit?: number;
  tipo?: 'GASTO' | 'RECEITA' | 'TODOS';
  incluir_participantes?: boolean;
  incluir_tags?: boolean;
}

export const useTransacoes = (params: TransacoesParams = {}) => {
  const defaultParams = {
    limit: 10,
    ordenar_por: 'data_transacao',
    ordem: 'desc',
    incluir_participantes: true,
    incluir_tags: true,
    ...params
  };

  return useQuery({
    queryKey: ['transacoes', 'recentes', defaultParams],
    queryFn: async () => {
      const response = await transacoesApi.list(defaultParams);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao carregar transações');
      }
      return response.data as { transacoes: Transacao[] };
    },
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
}; 