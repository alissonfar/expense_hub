import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Pessoa, PessoaHub } from '@/lib/types';

// Query Keys
export const pessoaKeys = {
  all: ['pessoas'] as const,
  lists: () => [...pessoaKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...pessoaKeys.lists(), filters] as const,
  details: () => [...pessoaKeys.all, 'detail'] as const,
  detail: (id: number) => [...pessoaKeys.details(), id] as const,
};

// Hook para listar pessoas do hub atual
export function usePessoas(filters: { ativo?: boolean } = {}) {
  return useQuery({
    queryKey: pessoaKeys.list(filters),
    queryFn: async (): Promise<PessoaHub[]> => {
      const params = new URLSearchParams();
      if (filters.ativo !== undefined) {
        params.append('ativo', String(filters.ativo));
      }
      const response = await api.get(`/pessoas?${params.toString()}`);
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para buscar pessoa por ID
export function usePessoa(id: number) {
  return useQuery({
    queryKey: pessoaKeys.detail(id),
    queryFn: async (): Promise<PessoaHub> => {
      const response = await api.get(`/pessoas/${id}`);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para convidar nova pessoa
export function useInvitePessoa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      email: string;
      nome: string;
      role: 'PROPRIETARIO' | 'ADMINISTRADOR' | 'COLABORADOR' | 'VISUALIZADOR';
      dataAccessPolicy?: 'GLOBAL' | 'INDIVIDUAL';
    }) => {
      const response = await api.post('/pessoas', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pessoaKeys.all });
    },
  });
}

// Hook para atualizar role de pessoa
export function useUpdatePessoaRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      pessoaId,
      role,
      dataAccessPolicy,
    }: {
      pessoaId: number;
      role: 'PROPRIETARIO' | 'ADMINISTRADOR' | 'COLABORADOR' | 'VISUALIZADOR';
      dataAccessPolicy?: 'GLOBAL' | 'INDIVIDUAL';
    }) => {
      const response = await api.put(`/pessoas/${pessoaId}`, {
        role,
        dataAccessPolicy,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pessoaKeys.all });
    },
  });
}

// Hook para remover pessoa do hub
export function useRemovePessoa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pessoaId: number) => {
      await api.delete(`/pessoas/${pessoaId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pessoaKeys.all });
    },
  });
}

// Hook simplificado para buscar apenas pessoas ativas (para formulários)
export function usePessoasAtivas() {
  return useQuery({
    queryKey: [...pessoaKeys.lists(), { ativo: true }],
    queryFn: async (): Promise<Array<{ id: number; nome: string; email: string }>> => {
      const response = await api.get('/pessoas?ativo=true');
      const pessoas = response.data.data as PessoaHub[];
      return pessoas.map(pessoa => ({
        id: pessoa.pessoaId,
        nome: pessoa.pessoa?.nome || '',
        email: pessoa.pessoa?.email || '',
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    select: (data) => data.sort((a, b) => a.nome.localeCompare(b.nome)),
  });
} 