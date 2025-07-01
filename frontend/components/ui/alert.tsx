import * as React from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
  onClose?: () => void;
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ type = "info", title, description, onClose, className, ...props }, ref) => {
    const Icon = icons[type];
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex items-start gap-4 rounded-xl p-4 border shadow-lg glass-effect backdrop-blur-md animate-fade-in-up",
          type === "success" && "border-green-400 bg-green-50/60 dark:bg-green-900/30",
          type === "error" && "border-red-400 bg-red-50/60 dark:bg-red-900/30",
          type === "warning" && "border-yellow-400 bg-yellow-50/60 dark:bg-yellow-900/30",
          type === "info" && "border-blue-400 bg-blue-50/60 dark:bg-blue-900/30",
          className
        )}
        {...props}
      >
        <span className={cn(
          "flex-shrink-0 mt-1 animate-bounce",
          type === "success" && "text-green-500",
          type === "error" && "text-red-500",
          type === "warning" && "text-yellow-500",
          type === "info" && "text-blue-500"
        )}>
          <Icon className="h-6 w-6" />
        </span>
        <div className="flex-1">
          <div className="font-bold text-base mb-0.5">
            {title}
          </div>
          {description && (
            <div className="text-sm text-muted-foreground">
              {description}
            </div>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 rounded-full p-1 hover:bg-muted/30 transition"
            aria-label="Fechar alerta"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);
Alert.displayName = "Alert"; 