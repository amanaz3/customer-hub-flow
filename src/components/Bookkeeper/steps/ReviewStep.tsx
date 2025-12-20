import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileCheck, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  PenLine,
  Undo2,
  Calculator,
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdjustmentItem {
  id: string;
  type: 'accrual' | 'depreciation' | 'correction' | 'reclassification' | 'tax_override';
  description: string;
  originalValue: number;
  adjustedValue: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  requiresJudgment: boolean;
  aiSuggestion?: string;
}

interface ReviewStepProps {
  onProceed?: () => void;
  onBack?: () => void;
}

const demoAdjustments: AdjustmentItem[] = [
  {
    id: '1',
    type: 'accrual',
    description: 'Unpaid December electricity bill',
    originalValue: 0,
    adjustedValue: 2500,
    aiSuggestion: 'Based on average of last 3 months',
    status: 'pending',
    requiresJudgment: true,
  },
  {
    id: '2',
    type: 'accrual',
    description: 'Consulting revenue earned but not invoiced',
    originalValue: 0,
    adjustedValue: 18000,
    aiSuggestion: 'Contract milestones indicate earned revenue',
    status: 'pending',
    requiresJudgment: true,
  },
  {
    id: '3',
    type: 'depreciation',
    description: 'Office furniture depreciation - Dec 2024',
    originalValue: 0,
    adjustedValue: 1250,
    aiSuggestion: 'Straight-line, 5-year useful life',
    status: 'pending',
    requiresJudgment: false,
  },
  {
    id: '4',
    type: 'correction',
    description: 'Marketing expense incorrectly posted as Software',
    originalValue: 3500,
    adjustedValue: 3500,
    reason: 'Recategorize from Software to Marketing',
    status: 'pending',
    requiresJudgment: false,
  },
  {
    id: '5',
    type: 'tax_override',
    description: 'Zero-rated export services - override VAT',
    originalValue: 750,
    adjustedValue: 0,
    reason: 'Export to non-UAE entity qualifies for zero-rating',
    status: 'pending',
    requiresJudgment: true,
  },
];

const typeLabels = {
  accrual: { label: 'Accrual Entry', icon: Clock, color: 'text-blue-500' },
  depreciation: { label: 'Depreciation', icon: TrendingDown, color: 'text-purple-500' },
  correction: { label: 'Correction', icon: Undo2, color: 'text-amber-500' },
  reclassification: { label: 'Reclassification', icon: ArrowRight, color: 'text-green-500' },
  tax_override: { label: 'Tax Override', icon: Calculator, color: 'text-red-500' },
};

export function ReviewStep({ onProceed, onBack }: ReviewStepProps) {
  const [items, setItems] = useState<AdjustmentItem[]>(demoAdjustments);
  const [reasonInputs, setReasonInputs] = useState<Record<string, string>>({});

  const pendingCount = items.filter(i => i.status === 'pending').length;
  const judgmentCount = items.filter(i => i.requiresJudgment && i.status === 'pending').length;
  const totalAdjustment = items
    .filter(i => i.status !== 'rejected')
    .reduce((acc, i) => acc + (i.adjustedValue - i.originalValue), 0);

  const approveItem = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, status: 'approved' as const, reason: reasonInputs[id] || item.reason } : item
    ));
  };

  const rejectItem = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, status: 'rejected' as const } : item
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Review & Accounting Adjustments</h2>
          <p className="text-muted-foreground">
            AI suggests adjustments. You decide. Required reasons for tax overrides.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <FileCheck className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Adjustments</p>
                <p className="text-xl font-bold">{items.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={pendingCount > 0 ? 'border-amber-500/50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={judgmentCount > 0 ? 'border-purple-500/50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <PenLine className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Requires Judgment</p>
                <p className="text-xl font-bold">{judgmentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Calculator className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Net Adjustment</p>
                <p className={cn('text-xl font-bold', totalAdjustment >= 0 ? 'text-green-600' : 'text-red-600')}>
                  AED {Math.abs(totalAdjustment).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Adjustments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Suggested Adjustments</CardTitle>
          <CardDescription>
            Review each AI suggestion. Items marked "Judgment Required" need your accounting decision.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {items.map(item => {
              const TypeConfig = typeLabels[item.type];
              const Icon = TypeConfig.icon;
              const difference = item.adjustedValue - item.originalValue;
              
              return (
                <div 
                  key={item.id}
                  className={cn(
                    'p-4',
                    item.status === 'approved' && 'bg-green-500/5',
                    item.status === 'rejected' && 'bg-red-500/5 opacity-60'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={TypeConfig.color}>
                          <Icon className="h-3 w-3 mr-1" />
                          {TypeConfig.label}
                        </Badge>
                        {item.requiresJudgment && (
                          <Badge variant="secondary" className="text-purple-600">
                            <PenLine className="h-3 w-3 mr-1" />
                            Judgment Required
                          </Badge>
                        )}
                        {item.status !== 'pending' && (
                          <Badge 
                            variant={item.status === 'approved' ? 'default' : 'destructive'}
                          >
                            {item.status === 'approved' ? 'Approved' : 'Rejected'}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="font-medium">{item.description}</p>
                      
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-muted-foreground">
                          Original: <span className="font-mono">AED {item.originalValue.toLocaleString()}</span>
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          Adjusted: <span className="font-mono">AED {item.adjustedValue.toLocaleString()}</span>
                        </span>
                        <span className={cn(
                          'font-mono font-medium',
                          difference >= 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          ({difference >= 0 ? '+' : ''}{difference.toLocaleString()})
                        </span>
                      </div>
                      
                      {item.aiSuggestion && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          AI: {item.aiSuggestion}
                        </p>
                      )}

                      {/* Reason input for tax overrides */}
                      {item.type === 'tax_override' && item.status === 'pending' && (
                        <div className="mt-3">
                          <Textarea 
                            placeholder="Reason required for tax override..."
                            className="h-20"
                            value={reasonInputs[item.id] || item.reason || ''}
                            onChange={(e) => setReasonInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                          />
                        </div>
                      )}
                    </div>

                    {item.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-green-600"
                          onClick={() => approveItem(item.id)}
                          disabled={item.type === 'tax_override' && !reasonInputs[item.id] && !item.reason}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-600"
                          onClick={() => rejectItem(item.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Judgment Notice */}
      <Card className="border-purple-500/30 bg-purple-500/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <PenLine className="h-5 w-5 text-purple-500 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Accounting Judgment Required</p>
              <p className="text-sm text-muted-foreground">
                Items marked "Judgment Required" involve accounting estimates or decisions. 
                AI may suggest, but <strong>never auto-applies</strong> these adjustments. 
                Your approval confirms the accounting treatment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Reconciliation
        </Button>
        <Button size="lg" onClick={onProceed}>
          Proceed to Tax View
          {pendingCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {pendingCount} pending
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
}
