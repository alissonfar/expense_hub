import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: "default" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  label?: string;
  showValue?: boolean;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ 
    value, 
    max = 100, 
    variant = "default", 
    size = "md", 
    label, 
    showValue = false,
    className, 
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const variantClasses = {
      default: "bg-primary",
      success: "bg-green-500",
      warning: "bg-yellow-500",
      error: "bg-red-500",
    };

    const sizeClasses = {
      sm: "h-2",
      md: "h-3",
      lg: "h-4",
    };

    const labelSizeClasses = {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
    };

    return (
      <div ref={ref} className={cn("w-full space-y-2", className)} {...props}>
        {(label || showValue) && (
          <div className="flex items-center justify-between">
            {label && (
              <span className={cn("font-medium text-foreground", labelSizeClasses[size])}>
                {label}
              </span>
            )}
            {showValue && (
              <span className={cn("text-muted-foreground", labelSizeClasses[size])}>
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        )}
        
        <div className={cn(
          "relative w-full rounded-full bg-muted/30 overflow-hidden glass-effect",
          sizeClasses[size]
        )}>
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden",
              variantClasses[variant]
            )}
            style={{ width: `${percentage}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>
    );
  }
);
Progress.displayName = "Progress"; 