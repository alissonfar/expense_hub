'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { useTransacoes } from '@/hooks/useTransacoes';
import { GraficoGastosPorDia } from '@/components/dashboard/GraficoGastosPorDia';
import { GraficoGastosPorCategoria } from '@/components/dashboard/GraficoGastosPorCategoria';
import { TransacoesRecentes } from '@/components/dashboard/TransacoesRecentes';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CreditCard,
  RefreshCw,
  Plus,
  BarChart3,
  Settings,
  UserPlus
} from 'lucide-react';
import type { DashboardQueryParams } from '@/lib/types';

export default function DashboardPage() {
  const { usuario, hubAtual, roleAtual } = useAuth();
  const [periodo, setPeriodo] = useState<DashboardQueryParams['periodo']>('30_dias');

  // Buscar dados do dashboard
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading, 
    error: dashboardError,
    refetch: refetchDashboard 
  } = useDashboard({
    periodo,
    incluir_graficos: true,
    incluir_comparativo: true,
    apenas_confirmadas: true
  });

  // Buscar transações recentes
  const { 
    data: transacoesData, 
    isLoading: transacoesLoading 
  } = useTransacoes({
    limit: 5,
    incluir_participantes: true,
    incluir_tags: true
  });

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarVariacao = (variacao: number) => {
    const isPositive = variacao >= 0;
    return `${isPositive ? '+' : ''}${variacao.toFixed(1)}%`;
  };

  const getPeriodoLabel = (periodo: string | undefined) => {
    switch (periodo) {
      case '7_dias': return '7 dias';
      case '30_dias': return '30 dias';
      case '90_dias': return '90 dias';
      case '1_ano': return '1 ano';
      default: return '30 dias';
    }
  };

  const cards = [
    {
      title: 'Saldo do Período',
      value: dashboardData ? formatarValor(dashboardData.resumo.saldo_periodo) : 'R$ 0,00',
      description: `Período: ${getPeriodoLabel(periodo)}`,
      icon: DollarSign,
      color: dashboardData?.resumo.saldo_periodo && dashboardData.resumo.saldo_periodo >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: dashboardData?.resumo.saldo_periodo && dashboardData.resumo.saldo_periodo >= 0 ? 'bg-green-100' : 'bg-red-100',
      variacao: dashboardData?.comparativo?.receitas_variacao
    },
    {
      title: 'Receitas',
      value: dashboardData ? formatarValor(dashboardData.resumo.total_receitas) : 'R$ 0,00',
      description: `Total de receitas`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      variacao: dashboardData?.comparativo?.receitas_variacao
    },
    {
      title: 'Gastos',
      value: dashboardData ? formatarValor(dashboardData.resumo.total_gastos) : 'R$ 0,00',
      description: `Total de gastos`,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      variacao: dashboardData?.comparativo?.gastos_variacao
    },
    {
      title: 'Transações Pendentes',
      value: dashboardData ? dashboardData.resumo.transacoes_pendentes.toString() : '0',
      description: `Aguardando pagamento`,
      icon: CreditCard,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Pessoas Devedoras',
      value: dashboardData ? dashboardData.resumo.pessoas_devedoras.toString() : '0',
      description: `Com pendências`,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header do Dashboard */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Bem-vindo de volta, {usuario?.nome}! Aqui está uma visão geral do hub {hubAtual?.nome}.
            </p>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
              <span>Seu papel:</span>
              <Badge variant="secondary" className="capitalize">
                {roleAtual?.toLowerCase()}
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as DashboardQueryParams['periodo'])}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="7_dias">7 dias</option>
              <option value="30_dias">30 dias</option>
              <option value="90_dias">90 dias</option>
              <option value="1_ano">1 ano</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchDashboard()}
              disabled={dashboardLoading}
            >
              <RefreshCw className={`h-4 w-4 ${dashboardLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {card.description}
                  </p>
                  {card.variacao !== undefined && (
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${
                        card.variacao >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatarVariacao(card.variacao)}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gráficos */}
      {dashboardData?.graficos && (
        <div className="grid gap-4 md:grid-cols-2">
          <GraficoGastosPorDia 
            data={dashboardData.graficos.gastos_por_dia} 
            isLoading={dashboardLoading}
          />
          <GraficoGastosPorCategoria 
            data={dashboardData.graficos.gastos_por_categoria} 
            isLoading={dashboardLoading}
          />
        </div>
      )}

      {/* Seção de Ações Rápidas e Transações Recentes */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesse rapidamente as funcionalidades mais usadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-auto p-3 flex flex-col items-start">
                <Plus className="h-4 w-4 mb-1" />
                <div className="font-medium">Nova Transação</div>
                <div className="text-xs text-muted-foreground">Adicionar gasto ou receita</div>
              </Button>
              <Button variant="outline" className="h-auto p-3 flex flex-col items-start">
                <BarChart3 className="h-4 w-4 mb-1" />
                <div className="font-medium">Ver Relatórios</div>
                <div className="text-xs text-muted-foreground">Análises e gráficos</div>
              </Button>
              <Button variant="outline" className="h-auto p-3 flex flex-col items-start">
                <UserPlus className="h-4 w-4 mb-1" />
                <div className="font-medium">Gerenciar Pessoas</div>
                <div className="text-xs text-muted-foreground">Membros do hub</div>
              </Button>
              <Button variant="outline" className="h-auto p-3 flex flex-col items-start">
                <Settings className="h-4 w-4 mb-1" />
                <div className="font-medium">Configurações</div>
                <div className="text-xs text-muted-foreground">Preferências do hub</div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <TransacoesRecentes 
          transacoes={transacoesData?.transacoes || []}
          isLoading={transacoesLoading}
        />
      </div>

      {/* Error State */}
      {dashboardError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="font-medium">Erro ao carregar dashboard</p>
              <p className="text-sm mt-1">
                {dashboardError instanceof Error ? dashboardError.message : 'Erro desconhecido'}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => refetchDashboard()}
              >
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 