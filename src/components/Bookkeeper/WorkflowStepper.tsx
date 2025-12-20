import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Upload, 
  Brain, 
  Scale, 
  FileCheck, 
  Calculator, 
  FileText, 
  Activity,
  CheckCircle2,
  AlertCircle,
  Circle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface WorkflowStep {
  id: number;
  key: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'in_progress' | 'completed' | 'needs_attention';
  itemsCount?: number;
  warningsCount?: number;
}

interface WorkflowStepperProps {
  currentStep: number;
  steps: WorkflowStep[];
  onStepClick: (stepIndex: number) => void;
}

export const defaultWorkflowSteps: WorkflowStep[] = [
  {
    id: 1,
    key: 'intake',
    title: 'Data Intake',
    shortTitle: 'Intake',
    description: 'Upload documents, bank statements, and expenses',
    icon: <Upload className="h-5 w-5" />,
    status: 'pending',
    itemsCount: 0,
  },
  {
    id: 2,
    key: 'classify',
    title: 'AI Classification',
    shortTitle: 'Classify',
    description: 'Auto-detect document types and extract data',
    icon: <Brain className="h-5 w-5" />,
    status: 'pending',
    itemsCount: 0,
    warningsCount: 0,
  },
  {
    id: 3,
    key: 'reconcile',
    title: 'Reconciliation',
    shortTitle: 'Reconcile',
    description: 'Match transactions with bank & card statements',
    icon: <Scale className="h-5 w-5" />,
    status: 'pending',
    itemsCount: 0,
    warningsCount: 0,
  },
  {
    id: 4,
    key: 'review',
    title: 'Review & Adjust',
    shortTitle: 'Review',
    description: 'Accounting adjustments and corrections',
    icon: <FileCheck className="h-5 w-5" />,
    status: 'pending',
    itemsCount: 0,
    warningsCount: 0,
  },
  {
    id: 5,
    key: 'tax',
    title: 'Tax & Compliance',
    shortTitle: 'Tax',
    description: 'VAT/GST summary and compliance checks',
    icon: <Calculator className="h-5 w-5" />,
    status: 'pending',
    warningsCount: 0,
  },
  {
    id: 6,
    key: 'reports',
    title: 'Reports',
    shortTitle: 'Reports',
    description: 'P&L, Balance Sheet, Cash Flow statements',
    icon: <FileText className="h-5 w-5" />,
    status: 'pending',
  },
  {
    id: 7,
    key: 'monitor',
    title: 'Monitoring',
    shortTitle: 'Monitor',
    description: 'Ongoing accuracy checks and anomaly detection',
    icon: <Activity className="h-5 w-5" />,
    status: 'pending',
    warningsCount: 0,
  },
];

export function WorkflowStepper({ currentStep, steps, onStepClick }: WorkflowStepperProps) {
  const getStatusIcon = (status: WorkflowStep['status'], isActive: boolean) => {
    if (status === 'completed') {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    if (status === 'needs_attention') {
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
    if (isActive) {
      return <Circle className="h-4 w-4 text-primary fill-primary" />;
    }
    return <Circle className="h-4 w-4 text-muted-foreground" />;
  };

  const getStepClasses = (index: number, status: WorkflowStep['status']) => {
    const isActive = index === currentStep;
    const isCompleted = status === 'completed';
    const needsAttention = status === 'needs_attention';

    return cn(
      'relative flex flex-col items-center cursor-pointer transition-all duration-200 group',
      'hover:scale-105',
      isActive && 'scale-105'
    );
  };

  const getCircleClasses = (index: number, status: WorkflowStep['status']) => {
    const isActive = index === currentStep;
    const isCompleted = status === 'completed';
    const needsAttention = status === 'needs_attention';

    return cn(
      'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200',
      'border-2',
      isActive && 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/20',
      isCompleted && 'border-green-500 bg-green-500/10 text-green-600',
      needsAttention && 'border-amber-500 bg-amber-500/10 text-amber-600',
      !isActive && !isCompleted && !needsAttention && 'border-muted-foreground/30 bg-muted/50 text-muted-foreground'
    );
  };

  return (
    <div className="w-full">
      {/* Desktop Stepper */}
      <div className="hidden lg:flex items-start justify-between relative">
        {/* Connection Line */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-muted-foreground/20" />
        <div 
          className="absolute top-6 left-0 h-0.5 bg-primary transition-all duration-500"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => (
          <div
            key={step.id}
            className={getStepClasses(index, step.status)}
            onClick={() => onStepClick(index)}
          >
            <div className={getCircleClasses(index, step.status)}>
              {step.icon}
            </div>
            
            <div className="mt-3 text-center max-w-[100px]">
              <div className="flex items-center justify-center gap-1">
                {getStatusIcon(step.status, index === currentStep)}
                <span className={cn(
                  'text-sm font-medium',
                  index === currentStep ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {step.shortTitle}
                </span>
              </div>
              
              {(step.itemsCount !== undefined && step.itemsCount > 0) && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  {step.itemsCount}
                </Badge>
              )}
              {(step.warningsCount !== undefined && step.warningsCount > 0) && (
                <Badge variant="destructive" className="mt-1 ml-1 text-xs">
                  {step.warningsCount}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Stepper */}
      <div className="lg:hidden">
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
