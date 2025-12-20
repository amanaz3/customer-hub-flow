import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ShieldAlert, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { RiskFlag, AISuggestion } from '@/hooks/useAIReconciliation';

interface RiskAnalyticsChartProps {
  riskFlags: RiskFlag[];
  suggestions: AISuggestion[];
}

export function RiskAnalyticsChart({ riskFlags, suggestions }: RiskAnalyticsChartProps) {
  const severityData = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    riskFlags.forEach(f => {
      if (f.severity in counts) counts[f.severity as keyof typeof counts]++;
    });
    return [
      { name: 'Critical', value: counts.critical, color: 'hsl(0, 84%, 60%)' },
      { name: 'High', value: counts.high, color: 'hsl(25, 95%, 53%)' },
      { name: 'Medium', value: counts.medium, color: 'hsl(48, 96%, 53%)' },
      { name: 'Low', value: counts.low, color: 'hsl(217, 91%, 60%)' },
    ].filter(d => d.value > 0);
  }, [riskFlags]);

  const statusData = useMemo(() => {
    const counts = { open: 0, investigating: 0, resolved: 0, dismissed: 0 };
    riskFlags.forEach(f => {
      if (f.status in counts) counts[f.status as keyof typeof counts]++;
    });
    return [
      { name: 'Open', value: counts.open, color: 'hsl(0, 84%, 60%)' },
      { name: 'Investigating', value: counts.investigating, color: 'hsl(48, 96%, 53%)' },
      { name: 'Resolved', value: counts.resolved, color: 'hsl(142, 76%, 36%)' },
      { name: 'Dismissed', value: counts.dismissed, color: 'hsl(var(--muted-foreground))' },
    ].filter(d => d.value > 0);
  }, [riskFlags]);

  const flagTypeData = useMemo(() => {
    const types: Record<string, number> = {};
    riskFlags.forEach(f => {
      types[f.flag_type] = (types[f.flag_type] || 0) + 1;
    });
    return Object.entries(types)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [riskFlags]);

  const suggestionStats = useMemo(() => {
    const counts = { pending: 0, approved: 0, rejected: 0, auto_matched: 0 };
    suggestions.forEach(s => {
      if (s.status in counts) counts[s.status as keyof typeof counts]++;
    });
    return [
      { name: 'Pending Review', value: counts.pending, icon: Clock, color: 'hsl(48, 96%, 53%)' },
      { name: 'Approved', value: counts.approved, icon: CheckCircle2, color: 'hsl(142, 76%, 36%)' },
      { name: 'Auto-Matched', value: counts.auto_matched, icon: CheckCircle2, color: 'hsl(217, 91%, 60%)' },
      { name: 'Rejected', value: counts.rejected, icon: AlertTriangle, color: 'hsl(0, 84%, 60%)' },
    ];
  }, [suggestions]);

  const avgConfidence = useMemo(() => {
    if (suggestions.length === 0) return 0;
    return suggestions.reduce((sum, s) => sum + s.confidence_score, 0) / suggestions.length * 100;
  }, [suggestions]);

  const confidenceDistribution = useMemo(() => {
    const ranges = [
      { range: '90-100%', min: 0.9, max: 1.01, count: 0 },
      { range: '70-89%', min: 0.7, max: 0.9, count: 0 },
      { range: '50-69%', min: 0.5, max: 0.7, count: 0 },
      { range: '<50%', min: 0, max: 0.5, count: 0 },
    ];
    suggestions.forEach(s => {
      const r = ranges.find(r => s.confidence_score >= r.min && s.confidence_score < r.max);
      if (r) r.count++;
    });
    return ranges.map(r => ({ name: r.range, value: r.count }));
  }, [suggestions]);

  if (riskFlags.length === 0 && suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk & AI Analytics</CardTitle>
          <CardDescription>Run AI reconciliation to see analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            No data available yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Suggestions Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {suggestionStats.map(stat => (
          <Card key={stat.name}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
                <span className="text-sm text-muted-foreground">{stat.name}</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Risk Severity Distribution */}
        {severityData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Risk Severity Distribution</CardTitle>
              <CardDescription>Breakdown by severity level</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Flag Status Distribution */}
        {statusData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resolution Status</CardTitle>
              <CardDescription>Risk flag handling progress</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Flag Types Bar Chart */}
        {flagTypeData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Issues by Type</CardTitle>
              <CardDescription>Most common data quality issues</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={flagTypeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={100}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* AI Confidence Distribution */}
        {suggestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Confidence Distribution</CardTitle>
              <CardDescription>Average: {avgConfidence.toFixed(0)}%</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={confidenceDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                  />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" name="Suggestions" fill="hsl(280, 87%, 65%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
