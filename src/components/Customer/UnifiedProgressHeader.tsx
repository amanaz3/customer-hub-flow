import { Check } from 'lucide-react';
import { CustomerTypeSelector } from './CustomerTypeSelector';

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
  onCustomerTypeChange
}: UnifiedProgressHeaderProps) => {
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      {/* Progress Bar */}
      <div className="h-1 bg-muted">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="px-4 sm:px-6 py-3 space-y-3">
        {/* Customer Type Selector - Full width row */}
        <div className="flex justify-center">
          <div className="w-full max-w-sm">
            <CustomerTypeSelector
              value={customerType}
              onChange={onCustomerTypeChange}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/30"></div>

        {/* Step Breadcrumbs - Full width row */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 overflow-x-auto">
            {stepConfig.map((step, index) => {
              const stepNumber = index + 1;
              const isActive = currentStep === stepNumber;
              const isCompleted = currentStep > stepNumber;
              const isLast = index === stepConfig.length - 1;
              
              return (
                <div key={stepNumber} className="flex items-center flex-shrink-0">
                  <div className={`flex items-center gap-2 transition-all duration-300 ${
                    isActive ? 'scale-105' : ''
                  }`}>
                    {/* Step Circle */}
                    <div className={`flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-primary text-primary-foreground' 
                        : isActive 
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
                    </div>
                    
                    {/* Step Label - Show only for active step on mobile */}
                    <div className={`${isActive ? 'block' : 'hidden lg:block'}`}>
                      <div className={`text-xs font-semibold leading-none whitespace-nowrap ${
                        isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {step.title}
                      </div>
                      <div className={`text-[10px] leading-none mt-0.5 whitespace-nowrap ${
                        isActive || isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/60'
                      }`}>
                        {step.desc}
                      </div>
                    </div>
                  </div>
                  
                  {/* Connector Line */}
                  {!isLast && (
                    <div className={`h-0.5 w-6 lg:w-8 mx-1 transition-all duration-300 ${
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Step Title & Description */}
        <div className="text-center pt-2 border-t border-border/30">
          <h2 className="text-sm font-bold text-foreground leading-tight">
            {currentStep === 1 && 'Customer Selection'}
            {currentStep === 2 && 'Service Selection'}
            {currentStep === 3 && 'Service Details'}
            {currentStep === 4 && 'Confirmation'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {currentStep === 1 && 'Choose between new or existing customer'}
            {currentStep === 2 && 'Select the service or product type'}
            {currentStep === 3 && 'Provide additional service information'}
            {currentStep === 4 && 'Review all details before submitting'}
          </p>
        </div>
      </div>
    </div>
  );
};
