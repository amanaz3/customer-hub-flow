import React, { useLayoutEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabbedCustomerProgressHeaderProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
}

export const TabbedCustomerProgressHeader = ({
  currentStep,
  totalSteps,
  onStepClick = () => {}
}: TabbedCustomerProgressHeaderProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useLayoutEffect(() => {
    const update = () => {
      const h = containerRef.current?.offsetHeight || 0;
      document.documentElement.style.setProperty('--tabbed-header-h', `${h}px`);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div ref={containerRef} className="w-full bg-card border border-border p-4 shadow-sm space-y-3 rounded-none">
      {/* Progress Bar - Continuous */}
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
        />
      </div>

      {/* Step Breadcrumbs - Arrow Style */}
      <div className="flex items-center justify-center w-full overflow-hidden">
        <div className="flex items-center w-full max-w-2xl">
          {[
            { step: 1, label: 'Customer' },
            { step: 2, label: 'Service' },
            { step: 3, label: 'Details' },
            { step: 4, label: 'Review' },
          ].map(({ step, label }, index) => (
            <button
              key={step}
              onClick={() => onStepClick(step)}
              disabled={step > currentStep}
              className={cn(
                "relative flex-1 flex items-center justify-center gap-2 px-3 sm:px-6 py-2.5 transition-all duration-300 group min-w-0",
                step === currentStep && "z-10 shadow-lg",
                step > currentStep && "opacity-50 cursor-not-allowed",
                step < currentStep && "hover:brightness-110",
                // Past steps - emerald/green for completed
                step < currentStep && "bg-emerald-500",
                // Current step - primary with glow
                step === currentStep && "bg-primary ring-2 ring-primary/30 ring-offset-1 ring-offset-background",
                // Future steps - muted
                step > currentStep && "bg-muted"
              )}
              style={{
                clipPath: index === 0 
                  ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
                  : index === 3
                  ? 'polygon(12px 0, 100% 0, 100% 100%, 12px 100%, 0 50%)'
                  : 'polygon(12px 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0 50%)',
              }}
            >
              <div className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shadow-md transition-all border-2",
                // Past steps - white bg with green text
                step < currentStep && "bg-white text-emerald-600 border-white",
                // Current step - white bg with primary text + pulse ring
                step === currentStep && "bg-white text-primary border-white animate-pulse",
                // Future steps - muted
                step > currentStep && "bg-muted-foreground/20 text-muted-foreground border-muted"
              )}>
                {step < currentStep ? (
                  <Check className="h-3.5 w-3.5 animate-scale-in" />
                ) : (
                  step
                )}
              </div>
              <span className={cn(
                "text-sm font-bold whitespace-nowrap transition-all drop-shadow-sm",
                step < currentStep && "text-white",
                step === currentStep && "text-primary-foreground",
                step > currentStep && "text-muted-foreground"
              )}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
