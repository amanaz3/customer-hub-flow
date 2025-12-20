import React from 'react';
import { cn } from '@/lib/utils';
import { 
  BookOpen, 
  FileText, 
  Calculator, 
  FileCheck, 
  Send
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface TaxWorkflowStep {
  id: number;
  key: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'in_progress' | 'completed' | 'needs_attention';
  warningsCount?: number;
}

interface TaxWorkflowStepperProps {
  currentStep: number;
  steps: TaxWorkflowStep[];
  onStepClick: (stepIndex: number) => void;
}

export const defaultTaxWorkflowSteps: TaxWorkflowStep[] = [
  {
    id: 1,
    key: 'verify_bookkeeping',
    title: 'Verify Bookkeeping',
    shortTitle: 'Verify',
    description: 'Ensure all financial records are complete and reconciled',
    icon: <BookOpen className="h-5 w-5" />,
    status: 'pending',
  },
  {
    id: 2,
    key: 'classify_income',
    title: 'Classify Income & Expenses',
    shortTitle: 'Classify',
    description: 'Categorize items for tax treatment',
    icon: <FileText className="h-5 w-5" />,
    status: 'pending',
  },
  {
    id: 3,
    key: 'compute_tax',
    title: 'Compute Tax',
    shortTitle: 'Compute',
    description: 'Calculate UAE corporate tax liability',
    icon: <Calculator className="h-5 w-5" />,
    status: 'pending',
  },
  {
    id: 4,
    key: 'review',
    title: 'Review & Approve',
    shortTitle: 'Review',
    description: 'Final review before submission',
    icon: <FileCheck className="h-5 w-5" />,
    status: 'pending',
  },
  {
    id: 5,
    key: 'submit',
    title: 'Submit Filing',
    shortTitle: 'Submit',
    description: 'Generate FTA-compliant documents and submit',
    icon: <Send className="h-5 w-5" />,
    status: 'pending',
  },
];

export function TaxWorkflowStepper({ currentStep, steps, onStepClick }: TaxWorkflowStepperProps) {
  const getStepClasses = (index: number, status: TaxWorkflowStep['status']) => {
    const isActive = index === currentStep;

    return cn(
      'relative flex flex-col items-center cursor-pointer transition-all duration-200 group',
      'hover:scale-105',
      isActive && 'scale-105'
    );
  };

  const getCircleClasses = (index: number, status: TaxWorkflowStep['status']) => {
    const isActive = index === currentStep;
    const isCompleted = status === 'completed';
    const needsAttention = status === 'needs_attention';

    return cn(
      'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200',
      'border-2',
      isActive && 'border-primary bg-primary/10 text-primary shadow-md shadow-primary/25 scale-110',
      isCompleted && 'border-green-500 bg-green-500/10 text-green-600',
      needsAttention && 'border-amber-500 bg-amber-500/10 text-amber-600',
      !isActive && !isCompleted && !needsAttention && 'border-muted-foreground/20 bg-background text-muted-foreground hover:border-muted-foreground/40'
    );
  };

  return (
    <div className="w-full">
      {/* Desktop Stepper */}
      <div className="hidden md:flex items-center justify-center gap-2 relative pb-6">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          
          return (
            <React.Fragment key={step.id}>
              {/* Step */}
              <div
                className={getStepClasses(index, step.status)}
                onClick={() => onStepClick(index)}
                title={step.title}
              >
                <div className={getCircleClasses(index, step.status)}>
                  {step.icon}
                </div>
                
                {/* Label - only show for active step */}
                {isActive && (
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="text-xs font-medium text-primary">{step.shortTitle}</span>
                  </div>
                )}
                
                {/* Badges for warnings */}
                {(step.warningsCount !== undefined && step.warningsCount > 0) && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center"
                  >
                    {step.warningsCount}
                  </Badge>
                )}
              </div>
              
              {/* Connector line between steps */}
              {index < steps.length - 1 && (
                <div className={cn(
                  'w-12 h-0.5 mx-1 transition-colors duration-300',
                  index < currentStep ? 'bg-primary' : 'bg-muted-foreground/20'
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile Stepper */}
      <div className="md:hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => onStepClick(index)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all',
                'border',
                index === currentStep 
                  ? 'border-primary bg-primary/10 text-primary' 
                  : 'border-muted bg-muted/50 text-muted-foreground',
                step.status === 'completed' && 'border-green-500/50 bg-green-500/10',
                step.status === 'needs_attention' && 'border-amber-500/50 bg-amber-500/10'
              )}
            >
              {step.icon}
              <span className="text-sm font-medium">{step.shortTitle}</span>
              {(step.warningsCount !== undefined && step.warningsCount > 0) && (
                <Badge variant="destructive" className="text-xs h-5 w-5 p-0 flex items-center justify-center">
                  {step.warningsCount}
                </Badge>
              )}
            </button>
          ))}
        </div>
        
        {/* Current Step Details */}
        <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              'bg-primary/10 text-primary'
            )}>
              {steps[currentStep]?.icon}
            </div>
            <div>
              <h3 className="font-semibold">{steps[currentStep]?.title}</h3>
              <p className="text-sm text-muted-foreground">{steps[currentStep]?.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
