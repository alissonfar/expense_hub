import { useState, useEffect } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuccessFeedbackProps {
  message: string;
  description?: string;
  showSparkles?: boolean;
  autoHide?: boolean;
  duration?: number;
  className?: string;
}

export const SuccessFeedback = ({ 
  message, 
  description,
  showSparkles = true,
  autoHide = true,
  duration = 3000,
  className 
}: SuccessFeedbackProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    setShowAnimation(true);
    
    if (autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 transition-all duration-500',
        showAnimation ? 'animate-in slide-in-from-top-2 fade-in' : '',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <Check size={16} className="text-white" />
          </div>
        </div>
        
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-green-800 mb-1">
            {message}
          </h4>
          {description && (
            <p className="text-sm text-green-700">{description}</p>
          )}
        </div>
        
        {showSparkles && (
          <div className="flex-shrink-0 animate-pulse">
            <Sparkles size={16} className="text-green-400" />
          </div>
        )}
      </div>
    </div>
  );
}; 