'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricIcon } from './MetricIcon';
import { MetricBadge } from './MetricBadge';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  type: 'revenue' | 'expense' | 'balance' | 'pending';
  change?: number;
  changeLabel?: string;
  subtitle?: string;
  loading?: boolean;
  interactive?: boolean;
}

export const KPICard = React.memo(function KPICard({
  title,
  value,
  type,
  change,
  changeLabel,
  subtitle,
  loading = false,
  interactive = true,
}: KPICardProps) {
  const getCardStyles = () => {
    switch (type) {
      case 'revenue':
        return {
          border: 'border-success-200',
          bg: 'bg-gradient-glass-success',
          shadow: 'shadow-success',
          hoverShadow: 'hover:shadow-success/50',
        };
      case 'expense':
        return {
          border: 'border-danger-200',
          bg: 'bg-gradient-glass-danger',
          shadow: 'shadow-danger',
          hoverShadow: 'hover:shadow-danger/50',
        };
      case 'balance':
        return {
          border: 'border-blue-200',
          bg: 'bg-gradient-primary/5',
          shadow: 'shadow-lg',
          hoverShadow: 'hover:shadow-xl',
        };
      case 'pending':
        return {
          border: 'border-neutral-200',
          bg: 'bg-gradient-glass-neutral',
          shadow: 'shadow-neutral',
          hoverShadow: 'hover:shadow-neutral/50',
        };
    }
  };

  const getValueColor = () => {
    switch (type) {
      case 'revenue':
        return 'text-success-700';
      case 'expense':
        return 'text-danger-700';
      case 'balance':
        return 'text-blue-700';
      case 'pending':
        return 'text-neutral-700';
    }
  };

  const styles = getCardStyles();

  if (loading) {
    return (
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300",
        styles.border,
        styles.bg,
        styles.shadow
      )}>
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

  const cardContent = (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300",
      styles.border,
      styles.bg,
      styles.shadow,
      interactive && styles.hoverShadow,
      interactive && "hover:-translate-y-1"
    )}
    role="region"
    aria-label={`Métrica: ${title}`}
    tabIndex={0}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <MetricIcon type={type} size="md" animated={interactive} />
      </CardHeader>
      
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="flex-1">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 200,
                damping: 15
              }}
              className={cn(
                "text-3xl font-bold tracking-tight",
                getValueColor()
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
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xs text-muted-foreground mt-1"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
          
          <MetricBadge 
            change={change}
            changeLabel={changeLabel}
            animated={interactive}
          />
        </div>
      </CardContent>
    </Card>
  );

  if (!interactive) {
    return cardContent;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      whileHover={{ y: -2 }}
    >
      {cardContent}
    </motion.div>
  );
}); 