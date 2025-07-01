import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, Circle } from "lucide-react";

export interface Step {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepClick,
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isPending = index > currentStep;

          return (
            <React.Fragment key={step.id}>
              {/* Step */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => onStepClick?.(index)}
                  disabled={!onStepClick}
                  className={cn(
                    "relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                    isCompleted && "bg-primary text-white shadow-lg",
                    isActive && "bg-primary/20 border-2 border-primary text-primary",
                    isPending && "bg-muted text-muted-foreground",
                    onStepClick && "hover:scale-110 cursor-pointer",
                    !onStepClick && "cursor-default"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6 animate-bounce" />
                  ) : step.icon ? (
                    <span className="w-6 h-6">{step.icon}</span>
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </button>
                
                {/* Step Info */}
                <div className="mt-2 text-center max-w-24">
                  <div className={cn(
                    "text-sm font-medium",
                    isCompleted && "text-primary",
                    isActive && "text-primary",
                    isPending && "text-muted-foreground"
                  )}>
                    {step.title}
                  </div>
                  {step.description && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Connector */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-4 relative">
                  <div className="absolute inset-0 bg-muted rounded-full" />
                  <div
                    className={cn(
                      "absolute inset-0 bg-primary rounded-full transition-all duration-500",
                      isCompleted ? "w-full" : "w-0"
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}; 