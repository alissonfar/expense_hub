import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

export interface ToastProps {
  type?: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
  duration?: number;
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  type = "info",
  title,
  description,
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
        "relative glass-effect rounded-xl border shadow-xl backdrop-blur-md animate-fade-in-up",
        "p-4 max-w-sm w-full",
        type === "success" && "border-green-400/30 bg-green-500/5",
        type === "error" && "border-red-400/30 bg-red-500/5",
        type === "warning" && "border-yellow-400/30 bg-yellow-500/5",
        type === "info" && "border-blue-400/30 bg-blue-500/5",
        className
      )}
    >
      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1">
          <div className="h-full bg-white/20 rounded-t-xl overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-100 ease-linear",
                type === "success" && "bg-green-500",
                type === "error" && "bg-red-500",
                type === "warning" && "bg-yellow-500",
                type === "info" && "bg-blue-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Close button */}
      {onClose && (
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Fechar toast"
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
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}; 