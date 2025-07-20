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
import { CalendarIcon } from 'lucide-react';
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
import { calcularProgressoTemporal } from '@/lib/utils';

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
  
  // Toggle configurável: 'filtrado', 'geral', 'mesAtual'
  const [modoCards, setModoCards] = useState<'filtrado' | 'geral' | 'mesAtual'>('filtrado');

  // Buscar dados do dashboard
  const { data: dashboardData, isLoading: loadingDashboard } = useDashboard({
    periodo,
    data_inicio: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    data_fim: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
  });
  
  // Buscar dados do dashboard para totais gerais (sem filtros de período)
  const { data: dashboardDataGeral } = useDashboard({ 
    periodo: '1_ano' // Usar um período longo para dados gerais
  });
  
  // Buscar dados do dashboard para mês atual
  const { data: dashboardDataMesAtual } = useDashboard({
    periodo: 'personalizado',
    data_inicio: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    data_fim: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd')
  });

  // Buscar transações recentes
  const { data: transacoesRecentes, isLoading: loadingTransacoes } = useTransacoesRecentes(5);
  
  // Escolher dados baseado no modo selecionado
  let dadosParaUsar = dashboardData;
  if (modoCards === 'geral') dadosParaUsar = dashboardDataGeral;
  if (modoCards === 'mesAtual') dadosParaUsar = dashboardDataMesAtual;

  


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

      {/* Toggle para Configurar Cards */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">
            Configuração dos Cards:
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="cardMode"
                checked={modoCards === 'filtrado'}
                onChange={() => setModoCards('filtrado')}
                className="text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-600">Valores Filtrados</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="cardMode"
                checked={modoCards === 'geral'}
                onChange={() => setModoCards('geral')}
                className="text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-600">Totais Gerais</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="cardMode"
                checked={modoCards === 'mesAtual'}
                onChange={() => setModoCards('mesAtual')}
                className="text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-600">Mês Atual</span>
            </label>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {modoCards === 'filtrado' && "Mostrando valores dos filtros aplicados"}
          {modoCards === 'geral' && "Mostrando totais de todas as transações"}
          {modoCards === 'mesAtual' && "Mostrando valores das transações do mês atual"}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
        <KPICard
          title="Receitas no Período"
          value={dadosParaUsar?.resumo.total_receitas ?? 0}
          type="revenue"
          change={dadosParaUsar?.comparativo?.receitas_variacao}
          subtitle="vs período anterior"
          progress={calcularProgressoTemporal()}
          loading={loadingDashboard}
          tooltip={{
            title: "Receitas do Período",
            description: "Total de todas as entradas financeiras confirmadas no período selecionado.",
            details: [
              "Inclui vendas, serviços e outras receitas",
              "Valores já processados e confirmados",
              "Base para cálculo de lucratividade"
            ],
            tip: "Compare com períodos anteriores para avaliar crescimento"
          }}
        />
        
        <KPICard
          title="Despesas no Período"
          value={dadosParaUsar?.resumo.total_gastos ?? 0}
          type="expense"
          change={dadosParaUsar?.comparativo?.gastos_variacao}
          subtitle="vs período anterior"
          progress={calcularProgressoTemporal()}
          loading={loadingDashboard}
          tooltip={{
            title: "Despesas do Período",
            description: "Total de todos os gastos e despesas confirmados no período selecionado.",
            details: [
              "Inclui custos operacionais e despesas",
              "Valores já processados e confirmados",
              "Base para controle de custos"
            ],
            tip: "Monitore para manter equilíbrio financeiro"
          }}
        />
        
        {!isVisualizador && (
          <KPICard
            title="Saldo do Período"
            value={dadosParaUsar?.resumo.saldo_periodo ?? 0}
            type="balance"
            subtitle="Resultado líquido"
            progress={calcularProgressoTemporal()}
            loading={loadingDashboard}
            tooltip={{
              title: "Saldo do Período",
              description: "Diferença entre receitas e despesas, indicando a situação financeira do período.",
              details: [
                "Resultado líquido das operações",
                "Indica saúde financeira do hub",
                "Base para tomada de decisões"
              ],
              tip: "Valores positivos indicam situação favorável"
            }}
          />
        )}
        
        <KPICard
          title="Transações Pendentes"
          value={dadosParaUsar?.resumo.transacoes_pendentes ?? 0}
          type="pending"
          subtitle="Aguardando aprovação"
          progress={calcularProgressoTemporal()}
          loading={loadingDashboard}
          tooltip={{
            title: "Transações Pendentes",
            description: "Transações que aguardam confirmação ou processamento.",
            details: [
              "Requerem atenção para aprovação",
              "Podem afetar o saldo final",
              "Importante revisar regularmente"
            ],
            tip: "Revisar pendências para evitar atrasos"
          }}
        />
        
        {/* ✅ NOVO: Card de Transações Vencidas */}
        <KPICard
          title="Transações Vencidas"
          value={dadosParaUsar?.resumo.transacoes_vencidas ?? 0}
          type="expense"
          subtitle="Requer atenção urgente"
          progress={calcularProgressoTemporal()}
          loading={loadingDashboard}
          tooltip={{
            title: "Transações Vencidas",
            description: "Transações que já ultrapassaram a data de vencimento.",
            details: [
              "Necessitam ação imediata",
              "Podem gerar multas ou juros",
              "Afetam o fluxo de caixa"
            ],
            tip: "Priorize o pagamento destas transações"
          }}
        />
        
        {/* ✅ NOVO: Card de Valor Vencido */}
        <KPICard
          title="Valor Vencido"
          value={dadosParaUsar?.resumo.valor_vencido ?? 0}
          type="expense"
          subtitle="Total em atraso"
          progress={calcularProgressoTemporal()}
          loading={loadingDashboard}
          tooltip={{
            title: "Valor Total Vencido",
            description: "Soma dos valores de todas as transações vencidas.",
            details: [
              "Impacto financeiro direto",
              "Base para negociação",
              "Controle de inadimplência"
            ],
            tip: "Monitore para evitar problemas financeiros"
          }}
        />
        
        {/* ✅ NOVO: Card de Próximos Vencimentos */}
        <KPICard
          title="Próximos Vencimentos"
          value={dadosParaUsar?.resumo.proximos_vencimentos ?? 0}
          type="pending"
          subtitle="Próximos 30 dias"
          progress={calcularProgressoTemporal()}
          loading={loadingDashboard}
          tooltip={{
            title: "Próximos Vencimentos",
            description: "Transações que vencem nos próximos 30 dias.",
            details: [
              "Planejamento de fluxo de caixa",
              "Evita atrasos de pagamento",
              "Organização financeira"
            ],
            tip: "Programe-se para os pagamentos futuros"
          }}
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