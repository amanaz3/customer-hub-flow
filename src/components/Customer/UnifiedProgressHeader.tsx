import React, { useLayoutEffect, useRef } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { CustomerTypeSelector } from './CustomerTypeSelector';
import { cn } from '@/lib/utils';

interface UnifiedProgressHeaderProps {
  currentStep: number;
  totalSteps: number;
  customerName?: string;
  customerEmail?: string;
  customerMobile?: string;
  customerWhatsapp?: string;
  customerCountry?: string;
  selectedProduct?: string;
  customerType: 'new' | 'existing';
  onCustomerTypeChange: (type: 'new' | 'existing') => void;
  onStepClick?: (step: number) => void;
}

const stepConfig = [
  { title: 'Customer', desc: 'Select type' },
  { title: 'Service', desc: 'Choose service' },
  { title: 'Details', desc: 'Additional info' },
  { title: 'Submit', desc: 'Review & send' }
];

export const UnifiedProgressHeader = ({
  currentStep,
  totalSteps,
  customerName,
  customerEmail,
  customerMobile,
  customerWhatsapp,
  customerCountry,
  selectedProduct,
  customerType,
  onCustomerTypeChange,
  onStepClick = () => {} // Default no-op handler
}: UnifiedProgressHeaderProps) => {
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const update = () => {
      const h = containerRef.current?.offsetHeight || 0;
      document.documentElement.style.setProperty('--unified-header-h', `${h}px`);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div ref={containerRef} className="sticky top-0 left-0 right-0 bg-white/95 backdrop-blur-xl z-[100] border-b border-slate-200/50 shadow-sm">
      <div className="w-full max-w-2xl mx-auto">
        <div className="px-4 sm:px-6 py-5 bg-gradient-to-b from-slate-50/50 to-transparent rounded-t-2xl">
        {/* Unified Container with consistent styling */}
        <div className="flex flex-col items-center gap-4">
          {/* Customer Type Selector */}
          <div className="w-full max-w-2xl">
            <div className="text-center mb-3">
              <h3 className="text-base font-semibold text-foreground tracking-tight">Customer Selection</h3>
              <p className="text-sm text-muted-foreground/80 mt-1.5 font-medium">Choose whether to create a new customer or select an existing one</p>
            </div>
            <CustomerTypeSelector
              value={customerType}
              onChange={onCustomerTypeChange}
            />
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-2xl">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-primary via-primary to-primary/80 transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Step Breadcrumbs - Arrow Style */}
          <div className="w-full max-w-2xl flex items-center justify-center">
            <div className="flex items-center -space-x-2">
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
                  "relative flex items-center gap-2 px-6 py-2.5 transition-all duration-200",
                  "first:pl-4 last:pr-4",
                  step === currentStep && "z-10",
                  step > currentStep && "opacity-50 cursor-not-allowed"
                )}
                style={{
                  clipPath: index === 0 
                    ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
                    : index === 3
                    ? 'polygon(12px 0, 100% 0, 100% 100%, 12px 100%, 0 50%)'
                    : 'polygon(12px 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0 50%)',
                  backgroundColor: step < currentStep 
                    ? 'hsl(var(--success))' // green for completed steps
                    : step === currentStep 
                    ? 'hsl(var(--primary))' 
                    : '#f1f5f9', // slate-100 for inactive
                  boxShadow: step === currentStep ? '0 4px 8px -2px hsl(var(--primary) / 0.3)' : 'none'
                }}
              >
                <div className={cn(
                  "flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold shadow-sm",
                  step < currentStep && "bg-success-foreground text-success",
                  step === currentStep && "bg-primary-foreground text-primary",
                  step > currentStep && "bg-slate-100 text-slate-400"
                )}>
                  {step < currentStep ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    step
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium whitespace-nowrap",
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
       </div>
      </div>
    </div>
  );
};
