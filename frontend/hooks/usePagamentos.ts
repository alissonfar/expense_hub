import { useState, useCallback, useEffect, useMemo } from 'react'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import { Pagamento, PagamentoForm, PagamentoFilters, PaginationInfo, ApiResponse, LoadingState } from '@/types'

interface UsePagamentosOptions {
  autoFetch?: boolean
  debounceMs?: number
}

interface ConfiguracaoExcedente {
  auto_criar_receita_excedente: boolean
  valor_minimo_excedente: number
  descricao_receita_excedente: string
}

function usePagamentos(options: UsePagamentosOptions = {}) {
  const { autoFetch = true, debounceMs = 500 } = options

  // Estados principais
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  // Estados de controle
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<PagamentoFilters>({
    page: '1',
    limit: '20'
  })

  // Estados para operações individuais
  const [createState, setCreateState] = useState<LoadingState>({
    loading: false,
    error: null
  })
  const [updateState, setUpdateState] = useState<LoadingState>({
    loading: false,
    error: null
  })
  const [deleteState, setDeleteState] = useState<LoadingState>({
    loading: false,
    error: null
  })

  // Estados para configurações
  const [configExcedente, setConfigExcedente] = useState<ConfiguracaoExcedente | null>(null)
  const [configLoading, setConfigLoading] = useState(false)

  // Calcular estatísticas dos pagamentos
  const statistics = useMemo(() => {
    const total_pagamentos = pagamentos.length
    const valor_total = pagamentos.reduce((acc, p) => acc + (Number(p.valor_total) || 0), 0)
    const valor_medio = total_pagamentos > 0 ? valor_total / total_pagamentos : 0
    const pagamentos_com_excedente = pagamentos.filter(p => p.valor_excedente && Number(p.valor_excedente) > 0).length
    const valor_excedente_total = pagamentos.reduce((acc, p) => acc + (Number(p.valor_excedente) || 0), 0)
    
    // Contar formas de pagamento
    const formas_pagamento = pagamentos.reduce((acc, p) => {
      const forma = p.forma_pagamento || 'OUTROS'
      acc[forma] = (acc[forma] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total_pagamentos,
      valor_total,
      valor_medio,
      pagamentos_com_excedente,
      valor_excedente_total,
      formas_pagamento
    }
  }, [pagamentos])

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).some(key => 
      key !== 'page' && key !== 'limit' && filters[key as keyof PagamentoFilters] !== undefined
    )
  }, [filters])

  // Buscar lista de pagamentos
  const fetchPagamentos = useCallback(async (customFilters?: PagamentoFilters) => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = { ...filters, ...customFilters }
      
      // Forçar conversão para strings
      const stringParams: Record<string, string> = {}
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          stringParams[key] = String(value)
        }
      })

      console.log('[usePagamentos] Buscando pagamentos:', stringParams)

      const response = await apiGet<{
        success: boolean
        data: Pagamento[]
        pagination: PaginationInfo
        message?: string
      }>('/pagamentos', stringParams)

      if (response.data.success) {
        setPagamentos(response.data.data || [])
        setPagination(response.data.pagination || pagination)
        console.log('[usePagamentos] Pagamentos carregados:', response.data.data?.length || 0)
      } else {
        setError(response.data.message || 'Erro ao carregar pagamentos')
      }
    } catch (err: any) {
      console.error('[usePagamentos] Erro ao buscar pagamentos:', err)
      setError(err.message || 'Erro ao carregar pagamentos')
      setPagamentos([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Buscar pagamento individual
  const fetchPagamento = useCallback(async (id: number): Promise<Pagamento | null> => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiGet<ApiResponse<Pagamento>>(`/pagamentos/${id}`)
      if (response.data.success && response.data.data) {
        return response.data.data
      } else {
        setError(response.data.message || 'Pagamento não encontrado')
        return null
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar pagamento')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Atualizar pagamento existente
  const updatePagamento = useCallback(async (id: number, data: Partial<PagamentoForm>): Promise<Pagamento> => {
    try {
      setUpdateState({ loading: true, error: null })

      console.log('[usePagamentos] Atualizando pagamento:', { id, data })

      const response = await apiPut<ApiResponse<Pagamento>>(`/pagamentos/${id}`, data)

      if (response.data.success && response.data.data) {
        console.log('[usePagamentos] Pagamento atualizado:', response.data.data)
        
        // Refresh da lista se estiver ativa
        if (autoFetch) {
          await fetchPagamentos()
        }
        
        setUpdateState({ loading: false, error: null })
        return response.data.data
      } else {
        throw new Error(response.data.message || 'Erro ao atualizar pagamento')
      }
    } catch (err: any) {
      console.error('[usePagamentos] Erro ao atualizar pagamento:', err)
      const errorMsg = err.message || 'Erro ao atualizar pagamento'
      setUpdateState({ loading: false, error: errorMsg })
      throw new Error(errorMsg)
    }
  }, [fetchPagamentos, autoFetch])

  // Criar novo pagamento
  const createPagamento = useCallback(async (data: PagamentoForm): Promise<Pagamento> => {
    try {
      setCreateState({ loading: true, error: null })

      console.log('[usePagamentos] Criando pagamento:', data)

      const response = await apiPost<ApiResponse<Pagamento>>('/pagamentos', data)

      if (response.data.success && response.data.data) {
        console.log('[usePagamentos] Pagamento criado:', response.data.data)
        
        // Refresh da lista se estiver ativa
        if (autoFetch) {
          await fetchPagamentos()
        }
        
        setCreateState({ loading: false, error: null })
        return response.data.data
      } else {
        throw new Error(response.data.message || 'Erro ao criar pagamento')
      }
    } catch (err: any) {
      console.error('[usePagamentos] Erro ao criar pagamento:', err)
      const errorMsg = err.message || 'Erro ao criar pagamento'
      setCreateState({ loading: false, error: errorMsg })
      throw new Error(errorMsg)
    }
  }, [fetchPagamentos, autoFetch])

  // Funções básicas
  const applyFilters = useCallback((newFilters: Partial<PagamentoFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: '1' }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({ page: '1', limit: '20' })
  }, [])

  const changePage = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page: String(page) }))
  }, [])

  const refresh = useCallback(() => {
    fetchPagamentos()
  }, [fetchPagamentos])

  const deletePagamento = useCallback(async (id: number): Promise<void> => {
    try {
      setDeleteState({ loading: true, error: null })
      const response = await apiDelete<ApiResponse>(`/pagamentos/${id}`)
      if (response.data.success) {
        setPagamentos(prev => prev.filter(p => p.id !== id.toString()))
        setDeleteState({ loading: false, error: null })
      } else {
        throw new Error(response.data.message || 'Erro ao excluir pagamento')
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Erro ao excluir pagamento'
      setDeleteState({ loading: false, error: errorMsg })
      throw new Error(errorMsg)
    }
  }, [])

  // Auto-fetch quando filtros mudam
  useEffect(() => {
    if (!autoFetch) return
    const timeoutId = setTimeout(() => {
      fetchPagamentos()
    }, debounceMs)
    return () => clearTimeout(timeoutId)
  }, [JSON.stringify(filters), autoFetch, debounceMs])

  return {
    // Dados
    pagamentos,
    pagination,
    statistics,
    
    // Estados
    loading,
    error,
    filters,
    hasActiveFilters,
    
    // Estados de operações
    createState,
    updateState,
    deleteState,
    
    // Configurações
    configExcedente,
    configLoading,
    
    // Ações
    fetchPagamentos,
    fetchPagamento,
    updatePagamento,
    createPagamento,
    applyFilters,
    clearFilters,
    changePage,
    refresh,
    deletePagamento
  }
}

export { usePagamentos }