import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Receipt, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import { useBookkeeper, Bill, Invoice } from '@/hooks/useBookkeeper';
import { format } from 'date-fns';

interface TransactionHistoryProps {
  demoMode?: boolean;
}

export function TransactionHistory({ demoMode = false }: TransactionHistoryProps) {
  const { bills, invoices, loading } = useBookkeeper(demoMode);

  const getStatusBadge = (status: string, isPaid: boolean) => {
    if (isPaid) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Paid</Badge>;
    }
    if (status === 'overdue') {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Overdue</Badge>;
    }
    return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-AE', { 
      style: 'currency', 
      currency: currency || 'AED',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd MMM yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="bills" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bills" className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-red-500" />
            Bills (Payables)
            <Badge variant="secondary" className="ml-1">{bills.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <ArrowDownLeft className="h-4 w-4 text-green-500" />
            Invoices (Receivables)
            <Badge variant="secondary" className="ml-1">{invoices.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bills">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Bills & Payables
              </CardTitle>
              <CardDescription>
                All bills from vendors that need to be paid
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bills.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No bills found. Enable demo mode to see sample data.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Bill Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>OCR</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bills.map((bill) => (
                        <TableRow key={bill.id}>
                          <TableCell className="font-mono text-sm">
                            {bill.reference_number}
                          </TableCell>
                          <TableCell className="font-medium">
                            {bill.vendor_name || 'Unknown Vendor'}
                          </TableCell>
                          <TableCell>{formatDate(bill.bill_date)}</TableCell>
                          <TableCell>{formatDate(bill.due_date)}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(bill.total_amount, bill.currency)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(bill.status, bill.is_paid)}
                          </TableCell>
                          <TableCell>
                            {bill.ocr_confidence ? (
                              <Badge variant="outline" className="text-xs">
                                {Math.round(bill.ocr_confidence * 100)}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* Summary */}
              {bills.length > 0 && (
                <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Total Payables:</span>
                    <span className="font-semibold">
                      {formatCurrency(
                        bills.filter(b => !b.is_paid).reduce((sum, b) => sum + b.total_amount, 0),
                        'AED'
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Paid:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(
                        bills.filter(b => b.is_paid).reduce((sum, b) => sum + b.total_amount, 0),
                        'AED'
                      )}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoices & Receivables
              </CardTitle>
              <CardDescription>
                All invoices sent to customers awaiting payment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No invoices found. Enable demo mode to see sample data.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Invoice Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono text-sm">
                            {invoice.reference_number}
                          </TableCell>
                          <TableCell className="font-medium">
                            {invoice.customer_name || 'Unknown Customer'}
                          </TableCell>
                          <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                          <TableCell>{formatDate(invoice.due_date)}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(invoice.total_amount, invoice.currency)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(invoice.status, invoice.is_paid)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* Summary */}
              {invoices.length > 0 && (
                <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Total Receivables:</span>
                    <span className="font-semibold">
                      {formatCurrency(
                        invoices.filter(i => !i.is_paid).reduce((sum, i) => sum + i.total_amount, 0),
                        'AED'
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Received:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(
                        invoices.filter(i => i.is_paid).reduce((sum, i) => sum + i.total_amount, 0),
                        'AED'
                      )}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
