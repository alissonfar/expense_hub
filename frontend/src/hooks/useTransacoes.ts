import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { 
  Transacao, 
  PaginatedResponse, 
  TransacaoFilters, 
  CreateTransacaoFormData, 
  TransacaoParticipante 
} from '@/lib/types';

// Query Keys
export const transactionKeys = {
  all: ['transacoes'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (filters: TransacaoFilters) => [...transactionKeys.lists(), filters] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: number) => [...transactionKeys.details(), id] as const,
};

// Tipo intermediário para resposta do backend
interface BackendTransacaoRaw extends Omit<Transacao, 'participantes'> {
  participantes?: unknown;
  transacao_participantes?: unknown;
}

// Hook para listar transações
export function useTransacoes(filters: TransacaoFilters = {}) {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: async (): Promise<PaginatedResponse<Transacao>> => {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await api.get(`/transacoes?${params.toString()}`);
      // Mapeamento: garantir que cada transação tenha participantes
      if (response.data?.data?.transacoes) {
        response.data.data.transacoes = response.data.data.transacoes.map((t: BackendTransacaoRaw) => {
          let participantes: TransacaoParticipante[] = [];
          if (Array.isArray(t.participantes)) {
            participantes = t.participantes as TransacaoParticipante[];
          } else if (Array.isArray(t.transacao_participantes)) {
            participantes = t.transacao_participantes as TransacaoParticipante[];
          }
          return {
            ...t,
            participantes,
          };
        });
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
  });
}

// Hook para buscar transação por ID
export function useTransacao(id: number) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: async (): Promise<Transacao> => {
      const response = await api.get(`/transacoes/${id}`);
      const data = response.data.data;
      // Mapeamento para compatibilidade com frontend
      return {
        ...data,
        participantes: data.participantes || data.transacao_participantes || [],
        pagamentos: data.pagamentos || data.pagamento_transacoes || [],
      };
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para criar transação (gasto)
export function useCreateTransacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTransacaoFormData): Promise<Transacao> => {
      const response = await api.post('/transacoes', data);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidar todas as queries de transações
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      // Invalidar queries do dashboard para atualizar métricas
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// Hook para criar receita
export function useCreateReceita() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      descricao: string;
      local?: string;
      valor_recebido: number;
      data_transacao: string;
      observacoes?: string;
      tags?: number[];
    }): Promise<Transacao> => {
      const response = await api.post('/transacoes/receita', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// Hook para editar transação (gasto)
export function useUpdateTransacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: {
        descricao?: string;
        local?: string;
        observacoes?: string;
        tags?: number[];
      };
    }): Promise<Transacao> => {
      const response = await api.put(`/transacoes/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: transactionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// Hook para editar receita
export function useUpdateReceita() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: {
        descricao?: string;
        local?: string;
        valor_recebido?: number;
        data_transacao?: string;
        observacoes?: string;
        tags?: number[];
      };
    }): Promise<Transacao> => {
      const response = await api.put(`/transacoes/receita/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: transactionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// Hook para excluir transação (soft delete)
export function useDeleteTransacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await api.delete(`/transacoes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// Hook para buscar transações na lixeira (ativo: false)
export function useTransacoesLixeira(filters: Omit<TransacaoFilters, 'ativo'> = {}) {
  return useQuery({
    queryKey: [...transactionKeys.lists(), { ...filters, ativo: false }],
    queryFn: async (): Promise<PaginatedResponse<Transacao>> => {
      const params = new URLSearchParams();
      
      // Adicionar ativo: false
      params.append('ativo', 'false');
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await api.get(`/transacoes?${params.toString()}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para buscar transações por grupo de parcela
export function useTransacoesParcelas(grupoParcela: string) {
  return useQuery({
    queryKey: [...transactionKeys.lists(), { grupo_parcela: grupoParcela }],
    queryFn: async (): Promise<PaginatedResponse<Transacao>> => {
      const response = await api.get(`/transacoes?grupo_parcela=${grupoParcela}`);
      return response.data;
    },
    enabled: !!grupoParcela,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para duplicar transação (criar nova baseada em existente)
export function useDuplicateTransacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<Transacao> => {
      // Buscar a transação original
      const originalResponse = await api.get(`/transacoes/${id}`);
      const original = originalResponse.data.data as Transacao;
      
      // Preparar dados para duplicação
      const duplicateData: CreateTransacaoFormData = {
        tipo: original.tipo,
        descricao: `${original.descricao} (cópia)`,
        local: original.local,
        valor_total: original.valor_total,
        data_transacao: new Date().toISOString().split('T')[0], // Data de hoje
        eh_parcelado: false, // Resetar parcelamento
        total_parcelas: 1,
        observacoes: original.observacoes,
        proprietario_id: original.proprietario_id,
        tags: original.tags?.map(tag => tag.id) || [],
        participantes: original.participantes?.map(p => ({
          pessoa_id: p.pessoa_id,
          valor_individual: p.valor_individual,
        })) || [],
      };
      
      // Criar nova transação
      const response = await api.post('/transacoes', duplicateData);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// Hook para estatísticas de transações (uso futuro)
export function useTransacoesStats(filters: TransacaoFilters = {}) {
  return useQuery({
    queryKey: [...transactionKeys.all, 'stats', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await api.get(`/transacoes/stats?${params.toString()}`);
      return response.data.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutos para stats
  });
} 