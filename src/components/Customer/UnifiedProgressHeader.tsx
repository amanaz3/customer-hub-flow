import React, { useLayoutEffect, useRef } from 'react';
import { Check, ChevronRight, User, Package, FileText, CheckCircle } from 'lucide-react';
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
  { title: 'Customer', desc: 'Select type', icon: User },
  { title: 'Service', desc: 'Choose service', icon: Package },
  { title: 'Details', desc: 'Additional info', icon: FileText },
  { title: 'Submit', desc: 'Review & send', icon: CheckCircle }
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
    <div ref={containerRef} className="sticky top-0 left-0 right-0 bg-white backdrop-blur-xl z-[100] border-b border-slate-200 shadow-sm">
      <div className="w-full max-w-2xl mx-auto">
        <div className="px-4 sm:px-6 py-5 bg-gradient-to-b from-slate-50 to-transparent rounded-t-2xl">
        {/* Unified Container with consistent styling */}
        <div className="flex flex-col items-center gap-4">
          {/* Customer Type Selector */}
          <div className="w-full max-w-2xl">
            <div className="text-center mb-3">
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">Customer Selection</h3>
              <p className="text-sm text-slate-600 mt-1.5 font-medium">Choose whether to create a new customer or select an existing one</p>
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
            {stepConfig.map(({ title, desc, icon: Icon }, index) => {
              const step = index + 1;
              const isCompleted = step < currentStep;
              const isActive = step === currentStep;
              const isDisabled = step > currentStep;
              
              return (
                <button
                  key={step}
                  onClick={() => onStepClick(step)}
                  disabled={isDisabled}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1 px-6 py-3 transition-all duration-300",
                    "first:pl-4 last:pr-4",
                    "group",
                    isActive && "z-10 scale-110",
                    isDisabled && "opacity-50 cursor-not-allowed",
                    !isDisabled && "hover:scale-105 hover:z-20"
                  )}
                  style={{
                    clipPath: index === 0 
                      ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
                      : index === 3
                      ? 'polygon(12px 0, 100% 0, 100% 100%, 12px 100%, 0 50%)'
                      : 'polygon(12px 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0 50%)',
                    backgroundColor: isCompleted
                      ? 'hsl(var(--success))' 
                      : isActive
                      ? 'hsl(var(--primary))' 
                      : '#f1f5f9',
                    boxShadow: isActive 
                      ? '0 6px 12px -3px hsl(var(--primary) / 0.4), 0 3px 6px -2px hsl(var(--primary) / 0.3)' 
                      : isCompleted
                      ? '0 2px 4px -1px rgba(0, 0, 0, 0.1)'
                      : 'none',
                    animation: isCompleted ? 'bounce 0.5s ease-out' : 'none'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold shadow-sm transition-transform",
                      isCompleted && "bg-white text-green-600",
                      isActive && "bg-white text-blue-600 scale-110",
                      isDisabled && "bg-slate-100 text-slate-400"
                    )}>
                      {isCompleted ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Icon className="h-3 w-3" />
                      )}
                    </div>
                    <span className={cn(
                      "text-xs font-semibold whitespace-nowrap transition-colors",
                      isCompleted && "text-white",
                      isActive && "text-white",
                      isDisabled && "text-slate-500"
                    )}>
                      {title}
                    </span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium whitespace-nowrap transition-opacity",
                    isCompleted && "text-white/90",
                    isActive && "text-white/90",
                    isDisabled && "text-slate-400"
                  )}>
                    {desc}
                  </span>
                </button>
              );
            })}
             </div>
           </div>
         </div>
       </div>
      </div>
    </div>
  );
};
