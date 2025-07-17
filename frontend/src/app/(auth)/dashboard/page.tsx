'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard, useTransacoesRecentes, PeriodoTipo } from '@/hooks/useDashboard';
import { KPICard } from '@/components/dashboard/KPICard';
import { GraficoGastosPorDia } from '@/components/dashboard/GraficoGastosPorDia';
import { GraficoGastosPorCategoria } from '@/components/dashboard/GraficoGastosPorCategoria';
import { TransacoesRecentes } from '@/components/dashboard/TransacoesRecentes';
import { DateRange } from 'react-day-picker';
import { useRouter } from 'next/navigation';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';

const periodoOptions = [
  { value: '7_dias', label: 'Últimos 7 dias' },
  { value: '30_dias', label: 'Últimos 30 dias' },
  { value: '90_dias', label: 'Últimos 90 dias' },
  { value: '1_ano', label: 'Último ano' },
  { value: 'personalizado', label: 'Período personalizado' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { roleAtual } = useAuth();
  const [periodo, setPeriodo] = useState<PeriodoTipo>('30_dias');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const onboardingShownRef = useRef(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Buscar dados do dashboard
  const { data: dashboardData, isLoading: loadingDashboard } = useDashboard({
    periodo,
    data_inicio: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    data_fim: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
  });

  // Buscar transações recentes
  const { data: transacoesRecentes, isLoading: loadingTransacoes } = useTransacoesRecentes(5);

  


  const handlePeriodoChange = (value: string) => {
    setPeriodo(value as PeriodoTipo);
    if (value !== 'personalizado') {
      setDateRange(undefined);
    }
  };

  const handleDayClick = (date: string) => {
    // Implementar modal ou navegação para transações do dia
    router.push(`/transacoes?data=${date}`);
  };

  // Verificar se deve mostrar onboarding
  useEffect(() => {
    if (
      !onboardingShownRef.current &&
      transacoesRecentes && transacoesRecentes.length === 0 &&
      dashboardData?.resumo.total_gastos === 0 &&
      dashboardData?.resumo.total_receitas === 0
    ) {
      setShowOnboarding(true);
      onboardingShownRef.current = true;
    }
  }, [transacoesRecentes, dashboardData]);

  // Verificar se deve mostrar visão simplificada para VISUALIZADOR
  const isVisualizador = roleAtual === 'VISUALIZADOR';

  return (
    <div className="space-y-6">
      {/* Onboarding Checklist */}
      {showOnboarding && (
        <OnboardingChecklist 
          isFirstLogin={true}
          onDismiss={() => setShowOnboarding(false)}
        />
      )}
      {/* Botão para reabrir o onboarding */}
      <button
        className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white rounded-full shadow-lg px-4 py-2 hover:bg-blue-700 transition"
        onClick={() => setShowOnboarding(true)}
        aria-label="Ver dicas de primeiros passos"
      >
        Primeiros Passos
      </button>

      {/* Header com filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Dashboard Financeiro
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe a saúde financeira do seu Hub
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={periodo} onValueChange={handlePeriodoChange}>
            <SelectTrigger className="w-[200px] border-blue-200">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              {periodoOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {periodo === 'personalizado' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] pl-3 text-left font-normal border-blue-200",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                        {format(dateRange.to, "dd/MM/yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy")
                    )
                  ) : (
                    <span>Selecione o período</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {!isVisualizador && (
          <KPICard
            title="Receitas no Período"
            value={dashboardData?.resumo.total_receitas ?? 0}
            icon={TrendingUp}
            change={dashboardData?.comparativo?.receitas_variacao}
            valueColor="success"
            loading={loadingDashboard}
          />
        )}
        
        <KPICard
          title="Despesas no Período"
          value={dashboardData?.resumo.total_gastos ?? 0}
          icon={TrendingDown}
          change={dashboardData?.comparativo?.gastos_variacao}
          valueColor="danger"
          loading={loadingDashboard}
        />
        
        {!isVisualizador && (
          <KPICard
            title="Saldo do Período"
            value={dashboardData?.resumo.saldo_periodo ?? 0}
            icon={DollarSign}
            valueColor={
              (dashboardData?.resumo.saldo_periodo ?? 0) >= 0 ? 'success' : 'danger'
            }
            loading={loadingDashboard}
          />
        )}
        
        <KPICard
          title="Pendências"
          value={dashboardData?.resumo.transacoes_pendentes ?? 0}
          icon={AlertCircle}
          subtitle={`${dashboardData?.resumo.pessoas_devedoras ?? 0} pessoas`}
          loading={loadingDashboard}
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <GraficoGastosPorDia
          data={dashboardData?.graficos?.gastosPorDia || []}
          loading={loadingDashboard}
          onDayClick={handleDayClick}
        />
        
        <GraficoGastosPorCategoria
          data={dashboardData?.graficos?.gastosPorCategoria || []}
          loading={loadingDashboard}
          periodo={periodo}
        />
      </div>

      {/* Transações Recentes */}
      <TransacoesRecentes
        transacoes={transacoesRecentes || []}
        loading={loadingTransacoes}
      />
    </div>
  );
} 