import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  ArrowRight
} from 'lucide-react';
import { TaxWorkflowStepper, defaultTaxWorkflowSteps, TaxWorkflowStep } from './TaxWorkflowStepper';
import { VerifyBookkeepingStep } from './steps/VerifyBookkeepingStep';
import { ClassifyIncomeStep } from './steps/ClassifyIncomeStep';
import { ComputeTaxStep } from './steps/ComputeTaxStep';
import { ReviewFilingStep } from './steps/ReviewFilingStep';
import { SubmitFilingStep } from './steps/SubmitFilingStep';
import { VectorDBStatus } from './VectorDBStatus';
import { BookkeepingStatus } from '@/hooks/useTaxFiling';

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

interface EnhancedTaxWorkflowProps {
  bookkeepingStatus: BookkeepingStatus;
  currentFiling: TaxFiling | null;
  onStartFiling: () => void;
  onGoToBookkeeping: () => void;
  demoMode?: boolean;
}

export function EnhancedTaxWorkflow({ 
  bookkeepingStatus, 
  currentFiling,
  onStartFiling,
  onGoToBookkeeping,
  demoMode = false
}: EnhancedTaxWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TaxWorkflowStep[]>(defaultTaxWorkflowSteps);

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      // Mark current as completed
      setSteps(prev => prev.map((s, i) => 
        i === currentStep ? { ...s, status: 'completed' as const } : s
      ));
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

      {/* Stepper Card */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-muted/30 to-muted/10">
        <CardContent className="py-4 px-6">
          <TaxWorkflowStepper 
            currentStep={currentStep}
            steps={steps}
            onStepClick={goToStep}
          />
        </CardContent>
      </Card>

      {/* Step Info Bar */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Step {currentStep + 1} of {steps.length}:</span>
          <span className="font-medium text-foreground">{steps[currentStep]?.title}</span>
        </div>
      </div>

      {/* Current Step Content */}
      <div className="min-h-[400px]">
        {renderCurrentStep()}
      </div>
    </div>
  );
}
