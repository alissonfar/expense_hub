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
  BarChart,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/lib/stores/auth-store";
import { ProtectedLayout } from '@/components/ProtectedLayout'
import { Badge } from '@/components/ui/badge'

// =============================================
// 💰 DASHBOARD PAGE COMPONENT
// =============================================

function DashboardContent() {
  const params = useParams();
  const { currentHub, hubId, hubNome, role, isOwner, isAdmin } = useAuthStore();
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* =============================================
              🎨 HEADER SECTION
              ============================================= */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-white">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    Dashboard
                  </h1>
                  <p className="text-muted-foreground">
                    {hubNome} • Hub ID: {hubId}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant={isOwner ? "default" : isAdmin ? "secondary" : "outline"}>
                {role}
              </Badge>
            </div>
          </div>

          {/* =============================================
              📈 STATS CARDS
              ============================================= */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="glass-effect">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Receitas
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">R$ 15.420,00</div>
                <p className="text-xs text-muted-foreground">
                  +12% em relação ao mês anterior
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Despesas
                </CardTitle>
                <DollarSign className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">R$ 8.240,00</div>
                <p className="text-xs text-muted-foreground">
                  -5% em relação ao mês anterior
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Saldo
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">R$ 7.180,00</div>
                <p className="text-xs text-muted-foreground">
                  +22% em relação ao mês anterior
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Membros
                </CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">3</div>
                <p className="text-xs text-muted-foreground">
                  Ativos no hub
                </p>
              </CardContent>
            </Card>
          </div>

          {/* =============================================
              📊 MAIN CONTENT
              ============================================= */}
          <div className="grid gap-6 lg:grid-cols-3">
            
            {/* Recent Activity */}
            <Card className="lg:col-span-2 glass-effect">
              <CardHeader>
                <CardTitle>Atividades Recentes</CardTitle>
                <CardDescription>
                  Últimas transações do hub
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: 'receita', desc: 'Salário', valor: 'R$ 5.000,00', data: '2 horas atrás' },
                    { type: 'despesa', desc: 'Supermercado', valor: 'R$ 234,50', data: '5 horas atrás' },
                    { type: 'receita', desc: 'Freelance', valor: 'R$ 800,00', data: '1 dia atrás' },
                    { type: 'despesa', desc: 'Combustível', valor: 'R$ 120,00', data: '2 dias atrás' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          item.type === 'receita' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="font-medium">{item.desc}</p>
                          <p className="text-sm text-muted-foreground">{item.data}</p>
                        </div>
                      </div>
                      <div className={`font-semibold ${
                        item.type === 'receita' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.type === 'receita' ? '+' : '-'}{item.valor}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>
                  Atalhos para operações comuns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Nova Receita', color: 'bg-green-600 hover:bg-green-700' },
                  { label: 'Nova Despesa', color: 'bg-red-600 hover:bg-red-700' },
                  { label: 'Ver Relatórios', color: 'bg-blue-600 hover:bg-blue-700' },
                  { label: 'Gerenciar Membros', color: 'bg-purple-600 hover:bg-purple-700', admin: true },
                ].map((action, i) => (
                  (!action.admin || isAdmin) && (
                    <button
                      key={i}
                      className={`w-full p-3 text-white rounded-lg transition-colors ${action.color}`}
                    >
                      {action.label}
                    </button>
                  )
                ))}
              </CardContent>
            </Card>
          </div>

          {/* =============================================
              🔧 DEBUG INFO (DEV ONLY)
              ============================================= */}
          {process.env.NODE_ENV === 'development' && (
            <Card className="glass-effect border-dashed border-2 border-orange-200">
              <CardHeader>
                <CardTitle className="text-orange-600">🔧 Debug Info</CardTitle>
                <CardDescription>
                  Informações de desenvolvimento - será removido em produção
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 text-sm font-mono">
                  <div><strong>Hub ID:</strong> {hubId}</div>
                  <div><strong>Hub Nome:</strong> {hubNome}</div>
                  <div><strong>Role:</strong> {role}</div>
                  <div><strong>Is Owner:</strong> {isOwner ? 'Sim' : 'Não'}</div>
                  <div><strong>Is Admin:</strong> {isAdmin ? 'Sim' : 'Não'}</div>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}

// =============================================
// 🛡️ PROTECTED DASHBOARD PAGE
// =============================================

export default function DashboardPage() {
  return (
    <ProtectedLayout 
      requireHub={true}
      allowedRoles={['PROPRIETARIO', 'ADMINISTRADOR', 'COLABORADOR', 'VISUALIZADOR']}
    >
      <DashboardContent />
    </ProtectedLayout>
  );
} 