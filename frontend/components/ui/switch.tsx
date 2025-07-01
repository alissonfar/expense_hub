import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  icons?: {
    checked?: React.ReactNode;
    unchecked?: React.ReactNode;
  };
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  disabled = false,
  size = "md",
  icons,
  className,
}) => {
  const sizeClasses = {
    sm: "w-8 h-4",
    md: "w-12 h-6",
    lg: "w-16 h-8",
  };

  const thumbSizeClasses = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  const iconSizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked
          ? "bg-primary shadow-lg"
          : "bg-muted border border-white/20",
        sizeClasses[size],
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out",
          checked ? "translate-x-full" : "translate-x-0",
          thumbSizeClasses[size]
        )}
      >
        {/* Icons */}
        {icons && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={cn(
                "transition-opacity duration-200",
                checked ? "opacity-100" : "opacity-0",
                iconSizeClasses[size]
              )}
            >
              {icons.checked}
            </div>
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-opacity duration-200",
                checked ? "opacity-0" : "opacity-100",
                iconSizeClasses[size]
              )}
            >
              {icons.unchecked}
            </div>
          </div>
        )}
      </span>
    </button>
  );
}; 