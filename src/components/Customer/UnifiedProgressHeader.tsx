import React from 'react';
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

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="px-4 sm:px-6 py-4">
        {/* Unified Container with consistent styling */}
        <div className="flex flex-col items-center gap-4">
          {/* Customer Type Selector */}
          <div className="w-full max-w-2xl">
            <CustomerTypeSelector
              value={customerType}
              onChange={onCustomerTypeChange}
            />
          </div>

          {/* Visual Separator */}
          <div className="w-full max-w-2xl flex items-center gap-3">
            <div className="flex-1 h-px bg-border"></div>
            <div className="text-xs text-muted-foreground font-medium">PROCESS STEPS</div>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-2xl">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Step Breadcrumbs */}
          <div className="w-full max-w-2xl flex items-center justify-center">
            <div className="flex items-center gap-2">
            {[
              { step: 1, label: 'Customer' },
              { step: 2, label: 'Service' },
              { step: 3, label: 'Details' },
              { step: 4, label: 'Review' },
            ].map(({ step, label }, index, array) => (
              <React.Fragment key={step}>
                <button
                  onClick={() => onStepClick(step)}
                  disabled={step > currentStep}
                  className={cn(
                    "group relative flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200",
                    step === currentStep && "bg-primary/10 ring-1 ring-primary/20",
                    step < currentStep && "hover:bg-muted/50 cursor-pointer",
                    step > currentStep && "opacity-40 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold transition-all duration-200",
                    step === currentStep && "bg-primary text-primary-foreground shadow-sm",
                    step < currentStep && "bg-primary/20 text-primary",
                    step > currentStep && "bg-muted text-muted-foreground"
                  )}>
                    {step < currentStep ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      step
                    )}
                  </div>
                  <span className={cn(
                    "text-xs font-medium transition-colors duration-200",
                    step === currentStep && "text-primary",
                    step < currentStep && "text-foreground",
                    step > currentStep && "text-muted-foreground"
                  )}>
                    {label}
                  </span>
                </button>

                {index < array.length - 1 && (
                  <ChevronRight className={cn(
                    "h-4 w-4 transition-colors duration-200",
                    step < currentStep ? "text-primary" : "text-muted-foreground/40"
                  )} />
                )}
              </React.Fragment>
            ))}
            </div>
          </div>
        </div>

        {/* Current Step Description */}
        <div className="text-center pt-3 mt-3 border-t border-border/50">
          <h2 className="text-sm font-bold text-foreground leading-tight">
            {currentStep === 2 && 'Service Selection'}
            {currentStep === 3 && 'Service Details'}
            {currentStep === 4 && 'Confirmation'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {currentStep === 2 && 'Select the service or product type'}
            {currentStep === 3 && 'Provide additional service information'}
            {currentStep === 4 && 'Review all details before submitting'}
          </p>
        </div>
      </div>
    </div>
  );
};
