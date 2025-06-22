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

      try {
        setIsLoading(true)
        setError(null)

        const response = await api.get('/relatorios/dashboard')
        const data: DashboardData = response.data.data

        // Converter dados do backend para formato do frontend
        const formattedMetrics: DashboardMetric[] = [
          {
            title: 'Total Gastos',
            value: data.totalGastos || 0,
            description: 'Gastos do mês atual',
            trend: 'neutral',
            trendValue: '0%',
            icon: 'TrendingDown',
            color: 'red'
          },
          {
            title: 'Total Receitas',
            value: data.totalReceitas || 0,
            description: 'Receitas do mês atual',
            trend: 'neutral',
            trendValue: '0%',
            icon: 'TrendingUp',
            color: 'green'
          },
          {
            title: 'Saldo Atual',
            value: data.saldoAtual || 0,
            description: 'Diferença entre receitas e gastos',
            trend: data.saldoAtual >= 0 ? 'up' : 'down',
            trendValue: '0%',
            icon: 'DollarSign',
            color: data.saldoAtual >= 0 ? 'green' : 'red'
          },
          {
            title: 'Pendências',
            value: data.transacoesPendentes || 0,
            description: 'Transações pendentes',
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