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
    <div className="space-y-6">
      {/* Stepper with Accounting Method Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <WorkflowStepper 
              currentStep={currentStep}
              steps={steps}
              onStepClick={goToStep}
            />
            
            {/* Global Accounting Method Selector */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border shrink-0">
              <div className="flex items-center gap-2">
                {accountingMethod === 'accrual' ? (
                  <Calculator className="h-4 w-4 text-blue-500" />
                ) : (
                  <Wallet className="h-4 w-4 text-green-500" />
                )}
                <span className="text-sm font-medium">Method:</span>
              </div>
              <Select value={accountingMethod} onValueChange={(v) => setAccountingMethod(v as AccountingMethod)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
              <Badge variant={accountingMethod === 'accrual' ? 'default' : 'secondary'} className="hidden sm:inline-flex">
                {accountingMethod === 'accrual' ? 'When Earned/Incurred' : 'When Paid/Received'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      <div className="min-h-[500px]">
        {renderCurrentStep()}
      </div>
    </div>
  );
}
