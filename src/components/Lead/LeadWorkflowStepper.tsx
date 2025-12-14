import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  Target, 
  Heart, 
  FileText, 
  UserCheck, 
  Check,
  ChevronRight,
  MessageSquare,
  Phone,
  Mail,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkflowStep {
  id: number;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'upcoming';
  actions: {
    icon: React.ReactNode;
    label: string;
    description: string;
  }[];
}

const LeadWorkflowStepper = () => {
  const [currentStep, setCurrentStep] = useState(2);

  const steps: WorkflowStep[] = [
    {
      id: 1,
      name: 'Import',
      description: 'Data entry from CSV, API, or manual',
      icon: <Upload className="h-5 w-5" />,
      status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'current' : 'upcoming',
      actions: [
        { icon: <Upload className="h-4 w-4" />, label: 'CSV Upload', description: 'Import from spreadsheet' },
        { icon: <ArrowRight className="h-4 w-4" />, label: 'API Sync', description: 'Apollo.io, LinkedIn' },
        { icon: <FileText className="h-4 w-4" />, label: 'Manual Entry', description: 'Add lead manually' },
      ]
    },
    {
      id: 2,
      name: 'Qualify',
      description: 'Score leads and assign to agents',
      icon: <Target className="h-5 w-5" />,
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'current' : 'upcoming',
      actions: [
        { icon: <Target className="h-4 w-4" />, label: 'Auto-Score', description: 'Hot/Warm/Cold based on value' },
        { icon: <UserCheck className="h-4 w-4" />, label: 'Assign Agent', description: 'Round-robin or manual' },
        { icon: <FileText className="h-4 w-4" />, label: 'Set Interest', description: 'Product/service interest' },
      ]
    },
    {
      id: 3,
      name: 'Nurture',
      description: 'Follow-up sequence over multiple days',
      icon: <Heart className="h-5 w-5" />,
      status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'current' : 'upcoming',
      actions: [
        { icon: <MessageSquare className="h-4 w-4" />, label: 'Day 0: WhatsApp', description: 'Welcome message' },
        { icon: <Phone className="h-4 w-4" />, label: 'Day 1: Call', description: 'Initial contact call' },
        { icon: <Mail className="h-4 w-4" />, label: 'Day 3: Email', description: 'Send proposal/portal link' },
      ]
    },
    {
      id: 4,
      name: 'Propose',
      description: 'Send offers and negotiate terms',
      icon: <FileText className="h-5 w-5" />,
      status: currentStep > 4 ? 'completed' : currentStep === 4 ? 'current' : 'upcoming',
      actions: [
        { icon: <FileText className="h-4 w-4" />, label: 'Generate Offer', description: 'AI-powered messaging' },
        { icon: <MessageSquare className="h-4 w-4" />, label: 'Send Proposal', description: 'Email or portal' },
        { icon: <Phone className="h-4 w-4" />, label: 'Negotiate', description: 'Handle objections' },
      ]
    },
    {
      id: 5,
      name: 'Convert',
      description: 'Transform lead into customer',
      icon: <UserCheck className="h-5 w-5" />,
      status: currentStep > 5 ? 'completed' : currentStep === 5 ? 'current' : 'upcoming',
      actions: [
        { icon: <UserCheck className="h-4 w-4" />, label: 'Create Customer', description: 'New customer record' },
        { icon: <FileText className="h-4 w-4" />, label: 'Select Services', description: 'Products purchased' },
        { icon: <Mail className="h-4 w-4" />, label: 'Onboarding', description: 'Portal access & docs' },
      ]
    },
  ];

  const getStepStyles = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-primary text-primary-foreground';
      case 'current':
        return 'bg-primary/20 text-primary border-2 border-primary';
      case 'upcoming':
        return 'bg-muted text-muted-foreground';
    }
  };

  const getConnectorStyles = (status: WorkflowStep['status']) => {
    return status === 'completed' ? 'bg-primary' : 'bg-muted';
  };

  return (
    <Card className="border-0 bg-gradient-to-br from-card to-card/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span>Lead Workflow</span>
              <p className="text-sm font-normal text-muted-foreground mt-1">
                From import to customer conversion
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            Step {currentStep} of 5
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stepper Header */}
        <div className="flex items-center justify-between px-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <button
                onClick={() => setCurrentStep(step.id)}
                className="flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                    getStepStyles(step.status),
                    "group-hover:scale-110"
                  )}
                >
                  {step.status === 'completed' ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="text-center">
                  <p className={cn(
                    "text-sm font-medium",
                    step.status === 'current' ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {step.name}
                  </p>
                </div>
              </button>
              {index < steps.length - 1 && (
                <div className={cn(
                  "flex-1 h-1 mx-2 rounded-full transition-all duration-200",
                  getConnectorStyles(steps[index + 1].status === 'completed' || steps[index + 1].status === 'current' ? 'completed' : 'upcoming')
                )} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Current Step Details */}
        {steps.map((step) => (
          step.status === 'current' && (
            <div key={step.id} className="mt-6 p-4 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  {step.icon}
                </div>
                <div>
                  <h4 className="font-semibold">{step.name}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {step.actions.map((action, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-background rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 rounded bg-primary/10 text-primary">
                        {action.icon}
                      </div>
                      <span className="text-sm font-medium">{action.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-8">{action.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          <Button
            size="sm"
            onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
            disabled={currentStep === 5}
          >
            Next Step
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadWorkflowStepper;
