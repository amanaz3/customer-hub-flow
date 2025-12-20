import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, 
  Download,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  History,
  Printer,
  Mail,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportsStepProps {
  onProceed?: () => void;
  onBack?: () => void;
  demoMode?: boolean;
  accountingMethod?: 'cash' | 'accrual';
}

const profitLossData = {
  revenue: [
    { category: 'Consulting Services', amount: 285000 },
    { category: 'Software Licenses', amount: 125000 },
    { category: 'Training', amount: 45000 },
  ],
  expenses: [
    { category: 'Salaries & Wages', amount: 180000 },
    { category: 'Rent', amount: 75000 },
    { category: 'Software & Tools', amount: 42000 },
    { category: 'Marketing', amount: 28000 },
    { category: 'Travel', amount: 18500 },
    { category: 'Utilities', amount: 9600 },
    { category: 'Other', amount: 12400 },
  ],
};

const balanceSheetData = {
  assets: [
    { category: 'Cash & Bank', amount: 425000, type: 'current' },
    { category: 'Accounts Receivable', amount: 145000, type: 'current' },
    { category: 'Prepaid Expenses', amount: 28000, type: 'current' },
    { category: 'Fixed Assets (Net)', amount: 85000, type: 'non-current' },
  ],
  liabilities: [
    { category: 'Accounts Payable', amount: 68000, type: 'current' },
    { category: 'VAT Payable', amount: 16500, type: 'current' },
    { category: 'Accrued Expenses', amount: 22000, type: 'current' },
  ],
};

