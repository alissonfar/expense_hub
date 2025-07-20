'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertCircle,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricIconProps {
  type: 'revenue' | 'expense' | 'balance' | 'pending';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

const iconMap: Record<MetricIconProps['type'], LucideIcon> = {
  revenue: TrendingUp,
  expense: TrendingDown,
  balance: DollarSign,
  pending: AlertCircle,
};

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const colorMap = {
  revenue: 'text-success-600',
  expense: 'text-danger-600',
  balance: 'text-blue-600',
  pending: 'text-neutral-600',
};

const bgColorMap = {
  revenue: 'bg-gradient-glass-success',
  expense: 'bg-gradient-glass-danger',
  balance: 'bg-gradient-primary/10',
  pending: 'bg-gradient-glass-neutral',
};

export const MetricIcon = React.memo(function MetricIcon({
  type,
  size = 'md',
  animated = true,
  className,
}: MetricIconProps) {
  const Icon = iconMap[type];
  
  const iconElement = (
    <Icon 
      className={cn(
        sizeMap[size],
        colorMap[type],
        className
      )} 
    />
  );

  if (!animated) {
    return (
      <div className={cn(
        "p-2.5 rounded-lg",
        bgColorMap[type]
      )}>
        {iconElement}
      </div>
    );
  }

  return (
    <motion.div
      className={cn(
        "p-2.5 rounded-lg",
        bgColorMap[type]
      )}
      whileHover={{ 
        scale: 1.05,
        rotate: 5,
      }}
      transition={{ 
        type: "spring", 
        stiffness: 300,
        damping: 10
      }}
    >
      {iconElement}
    </motion.div>
  );
}); 