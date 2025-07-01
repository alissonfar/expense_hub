import * as React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  trend,
  className,
}) => {
  const getTrendIcon = () => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getChangeColor = () => {
    if (trend === "up") return "text-green-500";
    if (trend === "down") return "text-red-500";
    return "text-gray-500";
  };

  return (
    <div
      className={cn(
        "relative p-6 rounded-xl glass-effect border border-white/20 shadow-lg overflow-hidden group hover:scale-105 transition-all duration-300 animate-fade-in-up",
        className
      )}
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            {title}
          </h3>
          {icon && (
            <div className="p-2 rounded-lg bg-primary/10 text-primary animate-pulse">
              {icon}
            </div>
          )}
        </div>
        
        <div className="flex items-end justify-between">
          <div className="text-3xl font-bold text-foreground">
            {value}
          </div>
          
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              getChangeColor()
            )}>
              {getTrendIcon()}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 