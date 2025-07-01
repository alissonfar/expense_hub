import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ variant = "default", size = "md", icon, children, className, ...props }, ref) => {
    const variantClasses = {
      default: "bg-primary text-primary-foreground border-primary/20",
      secondary: "bg-muted text-muted-foreground border-muted/20",
      destructive: "bg-red-500 text-white border-red-500/20",
      outline: "border border-primary text-primary bg-transparent",
      success: "bg-green-500 text-white border-green-500/20",
      warning: "bg-yellow-500 text-white border-yellow-500/20",
    };

    const sizeClasses = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-3 py-1 text-sm",
      lg: "px-4 py-2 text-base",
    };

    const iconSizeClasses = {
      sm: "w-3 h-3",
      md: "w-4 h-4",
      lg: "w-5 h-5",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border font-medium transition-all duration-200 hover:scale-105 glass-effect backdrop-blur-sm",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {icon && (
          <span className={cn("flex-shrink-0", iconSizeClasses[size])}>
            {icon}
          </span>
        )}
        {children}
      </div>
    );
  }
);
Badge.displayName = "Badge"; 