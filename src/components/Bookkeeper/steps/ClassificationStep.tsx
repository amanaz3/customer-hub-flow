import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Brain, 
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Filter,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClassifiedItem {
  id: string;
  name: string;
  documentType: string;
  vendor: string;
  date: string;
  amount: number;
  currency: string;
  category: string;
  accountingMethod: 'cash' | 'accrual';
  taxApplicable: boolean;
  taxType: string;
  isEmployee: boolean;
  isReimbursable: boolean;
  confidence: number;
  needsReview: boolean;
}

interface ClassificationStepProps {
  onProceed?: () => void;
  onBack?: () => void;
}

const categories = [
  'Rent', 'Salary', 'Utilities', 'Marketing', 'Software', 
  'Travel', 'Meals', 'Fuel', 'Hotel', 'Mobile Bill', 
  'Office Expenses', 'Professional Services', 'Other'
];

const taxTypes = ['VAT 5%', 'VAT 0%', 'Exempt', 'Out of Scope', 'Reverse Charge'];

// Demo data
const demoItems: ClassifiedItem[] = [
  {
    id: '1',
    name: 'Office Rent Invoice - December.pdf',
    documentType: 'Purchase Bill',
    vendor: 'Emirates Towers REIT',
    date: '2024-12-01',
    amount: 25000,
    currency: 'AED',
    category: 'Rent',
    accountingMethod: 'accrual',
    taxApplicable: true,
    taxType: 'VAT 5%',
    isEmployee: false,
    isReimbursable: false,
    confidence: 0.95,
    needsReview: false,
  },
  {
    id: '2',
    name: 'AWS Monthly Invoice.pdf',
    documentType: 'Purchase Bill',
    vendor: 'Amazon Web Services',
    date: '2024-12-05',
    amount: 3500,
    currency: 'USD',
    category: 'Software',
    accountingMethod: 'accrual',
    taxApplicable: false,
    taxType: 'Out of Scope',
    isEmployee: false,
    isReimbursable: false,
    confidence: 0.92,
    needsReview: false,
  },
  {
    id: '3',
    name: 'Team Dinner Receipt.jpg',
    documentType: 'Receipt',
    vendor: 'La Petite Maison',
    date: '2024-12-10',
    amount: 1250,
    currency: 'AED',
    category: 'Meals',
    accountingMethod: 'cash',
    taxApplicable: true,
    taxType: 'VAT 5%',
    isEmployee: false,
    isReimbursable: false,
    confidence: 0.68,
    needsReview: true,
  },
  {
    id: '4',
    name: 'Taxi to Airport.png',
    documentType: 'Employee Expense',
    vendor: 'Careem',
    date: '2024-12-12',
    amount: 85,
    currency: 'AED',
    category: 'Travel',
    accountingMethod: 'cash',
    taxApplicable: true,
    taxType: 'VAT 5%',
    isEmployee: true,
    isReimbursable: true,
    confidence: 0.55,
    needsReview: true,
  },
];

export function ClassificationStep({ onProceed, onBack }: ClassificationStepProps) {
  const [items, setItems] = useState<ClassifiedItem[]>(demoItems);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [filterNeedsReview, setFilterNeedsReview] = useState(false);
  const [processing, setProcessing] = useState(false);

  const needsReviewCount = items.filter(i => i.needsReview).length;
  const highConfidenceCount = items.filter(i => i.confidence >= 0.9).length;

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-500/10';
    if (confidence >= 0.7) return 'text-amber-600 bg-amber-500/10';
    return 'text-red-600 bg-red-500/10';
  };

  const updateItem = (id: string, field: keyof ClassifiedItem, value: any) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value, needsReview: false } : item
    ));
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(i => i.id)));
    }
  };

  const filteredItems = filterNeedsReview 
    ? items.filter(i => i.needsReview) 
    : items;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">AI Classification & Enrichment</h2>
          <p className="text-muted-foreground">
            AI has extracted and categorized your documents. Review and correct as needed.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-xl font-bold">{items.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">High Confidence</p>
                <p className="text-xl font-bold">{highConfidenceCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={needsReviewCount > 0 ? 'border-amber-500/50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Needs Review</p>
                <p className="text-xl font-bold">{needsReviewCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
                <p className="text-xl font-bold">
                  {(items.reduce((acc, i) => acc + i.confidence, 0) / items.length * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Button
          variant={filterNeedsReview ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterNeedsReview(!filterNeedsReview)}
        >
          <Filter className="h-4 w-4 mr-2" />
          {filterNeedsReview ? 'Show All' : 'Show Needs Review Only'}
          {needsReviewCount > 0 && (
            <Badge variant="destructive" className="ml-2">{needsReviewCount}</Badge>
          )}
        </Button>
        <Button variant="outline" size="sm" disabled={processing}>
          {processing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
          Re-analyze Selected
        </Button>
      </div>

      {/* Classification Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox 
                      checked={selectedItems.size === items.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Vendor/Customer</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map(item => (
                  <TableRow 
                    key={item.id}
                    className={cn(item.needsReview && 'bg-amber-500/5')}
                  >
                    <TableCell>
                      <Checkbox 
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={(checked) => {
                          const newSet = new Set(selectedItems);
                          if (checked) {
                            newSet.add(item.id);
                          } else {
                            newSet.delete(item.id);
                          }
                          setSelectedItems(newSet);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.date}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.documentType}</Badge>
                      {item.isEmployee && (
                        <Badge variant="secondary" className="ml-1 text-xs">Employee</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{item.vendor}</TableCell>
                    <TableCell>
                      <Select 
                        value={item.category}
                        onValueChange={(v) => updateItem(item.id, 'category', v)}
                      >
                        <SelectTrigger className="h-8 w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.currency} {item.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={item.taxType}
                        onValueChange={(v) => updateItem(item.id, 'taxType', v)}
                      >
                        <SelectTrigger className="h-8 w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {taxTypes.map(tax => (
                            <SelectItem key={tax} value={tax}>{tax}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.accountingMethod === 'accrual' ? 'default' : 'secondary'}>
                        {item.accountingMethod}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('font-mono', getConfidenceColor(item.confidence))}>
                        {(item.confidence * 100).toFixed(0)}%
                      </Badge>
                      {item.needsReview && (
                        <AlertTriangle className="h-4 w-4 text-amber-500 inline ml-2" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Responsibility Notice */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium text-sm">AI Classification Notice</p>
              <p className="text-sm text-muted-foreground">
                AI suggests categories and tax treatments based on document analysis. 
                Low-confidence items (below 70%) are flagged for manual review. 
                <strong> Final classification responsibility remains with you.</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Intake
        </Button>
        <Button size="lg" onClick={onProceed}>
          Proceed to Reconciliation
          {needsReviewCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {needsReviewCount} pending review
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
}
