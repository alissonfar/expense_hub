import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Pessoa, MembroHub } from '@/lib/types';

// Query Keys
export const pessoaKeys = {
  all: ['pessoas'] as const,
  lists: () => [...pessoaKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...pessoaKeys.lists(), filters] as const,
  details: () => [...pessoaKeys.all, 'detail'] as const,
  detail: (id: number) => [...pessoaKeys.details(), id] as const,
  membros: () => [...pessoaKeys.all, 'membros'] as const,
};

// Hook para listar pessoas do hub atual
export function usePessoas(filters: { ativo?: boolean } = {}) {
  return useQuery({
    queryKey: pessoaKeys.list(filters),
    queryFn: async (): Promise<Pessoa[]> => {
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
    queryFn: async (): Promise<Pessoa> => {
      const response = await api.get(`/pessoas/${id}`);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para listar membros do hub com informações completas
export function useMembrosHub(filters: { ativo?: boolean } = {}) {
  return useQuery({
    queryKey: [...pessoaKeys.membros(), filters],
    queryFn: async (): Promise<MembroHub[]> => {
      const params = new URLSearchParams();
      
      if (filters.ativo !== undefined) {
        params.append('ativo', String(filters.ativo));
      }

      const response = await api.get(`/pessoas/membros?${params.toString()}`);
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para convidar novo membro
export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      role: 'PROPRIETARIO' | 'ADMINISTRADOR' | 'COLABORADOR' | 'VISUALIZADOR';
      dataAccessPolicy?: 'GLOBAL' | 'INDIVIDUAL';
    }) => {
      const response = await api.post('/pessoas/invite', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pessoaKeys.all });
    },
  });
}

// Hook para atualizar role de membro
export function useUpdateMemberRole() {
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
      const response = await api.put(`/pessoas/${pessoaId}/role`, {
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

// Hook para remover membro do hub
export function useRemoveMember() {
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

// Hook simplificado para buscar apenas participantes ativos (para formulários)
export function useParticipantesAtivos() {
  return useQuery({
    queryKey: [...pessoaKeys.lists(), { ativo: true, participantes: true }],
    queryFn: async (): Promise<Array<{ id: number; nome: string; email: string }>> => {
      const response = await api.get('/pessoas?ativo=true');
      const pessoas = response.data.data as Pessoa[];
      
      return pessoas.map(pessoa => ({
        id: pessoa.id,
        nome: pessoa.nome,
        email: pessoa.email,
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    select: (data) => data.sort((a, b) => a.nome.localeCompare(b.nome)), // Ordenar por nome
  });
} 