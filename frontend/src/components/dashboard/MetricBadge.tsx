'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricBadgeProps {
  change?: number;
  changeLabel?: string;
  animated?: boolean;
  className?: string;
}

export const MetricBadge = React.memo(function MetricBadge({
  change,
  changeLabel,
  animated = true,
  className,
}: MetricBadgeProps) {
  if (change === undefined) return null;

  const getTrendIcon = (): LucideIcon | null => {
    if (change > 0) return TrendingUp;
    if (change < 0) return TrendingDown;
    return Minus;
  };

  const TrendIcon = getTrendIcon();

  // Se não há ícone de tendência, não renderiza o badge
  if (!TrendIcon) return null;

  const getBadgeStyles = () => {
    if (change > 0) {
      return {
        bg: 'bg-success-50',
        text: 'text-success-700',
        border: 'border-success-200',
        icon: 'text-success-600',
      };
    }
    if (change < 0) {
      return {
        bg: 'bg-danger-50',
        text: 'text-danger-700',
        border: 'border-danger-200',
        icon: 'text-danger-600',
      };
    }
    return {
      bg: 'bg-neutral-50',
      text: 'text-neutral-700',
      border: 'border-neutral-200',
      icon: 'text-neutral-600',
    };
  };

  const styles = getBadgeStyles();

  const badgeContent = (
    <div className={cn(
      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border",
      styles.bg,
      styles.text,
      styles.border,
      className
    )}>
      <TrendIcon className={cn("h-3 w-3", styles.icon)} />
      <span>{Math.abs(change).toFixed(1)}%</span>
      {changeLabel && (
        <span className="text-xs opacity-75 ml-1">
          {changeLabel}
        </span>
      )}
    </div>
  );

  if (!animated) {
    return badgeContent;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ 
        delay: 0.2,
        type: "spring",
        stiffness: 200,
        damping: 15
      }}
      whileHover={{ scale: 1.05 }}
    >
      {badgeContent}
    </motion.div>
  );
}); 