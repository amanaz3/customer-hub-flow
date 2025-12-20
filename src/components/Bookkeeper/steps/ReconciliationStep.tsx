import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Scale, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  Search,
  FileQuestion,
  Copy,
  DollarSign,
  Clock,
  User,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReconciliationItem {
  id: string;
  type: 'matched' | 'missing' | 'duplicate' | 'mismatch' | 'timing' | 'personal';
  source: {
    type: string;
    reference: string;
    amount: number;
    date: string;
    description: string;
  };
  target?: {
    type: string;
    reference: string;
    amount: number;
    date: string;
    description: string;
  };
  difference?: number;
  confidence: number;
  severity: 'high' | 'medium' | 'low';
  resolution?: string;
}

interface ReconciliationStepProps {
  onProceed?: () => void;
  onBack?: () => void;
}

const demoReconciliations: ReconciliationItem[] = [
  {
    id: '1',
    type: 'matched',
    source: { type: 'Bill', reference: 'BILL-001', amount: 25000, date: '2024-12-01', description: 'Office Rent - December' },
    target: { type: 'Bank Payment', reference: 'TXN-9912', amount: 25000, date: '2024-12-02', description: 'FT TO EMIRATES TOWERS' },
    confidence: 0.98,
    severity: 'low',
  },
  {
    id: '2',
    type: 'missing',
    source: { type: 'Bank Transaction', reference: 'TXN-9925', amount: 5600, date: '2024-12-05', description: 'CARD PAYMENT - NOON.COM' },
    confidence: 1.0,
    severity: 'high',
  },
  {
    id: '3',
    type: 'duplicate',
    source: { type: 'Bill', reference: 'BILL-015', amount: 1250, date: '2024-12-08', description: 'Office Supplies' },
    target: { type: 'Bill', reference: 'BILL-016', amount: 1250, date: '2024-12-08', description: 'Office Supplies - Duplicate' },
    confidence: 0.92,
    severity: 'medium',
  },
  {
    id: '4',
    type: 'mismatch',
    source: { type: 'Invoice', reference: 'INV-0089', amount: 15000, date: '2024-12-10', description: 'Consulting Services' },
    target: { type: 'Bank Receipt', reference: 'TXN-9940', amount: 14250, date: '2024-12-12', description: 'INCOMING TT - CLIENT A' },
    difference: 750,
    confidence: 0.85,
    severity: 'high',
  },
  {
    id: '5',
    type: 'timing',
    source: { type: 'Bill', reference: 'BILL-020', amount: 3500, date: '2024-11-28', description: 'Software License' },
    target: { type: 'Bank Payment', reference: 'TXN-9955', amount: 3500, date: '2024-12-05', description: 'FT TO AWS' },
    confidence: 0.88,
    severity: 'low',
  },
  {
    id: '6',
    type: 'personal',
    source: { type: 'Card Transaction', reference: 'CC-1155', amount: 450, date: '2024-12-09', description: 'AMAZON.AE - ELECTRONICS' },
    confidence: 0.75,
    severity: 'medium',
  },
];

const issueIcons = {
  matched: CheckCircle2,
  missing: FileQuestion,
  duplicate: Copy,
  mismatch: DollarSign,
  timing: Clock,
  personal: User,
};

const issueLabels = {
  matched: 'Matched',
  missing: 'Missing Entry',
  duplicate: 'Possible Duplicate',
  mismatch: 'Amount Mismatch',
  timing: 'Timing Difference',
  personal: 'Personal Expense?',
};

const severityColors = {
  high: 'text-red-500 bg-red-500/10',
  medium: 'text-amber-500 bg-amber-500/10',
  low: 'text-green-500 bg-green-500/10',
};

