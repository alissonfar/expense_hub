import { useQuery } from '@tanstack/react-query';
import { relatoriosApi } from '@/lib/api';
import type { DashboardData, DashboardQueryParams } from '@/lib/types';

export const useDashboard = (params: DashboardQueryParams = {}) => {
  return useQuery({
    queryKey: ['dashboard', params],
    queryFn: async (): Promise<DashboardData> => {
      const response = await relatoriosApi.dashboard(params as Record<string, unknown>);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erro ao carregar dashboard');
      }
      return response.data as DashboardData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
  });
}; 