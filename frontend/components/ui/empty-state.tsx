import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}) => (
  <div className={cn(
    "flex flex-col items-center justify-center p-8 rounded-2xl bg-white/60 dark:bg-gray-900/60 shadow-lg backdrop-blur-md border border-white/20 gap-3",
    className
  )}>
    {icon && <div className="mb-2 text-primary text-4xl">{icon}</div>}
    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 text-center">{title}</h3>
    {description && <p className="text-muted-foreground text-center mb-2">{description}</p>}
    {actionLabel && onAction && (
      <Button onClick={onAction} className="mt-2">{actionLabel}</Button>
    )}
  </div>
); 