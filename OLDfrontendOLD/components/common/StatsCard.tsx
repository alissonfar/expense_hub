'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TrendingUp, TrendingDown, Minus, AlertCircle, CreditCard, LucideIcon } from 'lucide-react'
import type { StatsCardProps } from '@/types'
import { cn } from '@/lib/utils'

// Mapeamento de ícones
const iconMap: Record<string, LucideIcon> = {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CreditCard,
}

export function StatsCard({
  title,
  value,
  description,
  trend,
  trendValue,
  icon,
  color = 'default',
  loading = false,
  onClick
}: StatsCardProps) {
  const Icon = icon ? iconMap[icon] : null
  
  const trendIcon = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus,
  }[trend || 'neutral']

  const trendColor = {
    up: 'text-green-600 bg-green-50 border-green-200',
    down: 'text-red-600 bg-red-50 border-red-200', 
    neutral: 'text-gray-600 bg-gray-50 border-gray-200',
  }[trend || 'neutral']

  const cardColor = {
    blue: 'border-l-blue-500',
    green: 'border-l-green-500',
    yellow: 'border-l-yellow-500',
    red: 'border-l-red-500',
    purple: 'border-l-purple-500',
    default: 'border-l-border',
  }[color]

  if (loading) {
    return (
      <Card className="relative">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-[120px] mb-2" />
          <Skeleton className="h-4 w-[80px]" />
        </CardContent>
      </Card>
    )
  }

  // CardComponent não é mais necessário para o protótipo

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card 
            className={cn(
              'relative transition-all hover:shadow-md border-l-4',
              cardColor
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {title}
              </CardTitle>
              {Icon && (
                <Icon className={cn(
                  'h-4 w-4',
                  color === 'blue' && 'text-blue-500',
                  color === 'green' && 'text-green-500',
                  color === 'yellow' && 'text-yellow-500',
                  color === 'red' && 'text-red-500',
                  color === 'purple' && 'text-purple-500',
                  color === 'default' && 'text-muted-foreground'
                )} />
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">
                  {value}
                </div>
                {trend && trendValue && (
                  <Badge 
                    variant="outline" 
                    className={cn('text-xs', trendColor)}
                  >
                    {React.createElement(trendIcon, { className: 'w-3 h-3 mr-1' })}
                    {trendValue}
                  </Badge>
                )}
              </div>
              {description && (
                <p className="text-xs text-muted-foreground mt-2">
                  {description}
                </p>
              )}
            </CardContent>
          </Card>
        </TooltipTrigger>
      </Tooltip>
    </TooltipProvider>
  )
} 