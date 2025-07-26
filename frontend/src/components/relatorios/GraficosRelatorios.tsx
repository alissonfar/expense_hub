 'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraficoGastosPorCategoria } from '@/components/dashboard/GraficoGastosPorCategoria';
import { GraficoGastosPorDia } from '@/components/dashboard/GraficoGastosPorDia';
import { GraficoComparacao } from './GraficoComparacao';
import { BarChart3, PieChart, TrendingUp, Calendar } from 'lucide-react';
import { RelatoriosGraficos, RelatoriosComparativo } from '@/hooks/useRelatorios';
import { useState } from 'react';

interface GraficosRelatoriosProps {
  data?: RelatoriosGraficos;
  comparativo?: RelatoriosComparativo;
  loading?: boolean;
  periodo?: string;
}

export function GraficosRelatorios({ 
  data, 
  comparativo,
  loading = false, 
  periodo = '30_dias' 
}: GraficosRelatoriosProps) {
  const [activeTab, setActiveTab] = useState('categorias');

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-60 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          Análise Visual
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="categorias" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">Por Categoria</span>
              <span className="sm:hidden">Categorias</span>
            </TabsTrigger>
            <TabsTrigger value="temporal" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Evolução Temporal</span>
              <span className="sm:hidden">Temporal</span>
            </TabsTrigger>
            <TabsTrigger value="comparacao" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Comparação</span>
              <span className="sm:hidden">Comparar</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="categorias" className="mt-6">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Distribuição de gastos por categoria no período selecionado
              </div>
              <GraficoGastosPorCategoria 
                data={data?.gastosPorCategoria || []} 
                loading={loading}
                periodo={periodo}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="temporal" className="mt-6">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Evolução dos gastos ao longo do tempo
              </div>
              <GraficoGastosPorDia 
                data={data?.gastosPorDia || []} 
                loading={loading}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="comparacao" className="mt-6">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Comparação entre períodos selecionados
              </div>
              <GraficoComparacao 
                data={comparativo}
                loading={loading}
                periodoAtual="Período Atual"
                periodoAnterior="Período Anterior"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}