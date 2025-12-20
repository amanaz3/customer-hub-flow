import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Download, 
  Calendar, 
  FileSpreadsheet, 
  Printer,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  CheckCircle2,
  Building2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface Props {
  demoMode: boolean;
}

const OpenBankingReports: React.FC<Props> = ({ demoMode }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('jan-2024');

  const monthlyData = [
    { month: 'Aug', revenue: 145000, expenses: 112000, profit: 33000 },
    { month: 'Sep', revenue: 158000, expenses: 125000, profit: 33000 },
    { month: 'Oct', revenue: 142000, expenses: 108000, profit: 34000 },
    { month: 'Nov', revenue: 175000, expenses: 132000, profit: 43000 },
    { month: 'Dec', revenue: 192000, expenses: 145000, profit: 47000 },
    { month: 'Jan', revenue: 178000, expenses: 135000, profit: 43000 },
  ];

  const expensesByCategory = [
    { category: 'Salaries', amount: 45000, percentage: 33 },
    { category: 'Rent', amount: 25000, percentage: 19 },
    { category: 'Services', amount: 20000, percentage: 15 },
    { category: 'Supplies', amount: 15000, percentage: 11 },
    { category: 'Utilities', amount: 12000, percentage: 9 },
    { category: 'Marketing', amount: 10000, percentage: 7 },
    { category: 'Other', amount: 8000, percentage: 6 },
  ];

  const reportTypes = [
    {
      id: 'profit-loss',
      name: 'Profit & Loss Statement',
      description: 'Monthly income and expense summary',
      icon: TrendingUp,
      formats: ['PDF', 'Excel'],
      lastGenerated: '2024-01-15',
    },
    {
      id: 'vat-report',
      name: 'VAT Report',
      description: 'UAE VAT filing ready report',
      icon: FileText,
      formats: ['PDF', 'Excel', 'FTA Format'],
      lastGenerated: '2024-01-10',
    },
    {
      id: 'bank-reconciliation',
      name: 'Bank Reconciliation',
      description: 'Matched transactions summary',
      icon: CheckCircle2,
      formats: ['PDF', 'Excel'],
      lastGenerated: '2024-01-14',
    },
    {
      id: 'expense-report',
      name: 'Expense Report',
      description: 'Categorized expense breakdown',
      icon: TrendingDown,
      formats: ['PDF', 'Excel'],
      lastGenerated: '2024-01-12',
    },
    {
      id: 'cash-flow',
      name: 'Cash Flow Statement',
      description: 'Inflows and outflows analysis',
      icon: ArrowRight,
      formats: ['PDF', 'Excel'],
      lastGenerated: '2024-01-13',
    },
    {
      id: 'aging-report',
      name: 'Aging Report',
      description: 'Outstanding receivables & payables',
      icon: Clock,
      formats: ['PDF', 'Excel'],
      lastGenerated: '2024-01-11',
    },
  ];

  if (!demoMode) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Reports</h3>
          <p className="text-muted-foreground mb-4">
            Enable demo mode to see sample reports
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jan-2024">January 2024</SelectItem>
              <SelectItem value="dec-2023">December 2023</SelectItem>
              <SelectItem value="nov-2023">November 2023</SelectItem>
              <SelectItem value="q4-2023">Q4 2023</SelectItem>
              <SelectItem value="2023">Full Year 2023</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export All to Excel
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print Reports
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold">AED 178,000</p>
            <div className="flex items-center gap-1 mt-1 text-sm text-emerald-600">
              <TrendingUp className="h-4 w-4" />
              <span>+8.2% from last month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 border-rose-500/20">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold">AED 135,000</p>
            <div className="flex items-center gap-1 mt-1 text-sm text-rose-600">
              <TrendingDown className="h-4 w-4" />
              <span>-6.9% from last month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Net Profit</p>
            <p className="text-2xl font-bold">AED 43,000</p>
            <div className="flex items-center gap-1 mt-1 text-sm text-blue-600">
              <TrendingUp className="h-4 w-4" />
              <span>24.1% margin</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
            <CardDescription>Last 6 months trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `${value / 1000}K`} />
                  <Tooltip 
                    formatter={(value: number) => [`AED ${value.toLocaleString()}`, '']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>By category for January 2024</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expensesByCategory.map((item) => (
                <div key={item.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{item.category}</span>
                    <span className="text-sm font-medium">AED {item.amount.toLocaleString()}</span>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-primary rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Types */}
      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription>Generate and download financial reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <report.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{report.name}</h4>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {report.formats.map((format) => (
                        <Badge key={format} variant="outline" className="text-xs">
                          {format}
                        </Badge>
                      ))}
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Last generated: {report.lastGenerated}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* VAT Section */}
      <Card className="bg-gradient-to-r from-blue-500/5 to-indigo-500/5 border-blue-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                UAE VAT Compliance
              </CardTitle>
              <CardDescription>Q1 2024 VAT filing preparation</CardDescription>
            </div>
            <Badge className="bg-emerald-500">Ready to File</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 rounded-lg bg-emerald-500/10">
              <p className="text-sm text-muted-foreground">Output VAT</p>
              <p className="text-xl font-bold text-emerald-600">AED 18,450</p>
            </div>
            <div className="p-4 rounded-lg bg-rose-500/10">
              <p className="text-sm text-muted-foreground">Input VAT</p>
              <p className="text-xl font-bold text-rose-600">AED 12,680</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10">
              <p className="text-sm text-muted-foreground">Net VAT Payable</p>
              <p className="text-xl font-bold">AED 5,770</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Download FTA Format
            </Button>
            <Button variant="outline">
              Review VAT Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OpenBankingReports;