export function ReconciliationStep({ onProceed, onBack }: ReconciliationStepProps) {
  const [items, setItems] = useState<ReconciliationItem[]>(demoReconciliations);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const matchedCount = items.filter(i => i.type === 'matched').length;
  const issuesCount = items.filter(i => i.type !== 'matched').length;
  const highPriorityCount = items.filter(i => i.severity === 'high' && i.type !== 'matched').length;

  const reconciliationRate = (matchedCount / items.length) * 100;

  const getFilteredItems = () => {
    if (activeTab === 'all') return items;
    if (activeTab === 'issues') return items.filter(i => i.type !== 'matched');
    return items.filter(i => i.type === activeTab);
  };

  const resolveItem = (id: string, resolution: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, type: 'matched' as const, resolution } : item
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Bank & Card Reconciliation</h2>
          <p className="text-muted-foreground">
            Critical error-detection layer. Match transactions against bank and card statements.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Scale className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Reconciliation Rate</p>
                <p className="text-xl font-bold">{reconciliationRate.toFixed(0)}%</p>
              </div>
            </div>
            <Progress value={reconciliationRate} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Matched</p>
                <p className="text-xl font-bold">{matchedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={issuesCount > 0 ? 'border-amber-500/50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Issues Found</p>
                <p className="text-xl font-bold">{issuesCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={highPriorityCount > 0 ? 'border-red-500/50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">High Priority</p>
                <p className="text-xl font-bold">{highPriorityCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button disabled={processing}>
          {processing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
          Run Auto-Match
        </Button>
        <Button variant="secondary" disabled={processing}>
          <Sparkles className="h-4 w-4 mr-2" />
          AI Smart Match
        </Button>
      </div>

      {/* Reconciliation Table */}
      <Card>
        <CardHeader className="pb-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">
                All ({items.length})
              </TabsTrigger>
              <TabsTrigger value="issues">
                Issues ({issuesCount})
                {issuesCount > 0 && <Badge variant="destructive" className="ml-1">{issuesCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="missing">Missing</TabsTrigger>
              <TabsTrigger value="duplicate">Duplicates</TabsTrigger>
              <TabsTrigger value="mismatch">Mismatches</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-center">
                    <ArrowRightLeft className="h-4 w-4 mx-auto" />
                  </TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Difference</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getFilteredItems().map(item => {
                  const Icon = issueIcons[item.type];
                  return (
                    <TableRow 
                      key={item.id}
                      className={cn(
                        item.type !== 'matched' && 'bg-muted/30'
                      )}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={cn(severityColors[item.severity])}>
                            <Icon className="h-3 w-3 mr-1" />
                            {issueLabels[item.type]}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{item.source.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">{item.source.type}</Badge>
                            <span>{item.source.reference}</span>
                            <span>•</span>
                            <span className="font-mono">AED {item.source.amount.toLocaleString()}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.target ? (
                          <ArrowRightLeft className="h-4 w-4 mx-auto text-muted-foreground" />
                        ) : (
                          <FileQuestion className="h-4 w-4 mx-auto text-amber-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        {item.target ? (
                          <div>
                            <p className="font-medium text-sm">{item.target.description}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs">{item.target.type}</Badge>
                              <span>{item.target.reference}</span>
                              <span>•</span>
                              <span className="font-mono">AED {item.target.amount.toLocaleString()}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">
                            No matching entry found
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.difference ? (
                          <span className="text-red-500 font-mono font-medium">
                            AED {item.difference.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.confidence >= 0.9 ? 'default' : 'secondary'}>
                          {(item.confidence * 100).toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.type === 'matched' ? (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        ) : (
                          <div className="flex gap-1 justify-end">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => resolveItem(item.id, 'approved')}
                            >
                              Approve
                            </Button>
                            <Button size="sm" variant="ghost">
                              Review
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Critical Notice */}
      <Card className="border-red-500/30 bg-red-500/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Critical Error Detection</p>
              <p className="text-sm text-muted-foreground">
                This step identifies the most common bookkeeping errors: missing entries, duplicates, 
                and personal expenses. <strong>Missing entries are the #1 cause of inaccurate books.</strong> 
                Review all flagged items before proceeding.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Classification
        </Button>
        <Button size="lg" onClick={onProceed}>
          Proceed to Review
          {issuesCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {issuesCount} unresolved
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
}
