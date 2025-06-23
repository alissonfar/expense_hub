'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiGet } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/constants'
import { Pessoa } from '@/types'

export function usePessoas() {
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPessoas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiGet<{
        success: boolean
        data: Pessoa[]
      }>(API_ENDPOINTS.PESSOAS.LIST)

      if (response.data.success && response.data.data) {
        // Filtrar apenas pessoas ativas
        const pessoasAtivas = response.data.data.filter(p => p.ativo)
        setPessoas(pessoasAtivas)
      } else {
        throw new Error('Erro ao carregar pessoas')
      }

    } catch (err: any) {
      setError(err.message || 'Erro ao carregar pessoas')
      setPessoas([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPessoas()
  }, [fetchPessoas])

  // Funções utilitárias
  const getPessoaById = useCallback((id: number) => {
    return pessoas.find(p => p.id === id)
  }, [pessoas])

  const getProprietarios = useCallback(() => {
    return pessoas.filter(p => p.eh_proprietario)
  }, [pessoas])

  const getParticipantes = useCallback(() => {
    return pessoas.filter(p => !p.eh_proprietario)
  }, [pessoas])

  return {
    pessoas,
    loading,
    error,
    refetch: fetchPessoas,
    getPessoaById,
    getProprietarios,
    getParticipantes
  }
} 