'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/constants'
import { toast } from '@/hooks/use-toast'

interface SaldoHistoricoPonto {
  data: string;
  saldo: number;
}

export function useSaldoHistorico(pessoaId: number | string | null) {
  const [data, setData] = useState<SaldoHistoricoPonto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSaldoHistorico = useCallback(async () => {
    if (!pessoaId) {
      setData([]);
      return;
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await api.get(API_ENDPOINTS.RELATORIOS.SALDO_HISTORICO(Number(pessoaId)))

      if (response.data.success && response.data.data) {
        setData(response.data.data)
      } else {
        throw new Error('Dados de histórico não encontrados')
      }

    } catch (err: any) {
      console.error('[useSaldoHistorico] Erro ao carregar histórico de saldo:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao carregar histórico'
      setError(errorMessage)
      setData([])
      toast({
        title: "Erro ao carregar gráfico",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [pessoaId])

  useEffect(() => {
    fetchSaldoHistorico()
  }, [fetchSaldoHistorico])

  return {
    data,
    loading,
    error,
    refetch: fetchSaldoHistorico
  }
} 