import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  Circle, 
  BookOpen, 
  FileText, 
  Calculator, 
  FileCheck,
  Send,
  ArrowRight,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VerifyBookkeepingStep } from './steps/VerifyBookkeepingStep';
import { ClassifyIncomeStep } from './steps/ClassifyIncomeStep';
import { ComputeTaxStep } from './steps/ComputeTaxStep';
import { ReviewFilingStep } from './steps/ReviewFilingStep';
import { SubmitFilingStep } from './steps/SubmitFilingStep';
import { BookkeepingStatus } from '@/hooks/useTaxFiling';
import { VectorDBStatus } from './VectorDBStatus';

export interface TaxFiling {
  id: string;
  tax_year: number;
  period_start: string;
  period_end: string;
  company_name: string;
  status: string;
  current_step: string;
  total_revenue: number;
  total_expenses: number;
  taxable_income: number;
  tax_liability: number;
  bookkeeping_complete: boolean;
}

interface TaxFilingWorkflowProps {
  bookkeepingStatus: BookkeepingStatus;
  currentFiling: TaxFiling | null;
  onStartFiling: () => void;
  onGoToBookkeeping: () => void;
}

const workflowSteps = [
  {
    id: 1,
    key: 'verify_bookkeeping',
    title: 'Verify Bookkeeping',
    shortTitle: 'Verify',
    description: 'Ensure all financial records are complete and reconciled',
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    id: 2,
    key: 'classify_income',
    title: 'Classify Income & Expenses',
    shortTitle: 'Classify',
    description: 'Categorize items for tax treatment',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: 3,
    key: 'compute_tax',
    title: 'Compute Tax',
    shortTitle: 'Compute',
    description: 'Calculate UAE corporate tax liability',
    icon: <Calculator className="h-5 w-5" />,
  },
  {
    id: 4,
    key: 'review',
    title: 'Review & Approve',
    shortTitle: 'Review',
    description: 'Final review before submission',
    icon: <FileCheck className="h-5 w-5" />,
  },
  {
    id: 5,
    key: 'submit',
    title: 'Submit Filing',
    shortTitle: 'Submit',
    description: 'Generate FTA-compliant documents and submit',
    icon: <Send className="h-5 w-5" />,
  },
];

export function TaxFilingWorkflow({ 
  bookkeepingStatus, 
  currentFiling,
  onStartFiling,
  onGoToBookkeeping
}: TaxFilingWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const progress = ((currentStep + 1) / workflowSteps.length) * 100;

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'pending';
  };

  const nextStep = () => {
    if (currentStep < workflowSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <VerifyBookkeepingStep 
            bookkeepingStatus={bookkeepingStatus}
            onProceed={nextStep}
            onGoToBookkeeping={onGoToBookkeeping}
          />
        );
      case 1:
        return (
          <ClassifyIncomeStep 
            onProceed={nextStep} 
            onBack={prevStep}
          />
        );
      case 2:
        return (
          <ComputeTaxStep 
            filing={currentFiling}
            onProceed={nextStep} 
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <ReviewFilingStep 
            filing={currentFiling}
            onProceed={nextStep} 
            onBack={prevStep}
          />
        );
      case 4:
        return (
          <SubmitFilingStep 
            filing={currentFiling}
            onBack={prevStep}
          />
        );
      default:
        return null;
    }
  };

  // Show start screen if no filing exists and no bookkeeping data
  if (!currentFiling && bookkeepingStatus.scenario === 'no_data') {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="p-4 rounded-full bg-amber-500/10 w-fit mx-auto">
              <BookOpen className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold">No Bookkeeping Data Found</h3>
            <p className="text-muted-foreground">
              Before you can file your UAE Corporate Tax, you need to complete your bookkeeping. 
              This ensures all your financial records are accurate and reconciled.
            </p>
            <Button onClick={onGoToBookkeeping} className="mt-4">
              Go to Bookkeeping
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Vector DB Status */}
      <VectorDBStatus />
      {/* Workflow Stepper */}
      <div className="space-y-6">
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Progress:</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Badge variant="outline">
              Step {currentStep + 1} of {workflowSteps.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-2 mb-4" />
          
          {/* Step indicators */}
          <div className="flex items-center justify-between">
            {workflowSteps.map((step, index) => {
              const status = getStepStatus(index);
              return (
                <button
                  key={step.key}
                  onClick={() => index <= currentStep && setCurrentStep(index)}
                  disabled={index > currentStep}
                  className={cn(
                    "flex flex-col items-center gap-1 transition-all",
                    status === 'current' && "scale-110",
                    index > currentStep && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-full transition-colors",
                    status === 'completed' && "bg-green-500/20 text-green-500",
                    status === 'current' && "bg-primary/20 text-primary",
                    status === 'pending' && "bg-muted text-muted-foreground"
                  )}>
                    {status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span className={cn(
                    "text-xs font-medium hidden sm:block",
                    status === 'current' && "text-primary"
                  )}>
                    {step.shortTitle}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {workflowSteps[currentStep].icon}
            {workflowSteps[currentStep].title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {workflowSteps[currentStep].description}
          </p>
        </CardHeader>
        <CardContent>
          {renderCurrentStep()}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
