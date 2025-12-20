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
      
      {/* Workflow Layout - Vertical Stepper + Content */}
      <div className="flex gap-6">
        {/* Left Sidebar - Vertical Stepper */}
        <div className="w-64 flex-shrink-0">
          <Card className="sticky top-4">
            <CardContent className="py-4">
              {/* Progress Header */}
              <div className="mb-4 pb-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(progress)}%
                  </Badge>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>

              {/* Vertical Steps */}
              <div className="space-y-1">
                {workflowSteps.map((step, index) => {
                  const status = getStepStatus(index);
                  const isClickable = index <= currentStep;
                  
                  return (
                    <button
                      key={step.key}
                      onClick={() => isClickable && setCurrentStep(index)}
                      disabled={!isClickable}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all",
                        status === 'current' && "bg-primary/10 border border-primary/30",
                        status === 'completed' && "hover:bg-green-500/5",
                        status === 'pending' && "opacity-50 cursor-not-allowed",
                        isClickable && status !== 'current' && "hover:bg-muted/50"
                      )}
                    >
                      {/* Step Icon with connector line */}
                      <div className="relative flex flex-col items-center">
                        <div className={cn(
                          "p-2 rounded-full transition-colors z-10",
                          status === 'completed' && "bg-green-500/20 text-green-500",
                          status === 'current' && "bg-primary/20 text-primary ring-2 ring-primary/30",
                          status === 'pending' && "bg-muted text-muted-foreground"
                        )}>
                          {status === 'completed' ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            React.cloneElement(step.icon as React.ReactElement, { className: 'h-4 w-4' })
                          )}
                        </div>
                        {/* Connector line */}
                        {index < workflowSteps.length - 1 && (
                          <div className={cn(
                            "absolute top-10 w-0.5 h-8",
                            index < currentStep ? "bg-green-500/40" : "bg-muted"
                          )} />
                        )}
                      </div>

                      {/* Step Info */}
                      <div className="flex-1 min-w-0 pt-1">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          status === 'current' && "text-primary",
                          status === 'completed' && "text-green-600"
                        )}>
                          {step.shortTitle}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {step.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 min-w-0">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg bg-primary/10 text-primary"
                )}>
                  {workflowSteps[currentStep].icon}
                </div>
                <div>
                  <CardTitle className="text-lg">
                    Step {currentStep + 1}: {workflowSteps[currentStep].title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {workflowSteps[currentStep].description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {renderCurrentStep()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
