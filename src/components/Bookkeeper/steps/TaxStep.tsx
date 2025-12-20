import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Calculator, 
  AlertTriangle,
  CheckCircle2,
  FileWarning,
  TrendingUp,
  TrendingDown,
  Receipt,
  FileText,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaxSummary {
  period: string;
  outputVAT: number;
  inputVAT: number;
  netPayable: number;
  status: 'complete' | 'incomplete' | 'warning';
}

interface TaxAlert {
  id: string;
  type: 'missing_invoice' | 'eligibility' | 'deadline' | 'mismatch';
  severity: 'high' | 'medium' | 'low';
  message: string;
  affectedAmount: number;
}

interface TaxStepProps {
  onProceed?: () => void;
  onBack?: () => void;
  demoMode?: boolean;
}

const demoTaxSummary: TaxSummary[] = [
  { period: 'Q4 2024', outputVAT: 45000, inputVAT: 28500, netPayable: 16500, status: 'warning' },
  { period: 'Q3 2024', outputVAT: 52000, inputVAT: 31200, netPayable: 20800, status: 'complete' },
  { period: 'Q2 2024', outputVAT: 48500, inputVAT: 29100, netPayable: 19400, status: 'complete' },
];

const demoAlerts: TaxAlert[] = [
  {
    id: '1',
    type: 'missing_invoice',
    severity: 'high',
    message: 'Missing tax invoice for AED 12,500 input VAT claim',
    affectedAmount: 625,
  },
  {
    id: '2',
    type: 'eligibility',
    severity: 'medium',
    message: 'Entertainment expenses may not be fully deductible',
    affectedAmount: 350,
  },
  {
    id: '3',
    type: 'deadline',
    severity: 'low',
    message: 'Q4 VAT return due in 28 days',
    affectedAmount: 16500,
  },
];

const alertIcons = {
  missing_invoice: FileWarning,
  eligibility: ShieldAlert,
  deadline: Calculator,
  mismatch: AlertTriangle,
};

const severityColors = {
  high: 'border-red-500/50 bg-red-500/5',
  medium: 'border-amber-500/50 bg-amber-500/5',
  low: 'border-blue-500/50 bg-blue-500/5',
};

export function TaxStep({ onProceed, onBack }: TaxStepProps) {
  const currentPeriod = demoTaxSummary[0];
  const totalOutputVAT = demoTaxSummary.reduce((acc, t) => acc + t.outputVAT, 0);
  const totalInputVAT = demoTaxSummary.reduce((acc, t) => acc + t.inputVAT, 0);
  const atRiskAmount = demoAlerts.reduce((acc, a) => acc + a.affectedAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Tax & Compliance View</h2>
          <p className="text-muted-foreground">
            VAT/GST summary, compliance checks, and risk indicators.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Output VAT (Q4)</p>
                <p className="text-xl font-bold font-mono">
                  AED {currentPeriod.outputVAT.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Input VAT (Q4)</p>
                <p className="text-xl font-bold font-mono">
                  AED {currentPeriod.inputVAT.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Calculator className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Net Payable (Q4)</p>
                <p className="text-xl font-bold font-mono text-primary">
                  AED {currentPeriod.netPayable.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={atRiskAmount > 0 ? 'border-amber-500/50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">At Risk</p>
                <p className="text-xl font-bold font-mono text-amber-600">
                  AED {atRiskAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Alerts */}
      {demoAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Compliance Alerts
            </CardTitle>
            <CardDescription>
              Issues that may affect your tax filing. Review and resolve before submission.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoAlerts.map(alert => {
              const Icon = alertIcons[alert.type];
              return (
                <div 
                  key={alert.id}
                  className={cn('p-4 rounded-lg border', severityColors[alert.severity])}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Icon className={cn(
                        'h-5 w-5 mt-0.5',
                        alert.severity === 'high' && 'text-red-500',
                        alert.severity === 'medium' && 'text-amber-500',
                        alert.severity === 'low' && 'text-blue-500'
                      )} />
                      <div>
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Affected amount: <span className="font-mono">AED {alert.affectedAmount.toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                    <Badge variant={alert.severity === 'high' ? 'destructive' : 'secondary'}>
                      {alert.severity}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Tax Summary by Period */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">VAT Summary by Period</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Output VAT</TableHead>
                <TableHead className="text-right">Input VAT</TableHead>
                <TableHead className="text-right">Net Payable</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoTaxSummary.map(period => (
                <TableRow key={period.period}>
                  <TableCell className="font-medium">{period.period}</TableCell>
                  <TableCell className="text-right font-mono">
                    AED {period.outputVAT.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    AED {period.inputVAT.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    AED {period.netPayable.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {period.status === 'complete' && (
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Complete
                      </Badge>
                    )}
                    {period.status === 'warning' && (
                      <Badge variant="outline" className="text-amber-600">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Review Needed
                      </Badge>
                    )}
                    {period.status === 'incomplete' && (
                      <Badge variant="outline" className="text-red-600">
                        <FileWarning className="h-3 w-3 mr-1" />
                        Incomplete
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Expense Eligibility */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Expense Eligibility Summary</CardTitle>
          <CardDescription>
            VAT recovery eligibility by expense category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { category: 'Office Expenses', total: 15000, eligible: 14250, rate: 95 },
              { category: 'Travel', total: 8500, eligible: 6800, rate: 80 },
              { category: 'Entertainment', total: 4200, eligible: 2100, rate: 50 },
              { category: 'Software', total: 12000, eligible: 0, rate: 0, note: 'Non-UAE' },
            ].map(item => (
              <div key={item.category} className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium">{item.category}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">
                      AED {item.eligible.toLocaleString()} / {item.total.toLocaleString()}
                    </span>
                    <span className={cn(
                      'font-medium',
                      item.rate >= 80 && 'text-green-600',
                      item.rate >= 50 && item.rate < 80 && 'text-amber-600',
                      item.rate < 50 && 'text-red-600'
                    )}>
                      {item.rate}% eligible
                    </span>
                  </div>
                  <Progress value={item.rate} className="h-2" />
                </div>
                {item.note && (
                  <Badge variant="secondary" className="text-xs">{item.note}</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="border-slate-500/30 bg-slate-500/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-slate-500 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Compliance Risk Indicators</p>
              <p className="text-sm text-muted-foreground">
                This view shows compliance risk indicators, <strong>not legal guarantees</strong>. 
                AI detects potential issues based on data patterns. Consult a tax professional 
                for authoritative guidance on your specific situation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Review
        </Button>
        <Button size="lg" onClick={onProceed}>
          Proceed to Reports
        </Button>
      </div>
    </div>
  );
}
