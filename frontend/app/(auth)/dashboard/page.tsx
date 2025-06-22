import React from 'react'
import { StatsCard } from '@/components/common/StatsCard'
import { ChartWrapper as Chart } from '@/components/charts/ChartWrapper'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ArrowRight, Clock, DollarSign } from 'lucide-react'
import {
  MOCK_METRICS,
  MOCK_CHART_DATA,
  MOCK_CATEGORIAS_DATA,
  MOCK_DIVIDAS_PENDENTES,
  MOCK_PAGAMENTOS_RECENTES
} from '@/lib/constants'
import { formatCurrency, formatRelativeDate, getStatusColor, generateAvatarColor, getInitials } from '@/lib/utils'
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral dos seus gastos e receitas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Clock className="w-4 h-4 mr-2" />
            Últimos 30 dias
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {MOCK_METRICS.map((metric, index) => (
          <StatsCard
            key={index}
            title={metric.title}
            value={metric.value}
            description={metric.description}
            trend={metric.trend}
            trendValue={metric.trendValue}
            icon={metric.icon}
            color={metric.color}
          />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Gastos vs Receitas Chart */}
        <Chart
          type="line"
          data={MOCK_CHART_DATA}
          xKey="mes"
          yKey={['gastos', 'receitas']}
          title="Gastos vs Receitas"
          height={350}
          showTooltip={true}
          showLegend={true}
        />

        {/* Gastos por Categoria Chart */}
        <Chart
          type="bar"
          data={MOCK_CATEGORIAS_DATA}
          xKey="categoria"
          yKey="valor"
          title="Gastos por Categoria"
          height={350}
          showTooltip={true}
        />
      </div>

      {/* Bottom Grid - Lists */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Dívidas Pendentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Dívidas Pendentes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/relatorios/pendencias">
                Ver todas
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {MOCK_DIVIDAS_PENDENTES.map((divida, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback 
                      className={`text-xs text-white ${generateAvatarColor(divida.pessoa)}`}
                    >
                      {getInitials(divida.pessoa)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{divida.pessoa}</p>
                    <p className="text-xs text-muted-foreground">
                      {divida.transacoes} {divida.transacoes === 1 ? 'transação' : 'transações'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-600">
                    {formatCurrency(divida.valor)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeDate(divida.ultimoPagamento)}
                  </p>
                </div>
              </div>
            ))}
            {MOCK_DIVIDAS_PENDENTES.length === 0 && (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">
                  Nenhuma dívida pendente
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagamentos Recentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Pagamentos Recentes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/pagamentos">
                Ver todos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {MOCK_PAGAMENTOS_RECENTES.map((pagamento, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback 
                      className={`text-xs text-white ${generateAvatarColor(pagamento.pessoa)}`}
                    >
                      {getInitials(pagamento.pessoa)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{pagamento.pessoa}</p>
                    <p className="text-xs text-muted-foreground">
                      {pagamento.metodo}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">
                    {formatCurrency(pagamento.valor)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeDate(pagamento.data)}
                  </p>
                </div>
              </div>
            ))}
            {MOCK_PAGAMENTOS_RECENTES.length === 0 && (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">
                  Nenhum pagamento recente
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            <Button className="justify-start" asChild>
              <Link href="/transacoes/nova">
                <DollarSign className="w-4 h-4 mr-2" />
                Novo Gasto
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/pagamentos/novo">
                <DollarSign className="w-4 h-4 mr-2" />
                Registrar Pagamento
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/relatorios">
                <ArrowRight className="w-4 h-4 mr-2" />
                Ver Relatórios
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 