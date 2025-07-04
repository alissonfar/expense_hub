import { useQuery } from '@tanstack/react-query';
import { relatoriosApi } from '@/lib/api';

interface PendenciasParams {
  limit?: number;
  urgencia?: 'TODAS' | 'VENCIDA' | 'ATRASADA' | 'NORMAL';
  ordenar_por?: 'pessoa_nome' | 'valor_devido' | 'data_transacao' | 'dias_atraso';
  ordem?: 'asc' | 'desc';
}

export const usePendencias = (params: PendenciasParams = {}) => {
  const defaultParams = {
    limit: 5,
    urgencia: 'VENCIDA',
    ordenar_por: 'dias_atraso',
    ordem: 'desc',
    ...params
  };

  return useQuery({
    queryKey: ['pendencias', 'urgentes', defaultParams],
    queryFn: async () => {
      const response = await relatoriosApi.pendencias(defaultParams);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao carregar pendências');
      }
      return response.data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
}; 