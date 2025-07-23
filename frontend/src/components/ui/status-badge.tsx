import { Check, X, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'success' | 'error' | 'warning' | 'info' | 'loading';
  message: string;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge = ({ 
  status, 
  message, 
  className,
  showIcon = true 
}: StatusBadgeProps) => {
  const statusConfig = {
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
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
      iconColor: 'text-yellow-500'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-500'
    },
    loading: {
      icon: Check,
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-200',
      iconColor: 'text-gray-500'
    }
  };

  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200',
        config.bgColor,
        config.textColor,
        config.borderColor,
        className
      )}
    >
      {showIcon && (
        <IconComponent 
          size={16} 
          className={cn('flex-shrink-0', config.iconColor)} 
        />
      )}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}; 