 'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileBarChart } from 'lucide-react';
import { KPICard } from '@/components/dashboard/KPICard';
import { FiltrosAvancados } from './FiltrosAvancados';
import { GraficosRelatorios } from './GraficosRelatorios';
import { ExportacaoRelatorios } from './ExportacaoRelatorios';
import { ControleOrcamento } from './ControleOrcamento';
import { MetasFinanceiras } from './MetasFinanceiras';
import { AlertasPessoais } from './AlertasPessoais';
import { AnimatedCard, StaggeredGrid, FadeIn } from './RelatoriosAnimations';
import { useRelatorios, FiltroRelatorio } from '@/hooks/useRelatorios';
import { cn } from '@/lib/utils';

interface RelatoriosDashboardProps {
  className?: string;
}

export function RelatoriosDashboard({ className }: RelatoriosDashboardProps) {
  const [filtros, setFiltros] = useState<FiltroRelatorio>({
    periodo: '30_dias',
    categorias: [],
    pessoas: [],
    status: 'TODOS',
    ordenacao: { campo: 'data', direcao: 'desc' }
  });

  const { data, isLoading, error } = useRelatorios({
    periodo: filtros.periodo,
    data_inicio: filtros.dataInicio,
    data_fim: filtros.dataFim,
    incluir_graficos: true,
    incluir_comparativo: true,
  });



  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <FileBarChart className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Erro ao carregar relatórios</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tente novamente em alguns instantes
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard de Relatórios</h2>
          <p className="text-gray-600">
            Análise completa das suas finanças com filtros avançados
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <ExportacaoRelatorios 
              dados={data}
              filtros={filtros}
            />
          )}
        </div>
      </div>

      {/* Filtros Avançados */}
      <FadeIn delay={0.1}>
        <FiltrosAvancados 
          filtros={filtros} 
          onFiltrosChange={setFiltros}
        />
      </FadeIn>
      
      {/* Métricas Principais */}
      <StaggeredGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          <KPICard
            key="total-gastos"
            title="Total Gastos"
            value={data?.resumo.total_gastos || 0}
            type="expense"
            change={data?.comparativo?.gastos_variacao}
            changeLabel="vs período anterior"
            loading={isLoading}
            tooltip={{
              description: "Total de gastos no período selecionado",
              details: [
                "Inclui todas as transações de gasto confirmadas",
                "Valores são atualizados em tempo real",
                "Comparação com período anterior equivalente"
              ],
              tip: "Use os filtros para analisar gastos específicos"
            }}
          />,
          
          <KPICard
            key="total-receitas"
            title="Total Receitas"
            value={data?.resumo.total_receitas || 0}
            type="revenue"
            change={data?.comparativo?.receitas_variacao}
            changeLabel="vs período anterior"
            loading={isLoading}
            tooltip={{
              description: "Total de receitas no período selecionado",
              details: [
                "Inclui todas as transações de receita confirmadas",
                "Valores são atualizados em tempo real"
              ]
            }}
          />,
          
          <KPICard
            key="saldo-periodo"
            title="Saldo do Período"
            value={data?.resumo.saldo_periodo || 0}
            type="balance"
            subtitle="Receitas - Gastos"
            loading={isLoading}
            tooltip={{
              description: "Diferença entre receitas e gastos no período",
              details: [
                "Saldo positivo: mais receitas que gastos",
                "Saldo negativo: mais gastos que receitas"
              ]
            }}
          />,
          
          <KPICard
            key="transacoes-pendentes"
            title="Transações Pendentes"
            value={data?.resumo.transacoes_pendentes || 0}
            type="pending"
            secondaryValue={data?.resumo.valor_vencido || 0}
            secondaryLabel="valor vencido"
            loading={isLoading}
            tooltip={{
              description: "Transações que ainda não foram quitadas",
              details: [
                "Inclui transações com status pendente",
                "Valor vencido: transações com vencimento passado"
              ]
            }}
          />
        ]}
      </StaggeredGrid>

      {/* Gráficos de Análise */}
      <AnimatedCard delay={0.3}>
        <GraficosRelatorios 
          data={data?.graficos} 
          comparativo={data?.comparativo}
          loading={isLoading}
          periodo={filtros.periodo}
        />
      </AnimatedCard>

      {/* Alertas Inteligentes */}
      <FadeIn delay={0.4}>
        <AlertasPessoais />
      </FadeIn>

      {/* Funcionalidades Avançadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controle de Orçamento */}
        <AnimatedCard delay={0.5}>
          <ControleOrcamento />
        </AnimatedCard>

        {/* Metas Financeiras */}
        <AnimatedCard delay={0.6}>
          <MetasFinanceiras />
        </AnimatedCard>
      </div>
    </div>
  );
}