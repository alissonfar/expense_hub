'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiGet } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/constants'

interface DashboardMetric {
  title: string
  value: number | string
  description: string
  trend: 'up' | 'down' | 'neutral'
  trendValue?: string
  icon: string
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
}

interface UseDashboardFallbackOptions {
  periodo?: string
  autoFetch?: boolean
}

export function useDashboardFallback(options: UseDashboardFallbackOptions = {}) {
  const { periodo = '30_dias', autoFetch = true } = options

  const [metrics, setMetrics] = useState<DashboardMetric[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usingFallback, setUsingFallback] = useState(false)

  // Dados mock para fallback
  const getMockMetrics = useCallback((): DashboardMetric[] => [
    {
      title: "Total Gastos",
      value: 12450.00,
      description: "Últimos 30 dias",
      trend: 'up',
      trendValue: "+12%",
      icon: "TrendingUp",
      color: "red"
    },
    {
      title: "Total Receitas", 
      value: 8720.00,
      description: "Últimos 30 dias",
      trend: 'down',
      trendValue: "-5%",
      icon: "TrendingDown",
      color: "green"
    },
    {
      title: "Saldo",
      value: -3730.00,
      description: "Receitas - Gastos",
      trend: 'down',
      icon: "DollarSign",
      color: "red"
    },
    {
      title: "Pendentes",
      value: 23,
      description: "Transações não pagas",
      trend: 'neutral',
      icon: "AlertCircle",
      color: "yellow"
    },
    {
      title: "Pessoas c/ Dívidas",
      value: 4,
      description: "Precisam pagar",
      trend: 'neutral',
      icon: "Users",
      color: "blue"
    }
  ], [])

  // Função para buscar dados reais
  const fetchRealData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setUsingFallback(false)

      const queryParams = new URLSearchParams()
      queryParams.append('periodo', periodo)
      queryParams.append('incluir_graficos', 'false')
      queryParams.append('incluir_comparativo', 'true')

      const url = `${API_ENDPOINTS.RELATORIOS.DASHBOARD}?${queryParams.toString()}`
      console.log('🔄 Tentando buscar dados reais:', url)
      
      const response = await apiGet<{
        success: boolean
        data: any
        message?: string
      }>(url)

      if (response.data.success && response.data.data) {
        console.log('✅ Dados reais carregados:', response.data.data)
        
        // Converter dados reais para métricas
        const realData = response.data.data
        const realMetrics: DashboardMetric[] = [
          {
            title: "Total Gastos",
            value: realData.resumo?.total_gastos || 0,
            description: "Últimos 30 dias",
            trend: 'neutral',
            icon: "TrendingUp", 
            color: "red"
          },
          {
            title: "Total Receitas",
            value: realData.resumo?.total_receitas || 0,
            description: "Últimos 30 dias", 
            trend: 'neutral',
            icon: "TrendingDown",
            color: "green"
          },
          {
            title: "Saldo",
            value: (realData.resumo?.total_receitas || 0) - (realData.resumo?.total_gastos || 0),
            description: "Receitas - Gastos",
            trend: 'neutral',
            icon: "DollarSign",
            color: "blue"
          },
          {
            title: "Pendentes",
            value: realData.resumo?.transacoes_pendentes || 0,
            description: "Transações não pagas",
            trend: 'neutral',
            icon: "AlertCircle",
            color: "yellow"
          },
          {
            title: "Pessoas c/ Dívidas", 
            value: realData.resumo?.pessoas_com_dividas || 0,
            description: "Precisam pagar",
            trend: 'neutral',
            icon: "Users",
            color: "purple"
          }
        ]

        setMetrics(realMetrics)
        setUsingFallback(false)
        
      } else {
        throw new Error(response.data.message || 'Resposta inválida do servidor')
      }

    } catch (err: any) {
      console.warn('⚠️ Erro ao carregar dados reais, usando fallback:', err.message)
      setError(`API indisponível: ${err.message}`)
      setMetrics(getMockMetrics())
      setUsingFallback(true)
    } finally {
      setLoading(false)
    }
  }, [periodo, getMockMetrics])

  // Auto-fetch
  useEffect(() => {
    if (autoFetch) {
      fetchRealData()
    }
  }, [fetchRealData, autoFetch])

  return {
    metrics,
    loading,
    error,
    usingFallback,
    refetch: fetchRealData,
    hasData: metrics.length > 0
  }
} 