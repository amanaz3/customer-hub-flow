import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Loader2,
  ArrowDownLeft,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { useBookkeeper, Bill, Invoice, Reconciliation } from '@/hooks/useBookkeeper';
import { format } from 'date-fns';

interface ReconciliationViewProps {
  demoMode?: boolean;
}

export function ReconciliationView({ demoMode = false }: ReconciliationViewProps) {
  const { 
    bills, 
    invoices, 
    reconciliations, 
    runReconciliation, 
    loading,
    fetchBills,
    fetchInvoices,
    fetchReconciliations
  } = useBookkeeper(demoMode);
  
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResults, setReconcileResults] = useState<{
    matched: number;
    partial: number;
    unmatched: number;
    discrepancies: any[];
  } | null>(null);

  const handleRunReconciliation = async (type: 'payable' | 'receivable' | 'all') => {
    setReconciling(true);
    const results = await runReconciliation(type);
    if (results) {
      setReconcileResults(results);
    }
    setReconciling(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'matched':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Matched</Badge>;
      case 'partial':
        return <Badge variant="secondary" className="bg-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" /> Partial</Badge>;
      case 'unmatched':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Unmatched</Badge>;
      case 'disputed':
        return <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" /> Disputed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const overdueBills = bills.filter(b => b.due_date && new Date(b.due_date) < new Date() && !b.is_paid);
  const overdueInvoices = invoices.filter(i => i.due_date && new Date(i.due_date) < new Date() && !i.is_paid);
  const pendingBills = bills.filter(b => !b.is_paid);
  const pendingInvoices = invoices.filter(i => !i.is_paid);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Payables</p>
                <p className="text-2xl font-bold">
                  {pendingBills.reduce((sum, b) => sum + Number(b.total_amount) - Number(b.paid_amount), 0).toLocaleString()} AED
                </p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Receivables</p>
                <p className="text-2xl font-bold">
                  {pendingInvoices.reduce((sum, i) => sum + Number(i.total_amount) - Number(i.paid_amount), 0).toLocaleString()} AED
                </p>
              </div>
              <ArrowDownLeft className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue Bills</p>
                <p className="text-2xl font-bold text-red-500">{overdueBills.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue Invoices</p>
                <p className="text-2xl font-bold text-yellow-600">{overdueInvoices.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reconciliation Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Reconciliation</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleRunReconciliation('payable')}
                disabled={reconciling}
              >
                {reconciling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Reconcile Payables
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleRunReconciliation('receivable')}
                disabled={reconciling}
              >
                {reconciling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Reconcile Receivables
              </Button>
              <Button 
                onClick={() => handleRunReconciliation('all')}
                disabled={reconciling}
              >
                {reconciling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Run Full Reconciliation
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Match bills with payments and invoices with receipts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reconcileResults && (
            <Alert className="mb-4">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Reconciliation Complete</AlertTitle>
              <AlertDescription>
                <div className="flex gap-4 mt-2">
                  <span className="flex items-center gap-1">
                    <Badge className="bg-green-500">{reconcileResults.matched}</Badge> Matched
                  </span>
                  <span className="flex items-center gap-1">
                    <Badge variant="secondary" className="bg-yellow-500">{reconcileResults.partial}</Badge> Partial
                  </span>
                  <span className="flex items-center gap-1">
                    <Badge variant="destructive">{reconcileResults.unmatched}</Badge> Unmatched
                  </span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="payables">
            <TabsList>
              <TabsTrigger value="payables">
                Accounts Payable ({pendingBills.length})
              </TabsTrigger>
              <TabsTrigger value="receivables">
                Accounts Receivable ({pendingInvoices.length})
              </TabsTrigger>
              <TabsTrigger value="discrepancies">
                Discrepancies ({reconcileResults?.discrepancies.length || 0})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="payables">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Bill Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingBills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No pending bills
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingBills.map((bill) => {
                      const isOverdue = bill.due_date && new Date(bill.due_date) < new Date();
                      return (
                        <TableRow key={bill.id} className={isOverdue ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                          <TableCell className="font-medium">{bill.reference_number}</TableCell>
                          <TableCell>{bill.vendor_name || 'Unknown'}</TableCell>
                          <TableCell>{format(new Date(bill.bill_date), 'dd MMM yyyy')}</TableCell>
                          <TableCell>
                            {bill.due_date ? format(new Date(bill.due_date), 'dd MMM yyyy') : '-'}
                            {isOverdue && <Badge variant="destructive" className="ml-2">Overdue</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            {Number(bill.total_amount).toLocaleString()} {bill.currency}
                          </TableCell>
                          <TableCell className="text-right">
                            {Number(bill.paid_amount).toLocaleString()} {bill.currency}
                          </TableCell>
                          <TableCell>{getStatusBadge(bill.status)}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="receivables">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No pending invoices
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingInvoices.map((invoice) => {
                      const isOverdue = invoice.due_date && new Date(invoice.due_date) < new Date();
                      return (
                        <TableRow key={invoice.id} className={isOverdue ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}>
                          <TableCell className="font-medium">{invoice.reference_number}</TableCell>
                          <TableCell>{invoice.customer_name || 'Unknown'}</TableCell>
                          <TableCell>{format(new Date(invoice.invoice_date), 'dd MMM yyyy')}</TableCell>
                          <TableCell>
                            {invoice.due_date ? format(new Date(invoice.due_date), 'dd MMM yyyy') : '-'}
                            {isOverdue && <Badge variant="secondary" className="ml-2 bg-yellow-500">Overdue</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            {Number(invoice.total_amount).toLocaleString()} {invoice.currency}
                          </TableCell>
                          <TableCell className="text-right">
                            {Number(invoice.paid_amount).toLocaleString()} {invoice.currency}
                          </TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="discrepancies">
              {reconcileResults?.discrepancies && reconcileResults.discrepancies.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Expected</TableHead>
                      <TableHead className="text-right">Actual</TableHead>
                      <TableHead className="text-right">Discrepancy</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reconcileResults.discrepancies.map((d, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Badge variant={d.type === 'payable' ? 'destructive' : 'secondary'}>
                            {d.type === 'payable' ? 'Payable' : 'Receivable'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{d.reference}</TableCell>
                        <TableCell className="text-right">{d.expectedAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{d.actualAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-red-500">
                          {d.discrepancy.toLocaleString()}
                        </TableCell>
                        <TableCell>{d.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No discrepancies found. Run reconciliation to check for issues.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
