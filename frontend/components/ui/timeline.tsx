import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  date?: string;
  status?: "completed" | "pending" | "error" | "warning";
  icon?: React.ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  variant?: "default" | "compact";
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({
  items,
  variant = "default",
  className,
}) => {
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <div className="w-5 h-5 rounded-full bg-muted" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "completed":
        return "border-green-500 bg-green-500/10";
      case "pending":
        return "border-yellow-500 bg-yellow-500/10";
      case "error":
        return "border-red-500 bg-red-500/10";
      case "warning":
        return "border-orange-500 bg-orange-500/10";
      default:
        return "border-muted bg-muted/10";
    }
  };

  return (
    <div className={cn("relative", className)}>
      {items.map((item, index) => (
        <div key={item.id} className="relative flex gap-4">
          {/* Timeline Line */}
          {index < items.length - 1 && (
            <div className="absolute left-6 top-10 w-0.5 h-full bg-gradient-to-b from-primary/50 to-transparent" />
          )}
          
          {/* Icon */}
          <div className={cn(
            "relative z-10 flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center glass-effect",
            getStatusColor(item.status)
          )}>
            {item.icon || getStatusIcon(item.status)}
          </div>
          
          {/* Content */}
          <div className={cn(
            "flex-1 pb-8",
            variant === "compact" && "pb-4"
          )}>
            <div className="glass-effect rounded-lg p-4 border border-white/20 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </div>
                {item.date && (
                  <span className="text-xs text-muted-foreground ml-4">
                    {item.date}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 