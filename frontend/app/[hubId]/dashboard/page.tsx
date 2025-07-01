"use client";

import React from "react";
import { useParams } from "next/navigation";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Users, 
  Receipt,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Plus,
  BarChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/lib/stores/auth-store";

// =============================================
// 💰 DASHBOARD PAGE COMPONENT
// =============================================

export default function DashboardPage() {
  const params = useParams();
  const { currentHub } = useAuthStore();
  const hubId = params.hubId as string;
  // Logar contexto ao montar o dashboard
  const storeState = useAuthStore.getState();
  console.log('[Dashboard] Componente montado. hubId:', hubId, {
    currentHub: storeState.currentHub,
    accessToken: storeState.accessToken,
    isAuthenticated: storeState.isAuthenticated
  });

  // =============================================
  // 📊 MOCK DATA (SERÁ SUBSTITUÍDO PELA API)
  // =============================================

  const financialSummary = {
    saldoAtual: 15420.75,
    receitasMes: 8500.00,
    despesasMes: 3420.25,
    economiasMes: 5079.75,
    variacao: {
      receitas: 12.5,
      despesas: -8.3,
      economia: 24.1
    }
  };

  const recentTransactions = [
    {
      id: "1",
      descricao: "Salário Janeiro",
      valor: 8500.00,
      tipo: "RECEITA",
      data: "2025-01-01",
      categoria: "Salário"
    },
    {
      id: "2", 
      descricao: "Supermercado",
      valor: -420.50,
      tipo: "DESPESA",
      data: "2024-12-30",
      categoria: "Alimentação"
    },
    {
      id: "3",
      descricao: "Freelance Design",
      valor: 1200.00,
      tipo: "RECEITA", 
      data: "2024-12-28",
      categoria: "Trabalho Extra"
    },
    {
      id: "4",
      descricao: "Internet + TV",
      valor: -199.90,
      tipo: "DESPESA",
      data: "2024-12-25",
      categoria: "Contas"
    }
  ];

  const quickStats = [
    {
      title: "Transações",
      value: "847",
      change: "+12%",
      icon: Receipt,
      trend: "up"
    },
    {
      title: "Categorias Ativas",
      value: "23",
      change: "+3",
      icon: Calendar,
      trend: "up"
    },
    {
      title: "Média Mensal",
      value: "R$ 4.280",
      change: "-5%",
      icon: TrendingUp,
      trend: "down"
    },
    {
      title: "Membros",
      value: "3",
      change: "0",
      icon: Users,
      trend: "neutral"
    }
  ];

  // =============================================
  // 🎨 HELPERS
  // =============================================

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  // =============================================
  // 🎨 RENDER
  // =============================================

  return (
    <div className="space-y-8">
      {/* =============================================
          🎨 HEADER SECTION
          ============================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo ao hub "{currentHub?.nome}" • {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Dezembro 2024
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* =============================================
          💰 FINANCIAL SUMMARY CARDS
          ============================================= */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Saldo Atual */}
        <Card className="glass-effect hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(financialSummary.saldoAtual)}
            </div>
            <p className="text-xs text-muted-foreground">
              Atualizado agora
            </p>
          </CardContent>
        </Card>

        {/* Receitas */}
        <Card className="glass-effect hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(financialSummary.receitasMes)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{financialSummary.variacao.receitas}%</span> vs mês anterior
            </p>
          </CardContent>
        </Card>

        {/* Despesas */}
        <Card className="glass-effect hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(financialSummary.despesasMes)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{financialSummary.variacao.despesas}%</span> vs mês anterior
            </p>
          </CardContent>
        </Card>

        {/* Economia */}
        <Card className="glass-effect hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Economia</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(financialSummary.economiasMes)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{financialSummary.variacao.economia}%</span> vs mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* =============================================
          📊 CHARTS AND STATS SECTION
          ============================================= */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Main Chart Area */}
        <Card className="lg:col-span-4 glass-effect">
          <CardHeader>
            <CardTitle>Fluxo Financeiro</CardTitle>
            <CardDescription>
              Receitas vs Despesas nos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center bg-muted/20 rounded-lg">
              <div className="text-center space-y-2">
                <BarChart className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">
                  Gráfico será implementado aqui
                </p>
                <p className="text-xs text-muted-foreground">
                  Usando Recharts para visualização
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="lg:col-span-3 glass-effect">
          <CardHeader>
            <CardTitle>Estatísticas Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quickStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-600' : 
                    stat.trend === 'down' ? 'text-red-600' : 
                    'text-muted-foreground'
                  }`}>
                    {stat.change}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* =============================================
          📋 RECENT TRANSACTIONS
          ============================================= */}
      <Card className="glass-effect">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transações Recentes</CardTitle>
            <CardDescription>
              Últimas movimentações do seu hub
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            Ver todas
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div 
                key={transaction.id}
                className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/20 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    transaction.tipo === 'RECEITA' 
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {transaction.tipo === 'RECEITA' ? (
                      <ArrowUpRight className="h-5 w-5" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5" />
                    )}
                  </div>
                  
                  <div>
                    <p className="font-medium">{transaction.descricao}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.categoria} • {formatDate(transaction.data)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`text-right ${
                    transaction.tipo === 'RECEITA' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <p className="font-semibold">
                      {formatCurrency(Math.abs(transaction.valor))}
                    </p>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* =============================================
          🔗 QUICK ACTIONS
          ============================================= */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-effect hover-lift cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 group-hover:scale-110 transition-transform dark:bg-green-900/30 dark:text-green-400">
                <ArrowUpRight className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Nova Receita</h3>
                <p className="text-sm text-muted-foreground">Registrar entrada de dinheiro</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect hover-lift cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 group-hover:scale-110 transition-transform dark:bg-red-900/30 dark:text-red-400">
                <ArrowDownRight className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Nova Despesa</h3>
                <p className="text-sm text-muted-foreground">Registrar saída de dinheiro</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect hover-lift cursor-pointer group">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:scale-110 transition-transform dark:bg-blue-900/30 dark:text-blue-400">
                <BarChart className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Ver Relatórios</h3>
                <p className="text-sm text-muted-foreground">Análises detalhadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 