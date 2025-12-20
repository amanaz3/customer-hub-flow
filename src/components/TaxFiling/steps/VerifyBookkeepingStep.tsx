import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  BookOpen,
  FileText,
  DollarSign,
  Scale
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerifyBookkeepingStepProps {
  isComplete: boolean;
  onProceed: () => void;
}

const bookkeepingChecks = [
  {
    id: 'invoices',
    label: 'All invoices recorded',
    description: 'Sales invoices for the financial year',
    icon: <FileText className="h-4 w-4" />,
  },
  {
    id: 'expenses',
    label: 'All expenses categorized',
    description: 'Bills and expenses properly classified',
    icon: <DollarSign className="h-4 w-4" />,
  },
  {
    id: 'reconciliation',
    label: 'Bank accounts reconciled',
    description: 'All bank transactions matched',
    icon: <Scale className="h-4 w-4" />,
  },
  {
    id: 'documents',
    label: 'Supporting documents uploaded',
    description: 'Receipts and evidence attached',
    icon: <BookOpen className="h-4 w-4" />,
  },
];

export function VerifyBookkeepingStep({ isComplete, onProceed }: VerifyBookkeepingStepProps) {
  // For demo purposes, show all checks as complete if bookkeeping is complete
  const checkStatus = (checkId: string) => isComplete;

  return (
    <div className="space-y-6">
      {/* Status Summary */}
      <Alert variant={isComplete ? "default" : "destructive"} className={cn(
        isComplete && "border-green-500/50 bg-green-500/10"
      )}>
        {isComplete ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4" />
        )}
        <AlertDescription className={cn(
          isComplete && "text-green-700 dark:text-green-300"
        )}>
          {isComplete 
            ? "Bookkeeping is complete. You can proceed with tax filing."
            : "Some bookkeeping tasks are incomplete. Please complete them before proceeding."
          }
        </AlertDescription>
      </Alert>

      {/* Checklist */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground">Bookkeeping Checklist</h4>
        <div className="grid gap-3">
          {bookkeepingChecks.map((check) => {
            const completed = checkStatus(check.id);
            return (
              <div
                key={check.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border",
                  completed && "bg-green-500/5 border-green-500/30"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg",
                  completed ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
                )}>
                  {check.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{check.label}</p>
                  <p className="text-xs text-muted-foreground">{check.description}</p>
                </div>
                {completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Badge variant="secondary" className="text-xs">Pending</Badge>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Financial Summary */}
      {isComplete && (
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <h4 className="font-medium text-sm">Financial Summary (Demo)</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Revenue</p>
              <p className="font-mono font-bold">AED 1,250,000</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Expenses</p>
              <p className="font-mono font-bold">AED 875,000</p>
            </div>
            <div>
              <p className="text-muted-foreground">Net Profit</p>
              <p className="font-mono font-bold text-green-600">AED 375,000</p>
            </div>
            <div>
              <p className="text-muted-foreground">Transactions</p>
              <p className="font-mono font-bold">847</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end">
        <Button 
          onClick={onProceed} 
          disabled={!isComplete}
          className="gap-2"
        >
          Proceed to Classification
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
