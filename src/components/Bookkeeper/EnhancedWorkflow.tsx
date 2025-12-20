import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { WorkflowStepper, defaultWorkflowSteps, WorkflowStep } from './WorkflowStepper';
import { DataIntakeStep } from './steps/DataIntakeStep';
import { ClassificationStep } from './steps/ClassificationStep';
import { ReconciliationStep } from './steps/ReconciliationStep';
import { ReviewStep } from './steps/ReviewStep';
import { TaxStep } from './steps/TaxStep';
import { ReportsStep } from './steps/ReportsStep';
import { MonitoringStep } from './steps/MonitoringStep';

interface EnhancedWorkflowProps {
  demoMode?: boolean;
}

export function EnhancedWorkflow({ demoMode = false }: EnhancedWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<WorkflowStep[]>(defaultWorkflowSteps);

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
        return <DataIntakeStep onProceed={nextStep} demoMode={demoMode} />;
      case 1:
        return <ClassificationStep onProceed={nextStep} onBack={prevStep} demoMode={demoMode} />;
      case 2:
        return <ReconciliationStep onProceed={nextStep} onBack={prevStep} demoMode={demoMode} />;
      case 3:
        return <ReviewStep onProceed={nextStep} onBack={prevStep} demoMode={demoMode} />;
      case 4:
        return <TaxStep onProceed={nextStep} onBack={prevStep} demoMode={demoMode} />;
      case 5:
        return <ReportsStep onProceed={nextStep} onBack={prevStep} demoMode={demoMode} />;
      case 6:
        return <MonitoringStep onBack={prevStep} demoMode={demoMode} />;
      default:
        return <DataIntakeStep onProceed={nextStep} demoMode={demoMode} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <Card>
        <CardContent className="pt-6">
          <WorkflowStepper 
            currentStep={currentStep}
            steps={steps}
            onStepClick={goToStep}
          />
        </CardContent>
      </Card>

      {/* Current Step Content */}
      <div className="min-h-[500px]">
        {renderCurrentStep()}
      </div>
    </div>
  );
}
