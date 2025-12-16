import React from 'react';
import { useWebflow } from '@/contexts/WebflowContext';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  { id: 1, name: 'Country' },
  { id: 2, name: 'Intent' },
  { id: 3, name: 'Jurisdiction' },
  { id: 4, name: 'Activity' },
  { id: 5, name: 'Plan' },
  { id: 6, name: 'Payment' },
  { id: 7, name: 'Details' },
  { id: 8, name: 'Tax Setup' },
  { id: 9, name: 'Dashboard' },
];

export const WebflowProgress: React.FC = () => {
  const { state, goToStep } = useWebflow();

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = state.completedSteps.includes(step.id);
          const isCurrent = state.currentStep === step.id;
          const isAccessible = step.id <= Math.max(...state.completedSteps, state.currentStep);

          return (
            <div key={step.id} className="contents">
              <button
                onClick={() => isAccessible && goToStep(step.id)}
                disabled={!isAccessible}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all",
                  isAccessible ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && !isCompleted && "bg-primary/20 text-primary border-2 border-primary",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                </div>
                <span className={cn(
                  "text-xs hidden sm:block",
                  isCurrent ? "text-primary font-medium" : "text-muted-foreground"
                )}>
                  {step.name}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-1",
                  isCompleted ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
