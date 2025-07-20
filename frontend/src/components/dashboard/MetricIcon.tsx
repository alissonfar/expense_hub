'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricIconProps {
  type: 'revenue' | 'expense' | 'balance' | 'pending' | 'excess';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export const MetricIcon = React.memo(function MetricIcon({
  type,
  size = 'md',
  animated = true,
  className,
}: MetricIconProps) {
  const getIcon = () => {
    switch (type) {
      case 'revenue':
        return TrendingUp;
      case 'expense':
        return TrendingDown;
      case 'balance':
        return DollarSign;
      case 'pending':
        return Clock;
      case 'excess':
        return Sparkles;
    }
  };

  const getIconStyles = () => {
    switch (type) {
      case 'revenue':
        return {
          bg: 'bg-success-100',
          text: 'text-success-600',
          border: 'border-success-200',
          hover: 'hover:bg-success-200',
        };
      case 'expense':
        return {
          bg: 'bg-danger-100',
          text: 'text-danger-600',
          border: 'border-danger-200',
          hover: 'hover:bg-danger-200',
        };
      case 'balance':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-600',
          border: 'border-blue-200',
          hover: 'hover:bg-blue-200',
        };
      case 'pending':
        return {
          bg: 'bg-neutral-100',
          text: 'text-neutral-600',
          border: 'border-neutral-200',
          hover: 'hover:bg-neutral-200',
        };
      case 'excess':
        return {
          bg: 'bg-excess-100',
          text: 'text-excess-600',
          border: 'border-excess-200',
          hover: 'hover:bg-excess-200',
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-sm';
      case 'md':
        return 'w-10 h-10 text-base';
      case 'lg':
        return 'w-12 h-12 text-lg';
    }
  };

  const IconComponent = getIcon();
  const styles = getIconStyles();
  const sizeClasses = getSizeClasses();

  const iconContent = (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg border transition-all duration-200',
        styles.bg,
        styles.text,
        styles.border,
        animated && styles.hover,
        sizeClasses,
        className
      )}
      role="img"
      aria-label={`Ícone de ${type}`}
    >
      <IconComponent className="w-1/2 h-1/2" />
    </div>
  );

  if (!animated) {
    return iconContent;
  }

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 200,
        damping: 15,
        delay: 0.1
      }}
      whileHover={{ 
        scale: 1.1,
        rotate: 5,
        transition: { duration: 0.2 }
      }}
      whileTap={{ 
        scale: 0.95,
        transition: { duration: 0.1 }
      }}
    >
      {iconContent}
    </motion.div>
  );
}); 