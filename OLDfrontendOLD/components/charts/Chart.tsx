'use client'

import React, { useState, useEffect } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  TooltipProps
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ChartProps } from '@/types'
import { formatCurrency } from '@/lib/utils'

// Cores padrão para os gráficos
const defaultColors = [
  '#3b82f6', // blue
  '#10b981', // green  
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
]

// Tooltip customizado
const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {`${entry.dataKey}: ${
              typeof entry.value === 'number' && typeof entry.dataKey === 'string' && entry.dataKey.includes('valor') 
                ? formatCurrency(entry.value)
                : entry.value
            }`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function Chart({
  data,
  type,
  xKey,
  yKey,
  title,
  height = 300,
  colors = defaultColors,
  responsive = true,
  simplified = false,
  showTooltip = true,
  showLegend = false
}: ChartProps) {
  const [isClient, setIsClient] = useState(false)

  // Aguardar hidratação para evitar erros SSR
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Loading skeleton - durante SSR ou se não há dados
  if (!isClient || !data || data.length === 0) {
    return (
      <Card>
        {title && (
          <CardHeader>
            <CardTitle className="text-lg">{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center" style={{ height }}>
            {!isClient ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <div className="text-center text-muted-foreground">
                <p className="text-sm">Nenhum dado disponível</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const yKeys = Array.isArray(yKey) ? yKey : [yKey]

  const renderChart = () => {
    const commonProps = {
      data,
      margin: simplified 
        ? { top: 5, right: 5, left: 5, bottom: 5 }
        : { top: 5, right: 30, left: 20, bottom: 5 }
    }

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {!simplified && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey={xKey} 
              tick={!simplified}
              axisLine={!simplified}
              tickLine={!simplified}
            />
            <YAxis 
              tick={!simplified}
              axisLine={!simplified}
              tickLine={!simplified}
            />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
            {yKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={simplified ? 1 : 2}
                dot={!simplified}
                activeDot={{ r: simplified ? 3 : 6 }}
              />
            ))}
          </LineChart>
        )

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {!simplified && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey={xKey}
              tick={!simplified}
              axisLine={!simplified}
              tickLine={!simplified}
            />
            <YAxis 
              tick={!simplified}
              axisLine={!simplified}
              tickLine={!simplified}
            />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
            {yKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                radius={simplified ? [2, 2, 0, 0] : [4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        )

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {!simplified && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis 
              dataKey={xKey}
              tick={!simplified}
              axisLine={!simplified}
              tickLine={!simplified}
            />
            <YAxis 
              tick={!simplified}
              axisLine={!simplified}
              tickLine={!simplified}
            />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
            {yKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId="1"
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.3}
              />
            ))}
          </AreaChart>
        )

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={simplified ? 60 : 80}
              fill="#8884d8"
              dataKey={yKeys[0]}
              label={!simplified}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors[index % colors.length]} 
                />
              ))}
            </Pie>
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            {showLegend && <Legend />}
          </PieChart>
        )

      default:
        return <div>Tipo de gráfico não suportado</div>
    }
  }

  const chartContent = responsive ? (
    <ResponsiveContainer width="100%" height={height}>
      {renderChart()}
    </ResponsiveContainer>
  ) : (
    renderChart()
  )

  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {chartContent}
      </CardContent>
    </Card>
  )
} 