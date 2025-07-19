 'use client';

import React, { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Componente de loading para o dashboard
const DashboardLoading = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
            <div className="h-8 w-32 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
            <div className="h-80 bg-gray-100 rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// Componente de loading para gráficos
const ChartLoading = () => (
  <Card className="w-full">
    <CardContent className="p-6">
      <div className="flex items-center justify-center h-80">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Carregando gráfico...</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Lazy loading para componentes pesados do dashboard
const LazyGraficoGastosPorCategoria = React.lazy(() => 
  import('@/components/dashboard/GraficoGastosPorCategoria').then(module => ({
    default: module.GraficoGastosPorCategoria
  }))
);

const LazyGraficoGastosPorDia = React.lazy(() => 
  import('@/components/dashboard/GraficoGastosPorDia').then(module => ({
    default: module.GraficoGastosPorDia
  }))
);

const LazyTransacoesRecentes = React.lazy(() => 
  import('@/components/dashboard/TransacoesRecentes').then(module => ({
    default: module.TransacoesRecentes
  }))
);

// Wrapper para gráficos com lazy loading
export const LazyGraficoGastosPorCategoriaWrapper = (props: React.ComponentProps<typeof LazyGraficoGastosPorCategoria>) => (
  <Suspense fallback={<ChartLoading />}>
    <LazyGraficoGastosPorCategoria {...props} />
  </Suspense>
);

export const LazyGraficoGastosPorDiaWrapper = (props: React.ComponentProps<typeof LazyGraficoGastosPorDia>) => (
  <Suspense fallback={<ChartLoading />}>
    <LazyGraficoGastosPorDia {...props} />
  </Suspense>
);

export const LazyTransacoesRecentesWrapper = (props: React.ComponentProps<typeof LazyTransacoesRecentes>) => (
  <Suspense fallback={<ChartLoading />}>
    <LazyTransacoesRecentes {...props} />
  </Suspense>
);

// Wrapper principal para o dashboard
export const DashboardWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<DashboardLoading />}>
    {children}
  </Suspense>
);