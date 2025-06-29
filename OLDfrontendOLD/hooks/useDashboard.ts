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

interface DashboardChart {
  type: 'line' | 'bar' | 'pie'
  data: any[]
  title: string
}

interface DashboardData {
  resumo: {
    total_gastos: number
    total_receitas: number
    saldo: number
    transacoes_pendentes: number
    transacoes_pagas: number
    pessoas_com_dividas: number
  }
  comparativo?: {
    gastos_periodo_anterior: number
    receitas_periodo_anterior: number
    variacao_gastos: number
    variacao_receitas: number
  }
  graficos?: {
    gastos_por_mes: any[]
    gastos_por_categoria: any[]
    evolucao_saldo: any[]
  }
  periodo: {
    data_inicio: string
    data_fim: string
    descricao: string
  }
}

interface UseDashboardOptions {
  periodo?: string
  data_inicio?: string
  data_fim?: string
  incluir_graficos?: boolean
  incluir_comparativo?: boolean
  apenas_confirmadas?: boolean
  autoFetch?: boolean
  refetchInterval?: number
}

export function useDashboard(options: UseDashboardOptions = {}) {
  const {
    periodo = '30_dias',
    data_inicio,
    data_fim,
    incluir_graficos = true,
    incluir_comparativo = true,
    apenas_confirmadas = false,
    autoFetch = true,
    refetchInterval
  } = options

  const [data, setData] = useState<DashboardData | null>(null)
  const [metrics, setMetrics] = useState<DashboardMetric[]>([])
  const [charts, setCharts] = useState<DashboardChart[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Função para buscar dados do dashboard
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Construir query params com validação
      const queryParams = new URLSearchParams()
      
      // Validar período conforme schema do backend
      const periodosValidos = ['7_dias', '30_dias', '90_dias', '1_ano', 'personalizado']
      const periodoValido = periodosValidos.includes(periodo) ? periodo : '30_dias'
      
      queryParams.append('periodo', periodoValido)
      
      if (data_inicio) queryParams.append('data_inicio', data_inicio)
      if (data_fim) queryParams.append('data_fim', data_fim)
      if (incluir_graficos) queryParams.append('incluir_graficos', 'true')
      if (incluir_comparativo) queryParams.append('incluir_comparativo', 'true')
      if (apenas_confirmadas) queryParams.append('apenas_confirmadas', 'true')

      const url = `${API_ENDPOINTS.RELATORIOS.DASHBOARD}?${queryParams.toString()}`
      console.log('Fazendo requisição para:', url)
      
      const response = await apiGet<{
        success: boolean
        data: DashboardData
        message?: string
      }>(url)

      if (response.data.success && response.data.data) {
        const dashboardData = response.data.data
        setData(dashboardData)

        // Converter dados em métricas para exibição
        const newMetrics: DashboardMetric[] = [
          {
            title: "Total Gastos",
            value: dashboardData.resumo.total_gastos,
            description: dashboardData.periodo.descricao,
            trend: dashboardData.comparativo 
              ? (dashboardData.comparativo.variacao_gastos > 0 ? 'up' : dashboardData.comparativo.variacao_gastos < 0 ? 'down' : 'neutral')
              : 'neutral',
            trendValue: dashboardData.comparativo 
              ? `${dashboardData.comparativo.variacao_gastos > 0 ? '+' : ''}${dashboardData.comparativo.variacao_gastos.toFixed(1)}%`
              : undefined,
            icon: "TrendingUp",
            color: "red"
          },
          {
            title: "Total Receitas",
            value: dashboardData.resumo.total_receitas,
            description: dashboardData.periodo.descricao,
            trend: dashboardData.comparativo 
              ? (dashboardData.comparativo.variacao_receitas > 0 ? 'up' : dashboardData.comparativo.variacao_receitas < 0 ? 'down' : 'neutral')
              : 'neutral',
            trendValue: dashboardData.comparativo 
              ? `${dashboardData.comparativo.variacao_receitas > 0 ? '+' : ''}${dashboardData.comparativo.variacao_receitas.toFixed(1)}%`
              : undefined,
            icon: "TrendingDown",
            color: "green"
          },
          {
            title: "Saldo",
            value: dashboardData.resumo.saldo,
            description: "Receitas - Gastos",
            trend: dashboardData.resumo.saldo >= 0 ? 'up' : 'down',
            icon: "DollarSign",
            color: dashboardData.resumo.saldo >= 0 ? "green" : "red"
          },
          {
            title: "Pendentes",
            value: dashboardData.resumo.transacoes_pendentes,
            description: "Transações não pagas",
            trend: 'neutral',
            icon: "AlertCircle",
            color: "yellow"
          },
          {
            title: "Pessoas c/ Dívidas",
            value: dashboardData.resumo.pessoas_com_dividas,
            description: "Precisam pagar",
            trend: 'neutral',
            icon: "Users",
            color: "blue"
          }
        ]

        setMetrics(newMetrics)

        // Converter gráficos se disponíveis
        if (dashboardData.graficos) {
          const newCharts: DashboardChart[] = []

          if (dashboardData.graficos.gastos_por_mes) {
            newCharts.push({
              type: 'line',
              data: dashboardData.graficos.gastos_por_mes,
              title: 'Gastos por Mês'
            })
          }

          if (dashboardData.graficos.gastos_por_categoria) {
            newCharts.push({
              type: 'bar',
              data: dashboardData.graficos.gastos_por_categoria,
              title: 'Gastos por Categoria'
            })
          }

          if (dashboardData.graficos.evolucao_saldo) {
            newCharts.push({
              type: 'line',
              data: dashboardData.graficos.evolucao_saldo,
              title: 'Evolução do Saldo'
            })
          }

          setCharts(newCharts)
        }

      } else {
        throw new Error(response.data.message || 'Erro ao carregar dashboard')
      }

    } catch (err: any) {
      console.error('Erro ao carregar dashboard:', err)
      setError(err.message || 'Erro ao carregar dados do dashboard')
      
      // Fallback para dados mock em caso de erro
      const mockMetrics: DashboardMetric[] = [
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
      ]
      
      setMetrics(mockMetrics)
      setData(null)
      setCharts([])
    } finally {
      setLoading(false)
    }
  }, [periodo, data_inicio, data_fim, incluir_graficos, incluir_comparativo, apenas_confirmadas])

  // Auto-fetch na inicialização
  useEffect(() => {
    if (autoFetch) {
      fetchDashboard()
    }
  }, [fetchDashboard, autoFetch])

  // Refetch automático se configurado
  useEffect(() => {
    if (refetchInterval && refetchInterval > 0) {
      const interval = setInterval(fetchDashboard, refetchInterval)
      return () => clearInterval(interval)
    }
  }, [fetchDashboard, refetchInterval])

  // Função para atualizar período
  const updatePeriod = useCallback((newPeriod: string) => {
    // Esta função retornaria novas opções para o hook
    return { ...options, periodo: newPeriod }
  }, [options])

  // Função para atualizar datas customizadas
  const updateCustomDates = useCallback((inicio: string, fim: string) => {
    return { ...options, data_inicio: inicio, data_fim: fim, periodo: 'custom' }
  }, [options])

  return {
    // Dados principais
    data,
    metrics,
    charts,
    loading,
    error,
    
    // Ações
    refetch: fetchDashboard,
    updatePeriod,
    updateCustomDates,
    
    // Estados úteis
    hasData: !!data,
    isEmpty: data ? Object.values(data.resumo).every(v => v === 0) : false,
    period: data?.periodo
  }
} 