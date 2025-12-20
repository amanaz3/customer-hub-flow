import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  Filter, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  ChevronDown,
  Building2,
  Calendar
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  demoMode: boolean;
}

const TransactionManager: React.FC<Props> = ({ demoMode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

  const categories = [
    { value: 'salaries', label: 'Salaries', color: 'bg-blue-500' },
    { value: 'rent', label: 'Rent', color: 'bg-purple-500' },
    { value: 'utilities', label: 'Utilities', color: 'bg-yellow-500' },
    { value: 'supplies', label: 'Supplies', color: 'bg-pink-500' },
    { value: 'services', label: 'Services', color: 'bg-indigo-500' },
    { value: 'sales', label: 'Sales', color: 'bg-emerald-500' },
    { value: 'other', label: 'Other', color: 'bg-gray-500' },
  ];

  const transactions = [
    {
      id: 'tx-001',
      date: '2024-01-15',
      description: 'ADCB Salary Transfer - Staff Payroll',
      bank: 'Emirates NBD',
      account: '****4521',
      amount: -45000,
      type: 'debit',
      category: 'salaries',
      status: 'matched',
      matchedTo: 'INV-2024-001',
      flags: [],
    },
    {
      id: 'tx-002',
      date: '2024-01-14',
      description: 'Client Payment - ABC Trading LLC',
      bank: 'Emirates NBD',
      account: '****4521',
      amount: 28500,
      type: 'credit',
      category: 'sales',
      status: 'matched',
      matchedTo: 'INV-2024-045',
      flags: [],
    },
    {
      id: 'tx-003',
      date: '2024-01-13',
      description: 'DEWA Electricity Bill - Dec 2023',
      bank: 'ADCB',
      account: '****9012',
      amount: -2850,
      type: 'debit',
      category: 'utilities',
      status: 'pending',
      matchedTo: null,
      flags: [],
    },
    {
      id: 'tx-004',
      date: '2024-01-12',
      description: 'Office Rent Payment - Q1 2024',
      bank: 'Emirates NBD',
      account: '****4521',
      amount: -25000,
      type: 'debit',
      category: 'rent',
      status: 'matched',
      matchedTo: 'BILL-2024-012',
      flags: [],
    },
    {
      id: 'tx-005',
      date: '2024-01-11',
      description: 'Payment Received - XYZ Global FZE',
      bank: 'FAB',
      account: '****3456',
      amount: 15750,
      type: 'credit',
      category: 'sales',
      status: 'flagged',
      matchedTo: null,
      flags: ['Large Transaction', 'New Customer'],
    },
    {
      id: 'tx-006',
      date: '2024-01-10',
      description: 'DU Mobile Services',
      bank: 'ADCB',
      account: '****9012',
      amount: -450,
      type: 'debit',
      category: 'utilities',
      status: 'matched',
      matchedTo: 'BILL-2024-008',
      flags: [],
    },
    {
      id: 'tx-007',
      date: '2024-01-09',
      description: 'Amazon UAE - Office Supplies',
      bank: 'Emirates NBD',
      account: '****7834',
      amount: -1250,
      type: 'debit',
      category: 'supplies',
      status: 'pending',
      matchedTo: null,
      flags: ['Possible Duplicate'],
    },
    {
      id: 'tx-008',
      date: '2024-01-08',
      description: 'Consulting Fee - Tech Solutions',
      bank: 'Emirates NBD',
      account: '****4521',
      amount: -8500,
      type: 'debit',
      category: 'services',
      status: 'matched',
      matchedTo: 'BILL-2024-005',
      flags: [],
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'matched':
        return <Badge className="bg-emerald-500 gap-1"><CheckCircle2 className="h-3 w-3" /> Matched</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'flagged':
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Flagged</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    return categories.find(c => c.value === category)?.color || 'bg-gray-500';
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tx.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || tx.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (selectedTransactions.length === filteredTransactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(filteredTransactions.map(tx => tx.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedTransactions(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (!demoMode) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Transactions</h3>
          <p className="text-muted-foreground mb-4">
            Enable demo mode to see sample transactions or connect a bank account
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters & Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {selectedTransactions.length > 0 && (
                <>
                  <Badge variant="secondary">{selectedTransactions.length} selected</Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowCategoryDialog(true)}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    Bulk Categorize
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>
                {filteredTransactions.length} transactions found
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Showing:</span>
              <Select defaultValue="50">
                <SelectTrigger className="w-[80px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-3 bg-muted/50 text-sm font-medium border-b">
              <div className="col-span-1 flex items-center">
                <Checkbox 
                  checked={selectedTransactions.length === filteredTransactions.length}
                  onCheckedChange={toggleSelectAll}
                />
              </div>
              <div className="col-span-1">Date</div>
              <div className="col-span-4">Description</div>
              <div className="col-span-1">Bank</div>
              <div className="col-span-1">Category</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1"></div>
            </div>

            {/* Transaction Rows */}
            {filteredTransactions.map((tx) => (
              <div 
                key={tx.id}
                className={`grid grid-cols-12 gap-4 p-3 border-b last:border-0 items-center hover:bg-muted/30 transition-colors ${
                  selectedTransactions.includes(tx.id) ? 'bg-primary/5' : ''
                }`}
              >
                <div className="col-span-1">
                  <Checkbox 
                    checked={selectedTransactions.includes(tx.id)}
                    onCheckedChange={() => toggleSelect(tx.id)}
                  />
                </div>
                <div className="col-span-1 text-sm text-muted-foreground">
                  {new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </div>
                <div className="col-span-4">
                  <p className="text-sm font-medium truncate">{tx.description}</p>
                  {tx.flags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {tx.flags.map(flag => (
                        <Badge key={flag} variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="col-span-1">
                  <div className="text-xs text-muted-foreground">
                    {tx.bank}
                    <br />
                    <span className="font-mono">{tx.account}</span>
                  </div>
                </div>
                <div className="col-span-1">
                  <Badge 
                    variant="outline" 
                    className="gap-1 cursor-pointer hover:bg-muted"
                    onClick={() => {
                      setEditingTransaction(tx);
                      setShowCategoryDialog(true);
                    }}
                  >
                    <div className={`w-2 h-2 rounded-full ${getCategoryColor(tx.category)}`} />
                    {categories.find(c => c.value === tx.category)?.label}
                  </Badge>
                </div>
                <div className="col-span-2 text-right">
                  <span className={`font-semibold ${tx.type === 'credit' ? 'text-emerald-600' : ''}`}>
                    {tx.type === 'credit' ? '+' : '-'}AED {Math.abs(tx.amount).toLocaleString()}
                  </span>
                  {tx.matchedTo && (
                    <p className="text-xs text-muted-foreground mt-0.5">→ {tx.matchedTo}</p>
                  )}
                </div>
                <div className="col-span-1">
                  {getStatusBadge(tx.status)}
                </div>
                <div className="col-span-1 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setEditingTransaction(tx);
                        setShowCategoryDialog(true);
                      }}>
                        <Tag className="h-4 w-4 mr-2" />
                        Change Category
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Match to Invoice
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Flag for Review
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-muted-foreground">
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? 'Change Category' : `Categorize ${selectedTransactions.length} Transactions`}
            </DialogTitle>
            <DialogDescription>
              {editingTransaction 
                ? editingTransaction.description 
                : 'Select a category for the selected transactions'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-2">
              {categories.map(cat => (
                <Button
                  key={cat.value}
                  variant="outline"
                  className="justify-start gap-2 h-auto py-3"
                >
                  <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                  {cat.label}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea placeholder="Add a note about this categorization..." />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCategoryDialog(false);
              setEditingTransaction(null);
            }}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowCategoryDialog(false);
              setEditingTransaction(null);
              setSelectedTransactions([]);
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionManager;
