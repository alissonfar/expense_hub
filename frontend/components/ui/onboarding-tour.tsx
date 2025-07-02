import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TourStep {
  title: string;
  description: string;
  targetRef: React.RefObject<HTMLElement>;
}

interface OnboardingTourProps {
  steps: TourStep[];
  open: boolean;
  onClose: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ steps, open, onClose }) => {
  const [current, setCurrent] = useState(0);
  if (!open || steps.length === 0) return null;

  const step = steps[current];
  const target = step.targetRef.current;
  const rect = target?.getBoundingClientRect();

  return (
    <div className="fixed inset-0 z-[1000]">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* Tooltip */}
      {rect && (
        <div
          className={cn(
            "absolute bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 border border-primary/30 max-w-xs transition-all",
            "animate-fade-in-up"
          )}
          style={{
            top: rect.bottom + 12,
            left: rect.left + rect.width / 2 - 160,
            width: 320,
          }}
        >
          <h4 className="font-bold text-lg mb-1 text-primary">{step.title}</h4>
          <p className="text-muted-foreground mb-3">{step.description}</p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={onClose}>Sair</Button>
            {current > 0 && (
              <Button variant="secondary" size="sm" onClick={() => setCurrent(current - 1)}>Anterior</Button>
            )}
            {current < steps.length - 1 ? (
              <Button size="sm" onClick={() => setCurrent(current + 1)}>Próximo</Button>
            ) : (
              <Button size="sm" onClick={onClose}>Finalizar</Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 