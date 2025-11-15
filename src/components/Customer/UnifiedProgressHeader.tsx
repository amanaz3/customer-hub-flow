import { Check, ChevronDown, User, Mail, Phone, MessageSquare, Globe } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface UnifiedProgressHeaderProps {
  currentStep: number;
  totalSteps: number;
  customerName?: string;
  customerEmail?: string;
  customerMobile?: string;
  customerWhatsapp?: string;
  customerCountry?: string;
  selectedProduct?: string;
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
        {/* Step Breadcrumbs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            {stepConfig.map((step, index) => {
              const stepNumber = index + 1;
              const isActive = currentStep === stepNumber;
              const isCompleted = currentStep > stepNumber;
              const isLast = index === stepConfig.length - 1;
              
              return (
                <div key={stepNumber} className="flex items-center">
                  <div className={`flex items-center gap-2 transition-all duration-300 ${
                    isActive ? 'scale-110' : ''
                  }`}>
                    {/* Step Circle */}
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-primary text-primary-foreground' 
                        : isActive 
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {isCompleted ? <Check className="h-4 w-4" /> : stepNumber}
                    </div>
                    
                    {/* Step Label - Hidden on mobile for non-active steps */}
                    <div className={`${isActive ? 'block' : 'hidden sm:block'}`}>
                      <div className={`text-xs font-semibold leading-none ${
                        isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {step.title}
                      </div>
                      <div className={`text-[10px] leading-none mt-0.5 ${
                        isActive || isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/60'
                      }`}>
                        {step.desc}
                      </div>
                    </div>
                  </div>
                  
                  {/* Connector Line */}
                  {!isLast && (
                    <div className={`h-0.5 w-8 sm:w-12 mx-1 transition-all duration-300 ${
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Customer Info Summary - Show after step 1 */}
          {currentStep > 1 && customerName && (
            <div className="flex-shrink-0 ml-4">
              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] bg-muted/30 hover:bg-muted/50 border border-border rounded-md transition-colors group">
                  <User className="h-3 w-3 text-primary" />
                  <span className="font-semibold text-foreground hidden sm:inline">{customerName}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="absolute right-4 mt-1 px-3 py-2 text-[11px] bg-card border border-border rounded-md shadow-lg z-10 min-w-[250px]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 pb-1 border-b border-border">
                      <User className="h-3 w-3 text-primary" />
                      <span className="font-semibold text-foreground">{customerName}</span>
                    </div>
                    {customerEmail && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-primary" />
                        <span className="text-muted-foreground font-medium w-16">Email:</span>
                        <span className="text-foreground">{customerEmail}</span>
                      </div>
                    )}
                    {customerMobile && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-primary" />
                        <span className="text-muted-foreground font-medium w-16">Mobile:</span>
                        <span className="text-foreground">{customerMobile}</span>
                      </div>
                    )}
                    {customerWhatsapp && (
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="h-3 w-3 text-primary" />
                        <span className="text-muted-foreground font-medium w-16">WhatsApp:</span>
                        <span className="text-foreground">{customerWhatsapp}</span>
                      </div>
                    )}
                    {customerCountry && (
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-3 w-3 text-primary" />
                        <span className="text-muted-foreground font-medium w-16">Country:</span>
                        <span className="text-foreground">{customerCountry}</span>
                      </div>
                    )}
                    {selectedProduct && (
                      <div className="flex items-start gap-1.5 pt-1 border-t border-border">
                        <span className="text-muted-foreground font-medium">Service:</span>
                        <span className="text-foreground flex-1">{selectedProduct}</span>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </div>

        {/* Current Step Title & Description */}
        <div>
          <h2 className="text-sm sm:text-base font-bold text-foreground leading-tight">
            {currentStep === 1 && 'Customer Selection'}
            {currentStep === 2 && 'Service Selection'}
            {currentStep === 3 && 'Service Details'}
            {currentStep === 4 && 'Confirmation'}
          </h2>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
            {currentStep === 1 && 'Choose customer type and provide customer information'}
            {currentStep === 2 && 'Select the service and specify the application amount'}
            {currentStep === 3 && 'Provide additional details specific to the selected service'}
            {currentStep === 4 && 'Review all information before submitting'}
          </p>
        </div>
      </div>
    </div>
  );
};
