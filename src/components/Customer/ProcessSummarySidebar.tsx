import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, FileText, User, Package, ClipboardList, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProcessStep {
  step: number;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
  icon: React.ReactNode;
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
    [key: string]: any;
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

  const customerName = companyMode && selectedCustomerData ? selectedCustomerData.name : formData.name;
  const customerEmail = companyMode && selectedCustomerData ? selectedCustomerData.email : formData.email;
  const customerMobile = companyMode && selectedCustomerData ? selectedCustomerData.mobile : formData.mobile;
  const customerCompany = companyMode && selectedCustomerData ? selectedCustomerData.company : formData.company;
  const customerReference = companyMode && selectedCustomerData?.reference_number ? selectedCustomerData.reference_number : null;

  const steps: ProcessStep[] = [
    {
      step: 1,
      title: 'Customer',
      description: 'Contact details',
      completed: currentStep > 1,
      active: currentStep === 1,
      icon: <User className="h-3.5 w-3.5" />
    },
    {
      step: 2,
      title: 'Service',
      description: 'Select service',
      completed: currentStep > 2,
      active: currentStep === 2,
      icon: <Package className="h-3.5 w-3.5" />
    },
    {
      step: 3,
      title: 'Details',
      description: 'Service info',
      completed: currentStep > 3,
      active: currentStep === 3,
      icon: <ClipboardList className="h-3.5 w-3.5" />
    },
    {
      step: 4,
      title: 'Review',
      description: 'Confirm & submit',
      completed: false,
      active: currentStep === 4,
      icon: <Send className="h-3.5 w-3.5" />
    }
  ];

  const progressPercentage = ((currentStep - 1) / 3) * 100;

  return (
    <div 
      className={cn(
        "fixed top-14 sm:top-16 left-0 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-out z-[99999]",
        isCollapsed ? 'w-12' : 'w-72'
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={handleToggle}
        className={cn(
          "fixed top-20 sm:top-24 h-7 w-7 rounded-full bg-background border shadow-md hover:bg-accent transition-all duration-300 z-[100000]",
          isCollapsed ? 'left-9' : 'left-[17rem]'
        )}
        title={isCollapsed ? 'Expand' : 'Collapse'}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </Button>

      {/* Collapsed State */}
      {isCollapsed && (
        <div className="flex flex-col items-center py-4 gap-3">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col items-center gap-1">
            {steps.map((step) => (
              <div
                key={step.step}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  step.completed ? "bg-emerald-500" : step.active ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      )}

      {/* Expanded Content */}
      {!isCollapsed && (
        <div className="h-full overflow-auto p-4">
          {/* Header */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-foreground">Process Summary</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Step {currentStep} of 4</p>
            
            {/* Progress Bar */}
            <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-1 mb-5">
            {steps.map((step, index) => (
              <div key={step.step} className="relative">
                {/* Vertical connecting line */}
                {index < steps.length - 1 && (
                  <div 
                    className={cn(
                      "absolute left-[1.15rem] top-10 w-0.5 h-6 transition-all duration-300",
                      step.completed ? "bg-emerald-500" : "bg-muted"
                    )}
                  />
                )}
                
                <div 
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200",
                    step.active && "bg-primary/10 border border-primary/20",
                    step.completed && "opacity-80"
                  )}
                >
                  {/* Step Icon */}
                  <div
                    className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all relative z-10",
                      step.completed && "bg-emerald-500 text-white",
                      step.active && "bg-primary text-primary-foreground shadow-sm",
                      !step.completed && !step.active && "bg-muted text-muted-foreground"
                    )}
                  >
                    {step.completed ? (
                      <Check className="h-4 w-4" strokeWidth={3} />
                    ) : (
                      step.icon
                    )}
                  </div>

                  {/* Step Text */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-xs font-medium leading-tight",
                      step.active ? "text-primary" : step.completed ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {step.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {step.description}
                    </p>
                  </div>

                  {/* Step Number Badge */}
                  {!step.completed && (
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "h-5 w-5 p-0 flex items-center justify-center text-[10px] font-bold",
                        step.active && "bg-primary text-primary-foreground"
                      )}
                    >
                      {step.step}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Captured Data */}
          {currentStep > 1 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Data</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              
              {/* Customer Section */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-semibold text-foreground uppercase tracking-wide">Customer</span>
                </div>
                
                {customerReference && (
                  <DataRow label="Ref" value={`#${customerReference}`} highlight />
                )}
                {customerName && <DataRow label="Name" value={customerName} />}
                {customerEmail && <DataRow label="Email" value={customerEmail} truncate />}
                {customerMobile && <DataRow label="Mobile" value={customerMobile} />}
                {customerCompany && <DataRow label="Company" value={customerCompany} />}
              </div>

              {/* Service Section */}
              {currentStep > 2 && productName && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-3.5 w-3.5 text-secondary" />
                    <span className="text-[10px] font-semibold text-foreground uppercase tracking-wide">Service</span>
                  </div>
                  
                  <DataRow label="Product" value={productName} />
                  {formData.amount && (
                    <DataRow label="Amount" value={`AED ${formData.amount.toLocaleString()}`} highlight />
                  )}
                </div>
              )}

              {/* Details Section */}
              {currentStep > 2 && (() => {
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

                if (dynamicFields.length > 0 || formData.license_type) {
                  return (
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <ClipboardList className="h-3.5 w-3.5 text-accent-foreground" />
                        <span className="text-[10px] font-semibold text-foreground uppercase tracking-wide">Details</span>
                      </div>
                      
                      {formData.license_type && (
                        <DataRow label="License" value={formData.license_type} />
                      )}
                      {dynamicFields.map(({ label, value, key }) => (
                        <DataRow key={key} label={label} value={value} />
                      ))}
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {/* Tips */}
          <div className="mt-4 p-3 bg-primary/5 border border-primary/10 rounded-lg">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {currentStep === 1 && '💡 Enter customer contact details to continue'}
              {currentStep === 2 && '💡 Select a service type to proceed'}
              {currentStep === 3 && '💡 Complete all required fields'}
              {currentStep === 4 && '💡 Review and submit your application'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for data rows
const DataRow = ({ label, value, highlight, truncate }: { 
  label: string; 
  value: string; 
  highlight?: boolean;
  truncate?: boolean;
}) => (
  <div className="flex justify-between items-start gap-2 text-[10px]">
    <span className="text-muted-foreground flex-shrink-0">{label}</span>
    <span className={cn(
      "text-right font-medium",
      highlight ? "text-primary" : "text-foreground",
      truncate && "truncate max-w-[120px]"
    )}>
      {value}
    </span>
  </div>
);
