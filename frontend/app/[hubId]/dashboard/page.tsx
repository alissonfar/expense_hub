"use client";

import React from "react";
import { useParams } from "next/navigation";
import { 
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Users,
  Receipt,
  MoreVertical,
  Plus,
  BarChart,
  ShieldCheck,
  Building2,
  FileBarChart2,
  UserPlus,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useHubContext } from "@/lib/stores/auth-store";
import { ProtectedLayout } from '@/components/ProtectedLayout';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { ChartWidget, ChartData } from '@/components/ui/chart-widget';
import { DataTable, Column } from '@/components/ui/data-table';

// =============================================
// 💰 DASHBOARD REVAMPED
// =============================================

// Mock Data Types
type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: 'Receita' | 'Despesa';
  date: string;
  status: 'Confirmado' | 'Pendente';
};

// =============================================
// 🎨 MOCK DATA (API REPLACEMENT)
// =============================================
const kpiData = [
  {
    title: "Saldo Atual",
    value: "R$ 7.180,00",
    change: 22,
    icon: <DollarSign className="w-5 h-5" />,
    trend: 'up' as const,
  },
  {
    title: "Receitas do Mês",
    value: "R$ 15.420,00",
    change: 12.5,
    icon: <ArrowUpRight className="w-5 h-5" />,
    trend: 'up' as const,
  },
  {
    title: "Despesas do Mês",
    value: "R$ 8.240,00",
    change: -5.8,
    icon: <ArrowDownRight className="w-5 h-5" />,
    trend: 'down' as const,
  },
  {
    title: "Membros Ativos",
    value: "3",
    change: 1,
    icon: <Users className="w-5 h-5" />,
    trend: 'up' as const,
  }
];

const recentTransactions: Transaction[] = [
    { id: 'txn_1', description: 'Salário de Janeiro', amount: 5000.00, type: 'Receita', date: '2025-01-05', status: 'Confirmado' },
    { id: 'txn_2', description: 'Compra Supermercado', amount: -234.50, type: 'Despesa', date: '2025-01-05', status: 'Confirmado' },
    { id: 'txn_3', description: 'Projeto Freelance', amount: 800.00, type: 'Receita', date: '2025-01-04', status: 'Confirmado' },
    { id: 'txn_4', description: 'Pagamento Aluguel', amount: -1800.00, type: 'Despesa', date: '2025-01-03', status: 'Pendente' },
    { id: 'txn_5', description: 'Venda de Item Usado', amount: 150.00, type: 'Receita', date: '2025-01-02', status: 'Confirmado' },
];

const revenueChartData: ChartData[] = [
  { label: 'Set', value: 6500 },
  { label: 'Out', value: 5900 },
  { label: 'Nov', value: 8000 },
  { label: 'Dez', value: 8100 },
  { label: 'Jan', value: 15420 },
  { label: 'Fev', value: 14000 },
];

const expenseByCategoryChartData: ChartData[] = [
    { label: 'Moradia', value: 1800 },
    { label: 'Transporte', value: 550 },
    { label: 'Alimentação', value: 1230 },
    { label: 'Lazer', value: 800 },
    { label: 'Outros', value: 400 },
];

const transactionColumns: Column<Transaction>[] = [
  {
    key: 'description',
    header: 'Descrição',
    accessor: (item) => <div className="font-medium">{item.description}</div>,
  },
  {
    key: 'amount',
    header: 'Valor',
    accessor: (item) => (
      <div className={`font-semibold ${item.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}
      </div>
    ),
  },
  {
    key: 'type',
    header: 'Tipo',
    accessor: (item) => (
       <Badge variant={item.type === 'Receita' ? 'default' : 'destructive'}>
        {item.type}
       </Badge>
    )
  },
  {
    key: 'date',
    header: 'Data',
    accessor: (item) => new Date(item.date).toLocaleDateString('pt-BR'),
  },
  {
    key: 'status',
    header: 'Status',
    accessor: (item) => (
      <Badge variant={item.status === 'Confirmado' ? 'secondary' : 'outline'}>
        {item.status}
      </Badge>
    )
  }
];

function DashboardContent() {
  const { hubId, hubNome, role, isOwner, isAdmin } = useHubContext();
  
  return (
    <main className="flex-1 bg-slate-50/50 dark:bg-slate-900/50 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ======================= HEADER ======================= */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Dashboard
              </h1>
              <p className="text-muted-foreground">
                Bem-vindo ao hub <span className="font-semibold text-primary">{hubNome}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Transação
            </Button>
            <Button variant="outline" size="icon" className="hidden sm:inline-flex">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ======================= KPI CARDS ======================= */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpiData.map((kpi) => (
            <StatCard key={kpi.title} {...kpi} />
          ))}
        </div>

        {/* ======================= CHARTS ======================= */}
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
             <ChartWidget
                type="line"
                title="Evolução de Receitas (Últimos 6 meses)"
                data={revenueChartData}
             />
          </div>
          <div className="lg:col-span-2">
            <ChartWidget
                type="bar"
                title="Despesas por Categoria"
                data={expenseByCategoryChartData}
             />
          </div>
        </div>
        
        {/* ======================= DATA TABLE & QUICK ACTIONS ======================= */}
        <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Últimas Transações</CardTitle>
                        <CardDescription>As 5 transações mais recentes no hub.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <DataTable columns={transactionColumns} data={recentTransactions} />
                    </CardContent>
                </Card>
            </div>

            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>Ações Rápidas</CardTitle>
                        <CardDescription>Atalhos para operações comuns.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                       <Button variant="outline"><FileBarChart2 className="mr-2 h-4 w-4" /> Ver Relatórios</Button>
                       <Button variant="outline"><UserPlus className="mr-2 h-4 w-4" /> Convidar Membro</Button>
                       <Button variant="outline"><Send className="mr-2 h-4 w-4" /> Realizar Pagamento</Button>
                    </CardContent>
                </Card>
            </div>
        </div>

        {/* ======================= DEBUG INFO ======================= */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="border-dashed border-orange-400 bg-orange-50/50 dark:bg-orange-900/10">
            <CardHeader>
              <CardTitle className="text-orange-600 dark:text-orange-400">🔧 Debug Info</CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-mono grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
              <div><strong>Hub ID:</strong> {hubId}</div>
              <div><strong>Hub Nome:</strong> {hubNome}</div>
              <div><strong>Role:</strong> <Badge variant="secondary">{role}</Badge></div>
              <div><strong>Is Owner:</strong> {isOwner ? 'Sim' : 'Não'}</div>
              <div><strong>Is Admin:</strong> {isAdmin ? 'Sim' : 'Não'}</div>
            </CardContent>
          </Card>
        )}

      </div>
    </main>
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