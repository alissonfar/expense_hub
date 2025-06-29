'use client'

import { useState, useCallback } from 'react'
import { apiPost, apiPut, apiDelete } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/constants'
import { useToast } from '@/hooks/use-toast'
import { 
  CreateGastoForm, 
  CreateReceitaForm, 
  UpdateTransacaoForm,
  Transacao 
} from '@/types'

interface MutationState {
  loading: boolean
  error: string | null
  success: boolean
}

interface UseTransacaoMutationsOptions {
  onSuccess?: (transacao?: Transacao) => void
  onError?: (error: string) => void
  autoToast?: boolean
}

export function useTransacaoMutations(options: UseTransacaoMutationsOptions = {}) {
  const { onSuccess, onError, autoToast = true } = options
  const { toast } = useToast()

  // Estados para cada operação
  const [createGastoState, setCreateGastoState] = useState<MutationState>({
    loading: false,
    error: null,
    success: false
  })

  const [createReceitaState, setCreateReceitaState] = useState<MutationState>({
    loading: false,
    error: null,
    success: false
  })

  const [updateState, setUpdateState] = useState<MutationState>({
    loading: false,
    error: null,
    success: false
  })

  const [deleteState, setDeleteState] = useState<MutationState>({
    loading: false,
    error: null,
    success: false
  })

  // Função para resetar estados
  const resetStates = useCallback(() => {
    setCreateGastoState({ loading: false, error: null, success: false })
    setCreateReceitaState({ loading: false, error: null, success: false })
    setUpdateState({ loading: false, error: null, success: false })
    setDeleteState({ loading: false, error: null, success: false })
  }, [])

  // Criar gasto
  const createGasto = useCallback(async (data: CreateGastoForm): Promise<Transacao | null> => {
    try {
      setCreateGastoState({ loading: true, error: null, success: false })

      // Validações básicas no frontend
      if (!data.descricao.trim()) {
        throw new Error('Descrição é obrigatória')
      }

      if (data.valor_total <= 0) {
        throw new Error('Valor deve ser maior que zero')
      }

      if (!data.participantes.length) {
        throw new Error('Deve haver pelo menos um participante')
      }

      // ✅ CORREÇÃO: Validação de data no frontend
      const dataRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dataRegex.test(data.data_transacao)) {
        throw new Error('Data deve estar no formato YYYY-MM-DD')
      }
      
      const inputDate = new Date(data.data_transacao)
      if (isNaN(inputDate.getTime())) {
        throw new Error('Data inválida')
      }
      
      const year = inputDate.getFullYear()
      if (year < 2000 || year > 2050) {
        throw new Error('Data deve estar entre os anos 2000 e 2050')
      }
      
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      if (inputDate > today) {
        throw new Error('Data não pode ser futura')
      }

      // Verificar se soma dos participantes confere
      const somaParticipantes = data.participantes.reduce((acc, p) => acc + p.valor_devido, 0)
      const diferenca = Math.abs(data.valor_total - somaParticipantes)
      if (diferenca > 0.01) {
        throw new Error('A soma dos valores dos participantes deve ser igual ao valor total')
      }

      const response = await apiPost<{
        success: boolean
        data: Transacao
        message: string
      }>(API_ENDPOINTS.TRANSACOES.CREATE, data)

      // ✅ CORREÇÃO: Verificar se a requisição HTTP foi bem-sucedida E se o response indica sucesso
      if (response.status >= 200 && response.status < 300 && response.data.success && response.data.data) {
        const novaTransacao = response.data.data

        setCreateGastoState({ loading: false, error: null, success: true })

        if (autoToast) {
          toast({
            title: "Gasto criado com sucesso!",
            description: `${novaTransacao.descricao} - ${new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(novaTransacao.valor_total)}`,
          })
        }

        onSuccess?.(novaTransacao)
        return novaTransacao
      } else {
        // ✅ CORREÇÃO: Melhor tratamento quando response não indica sucesso
        const errorMsg = response.data?.message || `Erro HTTP ${response.status}: Falha ao criar gasto`
        throw new Error(errorMsg)
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar gasto'
      setCreateGastoState({ loading: false, error: errorMessage, success: false })

      if (autoToast) {
        toast({
          title: "Erro ao criar gasto",
          description: errorMessage,
          variant: "destructive"
        })
      }

      onError?.(errorMessage)
      return null
    }
  }, [onSuccess, onError, autoToast, toast])

  // Criar receita
  const createReceita = useCallback(async (data: CreateReceitaForm): Promise<Transacao | null> => {
    try {
      setCreateReceitaState({ loading: true, error: null, success: false })

      // Validações básicas
      if (!data.descricao.trim()) {
        throw new Error('Descrição é obrigatória')
      }

      if (data.valor_recebido <= 0) {
        throw new Error('Valor deve ser maior que zero')
      }

      // ✅ CORREÇÃO: Validação de data no frontend (igual ao createGasto)
      const dataRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dataRegex.test(data.data_transacao)) {
        throw new Error('Data deve estar no formato YYYY-MM-DD')
      }
      
      const inputDate = new Date(data.data_transacao)
      if (isNaN(inputDate.getTime())) {
        throw new Error('Data inválida')
      }
      
      const year = inputDate.getFullYear()
      if (year < 2000 || year > 2050) {
        throw new Error('Data deve estar entre os anos 2000 e 2050')
      }
      
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      if (inputDate > today) {
        throw new Error('Data não pode ser futura')
      }

      const response = await apiPost<{
        success: boolean
        data: Transacao
        message: string
      }>(API_ENDPOINTS.TRANSACOES.CREATE_RECEITA, data)

      // ✅ CORREÇÃO: Verificar status HTTP e response success
      if (response.status >= 200 && response.status < 300 && response.data.success && response.data.data) {
        const novaReceita = response.data.data

        setCreateReceitaState({ loading: false, error: null, success: true })

        if (autoToast) {
          toast({
            title: "Receita criada com sucesso!",
            description: `${novaReceita.descricao} - ${new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(novaReceita.valor_total)}`,
          })
        }

        onSuccess?.(novaReceita)
        return novaReceita
      } else {
        // ✅ CORREÇÃO: Melhor tratamento de erro
        const errorMsg = response.data?.message || `Erro HTTP ${response.status}: Falha ao criar receita`
        throw new Error(errorMsg)
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar receita'
      setCreateReceitaState({ loading: false, error: errorMessage, success: false })

      if (autoToast) {
        toast({
          title: "Erro ao criar receita",
          description: errorMessage,
          variant: "destructive"
        })
      }

      onError?.(errorMessage)
      return null
    }
  }, [onSuccess, onError, autoToast, toast])

  // Atualizar transação
  const updateTransacao = useCallback(async (id: number, data: UpdateTransacaoForm): Promise<Transacao | null> => {
    try {
      setUpdateState({ loading: true, error: null, success: false })

      const response = await apiPut<{
        success: boolean
        data: Transacao
        message: string
      }>(API_ENDPOINTS.TRANSACOES.UPDATE(id), data)

      if (response.data.success && response.data.data) {
        const transacaoAtualizada = response.data.data

        setUpdateState({ loading: false, error: null, success: true })

        if (autoToast) {
          toast({
            title: "Transação atualizada com sucesso!",
            description: transacaoAtualizada.descricao,
          })
        }

        onSuccess?.(transacaoAtualizada)
        return transacaoAtualizada
      } else {
        throw new Error(response.data.message || 'Erro ao atualizar transação')
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao atualizar transação'
      setUpdateState({ loading: false, error: errorMessage, success: false })

      if (autoToast) {
        toast({
          title: "Erro ao atualizar transação",
          description: errorMessage,
          variant: "destructive"
        })
      }

      onError?.(errorMessage)
      return null
    }
  }, [onSuccess, onError, autoToast, toast])

  // Excluir transação
  const deleteTransacao = useCallback(async (id: number, descricao?: string): Promise<boolean> => {
    try {
      setDeleteState({ loading: true, error: null, success: false })

      const response = await apiDelete<{
        success: boolean
        message: string
      }>(API_ENDPOINTS.TRANSACOES.DELETE(id))

      if (response.data.success) {
        setDeleteState({ loading: false, error: null, success: true })

        if (autoToast) {
          toast({
            title: "Transação excluída com sucesso!",
            description: descricao || `Transação #${id}`,
          })
        }

        onSuccess?.()
        return true
      } else {
        throw new Error(response.data.message || 'Erro ao excluir transação')
      }

    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao excluir transação'
      setDeleteState({ loading: false, error: errorMessage, success: false })

      if (autoToast) {
        toast({
          title: "Erro ao excluir transação",
          description: errorMessage,
          variant: "destructive"
        })
      }

      onError?.(errorMessage)
      return false
    }
  }, [onSuccess, onError, autoToast, toast])

  // Função para duplicar última transação (útil para lançamentos sequenciais)
  const duplicateTransacao = useCallback((transacao: Transacao): CreateGastoForm => {
    return {
      descricao: transacao.descricao,
      local: transacao.local || '',
      valor_total: transacao.valor_total,
      data_transacao: new Date().toISOString().split('T')[0], // Data de hoje
      observacoes: transacao.observacoes || '',
      eh_parcelado: transacao.eh_parcelado,
      total_parcelas: transacao.total_parcelas || 1,
      participantes: transacao.transacao_participantes.map(p => ({
        pessoa_id: p.pessoa_id,
        nome: p.pessoas.nome,
        valor_devido: p.valor_devido
      })),
      tags: transacao.transacao_tags.map(t => t.tag_id)
    }
  }, [])

  // Estado geral de loading
  const isLoading = createGastoState.loading || createReceitaState.loading || 
                   updateState.loading || deleteState.loading

  return {
    // Estados individuais
    createGastoState,
    createReceitaState,
    updateState,
    deleteState,
    
    // Estado geral
    isLoading,
    
    // Ações
    createGasto,
    createReceita,
    updateTransacao,
    deleteTransacao,
    duplicateTransacao,
    resetStates
  }
} 