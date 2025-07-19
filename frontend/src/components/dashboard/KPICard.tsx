'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  LucideIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  subtitle?: string;
  valueColor?: 'default' | 'success' | 'danger';
  loading?: boolean;
}

export const KPICard = React.memo(function KPICard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
  subtitle,
  valueColor = 'default',
  loading = false,
}: KPICardProps) {
  const getTrendIcon = () => {
    if (!change) return null;
    if (change > 0) return TrendingUp;
    if (change < 0) return TrendingDown;
    return Minus;
  };

  const TrendIcon = getTrendIcon();

  const valueColorClasses = {
    default: 'text-gray-900',
    success: 'text-green-600',
    danger: 'text-red-600',
  };

  const changeColorClasses = change
    ? change > 0
      ? 'text-green-600 bg-green-50'
      : change < 0
      ? 'text-red-600 bg-red-50'
      : 'text-gray-600 bg-gray-50'
    : '';

  if (loading) {
    return (
      <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
    >
      <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-blue-100">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-transparent" />
        
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className="p-2.5 rounded-lg bg-gradient-primary/10">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
        </CardHeader>
        
        <CardContent className="relative">
          <div className="flex items-baseline justify-between">
            <div>
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className={cn(
                  "text-2xl font-bold",
                  valueColorClasses[valueColor]
                )}
              >
                {typeof value === 'number' && !isNaN(value)
                  ? new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(value ?? 0)
                  : value !== undefined && value !== null
                    ? value
                    : '—'
                }
              </motion.div>
              
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">
                  {subtitle}
                </p>
              )}
            </div>
            
            {change !== undefined && TrendIcon && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                  changeColorClasses
                )}
              >
                <TrendIcon className="h-3 w-3" />
                <span>{Math.abs(change).toFixed(1)}%</span>
                {changeLabel && (
                  <span className="text-xs text-muted-foreground ml-1">
                    {changeLabel}
                  </span>
                )}
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}); 