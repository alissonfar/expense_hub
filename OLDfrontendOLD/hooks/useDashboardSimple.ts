'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'

interface DashboardMetric {
  title: string
  value: number
  description: string
  trend: 'up' | 'down' | 'neutral'
  trendValue: string
  icon: string
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'default'
}

interface DashboardData {
  metrics: DashboardMetric[]
  totalGastos: number
  totalReceitas: number
  saldoAtual: number
  transacoesPendentes: number
}

export function useDashboardSimple() {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    const fetchDashboard = async () => {
      // Verificar se está autenticado
      if (!isAuthenticated || !user) {
        setIsLoading(false)
        return
      }

      // Verificar se token existe
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        setError('Token não encontrado')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const response = await api.get('/relatorios/dashboard')
        
        const apiData = response.data.data
        const resumo = apiData.resumo
        const comparativo = apiData.comparativo

        // Converter dados do backend para formato do frontend
        const formattedMetrics: DashboardMetric[] = [
          {
            title: 'Total Gastos',
            value: resumo.total_gastos || 0,
            description: 'Gastos do mês atual',
            trend: comparativo?.gastos_variacao > 0 ? 'up' : comparativo?.gastos_variacao < 0 ? 'down' : 'neutral',
            trendValue: comparativo?.gastos_variacao ? `${comparativo.gastos_variacao > 0 ? '+' : ''}${comparativo.gastos_variacao}%` : '0%',
            icon: 'TrendingDown',
            color: 'red'
          },
          {
            title: 'Total Receitas',
            value: resumo.total_receitas || 0,
            description: 'Receitas do mês atual',
            trend: comparativo?.receitas_variacao > 0 ? 'up' : comparativo?.receitas_variacao < 0 ? 'down' : 'neutral',
            trendValue: comparativo?.receitas_variacao ? `${comparativo.receitas_variacao > 0 ? '+' : ''}${comparativo.receitas_variacao}%` : '0%',
            icon: 'TrendingUp',
            color: 'green'
          },
          {
            title: 'Saldo do Período',
            value: resumo.saldo_periodo || 0,
            description: 'Receitas - Gastos',
            trend: resumo.saldo_periodo > 0 ? 'up' : resumo.saldo_periodo < 0 ? 'down' : 'neutral',
            trendValue: '0%',
            icon: 'DollarSign',
            color: resumo.saldo_periodo >= 0 ? 'green' : 'red'
          },
          {
            title: 'Pendências',
            value: resumo.transacoes_pendentes || 0,
            description: `${resumo.pessoas_devedoras || 0} pessoas devendo`,
            trend: 'neutral',
            trendValue: '0%',
            icon: 'Clock',
            color: 'yellow'
          }
        ]

        setMetrics(formattedMetrics)
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboard()
  }, [isAuthenticated, user])

  return {
    metrics,
    isLoading,
    error
  }
} 