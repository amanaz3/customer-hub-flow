import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { CashFlowForecast } from '@/hooks/useAIReconciliation';

interface CashFlowChartProps {
  forecasts: CashFlowForecast[];
}

export function CashFlowChart({ forecasts }: CashFlowChartProps) {
  const chartData = forecasts.map(f => ({
    date: format(new Date(f.forecast_date), 'MMM d'),
    fullDate: f.forecast_date,
    inflow: Number(f.projected_inflow),
    outflow: Number(f.projected_outflow),
    net: Number(f.net_position),
    confidence: Number(f.confidence_level) * 100,
    completeness: Number(f.data_completeness_score) * 100,
  }));

  const totalInflow = chartData.reduce((sum, d) => sum + d.inflow, 0);
  const totalOutflow = chartData.reduce((sum, d) => sum + d.outflow, 0);
  const netChange = totalInflow - totalOutflow;
  const avgConfidence = chartData.length > 0 
    ? chartData.reduce((sum, d) => sum + d.confidence, 0) / chartData.length 
    : 0;

  // Cumulative cash flow for area chart
  let cumulative = 0;
  const cumulativeData = chartData.map(d => {
    cumulative += d.net;
    return { ...d, cumulative };
  });

  if (forecasts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Cash Flow Forecast
          </CardTitle>
          <CardDescription>Run gap detection to generate forecasts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No forecast data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Projected Inflow</span>
            </div>
            <p className="text-xl font-bold text-green-600 mt-1">
              +{totalInflow.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Projected Outflow</span>
            </div>
            <p className="text-xl font-bold text-red-600 mt-1">
              -{totalOutflow.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              {netChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-primary" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span className="text-sm text-muted-foreground">Net Change</span>
            </div>
            <p className={`text-xl font-bold mt-1 ${netChange >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {netChange >= 0 ? '+' : ''}{netChange.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              {avgConfidence >= 70 ? (
                <Badge variant="default" className="text-xs">High</Badge>
              ) : avgConfidence >= 50 ? (
                <Badge variant="secondary" className="text-xs">Medium</Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">Low</Badge>
              )}
              <span className="text-sm text-muted-foreground">Confidence</span>
            </div>
            <p className="text-xl font-bold mt-1">
              {avgConfidence.toFixed(0)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Cash Flow</CardTitle>
          <CardDescription>Projected inflows and outflows over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => value.toLocaleString()}
              />
              <Legend />
              <Bar dataKey="inflow" name="Inflow" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outflow" name="Outflow" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
              <Line 
                type="monotone" 
                dataKey="net" 
                name="Net" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cumulative Cash Position */}
      <Card>
        <CardHeader>
          <CardTitle>Cumulative Cash Position</CardTitle>
          <CardDescription>Running total of net cash flow</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={cumulativeData}>
              <defs>
                <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => value.toLocaleString()}
              />
              <Area 
                type="monotone" 
                dataKey="cumulative" 
                name="Cumulative"
                stroke="hsl(var(--primary))"
                fill="url(#positiveGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Confidence & Risk Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Forecast Confidence</CardTitle>
          <CardDescription>Data completeness and prediction accuracy</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => `${value.toFixed(0)}%`}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="confidence" 
                name="Confidence"
                stroke="hsl(217, 91%, 60%)"
                fill="hsl(217, 91%, 60%)"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="completeness" 
                name="Data Completeness"
                stroke="hsl(280, 87%, 65%)"
                fill="hsl(280, 87%, 65%)"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
