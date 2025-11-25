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
    <div ref={containerRef} className="sticky top-0 left-0 right-0 bg-gradient-to-br from-background via-white to-purple-50/30 backdrop-blur-xl z-[100] border-b border-border shadow-md">
      <div className="w-full px-4 sm:px-6">
        <div className="py-2 bg-gradient-to-b from-white/50 to-transparent rounded-t-2xl">
        {/* Unified Container with consistent styling */}
        <div className="flex flex-col items-center gap-4">
          {/* Customer Type Selector */}
          <div className="w-full">
            <div className="text-center mb-3">
              <h3 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">Customer Selection</h3>
              <p className="text-sm text-muted-foreground mt-0.5 font-medium">Choose whether to create a new customer or select an existing one</p>
            </div>
            <CustomerTypeSelector
              value={customerType}
              onChange={onCustomerTypeChange}
            />
          </div>

          {/* Progress Bar & Step Breadcrumbs in Card */}
          <div className="w-full">
            <div className="bg-card border border-border p-4 shadow-sm space-y-3 rounded-none">
              {/* Progress Bar - Segmented */}
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((step) => (
                  <div 
                    key={step}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors duration-300",
                      step <= currentStep ? "bg-primary" : "bg-muted"
                    )}
                  />
                ))}
              </div>

              {/* Step Breadcrumbs - Arrow Style */}
              <div className="flex items-center justify-center">
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
                      "relative flex items-center gap-2 px-6 py-2.5 transition-all duration-300 group",
                      "first:pl-4 last:pr-4",
                      step === currentStep && "z-10 scale-105",
                      step > currentStep && "opacity-60 cursor-not-allowed",
                      step < currentStep && "hover:scale-105"
                    )}
                    style={{
                      clipPath: index === 0 
                        ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
                        : index === 3
                        ? 'polygon(12px 0, 100% 0, 100% 100%, 12px 100%, 0 50%)'
                        : 'polygon(12px 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0 50%)',
                      backgroundColor: step < currentStep 
                        ? '#059669'
                        : step === currentStep 
                        ? '#1d4ed8'
                        : '#d1d5db'
                    }}
                  >
                    <div className={cn(
                      "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shadow-md transition-all border-2",
                      step < currentStep && "bg-white text-emerald-700 border-white",
                      step === currentStep && "bg-white text-blue-800 border-white ring-2 ring-white/50",
                      step > currentStep && "bg-gray-100 text-gray-500 border-gray-200"
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
                      step === currentStep && "text-white",
                      step > currentStep && "text-gray-600"
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
      </div>
    </div>
  );
};
