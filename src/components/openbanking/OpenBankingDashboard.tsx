import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Building2,
  RefreshCw,
  MoreHorizontal,
  ArrowRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

interface Props {
  demoMode: boolean;
}

const OpenBankingDashboard: React.FC<Props> = ({ demoMode }) => {
  // Demo data
  const cashFlowData = [
    { month: 'Jan', inflow: 125000, outflow: 98000 },
    { month: 'Feb', inflow: 145000, outflow: 112000 },
    { month: 'Mar', inflow: 132000, outflow: 105000 },
    { month: 'Apr', inflow: 168000, outflow: 128000 },
    { month: 'May', inflow: 155000, outflow: 118000 },
    { month: 'Jun', inflow: 178000, outflow: 135000 },
  ];

  const categoryBreakdown = [
    { name: 'Salaries', value: 45000, color: '#10b981', percentage: 35 },
    { name: 'Rent', value: 25000, color: '#3b82f6', percentage: 20 },
    { name: 'Utilities', value: 8000, color: '#f59e0b', percentage: 6 },
    { name: 'Supplies', value: 15000, color: '#8b5cf6', percentage: 12 },
    { name: 'Services', value: 20000, color: '#ec4899', percentage: 16 },
    { name: 'Other', value: 14000, color: '#6b7280', percentage: 11 },
  ];

  const recentTransactions = [
    { id: 1, description: 'ADCB Salary Transfer', amount: -45000, type: 'debit', category: 'Salaries', date: '2024-01-15', status: 'matched' },
    { id: 2, description: 'Client Payment - ABC Corp', amount: 28500, type: 'credit', category: 'Sales', date: '2024-01-14', status: 'matched' },
    { id: 3, description: 'DEWA Bill Payment', amount: -2850, type: 'debit', category: 'Utilities', date: '2024-01-13', status: 'pending' },
    { id: 4, description: 'Office Rent - Q1', amount: -25000, type: 'debit', category: 'Rent', date: '2024-01-12', status: 'matched' },
    { id: 5, description: 'Payment from XYZ LLC', amount: 15750, type: 'credit', category: 'Sales', date: '2024-01-11', status: 'flagged' },
  ];

  const connectedBanks = [
    { name: 'Emirates NBD', balance: 425000, lastSync: '5 min ago', accounts: 2 },
    { name: 'ADCB', balance: 312500, lastSync: '12 min ago', accounts: 1 },
    { name: 'FAB', balance: 109750, lastSync: '8 min ago', accounts: 1 },
  ];

  if (!demoMode) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Connect Your Bank</h3>
          <p className="text-muted-foreground mb-4">
            Enable demo mode or connect a UAE bank account to see your dashboard
          </p>
          <Button>Connect Bank Account</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bank Accounts Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {connectedBanks.map((bank) => (
          <Card key={bank.name} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{bank.name}</p>
                    <p className="text-xs text-muted-foreground">{bank.accounts} account(s)</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-2xl font-bold">AED {bank.balance.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Last sync: {bank.lastSync}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Cash Flow Overview</CardTitle>
              <CardDescription>6-month inflow vs outflow trend</CardDescription>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Inflow</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <span>Outflow</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowData}>
                  <defs>
                    <linearGradient id="inflowGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="outflowGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
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
                  <Area 
                    type="monotone" 
                    dataKey="inflow" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#inflowGradient)" 
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="outflow" 
                    stroke="#f43f5e" 
                    fillOpacity={1} 
                    fill="url(#outflowGradient)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
            <CardDescription>This month's breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[180px] mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`AED ${value.toLocaleString()}`, '']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {categoryBreakdown.slice(0, 4).map((category) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: category.color }} 
                    />
                    <span className="text-sm">{category.name}</span>
                  </div>
                  <span className="text-sm font-medium">{category.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest activity across all accounts</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div 
                key={tx.id} 
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    tx.type === 'credit' 
                      ? 'bg-emerald-500/10 text-emerald-600' 
                      : 'bg-rose-500/10 text-rose-600'
                  }`}>
                    {tx.type === 'credit' ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{tx.date}</span>
                      <Badge variant="outline" className="text-xs py-0">
                        {tx.category}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={
                      tx.status === 'matched' ? 'default' : 
                      tx.status === 'flagged' ? 'destructive' : 
                      'secondary'
                    }
                    className="text-xs"
                  >
                    {tx.status}
                  </Badge>
                  <p className={`font-semibold ${
                    tx.type === 'credit' ? 'text-emerald-600' : 'text-foreground'
                  }`}>
                    {tx.type === 'credit' ? '+' : ''}AED {Math.abs(tx.amount).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reconciliation Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Reconciliation Status</CardTitle>
            <CardDescription>January 2024 progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Matched Transactions</span>
                <span className="text-sm font-medium">78%</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Categorized</span>
                <span className="text-sm font-medium">92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Pending Review</span>
                <span className="text-sm font-medium text-amber-600">23 items</span>
              </div>
              <Progress value={15} className="h-2 bg-amber-100" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>VAT Summary</CardTitle>
            <CardDescription>Q1 2024 overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10">
                <div>
                  <p className="text-sm text-muted-foreground">Output VAT (Collected)</p>
                  <p className="text-xl font-bold text-emerald-600">AED 18,450</p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-500/50" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-rose-500/10">
                <div>
                  <p className="text-sm text-muted-foreground">Input VAT (Paid)</p>
                  <p className="text-xl font-bold text-rose-600">AED 12,680</p>
                </div>
                <TrendingDown className="h-8 w-8 text-rose-500/50" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                <div>
                  <p className="text-sm text-muted-foreground">Net VAT Payable</p>
                  <p className="text-xl font-bold">AED 5,770</p>
                </div>
                <Badge>Due Feb 28</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OpenBankingDashboard;
