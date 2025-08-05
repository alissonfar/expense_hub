import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { isTransacao, isTransacaoParcelada, isApiResponse, isApiError } from '@/lib/typeGuards';
import type { 
  Transacao, 
  ApiResponse, 
  TransacaoFilters, 
  CreateTransacaoFormData, 
  TransacaoParticipante,
  Tag,
  PaymentMethod
} from '@/lib/types';

// Tipo para refletir a estrutura real do backend
export interface TransacoesListData {
  transacoes: Transacao[];
  paginacao: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  estatisticas: {
    total_transacoes: number;
    valor_total: string;
  };
}

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
  const { hubAtual } = useAuth();
  
  return useQuery({
    queryKey: [...transactionKeys.list(filters), hubAtual?.id],
    queryFn: async (): Promise<ApiResponse<TransacoesListData>> => {
      try {
        const params = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });

        const response = await api.get(`/transacoes?${params.toString()}`);
        
        // Validação de resposta com type guards
        if (!isApiResponse(response.data)) {
          throw new Error('Resposta da API inválida');
        }

        // Mapeamento: garantir que cada transação tenha participantes
        const responseData = response.data?.data as TransacoesListData;
        if (responseData?.transacoes) {
          responseData.transacoes = responseData.transacoes.map((t: BackendTransacaoRaw) => {
            let participantes: TransacaoParticipante[] = [];
            if (Array.isArray(t.participantes)) {
              participantes = t.participantes as TransacaoParticipante[];
            } else if (Array.isArray(t.transacao_participantes)) {
              participantes = t.transacao_participantes as TransacaoParticipante[];
            }
            // Novo: mapear transacao_tags para tags
            type TransacaoTagRaw = { tags: Tag };
            let tags: Tag[] = [];
            if (Array.isArray((t as unknown as { transacao_tags?: TransacaoTagRaw[] }).transacao_tags)) {
              tags = ((t as unknown as { transacao_tags: TransacaoTagRaw[] }).transacao_tags!).map((tt) => tt.tags);
            } else if (Array.isArray((t as { tags?: Tag[] }).tags)) {
              tags = (t as { tags: Tag[] }).tags;
            }
            return {
              ...t,
              participantes,
              tags,
            };
          });
        }
        
        return response.data as ApiResponse<TransacoesListData>;
      } catch (error) {
        console.error('Erro ao buscar transações:', error);
        if (isApiError(error)) {
          toast({
            title: "Erro",
            description: error.error || "Erro ao carregar transações",
            variant: "destructive",
          });
        }
        throw error;
      }
    },
    enabled: !!hubAtual,
    staleTime: 1000 * 60 * 10, // 10 minutos (otimizado)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount, error) => {
      // Não tentar novamente para erros 4xx (erro do usuário)
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as { status: number }).status;
        if (status >= 400 && status < 500) {
          return false;
        }
      }
      return failureCount < 3;
    },
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
      const participantes = data.transacao_participantes?.map((p: unknown) => {
        const participante = p as {
          id: number;
          transacao_id: number;
          pessoa_id: number;
          valor_devido?: string | number;
          valor_pago?: string | number;
          valor_recebido?: string | number;
          eh_proprietario?: boolean;
          pessoas?: { id: number; nome: string; email: string };
          criado_em?: string;
          atualizado_em?: string;
        };
        
        return {
          id: participante.id,
          transacao_id: participante.transacao_id,
          pessoa_id: participante.pessoa_id,
          valor_devido: Number(participante.valor_devido || 0),
          valor_pago: Number(participante.valor_pago || 0),
          valor_recebido: Number(participante.valor_recebido || 0),
          eh_proprietario: participante.eh_proprietario || false,
          quitado: Number(participante.valor_pago || 0) >= Number(participante.valor_devido || 0),
          pessoa: participante.pessoas,
          criado_em: participante.criado_em,
          atualizado_em: participante.atualizado_em
        };
      }) || [];

      // Mapear pagamentos através de pagamento_transacoes
      const pagamentos = data.pagamento_transacoes?.map((pt: unknown) => {
        const pagamentoTransacao = pt as {
          valor_aplicado?: string | number;
          pagamentos: {
            id: number;
            pessoa_id: number;
            valor_total?: string | number;
            valor_excedente?: string | number;
            data_pagamento?: string;
            forma_pagamento?: string;
            observacoes?: string;
            processar_excedente?: boolean;
            receita_excedente_id?: number;
            registrado_por: number;
            criado_em?: string;
            atualizado_em?: string;
            hubId: number;
            pessoas_pagamentos_pessoa_idTopessoas?: { id: number; nome: string; email: string };
            pessoas_pagamentos_registrado_porTopessoas?: { id: number; nome: string };
          };
        };
        
        return {
          id: pagamentoTransacao.pagamentos.id,
          pessoa_id: pagamentoTransacao.pagamentos.pessoa_id,
          valor_total: Number(pagamentoTransacao.pagamentos.valor_total || 0),
          valor_excedente: Number(pagamentoTransacao.pagamentos.valor_excedente || 0),
          data_pagamento: pagamentoTransacao.pagamentos.data_pagamento,
          forma_pagamento: pagamentoTransacao.pagamentos.forma_pagamento,
          observacoes: pagamentoTransacao.pagamentos.observacoes,
          processar_excedente: pagamentoTransacao.pagamentos.processar_excedente,
          receita_excedente_id: pagamentoTransacao.pagamentos.receita_excedente_id,
          registrado_por: pagamentoTransacao.pagamentos.registrado_por,
          criado_em: pagamentoTransacao.pagamentos.criado_em,
          atualizado_em: pagamentoTransacao.pagamentos.atualizado_em,
          hubId: pagamentoTransacao.pagamentos.hubId,
          valor_aplicado: Number(pagamentoTransacao.valor_aplicado || 0),
          pessoa: pagamentoTransacao.pagamentos.pessoas_pagamentos_pessoa_idTopessoas,
          registrado_por_pessoa: pagamentoTransacao.pagamentos.pessoas_pagamentos_registrado_porTopessoas,
          transacoes: [{
            id: data.id,
            tipo: data.tipo,
            descricao: data.descricao,
            valor_total: Number(data.valor_total || 0),
            status_pagamento: data.status_pagamento,
            data_transacao: data.data_transacao
          }]
        };
      }) || [];

      return {
        ...data,
        participantes,
        pagamentos,
      };
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutos (otimizado)
  });
}

