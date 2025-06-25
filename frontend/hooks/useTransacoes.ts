'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { apiGet } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/constants'
import { 
  Transacao, 
  TransacaoFiltros, 
  TransacoesResponse, 
  Paginacao, 
  EstatisticasLista 
} from '@/types'

interface UseTransacoesOptions {
  autoFetch?: boolean
  debounceMs?: number
}

export function useTransacoes(
  filtros: TransacaoFiltros = {}, 
  options: UseTransacoesOptions = {}
) {
  const { autoFetch = true, debounceMs = 300 } = options

  // Estados principais
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paginacao, setPaginacao] = useState<Paginacao | null>(null)
  const [estatisticas, setEstatisticas] = useState<EstatisticasLista | null>(null)

  // Cache para otimização
  const [cache, setCache] = useState<Map<string, TransacoesResponse>>(new Map())

  // Gerar chave de cache baseada nos filtros
  const cacheKey = useMemo(() => {
    return JSON.stringify(filtros)
  }, [filtros])

  // Função principal para buscar transações
  const fetchTransacoes = useCallback(async (forceFetch = false) => {
    // Verificar cache primeiro (se não for força)
    if (!forceFetch && cache.has(cacheKey)) {
      const cachedData = cache.get(cacheKey)!
      setTransacoes(cachedData.transacoes)
      setPaginacao(cachedData.paginacao)
      setEstatisticas(cachedData.estatisticas)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Construir query params
      const queryParams = new URLSearchParams()
      
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })

      const url = `${API_ENDPOINTS.TRANSACOES.LIST}?${queryParams.toString()}`
      const response = await apiGet<{
        success: boolean
        data: TransacoesResponse
      }>(url)

      if (response.data.success && response.data.data) {
        const { transacoes: novasTransacoes, paginacao: novaPaginacao, estatisticas: novasEstatisticas } = response.data.data

        // Atualizar estados
        setTransacoes(novasTransacoes)
        setPaginacao(novaPaginacao)
        setEstatisticas(novasEstatisticas)

        // Salvar no cache
        setCache(prev => {
          const newCache = new Map(prev)
          newCache.set(cacheKey, response.data.data)
          
          // Limitar tamanho do cache (últimas 20 consultas)
          if (newCache.size > 20) {
            const firstKey = newCache.keys().next().value
            if (firstKey) {
              newCache.delete(firstKey)
            }
          }
          
          return newCache
        })
      } else {
        throw new Error('Resposta inválida do servidor')
      }

    } catch (err: any) {
      setError(err.message || 'Erro ao carregar transações')
      setTransacoes([])
      setPaginacao(null)
      setEstatisticas(null)
    } finally {
      setLoading(false)
    }
  }, [filtros, cacheKey, cache])

  // Debounce para otimizar chamadas
  useEffect(() => {
    if (!autoFetch) return

    const timeoutId = setTimeout(() => {
      fetchTransacoes()
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }, [fetchTransacoes, autoFetch, debounceMs])

  // Funções utilitárias
  const refetch = useCallback(() => fetchTransacoes(true), [fetchTransacoes])
  
  const clearCache = useCallback(() => {
    setCache(new Map())
  }, [])

  const goToPage = useCallback((page: number) => {
    if (paginacao && page >= 1 && page <= paginacao.pages) {
      // Atualizar filtros com nova página (será detectado pelo useEffect)
      const novosFiltros = { ...filtros, page }
      return novosFiltros
    }
    return filtros
  }, [filtros, paginacao])

  const changeLimit = useCallback((limit: number) => {
    const novosFiltros = { ...filtros, limit, page: 1 } // Reset para página 1
    return novosFiltros
  }, [filtros])

  // Estatísticas computadas
  const computedStats = useMemo(() => {
    if (!transacoes.length) return null

    // Garantir que os valores sejam números válidos
    const totalGastos = transacoes
      .filter(t => t.tipo === 'GASTO')
      .reduce((acc, t) => {
        const valor = typeof t.valor_total === 'number' ? t.valor_total : parseFloat(String(t.valor_total)) || 0
        return acc + valor
      }, 0)

    const totalReceitas = transacoes
      .filter(t => t.tipo === 'RECEITA')
      .reduce((acc, t) => {
        const valor = typeof t.valor_total === 'number' ? t.valor_total : parseFloat(String(t.valor_total)) || 0
        return acc + valor
      }, 0)

    const pendentes = transacoes.filter(t => t.status_pagamento === 'PENDENTE').length
    const pagas = transacoes.filter(t => t.status_pagamento === 'PAGO_TOTAL').length

    return {
      totalGastos,
      totalReceitas,
      saldo: totalReceitas - totalGastos,
      pendentes,
      pagas,
      total: transacoes.length
    }
  }, [transacoes])

  // Funções de busca rápida
  const buscarPorDescricao = useCallback((termo: string) => {
    return transacoes.filter(t => 
      t.descricao?.toLowerCase().includes(termo.toLowerCase()) ||
      t.local?.toLowerCase().includes(termo.toLowerCase())
    )
  }, [transacoes])

  const buscarPorPessoa = useCallback((pessoaId: number) => {
    return transacoes.filter(t => 
      t.transacao_participantes && t.transacao_participantes.some(p => p.pessoa_id === pessoaId)
    )
  }, [transacoes])

  const buscarPorTag = useCallback((tagId: number) => {
    return transacoes.filter(t => 
      t.transacao_tags && t.transacao_tags.some(tag => tag.tag_id === tagId)
    )
  }, [transacoes])

  return {
    // Dados principais
    transacoes,
    loading,
    error,
    paginacao,
    estatisticas,
    
    // Estatísticas computadas
    computedStats,
    
    // Ações
    refetch,
    clearCache,
    goToPage,
    changeLimit,
    
    // Busca
    buscarPorDescricao,
    buscarPorPessoa,
    buscarPorTag,
    
    // Estado do cache
    cacheSize: cache.size,
    isCached: cache.has(cacheKey)
  }
} 