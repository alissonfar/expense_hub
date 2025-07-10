import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Tag, CreateTagFormData } from '@/lib/types';

// Query Keys
export const tagKeys = {
  all: ['tags'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...tagKeys.lists(), filters] as const,
  details: () => [...tagKeys.all, 'detail'] as const,
  detail: (id: number) => [...tagKeys.details(), id] as const,
};

// Hook para listar tags
export function useTags(filters: { ativo?: boolean } = {}) {
  return useQuery({
    queryKey: tagKeys.list(filters),
    queryFn: async (): Promise<Tag[]> => {
      const params = new URLSearchParams();
      
      if (filters.ativo !== undefined) {
        params.append('ativo', String(filters.ativo));
      }

      const response = await api.get(`/tags?${params.toString()}`);
      return response.data.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

// Hook para buscar tag por ID
export function useTag(id: number) {
  return useQuery({
    queryKey: tagKeys.detail(id),
    queryFn: async (): Promise<Tag> => {
      const response = await api.get(`/tags/${id}`);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

// Hook para criar tag
export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTagFormData): Promise<Tag> => {
      const response = await api.post('/tags', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
    },
  });
}

// Hook para editar tag
export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CreateTagFormData>;
    }): Promise<Tag> => {
      const response = await api.put(`/tags/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
      queryClient.invalidateQueries({ queryKey: tagKeys.detail(id) });
    },
  });
}

// Hook para excluir tag
export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await api.delete(`/tags/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagKeys.all });
    },
  });
} 