// Hook para criar transação (gasto)
export function useCreateTransacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTransacaoFormData): Promise<Transacao> => {
      try {
        // ✅ NOVO: Validação específica para gastos
        if (data.tipo === 'GASTO' && data.data_vencimento) {
          const dataTransacao = new Date(data.data_transacao);
          const dataVencimento = new Date(data.data_vencimento);
          if (dataVencimento < dataTransacao) {
            throw new Error('Data de vencimento deve ser maior ou igual à data da transação');
          }
        }
        
        // ✅ NOVO: Receitas não devem ter data de vencimento
        if (data.tipo === 'RECEITA' && data.data_vencimento) {
          throw new Error('Receitas não podem ter data de vencimento');
        }
        
        const response = await api.post('/transacoes', data);
        
        // Validação de resposta com type guards
        if (!isApiResponse(response.data)) {
          throw new Error('Resposta da API inválida');
        }
        
        // Verificar se é transação parcelada ou transação individual
        if (isTransacaoParcelada(response.data.data)) {
          // Para transações parceladas, retornar a primeira transação
          const transacao = response.data.data.transacoes[0];
          // Converter strings para numbers se necessário
          return {
            ...transacao,
            valor_total: typeof transacao.valor_total === 'string' ? parseFloat(transacao.valor_total) : transacao.valor_total,
            valor_parcela: typeof transacao.valor_parcela === 'string' ? parseFloat(transacao.valor_parcela) : transacao.valor_parcela,
            hubId: typeof transacao.hubId === 'string' ? parseInt(transacao.hubId) : transacao.hubId,
            criado_por: typeof transacao.criado_por === 'string' ? parseInt(transacao.criado_por) : transacao.criado_por,
          };
        }
        
        if (!isTransacao(response.data.data)) {
          console.error('Dados da transação inválidos:', response.data.data);
          throw new Error('Dados da transação inválidos');
        }
        
        // Converter strings para numbers se necessário
        const transacao = response.data.data;
        return {
          ...transacao,
          valor_total: typeof transacao.valor_total === 'string' ? parseFloat(transacao.valor_total) : transacao.valor_total,
          valor_parcela: typeof transacao.valor_parcela === 'string' ? parseFloat(transacao.valor_parcela) : transacao.valor_parcela,
          hubId: typeof transacao.hubId === 'string' ? parseInt(transacao.hubId) : transacao.hubId,
          criado_por: typeof transacao.criado_por === 'string' ? parseInt(transacao.criado_por) : transacao.criado_por,
        };
      } catch (error) {
        console.error('Erro ao criar transação:', error);
        if (isApiError(error)) {
          toast({
            title: "Erro",
            description: error.error || "Erro ao criar transação",
            variant: "destructive",
          });
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidar todas as queries de transações
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      // Invalidar queries do dashboard para atualizar métricas
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      // Para transações parceladas, invalidar também queries específicas do grupo
      if (data.grupo_parcela) {
        queryClient.invalidateQueries({ 
          queryKey: [...transactionKeys.lists(), { grupo_parcela: data.grupo_parcela }] 
        });
      }
      
      // Adicionar a nova transação ao cache otimisticamente
      queryClient.setQueryData(
        transactionKeys.all,
        (oldData: ApiResponse<TransacoesListData> | undefined) => {
          if (oldData?.data?.transacoes) {
            return {
              ...oldData,
              data: {
                ...oldData.data,
                transacoes: [data, ...oldData.data.transacoes],
              },
            };
          }
          return oldData;
        }
      );
      
      toast({
        title: "Sucesso",
        description: "Transação criada com sucesso!",
      });
    },
    onError: (error) => {
      console.error('Erro na criação da transação:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar transação. Tente novamente.",
        variant: "destructive",
      });
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
      forma_pagamento?: PaymentMethod; // ✅ NOVO: Forma de pagamento para receitas
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
        data_vencimento?: string; // ✅ NOVO: Data de vencimento (apenas gastos)
        forma_pagamento?: PaymentMethod; // ✅ NOVO: Forma de pagamento
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
        forma_pagamento?: PaymentMethod; // ✅ NOVO: Forma de pagamento para receitas
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
      toast({
        title: "Sucesso",
        description: "Transação excluída com sucesso.",
      });
    },
    onError: (error: unknown) => {
      console.error('Erro ao excluir transação:', error);
      
      // Extrair mensagem específica do backend
      let errorMessage = "Não foi possível excluir a transação.";
      
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

// Hook para buscar transações na lixeira (ativo: false)
export function useTransacoesLixeira(filters: Omit<TransacaoFilters, 'ativo'> = {}) {
  return useQuery({
    queryKey: [...transactionKeys.lists(), { ...filters, ativo: false }],
    queryFn: async (): Promise<Transacao[]> => {
      const params = new URLSearchParams();
      
      // Adicionar ativo: false
      params.append('ativo', 'false');
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await api.get(`/transacoes?${params.toString()}`);
      return response.data.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutos (otimizado)
  });
}

// Hook para buscar transações por grupo de parcela
export function useTransacoesParcelas(grupoParcela: string) {
  return useQuery({
    queryKey: [...transactionKeys.lists(), { grupo_parcela: grupoParcela }],
    queryFn: async (): Promise<Transacao[]> => {
      const response = await api.get(`/transacoes?grupo_parcela=${grupoParcela}`);
      return response.data.data;
    },
    enabled: !!grupoParcela,
    staleTime: 1000 * 60 * 10, // 10 minutos (otimizado)
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
        data_vencimento: original.data_vencimento, // ✅ NOVO: Preservar data de vencimento
        forma_pagamento: original.forma_pagamento, // ✅ NOVO: Preservar forma de pagamento
        eh_parcelado: false, // Resetar parcelamento
        total_parcelas: 1,
        observacoes: original.observacoes,
        proprietario_id: original.proprietario_id ?? 0,
        tags: original.tags?.map(tag => tag.id) || [],
        participantes: original.participantes?.map(p => ({
          pessoa_id: p.pessoa_id,
          valor_devido: p.valor_devido,
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