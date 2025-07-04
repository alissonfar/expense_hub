'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CreditCard,
  Activity
} from 'lucide-react';

export default function DashboardPage() {
  const { usuario, hubAtual, roleAtual } = useAuth();

  // Dados mockados para demonstração
  const dashboardData = {
    saldoAtual: 1250.50,
    receitasMes: 3200.00,
    despesasMes: 1949.50,
    totalTransacoes: 45,
    membrosAtivos: 8,
    tagsUtilizadas: 12
  };

  const cards = [
    {
      title: 'Saldo Atual',
      value: `R$ ${dashboardData.saldoAtual.toFixed(2)}`,
      description: 'Saldo disponível no hub',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Receitas do Mês',
      value: `R$ ${dashboardData.receitasMes.toFixed(2)}`,
      description: 'Total de receitas em janeiro',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Despesas do Mês',
      value: `R$ ${dashboardData.despesasMes.toFixed(2)}`,
      description: 'Total de despesas em janeiro',
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'Transações',
      value: dashboardData.totalTransacoes.toString(),
      description: 'Total de transações este mês',
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Membros Ativos',
      value: dashboardData.membrosAtivos.toString(),
      description: 'Pessoas no hub',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Tags Utilizadas',
      value: dashboardData.tagsUtilizadas.toString(),
      description: 'Categorias ativas',
      icon: Activity,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header do Dashboard */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo de volta, {usuario?.nome}! Aqui está uma visão geral do hub {hubAtual?.nome}.
        </p>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>Seu papel:</span>
          <span className="font-medium capitalize">{roleAtual?.toLowerCase()}</span>
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
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Seção de Ações Rápidas */}
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
              <button className="p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">Nova Transação</div>
                <div className="text-sm text-muted-foreground">Adicionar gasto ou receita</div>
              </button>
              <button className="p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">Ver Relatórios</div>
                <div className="text-sm text-muted-foreground">Análises e gráficos</div>
              </button>
              <button className="p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">Gerenciar Pessoas</div>
                <div className="text-sm text-muted-foreground">Membros do hub</div>
              </button>
              <button className="p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="font-medium">Configurações</div>
                <div className="text-sm text-muted-foreground">Preferências do hub</div>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>
              Últimas transações e atividades no hub
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Receita adicionada</p>
                  <p className="text-xs text-muted-foreground">Salário - R$ 3.200,00</p>
                </div>
                <span className="text-xs text-muted-foreground">2h atrás</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Despesa registrada</p>
                  <p className="text-xs text-muted-foreground">Supermercado - R$ 150,00</p>
                </div>
                <span className="text-xs text-muted-foreground">4h atrás</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Membro adicionado</p>
                  <p className="text-xs text-muted-foreground">João Silva entrou no hub</p>
                </div>
                <span className="text-xs text-muted-foreground">1 dia atrás</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 