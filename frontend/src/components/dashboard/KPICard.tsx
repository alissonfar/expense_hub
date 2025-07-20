'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MetricIcon } from './MetricIcon';
import { MetricBadge } from './MetricBadge';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  type: 'revenue' | 'expense' | 'balance' | 'pending' | 'excess';
  change?: number;
  changeLabel?: string;
  subtitle?: string;
  secondaryValue?: string | number;
  secondaryLabel?: string;
  progress?: number; // 0-100
  loading?: boolean;
  interactive?: boolean;
  className?: string;
  tooltip?: {
    title?: string;
    description: string;
    details?: string[];
    tip?: string;
  };
}

export const KPICard = React.memo(function KPICard({
  title,
  value,
  type,
  change,
  changeLabel,
  subtitle,
  secondaryValue,
  secondaryLabel,
  progress,
  loading = false,
  interactive = true,
  className,
  tooltip,
}: KPICardProps) {
  const getCardStyles = () => {
    switch (type) {
      case 'revenue':
        return {
          border: 'border-success-200',
          bg: 'bg-gradient-glass-success',
          shadow: 'shadow-success',
          shadowStyle: 'box-shadow: 0 20px 40px -10px rgba(34, 197, 94, 0.4), 0 10px 20px -5px rgba(34, 197, 94, 0.2)',
          hoverShadow: 'hover:shadow-success/50',
          glow: 'hover:animate-pulse-glow hover:text-success-600',
        };
      case 'expense':
        return {
          border: 'border-danger-200',
          bg: 'bg-gradient-glass-danger',
          shadow: 'shadow-danger',
          shadowStyle: 'box-shadow: 0 20px 40px -10px rgba(239, 68, 68, 0.4), 0 10px 20px -5px rgba(239, 68, 68, 0.2)',
          hoverShadow: 'hover:shadow-danger/50',
          glow: 'hover:animate-pulse-glow hover:text-danger-600',
        };
      case 'balance':
        return {
          border: 'border-blue-200',
          bg: 'bg-gradient-glass-primary',
          shadow: 'shadow-primary',
          shadowStyle: 'box-shadow: 0 20px 40px -10px rgba(59, 130, 246, 0.4), 0 10px 20px -5px rgba(59, 130, 246, 0.2)',
          hoverShadow: 'hover:shadow-primary/50',
          glow: 'hover:animate-pulse-glow hover:text-blue-600',
        };
      case 'pending':
        return {
          border: 'border-neutral-200',
          bg: 'bg-gradient-glass-neutral',
          shadow: 'shadow-neutral',
          shadowStyle: 'box-shadow: 0 20px 40px -10px rgba(107, 114, 128, 0.4), 0 10px 20px -5px rgba(107, 114, 128, 0.2)',
          hoverShadow: 'hover:shadow-neutral/50',
          glow: 'hover:animate-pulse-glow hover:text-neutral-600',
        };
      case 'excess':
        return {
          border: 'border-excess-200',
          bg: 'bg-gradient-glass-excess',
          shadow: 'shadow-excess',
          shadowStyle: 'box-shadow: 0 20px 40px -10px rgba(147, 51, 234, 0.4), 0 10px 20px -5px rgba(147, 51, 234, 0.2)',
          hoverShadow: 'hover:shadow-excess/50',
          glow: 'hover:animate-pulse-glow hover:text-excess-600',
        };
    }
  };

  const getValueColor = () => {
    switch (type) {
      case 'revenue':
        return 'text-success-800 dark:text-success-200';
      case 'expense':
        return 'text-danger-800 dark:text-danger-200';
      case 'balance':
        return 'text-blue-800 dark:text-blue-200';
      case 'pending':
        return 'text-neutral-800 dark:text-neutral-200';
      case 'excess':
        return 'text-excess-800 dark:text-excess-200';
    }
  };

  const getProgressColor = () => {
    switch (type) {
      case 'revenue':
        return 'bg-success-500';
      case 'expense':
        return 'bg-danger-500';
      case 'balance':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-neutral-500';
      case 'excess':
        return 'bg-excess-500';
    }
  };

  const styles = getCardStyles();

  // Gerar tooltip padrão baseado no tipo se não for fornecido
  const getDefaultTooltip = () => {
    if (tooltip) return tooltip;
    
    const baseTooltip = {
      title: title,
      description: "",
      details: [] as string[],
      tip: ""
    };

    switch (type) {
      case 'revenue':
        return {
          ...baseTooltip,
          description: "Representa o total de receitas e entradas financeiras do período.",
          details: [
            "Inclui todas as transações de entrada",
            "Valores já confirmados e processados",
            "Base para cálculo de lucros"
          ],
          tip: "Valores positivos indicam crescimento financeiro"
        };
      case 'expense':
        return {
          ...baseTooltip,
          description: "Representa o total de gastos e despesas do período.",
          details: [
            "Inclui todas as transações de saída",
            "Valores já confirmados e processados",
            "Base para controle de custos"
          ],
          tip: "Monitorar para manter equilíbrio financeiro"
        };
      case 'balance':
        return {
          ...baseTooltip,
          description: "Representa o saldo atual disponível.",
          details: [
            "Diferença entre receitas e despesas",
            "Indica saúde financeira atual",
            "Base para tomada de decisões"
          ],
          tip: "Valores positivos indicam situação favorável"
        };
      case 'pending':
        return {
          ...baseTooltip,
          description: "Representa valores pendentes de confirmação.",
          details: [
            "Transações aguardando processamento",
            "Valores não confirmados ainda",
            "Requer atenção para aprovação"
          ],
          tip: "Revisar pendências regularmente"
        };
      case 'excess':
        return {
          ...baseTooltip,
          description: "Representa valores excedentes ou sobras.",
          details: [
            "Valores além do orçado",
            "Indica eficiência financeira",
            "Pode ser reinvestido ou poupado"
          ],
          tip: "Valores positivos são favoráveis"
        };
    }
  };

  const tooltipContent = getDefaultTooltip();

  if (loading) {
    return (
      <Card 
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          styles.border,
          styles.bg,
          styles.shadow,
          className
        )}
        style={{ 
          boxShadow: styles.shadowStyle,
        }}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          {progress !== undefined && (
            <div className="mt-3">
              <div className="h-2 bg-gray-200 rounded-full animate-pulse" />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const cardContent = (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300 group",
        styles.border,
        styles.bg,
        styles.shadow,
        interactive && styles.hoverShadow,
        interactive && "hover:-translate-y-1 hover:scale-[1.02]",
        className
      )}
      style={{ 
        boxShadow: styles.shadowStyle,
        ...(interactive && {
          '--tw-shadow': styles.shadowStyle,
        })
      }}
      onMouseEnter={(e) => {
        if (interactive) {
          e.currentTarget.style.boxShadow = styles.shadowStyle.replace('0.4', '0.6').replace('0.2', '0.4');
        }
      }}
      onMouseLeave={(e) => {
        if (interactive) {
          e.currentTarget.style.boxShadow = styles.shadowStyle;
        }
      }}
      role="region"
      aria-label={`Métrica: ${title}`}
      tabIndex={0}
    >
      {/* Background Pattern - MAIS PRONUNCIADO */}
      <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
        <div className="absolute top-0 right-0 w-40 h-40 transform translate-x-10 -translate-y-10">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-current via-current/50 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 w-24 h-24 transform -translate-x-6 translate-y-6 opacity-60">
          <div className="w-full h-full rounded-full bg-gradient-to-tl from-current/30 to-transparent" />
        </div>
      </div>

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <MetricIcon type={type} size="md" animated={interactive} />
      </CardHeader>
      
      <CardContent className="relative z-10">
        <div className="space-y-3">
          {/* Valor Principal */}
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

          {/* Métrica Secundária */}
          {secondaryValue !== undefined && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-muted-foreground">{secondaryLabel}</span>
              <span className={cn("font-medium", getValueColor())}>
                {typeof secondaryValue === 'number' && !isNaN(secondaryValue)
                  ? secondaryValue.toLocaleString('pt-BR') // ✅ Apenas número, sem formatação monetária
                  : secondaryValue !== undefined && secondaryValue !== null
                    ? secondaryValue
                    : '—'
                }
              </span>
            </motion.div>
          )}

          {/* Progress Bar */}
          {progress !== undefined && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="space-y-1"
            >
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progresso</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", getProgressColor())}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Envolver com tooltip se fornecido
  if (tooltipContent) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            {cardContent}
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="max-w-xs p-4 bg-background border shadow-lg"
          >
            <div className="space-y-2">
              {tooltipContent.title && (
                <h4 className="font-semibold text-sm">{tooltipContent.title}</h4>
              )}
              <p className="text-sm text-muted-foreground">
                {tooltipContent.description}
              </p>
              {tooltipContent.details && tooltipContent.details.length > 0 && (
                <ul className="text-xs text-muted-foreground space-y-1">
                  {tooltipContent.details.map((detail, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              )}
              {tooltipContent.tip && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs font-medium text-primary">
                    💡 {tooltipContent.tip}
                  </p>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (!interactive) {
    return cardContent;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ 
          duration: 0.4,
          type: "spring",
          stiffness: 100,
          damping: 15
        }}
        whileHover={{ 
          y: -4,
          transition: { duration: 0.2 }
        }}
        whileTap={{ 
          scale: 0.98,
          transition: { duration: 0.1 }
        }}
      >
        {cardContent}
      </motion.div>
    </AnimatePresence>
  );
}); 