export function ReportsStep({ onProceed, onBack }: ReportsStepProps) {
  const [activeTab, setActiveTab] = useState('pnl');

  const totalRevenue = profitLossData.revenue.reduce((acc, r) => acc + r.amount, 0);
  const totalExpenses = profitLossData.expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const totalAssets = balanceSheetData.assets.reduce((acc, a) => acc + a.amount, 0);
  const totalLiabilities = balanceSheetData.liabilities.reduce((acc, l) => acc + l.amount, 0);
  const equity = totalAssets - totalLiabilities;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Reports & Outputs</h2>
          <p className="text-muted-foreground">
            Generate financial statements with full audit trail.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Send to Accountant
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold font-mono text-green-600">
                  AED {totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-xl font-bold font-mono text-red-600">
                  AED {totalExpenses.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Net Profit</p>
                <p className={cn(
                  'text-xl font-bold font-mono',
                  netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  AED {netProfit.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <PieChart className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Profit Margin</p>
                <p className="text-xl font-bold font-mono">
                  {((netProfit / totalRevenue) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pnl">Profit & Loss</TabsTrigger>
          <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        {/* Profit & Loss */}
        <TabsContent value="pnl">
          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss Statement</CardTitle>
              <CardDescription>Q4 2024 (October - December)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Revenue */}
                <div>
                  <h4 className="font-semibold text-green-600 mb-3">Revenue</h4>
                  <Table>
                    <TableBody>
                      {profitLossData.revenue.map(item => (
                        <TableRow key={item.category}>
                          <TableCell>{item.category}</TableCell>
                          <TableCell className="text-right font-mono">
                            AED {item.amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-green-500/10">
                        <TableCell>Total Revenue</TableCell>
                        <TableCell className="text-right font-mono text-green-600">
                          AED {totalRevenue.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Expenses */}
                <div>
                  <h4 className="font-semibold text-red-600 mb-3">Expenses</h4>
                  <Table>
                    <TableBody>
                      {profitLossData.expenses.map(item => (
                        <TableRow key={item.category}>
                          <TableCell>{item.category}</TableCell>
                          <TableCell className="text-right font-mono">
                            AED {item.amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-red-500/10">
                        <TableCell>Total Expenses</TableCell>
                        <TableCell className="text-right font-mono text-red-600">
                          AED {totalExpenses.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Net Profit */}
                <div className="pt-4 border-t-2">
                  <Table>
                    <TableBody>
                      <TableRow className="font-bold text-lg">
                        <TableCell>Net Profit</TableCell>
                        <TableCell className={cn(
                          'text-right font-mono',
                          netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          AED {netProfit.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balance Sheet */}
        <TabsContent value="balance">
          <Card>
            <CardHeader>
              <CardTitle>Balance Sheet</CardTitle>
              <CardDescription>As of December 31, 2024</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Assets */}
                <div>
                  <h4 className="font-semibold text-blue-600 mb-3">Assets</h4>
                  <Table>
                    <TableBody>
                      {balanceSheetData.assets.map(item => (
                        <TableRow key={item.category}>
                          <TableCell>
                            {item.category}
                            <Badge variant="outline" className="ml-2 text-xs">
                              {item.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            AED {item.amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-blue-500/10">
                        <TableCell>Total Assets</TableCell>
                        <TableCell className="text-right font-mono text-blue-600">
                          AED {totalAssets.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Liabilities & Equity */}
                <div>
                  <h4 className="font-semibold text-orange-600 mb-3">Liabilities</h4>
                  <Table>
                    <TableBody>
                      {balanceSheetData.liabilities.map(item => (
                        <TableRow key={item.category}>
                          <TableCell>
                            {item.category}
                            <Badge variant="outline" className="ml-2 text-xs">
                              {item.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            AED {item.amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-orange-500/10">
                        <TableCell>Total Liabilities</TableCell>
                        <TableCell className="text-right font-mono text-orange-600">
                          AED {totalLiabilities.toLocaleString()}
                        </TableCell>
                      </TableRow>
                      <TableRow className="font-bold">
                        <TableCell>Owner's Equity</TableCell>
                        <TableCell className="text-right font-mono text-purple-600">
                          AED {equity.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow */}
        <TabsContent value="cashflow">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Statement</CardTitle>
              <CardDescription>Q4 2024</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { section: 'Operating Activities', items: [
                    { label: 'Net Income', amount: netProfit },
                    { label: 'Depreciation', amount: 3750 },
                    { label: 'Change in Receivables', amount: -25000 },
                    { label: 'Change in Payables', amount: 12000 },
                  ]},
                  { section: 'Investing Activities', items: [
                    { label: 'Equipment Purchase', amount: -15000 },
                  ]},
                  { section: 'Financing Activities', items: [
                    { label: 'Owner Drawings', amount: -30000 },
                  ]},
                ].map(section => (
                  <div key={section.section}>
                    <h4 className="font-semibold mb-2">{section.section}</h4>
                    <Table>
                      <TableBody>
                        {section.items.map(item => (
                          <TableRow key={item.label}>
                            <TableCell>{item.label}</TableCell>
                            <TableCell className={cn(
                              'text-right font-mono',
                              item.amount >= 0 ? 'text-green-600' : 'text-red-600'
                            )}>
                              {item.amount >= 0 ? '' : '('}AED {Math.abs(item.amount).toLocaleString()}{item.amount < 0 ? ')' : ''}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Trail */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Audit Trail
              </CardTitle>
              <CardDescription>
                Complete history of all changes with timestamps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { date: '2024-12-15 14:32', user: 'John Smith', action: 'Classification Override', details: 'Changed category from "Other" to "Marketing"' },
                    { date: '2024-12-15 14:28', user: 'AI System', action: 'Auto-Match', details: 'Matched Bill-001 with Payment TXN-9912 (98% confidence)' },
                    { date: '2024-12-15 14:25', user: 'John Smith', action: 'Tax Override', details: 'Changed VAT treatment to zero-rated for export' },
                    { date: '2024-12-15 14:20', user: 'AI System', action: 'Document Import', details: 'Imported 12 documents via OCR' },
                    { date: '2024-12-15 10:15', user: 'Sarah Wilson', action: 'Approval', details: 'Approved accrual adjustment for December rent' },
                  ].map((log, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-sm">{log.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {log.user}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.details}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Tax View
        </Button>
        <Button size="lg" onClick={onProceed}>
          Proceed to Monitoring
        </Button>
      </div>
    </div>
  );
}
