import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calculator, Wallet } from 'lucide-react';
import { WorkflowStepper, defaultWorkflowSteps, WorkflowStep } from './WorkflowStepper';
import { DataIntakeStep } from './steps/DataIntakeStep';
import { ClassificationStep } from './steps/ClassificationStep';
import { ReconciliationStep } from './steps/ReconciliationStep';
import { ReviewStep } from './steps/ReviewStep';
import { TaxStep } from './steps/TaxStep';
import { ReportsStep } from './steps/ReportsStep';
import { MonitoringStep } from './steps/MonitoringStep';

export type AccountingMethod = 'cash' | 'accrual';

interface EnhancedWorkflowProps {
  demoMode?: boolean;
}

export function EnhancedWorkflow({ demoMode = false }: EnhancedWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<WorkflowStep[]>(defaultWorkflowSteps);
  const [accountingMethod, setAccountingMethod] = useState<AccountingMethod>('accrual');

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
        return <DataIntakeStep onProceed={nextStep} demoMode={demoMode} accountingMethod={accountingMethod} />;
      case 1:
        return <ClassificationStep onProceed={nextStep} onBack={prevStep} demoMode={demoMode} accountingMethod={accountingMethod} />;
      case 2:
        return <ReconciliationStep onProceed={nextStep} onBack={prevStep} demoMode={demoMode} accountingMethod={accountingMethod} />;
      case 3:
        return <ReviewStep onProceed={nextStep} onBack={prevStep} demoMode={demoMode} accountingMethod={accountingMethod} />;
      case 4:
        return <TaxStep onProceed={nextStep} onBack={prevStep} demoMode={demoMode} accountingMethod={accountingMethod} />;
      case 5:
        return <ReportsStep onProceed={nextStep} onBack={prevStep} demoMode={demoMode} accountingMethod={accountingMethod} />;
      case 6:
        return <MonitoringStep onBack={prevStep} demoMode={demoMode} accountingMethod={accountingMethod} />;
      default:
        return <DataIntakeStep onProceed={nextStep} demoMode={demoMode} accountingMethod={accountingMethod} />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Stepper Card */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-muted/30 to-muted/10">
        <CardContent className="py-4 px-6">
          <WorkflowStepper 
            currentStep={currentStep}
            steps={steps}
            onStepClick={goToStep}
          />
        </CardContent>
      </Card>

      {/* Accounting Method Bar - Subtle inline bar */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Step {currentStep + 1} of {steps.length}:</span>
          <span className="font-medium text-foreground">{steps[currentStep]?.title}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">Accounting:</span>
          <Select value={accountingMethod} onValueChange={(v) => setAccountingMethod(v as AccountingMethod)}>
            <SelectTrigger className="h-8 w-[110px] text-xs border-dashed">
              <div className="flex items-center gap-1.5">
                {accountingMethod === 'accrual' ? (
                  <Calculator className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Wallet className="h-3.5 w-3.5 text-green-600" />
                )}
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="accrual">
                <div className="flex items-center gap-2">
                  <Calculator className="h-3 w-3" />
                  Accrual
                </div>
              </SelectItem>
              <SelectItem value="cash">
                <div className="flex items-center gap-2">
                  <Wallet className="h-3 w-3" />
                  Cash
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Current Step Content */}
      <div className="min-h-[500px]">
        {renderCurrentStep()}
      </div>
    </div>
  );
}
