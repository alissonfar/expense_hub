'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/constants'
import { toast } from '@/hooks/use-toast'
import type { Pessoa, PessoaForm } from '@/types'

// ============================================================================
// 🔥 HOOK COMPLETO PARA GESTÃO DE PESSOAS
// ============================================================================

export function usePessoas() {
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carregar pessoas da API
  const fetchPessoas = useCallback(async (filtros?: {
    ativo?: boolean
    proprietario?: boolean
    page?: number
    limit?: number
  }) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filtros?.ativo !== undefined) params.append('ativo', String(filtros.ativo))
      if (filtros?.proprietario !== undefined) params.append('proprietario', String(filtros.proprietario))
      if (filtros?.page) params.append('page', String(filtros.page))
      if (filtros?.limit) params.append('limit', String(filtros.limit))

      const url = `${API_ENDPOINTS.PESSOAS.LIST}${params.toString() ? `?${params.toString()}` : ''}`
      const response = await api.get(url)

      if (response.data.success && response.data.data) {
        setPessoas(response.data.data)
        return {
          pessoas: response.data.data,
          pagination: response.data.pagination
        }
      } else {
        throw new Error('Erro ao carregar pessoas')
      }

    } catch (err: any) {
      console.error('[usePessoas] Erro ao carregar pessoas:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao carregar pessoas'
      setError(errorMessage)
      setPessoas([])
      
      toast({
        title: "Erro ao carregar pessoas",
        description: errorMessage,
        variant: "destructive",
      })
      
      return { pessoas: [], pagination: null }
    } finally {
      setLoading(false)
    }
  }, [])

  // Carregar dados iniciais
  useEffect(() => {
    fetchPessoas()
  }, [fetchPessoas])

  // Funções utilitárias
  const getPessoaById = useCallback((id: number) => {
    return pessoas.find(p => p.id === id)
  }, [pessoas])

  const getPessoaComTransacoes = useCallback(async (id: number) => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.get(API_ENDPOINTS.PESSOAS.GET(id))

      if (response.data.success && response.data.data) {
        return response.data.data
      } else {
        throw new Error('Erro ao carregar pessoa')
      }

    } catch (err: any) {
      console.error('[usePessoas] Erro ao carregar pessoa com transações:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao carregar pessoa'
      setError(errorMessage)
      
      toast({
        title: "Erro ao carregar pessoa",
        description: errorMessage,
        variant: "destructive",
      })
      
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const getProprietarios = useCallback(() => {
    return pessoas.filter(p => p.eh_proprietario)
  }, [pessoas])

  const getParticipantes = useCallback(() => {
    return pessoas.filter(p => !p.eh_proprietario)
  }, [pessoas])

  const getPessoasAtivas = useCallback(() => {
    return pessoas.filter(p => p.ativo)
  }, [pessoas])

  const contarPessoas = useCallback(() => {
    return {
      total: pessoas.length,
      ativas: pessoas.filter(p => p.ativo).length,
      inativas: pessoas.filter(p => !p.ativo).length,
      proprietarios: pessoas.filter(p => p.eh_proprietario).length,
      participantes: pessoas.filter(p => !p.eh_proprietario).length
    }
  }, [pessoas])

  return {
    pessoas,
    loading,
    error,
    refetch: fetchPessoas,
    getPessoaById,
    getPessoaComTransacoes,
    getProprietarios,
    getParticipantes,
    getPessoasAtivas,
    contarPessoas
  }
}

// ============================================================================
// 🔥 HOOK PARA PESSOA INDIVIDUAL
// ============================================================================

export function usePessoa(id: number | string) {
  const [pessoa, setPessoa] = useState<Pessoa | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPessoa = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)

      const response = await api.get(API_ENDPOINTS.PESSOAS.GET(Number(id)))

      if (response.data.success && response.data.data) {
        setPessoa(response.data.data)
      } else {
        throw new Error('Pessoa não encontrada')
      }

    } catch (err: any) {
      console.error('[usePessoa] Erro ao carregar pessoa:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao carregar pessoa'
      setError(errorMessage)
      setPessoa(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchPessoa()
  }, [fetchPessoa])

  return {
    pessoa,
    loading,
    error,
    refetch: fetchPessoa
  }
}

// ============================================================================
// 🔥 HOOK PARA MUTAÇÕES (CRIAR, EDITAR, DELETAR)
// ============================================================================

export function usePessoaMutations() {
  const [loading, setLoading] = useState(false)

  const criarPessoa = useCallback(async (dados: PessoaForm) => {
    try {
      setLoading(true)

      const response = await api.post(API_ENDPOINTS.PESSOAS.CREATE, dados)

      if (response.data.success) {
        toast({
          title: "Pessoa criada!",
          description: response.data.message || "Pessoa adicionada com sucesso.",
          duration: 3000,
        })
        return response.data.data
      } else {
        throw new Error('Erro ao criar pessoa')
      }

    } catch (err: any) {
      console.error('[usePessoaMutations] Erro ao criar pessoa:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao criar pessoa'
      
      toast({
        title: "Erro ao criar pessoa",
        description: errorMessage,
        variant: "destructive",
      })
      
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const editarPessoa = useCallback(async (id: number, dados: Partial<PessoaForm>) => {
    try {
      setLoading(true)

      const response = await api.put(API_ENDPOINTS.PESSOAS.UPDATE(id), dados)

      if (response.data.success) {
        toast({
          title: "Pessoa atualizada!",
          description: response.data.message || "Dados atualizados com sucesso.",
          duration: 3000,
        })
        return response.data.data
      } else {
        throw new Error('Erro ao atualizar pessoa')
      }

    } catch (err: any) {
      console.error('[usePessoaMutations] Erro ao editar pessoa:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao atualizar pessoa'
      
      toast({
        title: "Erro ao atualizar pessoa",
        description: errorMessage,
        variant: "destructive",
      })
      
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deletarPessoa = useCallback(async (id: number, nome: string) => {
    try {
      setLoading(true)

      const response = await api.delete(API_ENDPOINTS.PESSOAS.DELETE(id))

      if (response.data.success) {
        toast({
          title: "Pessoa desativada!",
          description: `${nome} foi desativada do sistema.`,
          duration: 3000,
        })
        return true
      } else {
        throw new Error('Erro ao desativar pessoa')
      }

    } catch (err: any) {
      console.error('[usePessoaMutations] Erro ao deletar pessoa:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao desativar pessoa'
      
      toast({
        title: "Erro ao desativar pessoa",
        description: errorMessage,
        variant: "destructive",
      })
      
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    criarPessoa,
    editarPessoa,
    deletarPessoa
  }
} 