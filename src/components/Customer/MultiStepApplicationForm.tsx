import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, ChevronRight, FileText, DollarSign, Upload, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiStepApplicationFormProps {
  isEnabled?: boolean;
  onComplete?: () => void;
}

type Step = 'service' | 'deal' | 'documents' | 'review';

const steps: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: 'service', label: 'Service Selection', icon: <FileText className="h-4 w-4" /> },
  { id: 'deal', label: 'Deal Information', icon: <DollarSign className="h-4 w-4" /> },
  { id: 'documents', label: 'Document Upload', icon: <Upload className="h-4 w-4" /> },
  { id: 'review', label: 'Review & Submit', icon: <Eye className="h-4 w-4" /> },
];

export const MultiStepApplicationForm: React.FC<MultiStepApplicationFormProps> = ({ 
  isEnabled = true,
  onComplete 
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('service');
  const [completedSteps, setCompletedSteps] = useState<Step[]>([]);

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const handleNext = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    } else if (onComplete) {
      onComplete();
    }
  };

  const handleStepClick = (stepId: Step) => {
    if (!isEnabled) return;
    const stepIndex = steps.findIndex(s => s.id === stepId);
    if (stepIndex <= currentStepIndex || completedSteps.includes(stepId)) {
      setCurrentStep(stepId);
    }
  };

  return (
    <Card className={cn(
      "w-full transition-opacity",
      !isEnabled && "opacity-50 pointer-events-none"
    )}>
      <CardHeader>
        <CardTitle>Application Details</CardTitle>
        <CardDescription>
          {isEnabled 
            ? "Complete the following steps to create the application" 
            : "Select or create a customer first to enable application creation"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between gap-2">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = currentStep === step.id;
            const isAccessible = index <= currentStepIndex || isCompleted;

            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => handleStepClick(step.id)}
                  disabled={!isEnabled || !isAccessible}
                  className={cn(
                    "flex flex-col items-center gap-2 flex-1 group transition-all",
                    isAccessible ? "cursor-pointer" : "cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    isCompleted && "bg-green-500 text-white",
                    isCurrent && !isCompleted && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2",
                    !isCurrent && !isCompleted && "bg-muted text-muted-foreground group-hover:bg-muted/80"
                  )}>
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : step.icon}
                  </div>
                  <div className="text-center">
                    <div className={cn(
                      "text-xs font-medium transition-colors",
                      isCurrent && "text-foreground",
                      !isCurrent && "text-muted-foreground"
                    )}>
                      {step.label}
                    </div>
                  </div>
                </button>
                {index < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 -mx-2" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[200px] border rounded-lg p-6 bg-muted/20">
          {currentStep === 'service' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Select Service</h3>
              <p className="text-sm text-muted-foreground">
                Choose the service or product for this application
              </p>
              {/* Service selection form will go here */}
              <div className="text-center py-8 text-muted-foreground">
                Service selection form coming soon...
              </div>
            </div>
          )}

          {currentStep === 'deal' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Deal Information</h3>
              <p className="text-sm text-muted-foreground">
                Enter deal amount, terms, and related information
              </p>
              {/* Deal information form will go here */}
              <div className="text-center py-8 text-muted-foreground">
                Deal information form coming soon...
              </div>
            </div>
          )}

          {currentStep === 'documents' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Upload Documents</h3>
              <p className="text-sm text-muted-foreground">
                Upload required documents for this application
              </p>
              {/* Document upload will go here */}
              <div className="text-center py-8 text-muted-foreground">
                Document upload coming soon...
              </div>
            </div>
          )}

          {currentStep === 'review' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Review & Submit</h3>
              <p className="text-sm text-muted-foreground">
                Review all information and submit the application
              </p>
              {/* Review content will go here */}
              <div className="text-center py-8 text-muted-foreground">
                Review section coming soon...
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              const prevIndex = currentStepIndex - 1;
              if (prevIndex >= 0) {
                setCurrentStep(steps[prevIndex].id);
              }
            }}
            disabled={!isEnabled || currentStepIndex === 0}
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={!isEnabled}
          >
            {currentStepIndex === steps.length - 1 ? 'Submit' : 'Next'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
