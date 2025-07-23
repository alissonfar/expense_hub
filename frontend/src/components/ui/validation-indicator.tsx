import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationIndicatorProps {
  isValid: boolean | null; // null = não validado, true = válido, false = inválido
  message?: string;
  showMessage?: boolean;
  className?: string;
}

export const ValidationIndicator = ({ 
  isValid, 
  message, 
  showMessage = true,
  className 
}: ValidationIndicatorProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isValid !== null) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isValid]);

  if (isValid === null || !isVisible) return null;

  const config = {
    success: {
      icon: Check,
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      iconColor: 'text-green-500'
    },
    error: {
      icon: X,
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      iconColor: 'text-red-500'
    }
  };

  const status = isValid ? 'success' : 'error';
  const statusConfig = config[status];
  const IconComponent = statusConfig.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300 animate-in slide-in-from-top-2',
        statusConfig.bgColor,
        statusConfig.textColor,
        statusConfig.borderColor,
        className
      )}
    >
      <IconComponent 
        size={16} 
        className={cn('flex-shrink-0', statusConfig.iconColor)} 
      />
      {showMessage && message && (
        <span className="text-sm font-medium">{message}</span>
      )}
    </div>
  );
}; 