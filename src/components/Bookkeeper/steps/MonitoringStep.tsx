import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileQuestion,
  RefreshCw,
  Zap,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MonitoringMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
}

interface Anomaly {
  id: string;
  type: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  date: string;
}

interface MonitoringStepProps {
  onBack?: () => void;
  demoMode?: boolean;
}

const metrics: MonitoringMetric[] = [
  { id: '1', name: 'Monthly Completeness', value: 92, target: 95, trend: 'up', status: 'warning' },
  { id: '2', name: 'Revenue vs Bank Inflow', value: 98, target: 95, trend: 'stable', status: 'good' },
  { id: '3', name: 'Expense Accuracy', value: 96, target: 90, trend: 'up', status: 'good' },
  { id: '4', name: 'Reconciliation Rate', value: 88, target: 95, trend: 'down', status: 'warning' },
  { id: '5', name: 'Document Coverage', value: 85, target: 90, trend: 'stable', status: 'warning' },
  { id: '6', name: 'Tax Compliance Score', value: 94, target: 90, trend: 'up', status: 'good' },
];

const anomalies: Anomaly[] = [
  { id: '1', type: 'Spike', description: 'Marketing expenses 3x higher than average this month', severity: 'medium', date: 'Dec 12, 2024' },
  { id: '2', type: 'Missing', description: 'No utility bills recorded for December', severity: 'high', date: 'Dec 15, 2024' },
  { id: '3', type: 'Pattern', description: 'Repeated cash withdrawals on same day each week', severity: 'low', date: 'Ongoing' },
];

const statusColors = {
  good: 'text-green-500',
  warning: 'text-amber-500',
  critical: 'text-red-500',
};

const severityColors = {
  high: 'border-red-500/50 bg-red-500/10',
  medium: 'border-amber-500/50 bg-amber-500/10',
  low: 'border-blue-500/50 bg-blue-500/10',
};

export function MonitoringStep({ onBack }: MonitoringStepProps) {
  const overallScore = Math.round(metrics.reduce((acc, m) => acc + m.value, 0) / metrics.length);
  const warningCount = metrics.filter(m => m.status === 'warning').length;
  const criticalCount = metrics.filter(m => m.status === 'critical').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Ongoing Accuracy & Monitoring</h2>
          <p className="text-muted-foreground">
            Continuous checks for data completeness, consistency, and anomalies.
          </p>
        </div>
        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Analysis
        </Button>
      </div>

      {/* Overall Health */}
      <Card className={cn(
        'border-2',
        overallScore >= 90 && 'border-green-500/50',
        overallScore >= 80 && overallScore < 90 && 'border-amber-500/50',
        overallScore < 80 && 'border-red-500/50'
      )}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold',
                overallScore >= 90 && 'bg-green-500/10 text-green-600',
                overallScore >= 80 && overallScore < 90 && 'bg-amber-500/10 text-amber-600',
                overallScore < 80 && 'bg-red-500/10 text-red-600'
              )}>
                {overallScore}%
              </div>
              <div>
                <h3 className="text-lg font-semibold">Overall Data Health Score</h3>
                <p className="text-muted-foreground">
                  {overallScore >= 90 && 'Your books are in excellent shape'}
                  {overallScore >= 80 && overallScore < 90 && 'Good, but some areas need attention'}
                  {overallScore < 80 && 'Several issues require immediate attention'}
                </p>
              </div>
            </div>
            <div className="flex gap-4 text-center">
              {warningCount > 0 && (
                <div>
                  <p className="text-2xl font-bold text-amber-500">{warningCount}</p>
                  <p className="text-xs text-muted-foreground">Warnings</p>
                </div>
              )}
              {criticalCount > 0 && (
                <div>
                  <p className="text-2xl font-bold text-red-500">{criticalCount}</p>
                  <p className="text-xs text-muted-foreground">Critical</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map(metric => (
          <Card key={metric.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{metric.name}</span>
                <div className="flex items-center gap-1">
                  {metric.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                  {metric.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                  {metric.trend === 'stable' && <Activity className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className={cn('text-2xl font-bold', statusColors[metric.status])}>
                  {metric.value}%
                </span>
                <span className="text-sm text-muted-foreground mb-1">
                  / {metric.target}% target
                </span>
              </div>
              <Progress 
                value={metric.value} 
                className="h-2"
              />
              {metric.status !== 'good' && (
                <p className="text-xs text-muted-foreground mt-2">
                  {metric.target - metric.value}% below target
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Anomalies Detected */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Anomalies Detected
          </CardTitle>
          <CardDescription>
            Unusual patterns that may indicate errors or require investigation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {anomalies.map(anomaly => (
            <div 
              key={anomaly.id}
              className={cn('p-4 rounded-lg border', severityColors[anomaly.severity])}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {anomaly.severity === 'high' && <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />}
                  {anomaly.severity === 'medium' && <Eye className="h-5 w-5 text-amber-500 mt-0.5" />}
                  {anomaly.severity === 'low' && <FileQuestion className="h-5 w-5 text-blue-500 mt-0.5" />}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{anomaly.type}</Badge>
                      <span className="text-xs text-muted-foreground">{anomaly.date}</span>
                    </div>
                    <p className="text-sm">{anomaly.description}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Investigate
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Consistency Checks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Consistency Checks</CardTitle>
          <CardDescription>
            Automated cross-validation of your financial data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { check: 'Revenue matches bank deposits', status: 'pass', detail: 'Within 2% tolerance' },
              { check: 'All expenses have supporting documents', status: 'warning', detail: '3 items missing receipts' },
              { check: 'VAT collected matches returns', status: 'pass', detail: 'Reconciled' },
              { check: 'Payroll matches bank transfers', status: 'pass', detail: 'All matched' },
              { check: 'No duplicate transactions', status: 'warning', detail: '1 potential duplicate flagged' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {item.status === 'pass' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  {item.status === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                  {item.status === 'fail' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                  <span className="font-medium">{item.check}</span>
                </div>
                <span className="text-sm text-muted-foreground">{item.detail}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Notice */}
      <Card className="border-slate-500/30 bg-slate-500/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Activity className="h-5 w-5 text-slate-500 mt-0.5" />
            <div>
              <p className="font-medium text-sm">AI Pattern Detection</p>
              <p className="text-sm text-muted-foreground">
                AI detects patterns and anomalies, <strong>not intent</strong>. 
                Flagged items require human judgment to determine if they represent 
                errors, unusual but legitimate transactions, or areas for investigation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back to Reports
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Full Dashboard
          </Button>
          <Button>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Complete Review
          </Button>
        </div>
      </div>
    </div>
  );
}
