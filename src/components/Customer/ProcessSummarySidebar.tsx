import { useState } from 'react';
import { Check, Circle, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProcessStep {
  step: number;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
}

interface ProcessSummarySidebarProps {
  currentStep: number;
  formData: {
    name?: string;
    email?: string;
    mobile?: string;
    product_id?: string;
    amount?: number;
    license_type?: string;
    company?: string;
    [key: string]: any; // Allow dynamic fields
  };
  productName?: string;
  fieldLabelMap?: Record<string, string>;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  selectedCustomerData?: {
    name: string;
    email: string;
    mobile: string;
    company?: string;
    reference_number?: number;
    [key: string]: any;
  } | null;
  companyMode?: boolean;
}

export const ProcessSummarySidebar = ({
  currentStep,
  formData,
  productName,
  fieldLabelMap = {},
  isCollapsed: externalCollapsed,
  onToggleCollapse,
  selectedCustomerData,
  companyMode
}: ProcessSummarySidebarProps) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = externalCollapsed ?? internalCollapsed;
  
  const handleToggle = () => {
    const newState = !isCollapsed;
    if (onToggleCollapse) {
      onToggleCollapse(newState);
    } else {
      setInternalCollapsed(newState);
    }
  };

  // Use selected customer data if in company mode, otherwise use form data
  const customerName = companyMode && selectedCustomerData ? selectedCustomerData.name : formData.name;
  const customerEmail = companyMode && selectedCustomerData ? selectedCustomerData.email : formData.email;
  const customerMobile = companyMode && selectedCustomerData ? selectedCustomerData.mobile : formData.mobile;
  const customerCompany = companyMode && selectedCustomerData ? selectedCustomerData.company : formData.company;
  const customerReference = companyMode && selectedCustomerData?.reference_number ? selectedCustomerData.reference_number : null;
  const steps: ProcessStep[] = [
    {
      step: 1,
      title: 'Quick Info',
      description: 'Basic contact details',
      completed: currentStep > 1,
      active: currentStep === 1
    },
    {
      step: 2,
      title: 'Service',
      description: 'Select service type',
      completed: currentStep > 2,
      active: currentStep === 2
    },
    {
      step: 3,
      title: 'Details',
      description: 'Additional information',
      completed: currentStep > 3,
      active: currentStep === 3
    },
    {
      step: 4,
      title: 'Submit',
      description: 'Review and confirm',
      completed: false,
      active: currentStep === 4
    }
  ];

  return (
    <div 
      className={cn(
        "fixed top-14 sm:top-16 left-0 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] bg-card border-r shadow-lg transition-all duration-300 ease-in-out z-[99999]",
        isCollapsed ? 'w-12' : 'w-80'
      )}
    >
      {/* Toggle Button - Always Visible */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        className={cn(
          "fixed top-20 sm:top-24 h-9 w-9 rounded-full border-2 bg-card shadow-lg hover:bg-accent transition-all duration-300 z-[100000]",
          isCollapsed ? 'left-12' : 'left-80'
        )}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>

      {/* Collapsed State */}
      {isCollapsed && (
        <div className="flex flex-col items-center py-3 gap-3">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <Badge variant="secondary" className="writing-mode-vertical text-[9px] px-0.5 py-1.5 font-medium bg-primary/10 text-primary border-primary/20">Process</Badge>
        </div>
      )}

      {/* Sidebar Content */}
      {!isCollapsed && (
      <div 
        className="h-full overflow-auto pt-3 pb-3 px-2"
      >
        <Card className="border-border/50 bg-gradient-to-br from-card via-card to-primary/5 backdrop-blur-sm shadow-md">
        <CardHeader className="pb-2 space-y-1 px-3 pt-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 bg-gradient-to-b from-primary to-secondary rounded-full" />
            <div>
              <CardTitle className="text-sm font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Process Summary</CardTitle>
              <p className="text-xs text-muted-foreground/90 font-medium mt-0.5">
                Step {currentStep} of 4
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3 px-3 pb-3">
          {/* Progress Steps */}
          <div className="space-y-2.5">
            {steps.map((step, index) => (
              <div key={step.step} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`absolute left-3 top-7 h-full w-0.5 transition-all duration-300 ${
                      step.completed 
                        ? 'bg-gradient-to-b from-success to-success/50' 
                        : 'bg-slate-200'
                    }`}
                  />
                )}
                
                {/* Step Item */}
                <div className="flex gap-2.5 relative">
                  {/* Step Icon */}
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      step.completed
                        ? 'bg-gradient-to-br from-success to-success/80 border-success shadow-md shadow-success/30'
                        : step.active
                        ? 'bg-gradient-to-br from-primary to-secondary border-primary shadow-md shadow-primary/30 scale-110'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    {step.completed ? (
                      <Check className="h-3 w-3 text-white font-bold" />
                    ) : (
                      <Circle
                        className={`h-2 w-2 ${
                          step.active ? 'fill-white text-white' : 'text-muted-foreground/50'
                        }`}
                      />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 pb-3">
                    <p
                      className={`text-xs font-semibold leading-tight ${
                        step.active 
                          ? 'text-primary'
                          : step.completed
                          ? 'text-foreground'
                          : 'text-muted-foreground/70'
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-tight">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Captured Information */}
          {currentStep > 1 && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="h-3 w-0.5 bg-gradient-to-b from-primary to-secondary rounded-full" />
                <h4 className="text-[11px] font-bold text-foreground">Captured Info</h4>
              </div>
              
              {/* Customer Information Section */}
              <div className="mb-2">
                <p className="text-[10px] font-semibold text-primary/90 mb-1.5 ml-1">Customer</p>
                <div className="space-y-1.5 pl-2.5 border-l-2 border-gradient-to-b from-primary/30 to-secondary/30 rounded-sm bg-gradient-to-br from-primary/5 to-transparent py-1.5">
                  {customerReference && (
                    <div className="text-[10px]">
                      <span className="text-muted-foreground/80 font-medium">Ref:</span>
                      <span className="ml-1.5 font-semibold text-foreground">#{customerReference}</span>
                    </div>
                  )}
                  {customerName && (
                    <div className="text-[10px]">
                      <span className="text-muted-foreground/80 font-medium">Name:</span>
                      <span className="ml-1.5 font-semibold text-foreground">{customerName}</span>
                    </div>
                  )}
                  {customerEmail && (
                    <div className="text-[10px]">
                      <span className="text-muted-foreground/80 font-medium">Email:</span>
                      <span className="ml-1.5 font-semibold text-foreground break-all">
                        {customerEmail}
                      </span>
                    </div>
                  )}
                  {customerMobile && (
                    <div className="text-[10px]">
                      <span className="text-muted-foreground/80 font-medium">Mobile:</span>
                      <span className="ml-1.5 font-semibold text-foreground">{customerMobile}</span>
                    </div>
                  )}
                  {customerCompany && (
                    <div className="text-[10px]">
                      <span className="text-muted-foreground/80 font-medium">Company:</span>
                      <span className="ml-1.5 font-semibold text-foreground">{customerCompany}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Service Section */}
              {currentStep > 2 && productName && (
                <div className="mb-2">
                  <p className="text-[10px] font-semibold text-secondary/90 mb-1.5 ml-1">Service</p>
                  <div className="space-y-1.5 pl-2.5 border-l-2 border-gradient-to-b from-secondary/30 to-primary/30 rounded-sm bg-gradient-to-br from-secondary/5 to-transparent py-1.5">
                    <div className="text-[10px]">
                      <span className="text-muted-foreground/80 font-medium">Product:</span>
                      <span className="ml-1.5 font-semibold text-foreground">{productName}</span>
                    </div>
                    {formData.amount && (
                      <div className="text-[10px]">
                        <span className="text-muted-foreground/80 font-medium">Amount:</span>
                        <span className="ml-1.5 font-semibold text-foreground">
                          AED {formData.amount.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Service Details Section */}
              {currentStep > 2 && (() => {
                // Get dynamic service detail fields (those starting with section_)
                const dynamicFields = Object.entries(formData)
                  .filter(([key, value]) => key.startsWith('section_') && value)
                  .map(([key, value]) => {
                    const label = fieldLabelMap[key] || (() => {
                      const parts = key.replace('section_', '').split('_');
                      const fieldName = parts.slice(1).join(' ');
                      return fieldName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    })();
                    
                    return {
                      label,
                      value: typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value),
                      key
                    };
                  });

                // If there are dynamic fields OR license_type, show the section
                if (dynamicFields.length > 0 || formData.license_type) {
                  return (
                    <div className="mb-2">
                      <p className="text-[10px] font-semibold text-accent/90 mb-1.5 ml-1">Details</p>
                      <div className="space-y-1.5 pl-2.5 border-l-2 border-gradient-to-b from-accent/30 to-primary/30 rounded-sm bg-gradient-to-br from-accent/5 to-transparent py-1.5">
                        {formData.license_type && (
                          <div className="text-[10px]">
                            <span className="text-muted-foreground/80 font-medium">License:</span>
                            <span className="ml-1.5 font-semibold text-foreground">{formData.license_type}</span>
                          </div>
                        )}
                        {dynamicFields.map(({ label, value, key }) => (
                          <div key={key} className="text-[10px]">
                            <span className="text-muted-foreground/80 font-medium">{label}:</span>
                            <span className="ml-1.5 font-semibold text-foreground">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {/* Help Tips */}
          <div className="pt-2 border-t border-border/50">
            <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 rounded-lg p-2 border border-primary/20">
              <p className="text-[10px] text-muted-foreground/90 leading-relaxed font-medium">
                {currentStep === 1 && '💡 Provide customer contact details to proceed'}
                {currentStep === 2 && '💡 Select the service and enter key information'}
                {currentStep === 3 && '💡 Fill in additional details specific to the service'}
                {currentStep === 4 && '💡 Review all information before submitting'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
      )}
    </div>
  );
};
