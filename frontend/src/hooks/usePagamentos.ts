import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { isApiResponse, isApiError } from '@/lib/typeGuards';
import type { 
  Pagamento, 
  ApiResponse, 
  PagamentoFilters, 
  CreatePagamentoFormData
} from '@/lib/types';

// Tipo para refletir a estrutura real do backend
export interface PagamentosListData {
  pagamentos: Pagamento[];
  paginacao: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  estatisticas: {
    total_pagamentos: number;
    valor_total: string;
  };
}

// Query Keys
export const pagamentoKeys = {
  all: ['pagamentos'] as const,
  lists: () => [...pagamentoKeys.all, 'list'] as const,
  list: (filters: PagamentoFilters) => [...pagamentoKeys.lists(), filters] as const,
  details: () => [...pagamentoKeys.all, 'detail'] as const,
  detail: (id: number) => [...pagamentoKeys.details(), id] as const,
};

// Tipo intermediário para resposta do backend
interface BackendPagamentoRaw extends Omit<Pagamento, 'pessoa' | 'transacoes'> {
  pessoas_pagamentos_pessoa_idTopessoas?: { id: number; nome: string; email: string };
  pagamento_transacoes?: Array<{
    transacao_id: number;
    valor_aplicado: number;
    transacoes?: {
      id: number;
      descricao?: string;
      tipo?: string;
      valor_total: number;
      status_pagamento?: string;
      data_transacao?: string;
    };
  }>;
  receita_excedente?: { id: number; descricao: string; valor_total: number };
}

