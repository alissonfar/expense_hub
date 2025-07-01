import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertTriangle, Info, X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export interface NotificationAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost";
}

export interface NotificationProps {
  type?: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  actions?: NotificationAction[];
  duration?: number;
  onClose?: () => void;
  className?: string;
}

export const Notification: React.FC<NotificationProps> = ({
  type = "info",
  title,
  message,
  actions = [],
  duration = 5000,
  onClose,
  className,
}) => {
  const [isVisible, setIsVisible] = React.useState(true);
  const [progress, setProgress] = React.useState(100);
  const progressRef = React.useRef<NodeJS.Timeout>();

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const Icon = icons[type];

  React.useEffect(() => {
    if (duration > 0) {
      const startTime = Date.now();
      const endTime = startTime + duration;

      const updateProgress = () => {
        const now = Date.now();
        const remaining = Math.max(0, endTime - now);
        const newProgress = (remaining / duration) * 100;
        
        setProgress(newProgress);
        
        if (remaining > 0) {
          progressRef.current = setTimeout(updateProgress, 100);
        } else {
          handleClose();
        }
      };

      progressRef.current = setTimeout(updateProgress, 100);
    }

    return () => {
      if (progressRef.current) {
        clearTimeout(progressRef.current);
      }
    };
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "relative glass-effect rounded-xl border border-white/20 shadow-xl backdrop-blur-md animate-fade-in-up",
        "p-4 max-w-sm w-full",
        type === "success" && "border-green-400/30",
        type === "error" && "border-red-400/30",
        type === "warning" && "border-yellow-400/30",
        type === "info" && "border-blue-400/30",
        className
      )}
    >
      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1">
          <Progress value={progress} className="h-1" />
        </div>
      )}

      {/* Close button */}
      {onClose && (
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Fechar notificação"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Content */}
      <div className="flex gap-3 pr-8">
        <div className={cn(
          "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
          type === "success" && "bg-green-500/20 text-green-500",
          type === "error" && "bg-red-500/20 text-red-500",
          type === "warning" && "bg-yellow-500/20 text-yellow-500",
          type === "info" && "bg-blue-500/20 text-blue-500"
        )}>
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground mb-1">
            {title}
          </h4>
          {message && (
            <p className="text-sm text-muted-foreground mb-3">
              {message}
            </p>
          )}
          
          {/* Actions */}
          {actions.length > 0 && (
            <div className="flex gap-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "outline"}
                  size="sm"
                  onClick={action.onClick}
                  className="glass-effect border-white/20 hover:bg-white/10"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 