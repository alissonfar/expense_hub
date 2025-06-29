'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ChartProps } from '@/types'

// Dynamic import do Chart para evitar SSR
const Chart = dynamic(() => import('./Chart').then(mod => ({ default: mod.Chart })), {
  ssr: false,
  loading: () => <ChartSkeleton />
})

// Skeleton personalizado para gráficos
function ChartSkeleton({ title, height = 300 }: { title?: string, height?: number }) {
  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-3">
          {/* Título do gráfico */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          
          {/* Área do gráfico */}
          <div className="relative" style={{ height }}>
            <Skeleton className="w-full h-full rounded-lg" />
            
            {/* Simulação de elementos do gráfico */}
            <div className="absolute inset-4 flex items-end justify-around">
              {[...Array(6)].map((_, i) => (
                <Skeleton 
                  key={i} 
                  className="w-8" 
                  style={{ height: `${Math.random() * 60 + 20}%` }}
                />
              ))}
            </div>
          </div>
          
          {/* Legenda simulada */}
          <div className="flex justify-center gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Wrapper component que será usado no Dashboard
export function ChartWrapper(props: ChartProps) {
  return <Chart {...props} />
}

export { ChartSkeleton } 