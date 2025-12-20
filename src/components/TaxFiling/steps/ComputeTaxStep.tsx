import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  ArrowRight, 
  ArrowLeft, 
  Calculator, 
  TrendingUp, 
  TrendingDown,
  CheckCircle2,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaxFiling } from '../TaxFilingWorkflow';

interface ComputeTaxStepProps {
  filing: TaxFiling | null;
  onProceed: () => void;
  onBack: () => void;
}

export function ComputeTaxStep({ filing, onProceed, onBack }: ComputeTaxStepProps) {
  const [applySmallBusinessRelief, setApplySmallBusinessRelief] = useState(false);

  // Demo calculation values
  const totalRevenue = 1050000;
  const exemptIncome = 100000; // Dividends from UAE company
  const taxableRevenue = totalRevenue - exemptIncome;
  
  const totalExpenses = 752000;
  const nonDeductibleExpenses = 12000; // Fines
  const partiallyDeductibleExpenses = 45000 * 0.5; // 50% entertainment
  const deductibleExpenses = totalExpenses - nonDeductibleExpenses - partiallyDeductibleExpenses;
  
  const taxableIncome = taxableRevenue - deductibleExpenses;
  const threshold = 375000;
  const taxRate = 0.09;
  
  const taxableAmountAboveThreshold = Math.max(0, taxableIncome - threshold);
  const taxLiability = applySmallBusinessRelief ? 0 : taxableAmountAboveThreshold * taxRate;

  const isEligibleForRelief = totalRevenue <= 3000000;

  return (
    <div className="space-y-6">
      {/* Small Business Relief Toggle */}
      {isEligibleForRelief && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Small Business Relief Eligible</p>
                  <p className="text-sm text-muted-foreground">
                    Revenue is under AED 3M threshold. Tax liability can be reduced to zero.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="sbr"
                  checked={applySmallBusinessRelief}
                  onCheckedChange={setApplySmallBusinessRelief}
                />
                <Label htmlFor="sbr" className="text-sm">Apply Relief</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Computation Breakdown */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Tax Computation Breakdown
        </h4>

        <div className="border rounded-lg divide-y">
          {/* Revenue Section */}
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Revenue
            </div>
            <div className="pl-6 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Total Revenue</span>
                <span className="font-mono">AED {totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>Less: Exempt Income (Dividends)</span>
                <span className="font-mono">- AED {exemptIncome.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-medium border-t pt-1 mt-1">
                <span>Taxable Revenue</span>
                <span className="font-mono">AED {taxableRevenue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Expenses Section */}
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Deductions
            </div>
            <div className="pl-6 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Total Expenses</span>
                <span className="font-mono">AED {totalExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-red-600">
                <span>Less: Non-Deductible (Fines)</span>
                <span className="font-mono">- AED {nonDeductibleExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-amber-600">
                <span>Less: Partial (50% Entertainment)</span>
                <span className="font-mono">- AED {partiallyDeductibleExpenses.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-medium border-t pt-1 mt-1">
                <span>Allowable Deductions</span>
                <span className="font-mono">AED {deductibleExpenses.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Taxable Income */}
          <div className="p-4 bg-muted/30">
            <div className="flex justify-between items-center">
              <span className="font-medium">Taxable Income</span>
              <span className="font-mono font-bold text-lg">AED {taxableIncome.toLocaleString()}</span>
            </div>
          </div>

          {/* Tax Calculation */}
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calculator className="h-4 w-4" />
              Tax Calculation
            </div>
            <div className="pl-6 space-y-1">
              <div className="flex justify-between text-sm">
                <span>First AED 375,000 @ 0%</span>
                <span className="font-mono">AED 0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Amount above threshold @ 9%</span>
                <span className="font-mono">
                  AED {taxableAmountAboveThreshold.toLocaleString()} × 9%
                </span>
              </div>
            </div>
          </div>

          {/* Final Tax */}
          <div className={cn(
            "p-4",
            applySmallBusinessRelief ? "bg-green-500/10" : "bg-primary/5"
          )}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-medium">Corporate Tax Liability</span>
                {applySmallBusinessRelief && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                    Small Business Relief Applied
                  </Badge>
                )}
              </div>
              <span className={cn(
                "font-mono font-bold text-xl",
                applySmallBusinessRelief ? "text-green-600" : "text-primary"
              )}>
                AED {taxLiability.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <p>
          This is a preliminary computation based on classified income and expenses. 
          The final tax liability may vary based on FTA assessment and any applicable 
          reliefs or adjustments.
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={onProceed} className="gap-2">
          Review Filing
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
