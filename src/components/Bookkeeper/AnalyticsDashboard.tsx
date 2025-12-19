import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  RefreshCw,
  Loader2,
  BarChart3,
  PieChart,
  AlertCircle
} from 'lucide-react';
import { useBookkeeper } from '@/hooks/useBookkeeper';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';
import { format } from 'date-fns';

interface AnalyticsData {
  summary: {
    totalExpectedInflow: number;
    totalExpectedOutflow: number;
    netCashFlow: number;
    overdueReceivables: number;
    overduePayables: number;
    accountingMethod: string;
  };
  weeklyForecasts: Array<{
    weekStart: string;
    weekEnd: string;
    expectedInflow: number;
    expectedOutflow: number;
    netCashFlow: number;
  }>;
  agingBuckets: {
    current: { payables: number; receivables: number };
    '1-30': { payables: number; receivables: number };
    '31-60': { payables: number; receivables: number };
    '61-90': { payables: number; receivables: number };
    '90+': { payables: number; receivables: number };
  };
  billsCount: number;
  invoicesCount: number;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

export function AnalyticsDashboard() {
  const { getAnalytics, bills, invoices } = useBookkeeper();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [forecastDays, setForecastDays] = useState('30');
  const [accountingMethod, setAccountingMethod] = useState<'cash' | 'accrual'>('accrual');

  const fetchAnalytics = async () => {
    setLoading(true);
    const data = await getAnalytics(parseInt(forecastDays), accountingMethod);
    if (data) {
      setAnalytics(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAnalytics();
  }, [forecastDays, accountingMethod]);

  const agingData = analytics?.agingBuckets ? [
    { name: 'Current', payables: analytics.agingBuckets.current.payables, receivables: analytics.agingBuckets.current.receivables },
    { name: '1-30 Days', payables: analytics.agingBuckets['1-30'].payables, receivables: analytics.agingBuckets['1-30'].receivables },
    { name: '31-60 Days', payables: analytics.agingBuckets['31-60'].payables, receivables: analytics.agingBuckets['31-60'].receivables },
    { name: '61-90 Days', payables: analytics.agingBuckets['61-90'].payables, receivables: analytics.agingBuckets['61-90'].receivables },
    { name: '90+ Days', payables: analytics.agingBuckets['90+'].payables, receivables: analytics.agingBuckets['90+'].receivables },
  ] : [];

  const pieData = analytics?.summary ? [
    { name: 'Expected Inflow', value: analytics.summary.totalExpectedInflow },
    { name: 'Expected Outflow', value: analytics.summary.totalExpectedOutflow },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Forecast Period:</span>
            <Select value={forecastDays} onValueChange={setForecastDays}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="14">14 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="60">60 Days</SelectItem>
                <SelectItem value="90">90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Method:</span>
            <Select value={accountingMethod} onValueChange={(v) => setAccountingMethod(v as any)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="accrual">Accrual</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button onClick={fetchAnalytics} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {analytics?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Expected Inflow</p>
                  <p className="text-2xl font-bold text-green-600">
                    {analytics.summary.totalExpectedInflow.toLocaleString()} AED
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Expected Outflow</p>
                  <p className="text-2xl font-bold text-red-600">
                    {analytics.summary.totalExpectedOutflow.toLocaleString()} AED
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className={analytics.summary.netCashFlow >= 0 ? 'border-green-200' : 'border-red-200'}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Cash Flow</p>
                  <p className={`text-2xl font-bold ${analytics.summary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analytics.summary.netCashFlow.toLocaleString()} AED
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue Receivables</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {analytics.summary.overdueReceivables.toLocaleString()} AED
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue Payables</p>
                  <p className="text-2xl font-bold text-red-600">
                    {analytics.summary.overduePayables.toLocaleString()} AED
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts */}
      {analytics?.summary && (
        <>
          {analytics.summary.overduePayables > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Overdue Payments Alert</AlertTitle>
              <AlertDescription>
                You have {analytics.summary.overduePayables.toLocaleString()} AED in overdue payables. 
                Review and schedule payments to avoid late fees.
              </AlertDescription>
            </Alert>
          )}
          
          {analytics.summary.netCashFlow < 0 && (
            <Alert>
              <TrendingDown className="h-4 w-4" />
              <AlertTitle>Cash Flow Warning</AlertTitle>
              <AlertDescription>
                Expected outflows exceed inflows by {Math.abs(analytics.summary.netCashFlow).toLocaleString()} AED 
                in the next {forecastDays} days. Consider accelerating receivables collection.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Forecast Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Weekly Cash Flow Forecast
            </CardTitle>
            <CardDescription>
              Expected inflows vs outflows over the next {forecastDays} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.weeklyForecasts && analytics.weeklyForecasts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.weeklyForecasts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="weekStart" 
                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => value.toLocaleString() + ' AED'}
                    labelFormatter={(label) => `Week of ${format(new Date(label), 'MMM dd')}`}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="expectedInflow" 
                    stackId="1" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    name="Inflow"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expectedOutflow" 
                    stackId="2" 
                    stroke="#EF4444" 
                    fill="#EF4444" 
                    name="Outflow"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No forecast data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aging Analysis Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Aging Analysis
            </CardTitle>
            <CardDescription>
              Breakdown of payables and receivables by age
            </CardDescription>
          </CardHeader>
          <CardContent>
            {agingData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={agingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => value.toLocaleString() + ' AED'} />
                  <Legend />
                  <Bar dataKey="receivables" fill="#10B981" name="Receivables" />
                  <Bar dataKey="payables" fill="#EF4444" name="Payables" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No aging data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Cash Flow Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            {pieData.length > 0 && pieData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <RePieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#EF4444'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => value.toLocaleString() + ' AED'} />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No data available for distribution chart
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
