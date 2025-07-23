import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PulseProps {
  color?: 'blue' | 'green' | 'red' | 'yellow';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Pulse = ({ color = 'blue', size = 'md', className }: PulseProps) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500'
  };

  return (
    <div
      className={cn(
        'rounded-full animate-pulse',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  );
};

interface ShimmerProps {
  className?: string;
  children: React.ReactNode;
}

export const Shimmer = ({ className, children }: ShimmerProps) => {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {children}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
};

interface BounceProps {
  delay?: number;
  children: React.ReactNode;
  className?: string;
}

export const Bounce = ({ delay = 0, children, className }: BounceProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        'transition-all duration-500',
        isVisible ? 'animate-in bounce-in' : 'opacity-0 scale-95',
        className
      )}
    >
      {children}
    </div>
  );
};

interface FadeInProps {
  delay?: number;
  children: React.ReactNode;
  className?: string;
}

export const FadeIn = ({ delay = 0, children, className }: FadeInProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        'transition-all duration-700',
        isVisible ? 'animate-in fade-in slide-in-from-bottom-2' : 'opacity-0 translate-y-4',
        className
      )}
    >
      {children}
    </div>
  );
}; 