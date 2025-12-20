import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Search, 
  Filter, 
  Download,
  RefreshCw,
  Landmark,
  Tag,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export interface LeanTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  type: 'credit' | 'debit';
  category?: string;
  bankName: string;
  accountNumber: string;
  reference?: string;
  status: 'pending' | 'categorized' | 'reconciled';
  source: 'lean';
}

interface LeanTransactionFeedProps {
  leanEnabled: boolean;
  demoMode?: boolean;
  onImportToWorkflow?: (transactions: LeanTransaction[]) => void;
}

// Demo transactions from UAE banks
const demoTransactions: LeanTransaction[] = [
  {
    id: 'lt-1',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'ADNOC Service Station',
    amount: 350.00,
    currency: 'AED',
    type: 'debit',
    category: 'Transportation',
    bankName: 'Emirates NBD',
    accountNumber: '****4521',
    reference: 'TXN2024120001',
    status: 'categorized',
    source: 'lean'
  },
  {
    id: 'lt-2',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Carrefour Hypermarket',
    amount: 892.50,
    currency: 'AED',
    type: 'debit',
    category: 'Office Supplies',
    bankName: 'Emirates NBD',
    accountNumber: '****4521',
    reference: 'TXN2024120002',
    status: 'categorized',
    source: 'lean'
  },
  {
    id: 'lt-3',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Transfer from ABC Trading LLC',
    amount: 45000.00,
    currency: 'AED',
    type: 'credit',
    category: 'Sales Revenue',
    bankName: 'Emirates NBD',
    accountNumber: '****4521',
    reference: 'TXN2024119003',
    status: 'reconciled',
    source: 'lean'
  },
  {
    id: 'lt-4',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Dubai Electricity DEWA',
    amount: 2450.00,
    currency: 'AED',
    type: 'debit',
    category: 'Utilities',
    bankName: 'ADCB',
    accountNumber: '****8832',
    reference: 'TXN2024119004',
    status: 'categorized',
    source: 'lean'
  },
  {
    id: 'lt-5',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Etisalat Monthly Bill',
    amount: 1250.00,
    currency: 'AED',
    type: 'debit',
    category: 'Telecommunications',
    bankName: 'ADCB',
    accountNumber: '****8832',
    reference: 'TXN2024118005',
    status: 'pending',
    source: 'lean'
  },
  {
    id: 'lt-6',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Salary Transfer - Mohammed Ali',
    amount: 15000.00,
    currency: 'AED',
    type: 'debit',
    category: 'Salaries',
    bankName: 'Emirates NBD',
    accountNumber: '****4521',
    reference: 'TXN2024118006',
    status: 'reconciled',
    source: 'lean'
  },
  {
    id: 'lt-7',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Transfer from XYZ Consulting',
    amount: 28500.00,
    currency: 'AED',
    type: 'credit',
    category: 'Consulting Revenue',
    bankName: 'Emirates NBD',
    accountNumber: '****4521',
    reference: 'TXN2024117007',
    status: 'pending',
    source: 'lean'
  },
  {
    id: 'lt-8',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Amazon UAE Purchase',
    amount: 1580.00,
    currency: 'AED',
    type: 'debit',
    category: 'Office Supplies',
    bankName: 'ADCB',
    accountNumber: '****8832',
    reference: 'TXN2024116008',
    status: 'categorized',
    source: 'lean'
  }
];

export function LeanTransactionFeed({ leanEnabled, demoMode = false, onImportToWorkflow }: LeanTransactionFeedProps) {
  const [transactions, setTransactions] = useState<LeanTransaction[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (leanEnabled && demoMode) {
      setTransactions(demoTransactions);
    } else if (!leanEnabled) {
      setTransactions([]);
    }
  }, [leanEnabled, demoMode]);

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tx.reference?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredTransactions.map(tx => tx.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (demoMode) {
      setTransactions(demoTransactions);
    }
    setIsLoading(false);
  };

  const handleImportSelected = () => {
    const selectedTxs = transactions.filter(tx => selectedIds.has(tx.id));
    onImportToWorkflow?.(selectedTxs);
    setSelectedIds(new Set());
  };

  const getStatusBadge = (status: LeanTransaction['status']) => {
    switch (status) {
      case 'reconciled':
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30"><CheckCircle2 className="h-3 w-3 mr-1" /> Reconciled</Badge>;
      case 'categorized':
        return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30"><Tag className="h-3 w-3 mr-1" /> Categorized</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
    }
  };

  if (!leanEnabled) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-12 text-center text-muted-foreground">
          <Landmark className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Lean Integration Disabled</p>
          <p className="text-sm">Enable Lean Integration to view bank transactions</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Bank Transactions
              <Badge variant="outline" className="text-xs font-normal">via Lean</Badge>
            </CardTitle>
            <CardDescription>
              Auto-fetched transactions from connected UAE bank accounts
            </CardDescription>
          </div>
          
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading} className="gap-2">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search transactions..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="categorized">Categorized</SelectItem>
              <SelectItem value="reconciled">Reconciled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="credit">Credits</SelectItem>
              <SelectItem value="debit">Debits</SelectItem>
            </SelectContent>
          </Select>
          
          {selectedIds.size > 0 && (
            <Button onClick={handleImportSelected} className="gap-2">
              <Download className="h-4 w-4" />
              Import {selectedIds.size} to Workflow
            </Button>
          )}
        </div>

        {/* Transactions Table */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox 
                    checked={selectedIds.size === filteredTransactions.length && filteredTransactions.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.has(tx.id)}
                        onCheckedChange={(checked) => handleSelectOne(tx.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(tx.date), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {tx.type === 'credit' ? (
                          <ArrowDownLeft className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-red-600" />
                        )}
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">{tx.reference}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{tx.bankName}</p>
                        <p className="text-muted-foreground">{tx.accountNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {tx.category ? (
                        <Badge variant="outline">{tx.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Uncategorized</span>
                      )}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-mono font-medium",
                      tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                    )}>
                      {tx.type === 'credit' ? '+' : '-'}{tx.currency} {tx.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(tx.status)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        {filteredTransactions.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
            <span>
              Showing {filteredTransactions.length} transactions
              {selectedIds.size > 0 && ` • ${selectedIds.size} selected`}
            </span>
            <div className="flex items-center gap-4">
              <span className="text-green-600">
                Credits: AED {filteredTransactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0).toLocaleString()}
              </span>
              <span className="text-red-600">
                Debits: AED {filteredTransactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
