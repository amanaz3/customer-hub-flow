import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, FileText, Info, Upload, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiStepApplicationFormProps {
  customerId: string | null;
  isEnabled: boolean;
}

type Step = {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'active' | 'completed';
};

export const MultiStepApplicationForm: React.FC<MultiStepApplicationFormProps> = ({
  customerId,
  isEnabled
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const steps: Step[] = [
    {
      id: 1,
      title: 'Service Selection',
      description: 'Choose the service/product for this application',
      icon: <FileText className="h-5 w-5" />,
      status: currentStep === 1 ? 'active' : completedSteps.includes(1) ? 'completed' : 'pending'
    },
    {
      id: 2,
      title: 'Deal Information',
      description: 'Enter deal details, amount, and terms',
      icon: <Info className="h-5 w-5" />,
      status: currentStep === 2 ? 'active' : completedSteps.includes(2) ? 'completed' : 'pending'
    },
    {
      id: 3,
      title: 'Document Upload',
      description: 'Upload required documents',
      icon: <Upload className="h-5 w-5" />,
      status: currentStep === 3 ? 'active' : completedSteps.includes(3) ? 'completed' : 'pending'
    },
    {
      id: 4,
      title: 'Review & Submit',
      description: 'Review all information and submit',
      icon: <Eye className="h-5 w-5" />,
      status: currentStep === 4 ? 'active' : completedSteps.includes(4) ? 'completed' : 'pending'
    }
  ];

  const handleStepComplete = () => {
    if (currentStep < 4) {
      setCompletedSteps([...completedSteps, currentStep]);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStepBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Card className={cn(
      "border-2 transition-opacity duration-300",
      !isEnabled && "opacity-50 pointer-events-none"
    )}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Step 2: Application Details
        </CardTitle>
        <CardDescription>
          {isEnabled 
            ? 'Complete the following steps to create the application'
            : 'Select a customer first to continue'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1">
                  {/* Step Circle */}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300",
                      step.status === 'completed' && "bg-green-600 text-white",
                      step.status === 'active' && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                      step.status === 'pending' && "bg-muted text-muted-foreground"
                    )}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <span className="text-sm font-semibold">{step.id}</span>
                    )}
                  </div>
                  {/* Step Info */}
                  <div className="text-center max-w-[120px]">
                    <p className={cn(
                      "text-sm font-medium mb-1",
                      step.status === 'active' && "text-foreground",
                      step.status !== 'active' && "text-muted-foreground"
                    )}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground hidden md:block">
                      {step.description}
                    </p>
                  </div>
                </div>
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 mx-2 -mt-12 transition-all duration-300",
                      completedSteps.includes(step.id) ? "bg-green-600" : "bg-muted"
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[300px] border rounded-lg p-6 bg-muted/30">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Service Selection
              </h3>
              <p className="text-muted-foreground">
                Select the service or product for this application. This will determine the required documents and workflow.
              </p>
              {/* TODO: Add service selection component */}
              <div className="text-center py-8 text-muted-foreground">
                Service selection form will go here
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Info className="h-5 w-5" />
                Deal Information
              </h3>
              <p className="text-muted-foreground">
                Enter the deal details including amount, terms, and other relevant information.
              </p>
              {/* TODO: Add deal information form */}
              <div className="text-center py-8 text-muted-foreground">
                Deal information form will go here
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Document Upload
              </h3>
              <p className="text-muted-foreground">
                Upload the required documents based on the selected service.
              </p>
              {/* TODO: Add document upload component */}
              <div className="text-center py-8 text-muted-foreground">
                Document upload interface will go here
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Review & Submit
              </h3>
              <p className="text-muted-foreground">
                Review all the information before submitting the application.
              </p>
              {/* TODO: Add review component */}
              <div className="text-center py-8 text-muted-foreground">
                Review summary will go here
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleStepBack}
            disabled={currentStep === 1}
          >
            Back
          </Button>
          <Button
            onClick={handleStepComplete}
            disabled={currentStep === 4}
          >
            {currentStep === 4 ? 'Submit Application' : 'Continue'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
