import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClassifyIncomeStepProps {
  onProceed: () => void;
  onBack: () => void;
}

interface IncomeItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  taxTreatment: string;
  needsReview: boolean;
  confidence: number;
}

const demoIncomeItems: IncomeItem[] = [
  { id: '1', description: 'Consulting Services Revenue', amount: 450000, category: 'revenue', taxTreatment: 'taxable', needsReview: false, confidence: 0.98 },
  { id: '2', description: 'Software License Sales', amount: 320000, category: 'revenue', taxTreatment: 'taxable', needsReview: false, confidence: 0.95 },
  { id: '3', description: 'Investment Income - UAE Bonds', amount: 15000, category: 'revenue', taxTreatment: 'exempt', needsReview: true, confidence: 0.72 },
  { id: '4', description: 'Dividend from UAE Company', amount: 85000, category: 'revenue', taxTreatment: 'exempt', needsReview: false, confidence: 0.99 },
  { id: '5', description: 'Foreign Subsidiary Income', amount: 180000, category: 'revenue', taxTreatment: 'taxable', needsReview: true, confidence: 0.65 },
];

const demoExpenseItems: IncomeItem[] = [
  { id: '6', description: 'Employee Salaries', amount: 420000, category: 'expense', taxTreatment: 'deductible', needsReview: false, confidence: 0.99 },
  { id: '7', description: 'Office Rent', amount: 180000, category: 'expense', taxTreatment: 'deductible', needsReview: false, confidence: 0.98 },
  { id: '8', description: 'Entertainment Expenses', amount: 45000, category: 'expense', taxTreatment: 'partially_deductible', needsReview: true, confidence: 0.85 },
  { id: '9', description: 'Regulatory Fines', amount: 12000, category: 'expense', taxTreatment: 'non_deductible', needsReview: false, confidence: 0.97 },
  { id: '10', description: 'Professional Services', amount: 95000, category: 'expense', taxTreatment: 'deductible', needsReview: false, confidence: 0.96 },
];

const taxTreatmentOptions = [
  { value: 'taxable', label: 'Taxable', color: 'text-blue-500 bg-blue-500/10' },
  { value: 'exempt', label: 'Exempt', color: 'text-green-500 bg-green-500/10' },
  { value: 'deductible', label: 'Deductible', color: 'text-green-500 bg-green-500/10' },
  { value: 'partially_deductible', label: 'Partial (50%)', color: 'text-amber-500 bg-amber-500/10' },
  { value: 'non_deductible', label: 'Non-Deductible', color: 'text-red-500 bg-red-500/10' },
];

export function ClassifyIncomeStep({ onProceed, onBack }: ClassifyIncomeStepProps) {
  const [incomeItems, setIncomeItems] = useState(demoIncomeItems);
  const [expenseItems, setExpenseItems] = useState(demoExpenseItems);
  const [activeTab, setActiveTab] = useState<'income' | 'expenses'>('income');

  const currentItems = activeTab === 'income' ? incomeItems : expenseItems;
  const setCurrentItems = activeTab === 'income' ? setIncomeItems : setExpenseItems;

  const needsReviewCount = [...incomeItems, ...expenseItems].filter(i => i.needsReview).length;
  const totalIncome = incomeItems.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = expenseItems.reduce((sum, i) => sum + i.amount, 0);

  const updateTreatment = (id: string, treatment: string) => {
    setCurrentItems(prev => prev.map(item => 
      item.id === id ? { ...item, taxTreatment: treatment, needsReview: false } : item
    ));
  };

  const getTreatmentBadge = (treatment: string) => {
    const option = taxTreatmentOptions.find(o => o.value === treatment);
    return option ? (
      <Badge variant="outline" className={cn("text-xs", option.color)}>
        {option.label}
      </Badge>
    ) : null;
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground">Total Revenue</p>
          <p className="font-mono font-bold text-lg">AED {totalIncome.toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground">Total Expenses</p>
          <p className="font-mono font-bold text-lg">AED {totalExpenses.toLocaleString()}</p>
        </div>
        <div className={cn(
          "p-3 rounded-lg",
          needsReviewCount > 0 ? "bg-amber-500/10" : "bg-green-500/10"
        )}>
          <p className="text-xs text-muted-foreground">Needs Review</p>
          <p className="font-mono font-bold text-lg flex items-center gap-1">
            {needsReviewCount > 0 ? (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
            {needsReviewCount} items
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('income')}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === 'income' 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Income ({incomeItems.length})
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === 'expenses' 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Expenses ({expenseItems.length})
        </button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount (AED)</TableHead>
              <TableHead>Tax Treatment</TableHead>
              <TableHead className="text-center">AI Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((item) => (
              <TableRow key={item.id} className={cn(item.needsReview && "bg-amber-500/5")}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {item.description}
                    {item.needsReview && (
                      <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/30">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Review
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {item.amount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Select
                    value={item.taxTreatment}
                    onValueChange={(value) => updateTreatment(item.id, value)}
                  >
                    <SelectTrigger className="w-[160px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {taxTreatmentOptions
                        .filter(o => activeTab === 'income' 
                          ? ['taxable', 'exempt'].includes(o.value)
                          : ['deductible', 'partially_deductible', 'non_deductible'].includes(o.value)
                        )
                        .map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <span className={cn("text-sm", option.color.split(' ')[0])}>
                              {option.label}
                            </span>
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span className={cn(
                      "text-sm font-mono",
                      item.confidence >= 0.9 && "text-green-600",
                      item.confidence >= 0.7 && item.confidence < 0.9 && "text-amber-600",
                      item.confidence < 0.7 && "text-red-600"
                    )}>
                      {Math.round(item.confidence * 100)}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={onProceed} className="gap-2">
          Proceed to Computation
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