// Hook para listar pagamentos
export function usePagamentos(filters: PagamentoFilters = {}) {
  const { hubAtual } = useAuth();
  
  return useQuery({
    queryKey: [...pagamentoKeys.list(filters), hubAtual?.id],
    queryFn: async (): Promise<ApiResponse<PagamentosListData>> => {
      try {
        const params = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });

        const response = await api.get(`/pagamentos?${params.toString()}`);
        
        // Validação de resposta com type guards
        if (!isApiResponse(response.data)) {
          throw new Error('Resposta da API inválida');
        }

        // Mapeamento: garantir que cada pagamento tenha dados estruturados
        // O backend retorna data como array direto, não como objeto com propriedade pagamentos
        const pagamentosArray = response.data?.data as BackendPagamentoRaw[];
        
        if (pagamentosArray && Array.isArray(pagamentosArray)) {
          const pagamentosMapeados = pagamentosArray.map((p: BackendPagamentoRaw) => {
            // Mapear pessoa
            const pessoa = p.pessoas_pagamentos_pessoa_idTopessoas ? {
              id: p.pessoas_pagamentos_pessoa_idTopessoas.id,
              nome: p.pessoas_pagamentos_pessoa_idTopessoas.nome,
              email: p.pessoas_pagamentos_pessoa_idTopessoas.email,
              telefone: undefined,
              ehAdministrador: false,
              ativo: true,
              data_cadastro: '',
              atualizado_em: '',
              conviteToken: undefined
            } : undefined;

            // Mapear transações
            const transacoes = (p.pagamento_transacoes || []).map(pt => ({
              id: pt.transacoes?.id ?? pt.transacao_id,
              tipo: (pt.transacoes?.tipo ?? 'GASTO') as 'GASTO' | 'RECEITA',
              descricao: pt.transacoes?.descricao ?? '',
              local: undefined,
              valor_total: pt.transacoes?.valor_total ?? 0,
              data_transacao: pt.transacoes?.data_transacao ?? '',
              eh_parcelado: false,
              parcela_atual: 0,
              total_parcelas: 0,
              valor_parcela: 0,
              grupo_parcela: undefined,
              observacoes: undefined,
              status_pagamento: (pt.transacoes?.status_pagamento ?? 'PENDENTE') as 'PENDENTE' | 'PAGO_PARCIAL' | 'PAGO_TOTAL',
              proprietario_id: 0,
              criado_por: 0,
              hubId: 0,
              criado_em: '',
              atualizado_em: '',
              proprietario: undefined,
              criador: undefined,
              tags: undefined,
              participantes: undefined,
              pagamentos: undefined
            }));

            return {
              ...p,
              pessoa,
              transacoes,
            };
          });
          
          // Criar estrutura compatível com a interface esperada
          const rawResponse = response.data as { pagination?: { page?: number; limit?: number; total?: number; totalPages?: number } };
          const responseData: PagamentosListData = {
            pagamentos: pagamentosMapeados,
            paginacao: {
              page: rawResponse?.pagination?.page || 1,
              limit: rawResponse?.pagination?.limit || 20,
              total: rawResponse?.pagination?.total || 0,
              pages: rawResponse?.pagination?.totalPages || 1,
            },
            estatisticas: {
              total_pagamentos: pagamentosMapeados.length,
              valor_total: pagamentosMapeados.reduce((sum, p) => sum + p.valor_total, 0).toString(),
            },
          };
          
          return {
            success: response.data?.success || true,
            message: response.data?.message || '',
            data: responseData,
          } as ApiResponse<PagamentosListData>;
        }
        
        // Fallback se não houver dados
        return {
          success: true,
          message: 'Nenhum pagamento encontrado',
          data: {
            pagamentos: [],
            paginacao: { page: 1, limit: 20, total: 0, pages: 1 },
            estatisticas: { total_pagamentos: 0, valor_total: '0' },
          },
        } as ApiResponse<PagamentosListData>;
      } catch (error) {
        console.error('Erro ao buscar pagamentos:', error);
        if (isApiError(error)) {
          toast({
            title: "Erro",
            description: "Não foi possível carregar os pagamentos.",
            variant: "destructive"
          });
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para buscar um pagamento específico
export function usePagamento(id: number) {
  const { hubAtual } = useAuth();
  
  return useQuery({
    queryKey: [...pagamentoKeys.detail(id), hubAtual?.id],
    queryFn: async (): Promise<Pagamento> => {
      try {
        const response = await api.get(`/pagamentos/${id}`);
        
        if (!isApiResponse(response.data)) {
          throw new Error('Resposta da API inválida');
        }

        const pagamento = response.data.data as BackendPagamentoRaw;
        
        // Mapear dados estruturados
        const pessoa = pagamento.pessoas_pagamentos_pessoa_idTopessoas ? {
          id: pagamento.pessoas_pagamentos_pessoa_idTopessoas.id,
          nome: pagamento.pessoas_pagamentos_pessoa_idTopessoas.nome,
          email: pagamento.pessoas_pagamentos_pessoa_idTopessoas.email,
          telefone: undefined,
          ehAdministrador: false,
          ativo: true,
          data_cadastro: '',
          atualizado_em: '',
          conviteToken: undefined
        } : undefined;

        const transacoes = (pagamento.pagamento_transacoes || []).map(pt => ({
          id: pt.transacoes?.id ?? pt.transacao_id,
          tipo: (pt.transacoes?.tipo ?? 'GASTO') as 'GASTO' | 'RECEITA',
          descricao: pt.transacoes?.descricao ?? '',
          local: undefined,
          valor_total: pt.transacoes?.valor_total ?? 0,
          data_transacao: pt.transacoes?.data_transacao ?? '',
          eh_parcelado: false,
          parcela_atual: 0,
          total_parcelas: 0,
          valor_parcela: 0,
          grupo_parcela: undefined,
          observacoes: undefined,
          status_pagamento: (pt.transacoes?.status_pagamento ?? 'PENDENTE') as 'PENDENTE' | 'PAGO_PARCIAL' | 'PAGO_TOTAL',
          proprietario_id: 0,
          criado_por: 0,
          hubId: 0,
          criado_em: '',
          atualizado_em: '',
          proprietario: undefined,
          criador: undefined,
          tags: undefined,
          participantes: undefined,
          pagamentos: undefined
        }));

        return {
          ...pagamento,
          pessoa,
          transacoes,
        };
      } catch (error) {
        console.error('Erro ao buscar pagamento:', error);
        if (isApiError(error)) {
          toast({
            title: "Erro",
            description: "Não foi possível carregar o pagamento.",
            variant: "destructive"
          });
        }
        throw error;
      }
    },
    enabled: !!id && !!hubAtual?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Hook para criar pagamento
export function useCreatePagamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePagamentoFormData): Promise<Pagamento> => {
      const response = await api.post('/pagamentos', data);
      
      if (!isApiResponse(response.data)) {
        throw new Error('Resposta da API inválida');
      }

      return response.data.data as Pagamento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pagamentoKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: "Sucesso",
        description: "Pagamento criado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao criar pagamento:', error);
      if (isApiError(error)) {
        toast({
          title: "Erro",
          description: "Não foi possível criar o pagamento.",
          variant: "destructive"
        });
      }
    },
  });
}

// Hook para atualizar pagamento
export function useUpdatePagamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreatePagamentoFormData> }): Promise<Pagamento> => {
      const response = await api.put(`/pagamentos/${id}`, data);
      
      if (!isApiResponse(response.data)) {
        throw new Error('Resposta da API inválida');
      }

      return response.data.data as Pagamento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pagamentoKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: "Sucesso",
        description: "Pagamento atualizado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar pagamento:', error);
      if (isApiError(error)) {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o pagamento.",
          variant: "destructive"
        });
      }
    },
  });
}

// Hook para excluir pagamento
export function useDeletePagamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await api.delete(`/pagamentos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pagamentoKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: "Sucesso",
        description: "Pagamento excluído com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao excluir pagamento:', error);
      
      // Extrair mensagem específica do backend
      let errorMessage = "Não foi possível excluir o pagamento.";
      
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: { message?: string } } };
        if (apiError.response?.data?.message) {
          errorMessage = apiError.response.data.message;
        }
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    },
  });
}

// Hook para estatísticas de pagamentos (uso futuro)
export function usePagamentosStats(filters: PagamentoFilters = {}) {
  return useQuery({
    queryKey: [...pagamentoKeys.all, 'stats', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await api.get(`/pagamentos/stats?${params.toString()}`);
      return response.data.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
} 