import { useState } from 'react';
import { Check, Circle, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
      className={`fixed top-0 left-0 h-screen transition-all duration-300 ease-in-out z-[600] ${
        isCollapsed ? 'w-12' : 'w-80'
      }`}
    >
      {/* Toggle Button - Always Visible */}
      <Button
        size="icon"
        variant="secondary"
        onClick={handleToggle}
        className={`absolute top-1 h-10 w-10 rounded-full shadow-lg bg-secondary hover:bg-secondary/80 border-2 border-border hover:scale-110 transition-all z-[9999] ${
          isCollapsed ? 'right-[-16px]' : 'right-[-20px]'
        }`}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="h-5 w-5" />
        ) : (
          <ChevronLeft className="h-5 w-5" />
        )}
      </Button>

      {/* Collapsed State */}
      {isCollapsed && (
        <div className="flex flex-col items-center py-4 gap-4 h-full bg-card border-r border-border">
          <FileText className="h-6 w-6 text-muted-foreground" />
          <Badge className="writing-mode-vertical text-xs">Process</Badge>
        </div>
      )}

      {/* Sidebar Content */}
      {!isCollapsed && (
      <div 
        className="h-full overflow-auto py-4 px-3 bg-background border-r border-border shadow-xl transition-all duration-300"
      >
        <Card className="border-border bg-card/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Process Summary</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Step {currentStep} of 4
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Progress Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.step} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`absolute left-3 top-7 h-full w-0.5 ${
                      step.completed ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                )}
                
                {/* Step Item */}
                <div className="flex gap-3 relative">
                  {/* Step Icon */}
                  <div
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                      step.completed
                        ? 'bg-primary border-primary'
                        : step.active
                        ? 'bg-background border-primary'
                        : 'bg-background border-border'
                    }`}
                  >
                    {step.completed ? (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    ) : (
                      <Circle
                        className={`h-2 w-2 ${
                          step.active ? 'fill-primary text-primary' : 'text-muted-foreground'
                        }`}
                      />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 pb-4">
                    <p
                      className={`text-xs font-medium ${
                        step.active || step.completed
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Captured Information */}
          {currentStep > 1 && (
            <div className="pt-3 border-t border-border">
              <h4 className="text-xs font-semibold mb-3">Captured Info</h4>
              
              {/* Customer Information Section */}
              <div className="mb-3">
                <p className="text-[10px] font-semibold text-primary mb-1.5">Customer Information</p>
                <div className="space-y-1.5 pl-2 border-l-2 border-primary/20">
                  {customerReference && (
                    <div className="text-[11px]">
                      <span className="text-muted-foreground">Ref #:</span>
                      <span className="ml-1 font-medium text-foreground">{customerReference}</span>
                    </div>
                  )}
                  {customerName && (
                    <div className="text-[11px]">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="ml-1 font-medium text-foreground">{customerName}</span>
                    </div>
                  )}
                  {customerEmail && (
                    <div className="text-[11px]">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="ml-1 font-medium text-foreground break-all">
                        {customerEmail}
                      </span>
                    </div>
                  )}
                  {customerMobile && (
                    <div className="text-[11px]">
                      <span className="text-muted-foreground">Mobile:</span>
                      <span className="ml-1 font-medium text-foreground">{customerMobile}</span>
                    </div>
                  )}
                  {customerCompany && (
                    <div className="text-[11px]">
                      <span className="text-muted-foreground">Company:</span>
                      <span className="ml-1 font-medium text-foreground">{customerCompany}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Service Section */}
              {currentStep > 2 && productName && (
                <div className="mb-3">
                  <p className="text-[10px] font-semibold text-primary mb-1.5">Service</p>
                  <div className="space-y-1.5 pl-2 border-l-2 border-primary/20">
                    <div className="text-[11px]">
                      <span className="text-muted-foreground">Product:</span>
                      <span className="ml-1 font-medium text-foreground">{productName}</span>
                    </div>
                    {formData.amount && (
                      <div className="text-[11px]">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="ml-1 font-medium text-foreground">
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
                    <div className="mb-3">
                      <p className="text-[10px] font-semibold text-primary mb-1.5">Service Details</p>
                      <div className="space-y-1.5 pl-2 border-l-2 border-primary/20">
                        {formData.license_type && (
                          <div className="text-[11px]">
                            <span className="text-muted-foreground">License Type:</span>
                            <span className="ml-1 font-medium text-foreground">{formData.license_type}</span>
                          </div>
                        )}
                        {dynamicFields.map(({ label, value, key }) => (
                          <div key={key} className="text-[11px]">
                            <span className="text-muted-foreground">{label}:</span>
                            <span className="ml-1 font-medium text-foreground">{value}</span>
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
          <div className="pt-3 border-t border-border">
            <div className="bg-muted/30 rounded-md p-2.5">
              <p className="text-[10px] text-muted-foreground leading-relaxed">
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
