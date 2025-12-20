import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  BookOpen,
  FileText,
  DollarSign,
  Scale,
  AlertTriangle,
  RefreshCcw,
  Database,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BookkeepingStatus, CustomerScenario } from '@/hooks/useTaxFiling';

interface VerifyBookkeepingStepProps {
  bookkeepingStatus: BookkeepingStatus;
  onProceed: () => void;
  onGoToBookkeeping: () => void;
}

const scenarioConfig: Record<CustomerScenario, {
  title: string;
  description: string;
  icon: React.ReactNode;
  variant: 'success' | 'warning' | 'error' | 'info';
  canProceed: boolean;
  actionLabel: string;
}> = {
  existing_with_bookkeeping: {
    title: 'Complete Bookkeeping Found',
    description: 'All bookkeeping outputs are available. You can proceed directly to tax filing.',
    icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    variant: 'success',
    canProceed: true,
    actionLabel: 'Proceed to Classification',
  },
  new_with_predone_bookkeeping: {
    title: 'Pre-Done Bookkeeping Detected',
    description: 'Reconciliation data found. Consider running anomaly detection before proceeding.',
    icon: <Database className="h-5 w-5 text-blue-500" />,
    variant: 'info',
    canProceed: true,
    actionLabel: 'Proceed to Classification',
  },
  new_with_raw_docs_only: {
    title: 'Raw Documents Only',
    description: 'Invoices/bills found but no reconciliations. Bookkeeping module needs to run first.',
    icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    variant: 'warning',
    canProceed: false,
    actionLabel: 'Run Bookkeeping',
  },
  no_data: {
    title: 'No Data Found',
    description: 'No bookkeeping data available. Please upload documents or complete bookkeeping.',
    icon: <XCircle className="h-5 w-5 text-red-500" />,
    variant: 'error',
    canProceed: false,
    actionLabel: 'Go to Bookkeeping',
  },
};

export function VerifyBookkeepingStep({ 
  bookkeepingStatus, 
  onProceed,
  onGoToBookkeeping 
}: VerifyBookkeepingStepProps) {
  const config = scenarioConfig[bookkeepingStatus.scenario];
  
  const getAlertClass = () => {
    switch (config.variant) {
      case 'success': return 'border-green-500/50 bg-green-500/10';
      case 'warning': return 'border-amber-500/50 bg-amber-500/10';
      case 'error': return 'border-red-500/50 bg-red-500/10';
      case 'info': return 'border-blue-500/50 bg-blue-500/10';
    }
  };

  const getTextClass = () => {
    switch (config.variant) {
      case 'success': return 'text-green-700 dark:text-green-300';
      case 'warning': return 'text-amber-700 dark:text-amber-300';
      case 'error': return 'text-red-700 dark:text-red-300';
      case 'info': return 'text-blue-700 dark:text-blue-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Scenario Alert */}
      <Alert className={getAlertClass()}>
        <div className="flex items-start gap-3">
          {config.icon}
          <div className="flex-1">
            <p className={cn("font-semibold", getTextClass())}>{config.title}</p>
            <AlertDescription className={getTextClass()}>
              {config.description}
            </AlertDescription>
          </div>
        </div>
      </Alert>

      {/* Data Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className={cn(
          "transition-colors",
          bookkeepingStatus.hasInvoices && "border-green-500/30 bg-green-500/5"
        )}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <FileText className={cn(
                "h-4 w-4",
                bookkeepingStatus.hasInvoices ? "text-green-500" : "text-muted-foreground"
              )} />
              <span className="text-sm font-medium">Invoices</span>
            </div>
            <p className="text-2xl font-bold">{bookkeepingStatus.invoiceCount}</p>
          </CardContent>
        </Card>

        <Card className={cn(
          "transition-colors",
          bookkeepingStatus.hasBills && "border-green-500/30 bg-green-500/5"
        )}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className={cn(
                "h-4 w-4",
                bookkeepingStatus.hasBills ? "text-green-500" : "text-muted-foreground"
              )} />
              <span className="text-sm font-medium">Bills</span>
            </div>
            <p className="text-2xl font-bold">{bookkeepingStatus.billCount}</p>
          </CardContent>
        </Card>

        <Card className={cn(
          "transition-colors",
          bookkeepingStatus.hasReconciliations && "border-green-500/30 bg-green-500/5"
        )}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <Scale className={cn(
                "h-4 w-4",
                bookkeepingStatus.hasReconciliations ? "text-green-500" : "text-muted-foreground"
              )} />
              <span className="text-sm font-medium">Reconciled</span>
            </div>
            <p className="text-2xl font-bold">{bookkeepingStatus.reconciliationCount}</p>
          </CardContent>
        </Card>

        <Card className={cn(
          "transition-colors",
          bookkeepingStatus.hasPayments && "border-green-500/30 bg-green-500/5"
        )}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className={cn(
                "h-4 w-4",
                bookkeepingStatus.hasPayments ? "text-green-500" : "text-muted-foreground"
              )} />
              <span className="text-sm font-medium">Payments</span>
            </div>
            <p className="text-2xl font-bold">
              {bookkeepingStatus.hasPayments ? '✓' : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Summary */}
      <div className="p-4 rounded-lg bg-muted/50">
        <p className="text-sm text-muted-foreground">{bookkeepingStatus.summary}</p>
      </div>

      {/* Workflow Routing Info */}
      {bookkeepingStatus.scenario === 'new_with_predone_bookkeeping' && (
        <Alert className="border-blue-500/30 bg-blue-500/5">
          <RefreshCcw className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            <strong>Optional:</strong> Run ML anomaly detection on pre-done bookkeeping before proceeding.
            This can help identify discrepancies in uploaded data.
          </AlertDescription>
        </Alert>
      )}

      {bookkeepingStatus.scenario === 'new_with_raw_docs_only' && (
        <Alert className="border-amber-500/30 bg-amber-500/5">
          <Upload className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            Raw documents detected. The bookkeeping module will process these documents,
            categorize transactions, and create reconciliations before tax filing can proceed.
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {!config.canProceed && (
          <Button 
            onClick={onGoToBookkeeping}
            className="gap-2"
          >
            <BookOpen className="h-4 w-4" />
            {config.actionLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
        
        {config.canProceed && (
          <Button 
            onClick={onProceed}
            className="gap-2"
          >
            {config.actionLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
