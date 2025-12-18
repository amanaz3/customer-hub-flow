import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Building2,
  Globe,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lightbulb,
} from 'lucide-react';
import { useBankReadinessCases, BankReadinessCaseRecord } from '@/hooks/useBankReadinessCases';

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#6b7280'];

interface AnalyticsData {
  bankApprovalRates: { bank: string; approved: number; rejected: number; rate: number }[];
  nationalityRates: { nationality: string; approved: number; rejected: number; rate: number }[];
  activityRates: { activity: string; approved: number; rejected: number; rate: number }[];
  riskCategoryOutcomes: { category: string; approved: number; rejected: number }[];
  rejectionReasons: { reason: string; count: number }[];
  predictionAccuracy: {
    recommendedAndApproved: number;
    recommendedAndRejected: number;
    avoidedAndApproved: number;
    avoidedAndRejected: number;
  };
  monthlyTrend: { month: string; approved: number; rejected: number }[];
}

const OutcomeAnalyticsTab: React.FC = () => {
  const { cases, loading } = useBankReadinessCases();

  const analytics = useMemo<AnalyticsData>(() => {
    const casesWithOutcome = cases.filter(c => c.outcome && c.outcome !== 'pending' && c.outcome !== 'withdrawn');
    
    // Bank approval rates
    const bankMap = new Map<string, { approved: number; rejected: number }>();
    casesWithOutcome.forEach(c => {
      if (c.bank_applied_to) {
        const current = bankMap.get(c.bank_applied_to) || { approved: 0, rejected: 0 };
        if (c.outcome === 'approved') current.approved++;
        if (c.outcome === 'rejected') current.rejected++;
        bankMap.set(c.bank_applied_to, current);
      }
    });
    const bankApprovalRates = Array.from(bankMap.entries())
      .map(([bank, data]) => ({
        bank,
        ...data,
        rate: data.approved + data.rejected > 0 
          ? Math.round((data.approved / (data.approved + data.rejected)) * 100) 
          : 0
      }))
      .sort((a, b) => b.rate - a.rate);

    // Nationality rates
    const nationalityMap = new Map<string, { approved: number; rejected: number }>();
    casesWithOutcome.forEach(c => {
      const nat = c.applicant_nationality;
      const current = nationalityMap.get(nat) || { approved: 0, rejected: 0 };
      if (c.outcome === 'approved') current.approved++;
      if (c.outcome === 'rejected') current.rejected++;
      nationalityMap.set(nat, current);
    });
    const nationalityRates = Array.from(nationalityMap.entries())
      .map(([nationality, data]) => ({
        nationality,
        ...data,
        rate: data.approved + data.rejected > 0 
          ? Math.round((data.approved / (data.approved + data.rejected)) * 100) 
          : 0
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 10);

    // Activity rates
    const activityMap = new Map<string, { approved: number; rejected: number }>();
    casesWithOutcome.forEach(c => {
      const activity = c.license_activity.substring(0, 30);
      const current = activityMap.get(activity) || { approved: 0, rejected: 0 };
      if (c.outcome === 'approved') current.approved++;
      if (c.outcome === 'rejected') current.rejected++;
      activityMap.set(activity, current);
    });
    const activityRates = Array.from(activityMap.entries())
      .map(([activity, data]) => ({
        activity,
        ...data,
        rate: data.approved + data.rejected > 0 
          ? Math.round((data.approved / (data.approved + data.rejected)) * 100) 
          : 0
      }))
      .sort((a, b) => (b.approved + b.rejected) - (a.approved + a.rejected))
      .slice(0, 8);

    // Risk category outcomes
    const riskMap = new Map<string, { approved: number; rejected: number }>();
    casesWithOutcome.forEach(c => {
      const risk = c.risk_category || 'unknown';
      const current = riskMap.get(risk) || { approved: 0, rejected: 0 };
      if (c.outcome === 'approved') current.approved++;
      if (c.outcome === 'rejected') current.rejected++;
      riskMap.set(risk, current);
    });
    const riskCategoryOutcomes = Array.from(riskMap.entries())
      .map(([category, data]) => ({ category, ...data }));

    // Rejection reasons
    const reasonMap = new Map<string, number>();
    casesWithOutcome.filter(c => c.outcome === 'rejected' && c.rejection_reason).forEach(c => {
      const reason = c.rejection_reason!;
      reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
    });
    const rejectionReasons = Array.from(reasonMap.entries())
      .map(([reason, count]) => ({ reason: formatRejectionReason(reason), count }))
      .sort((a, b) => b.count - a.count);

    // Prediction accuracy
    let recommendedAndApproved = 0;
    let recommendedAndRejected = 0;
    let avoidedAndApproved = 0;
    let avoidedAndRejected = 0;

    casesWithOutcome.forEach(c => {
      if (!c.bank_applied_to) return;
      const recommended = (c.recommended_banks as any[]) || [];
      const avoided = (c.banks_to_avoid as any[]) || [];
      const wasRecommended = recommended.some(b => b.bank_name === c.bank_applied_to);
      const wasAvoided = avoided.some(b => b.bank_name === c.bank_applied_to);

      if (wasRecommended && c.outcome === 'approved') recommendedAndApproved++;
      if (wasRecommended && c.outcome === 'rejected') recommendedAndRejected++;
      if (wasAvoided && c.outcome === 'approved') avoidedAndApproved++;
      if (wasAvoided && c.outcome === 'rejected') avoidedAndRejected++;
    });

    // Monthly trend
    const monthMap = new Map<string, { approved: number; rejected: number }>();
    casesWithOutcome.forEach(c => {
      const month = new Date(c.created_at).toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
      const current = monthMap.get(month) || { approved: 0, rejected: 0 };
      if (c.outcome === 'approved') current.approved++;
      if (c.outcome === 'rejected') current.rejected++;
      monthMap.set(month, current);
    });
    const monthlyTrend = Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .slice(-6);

    return {
      bankApprovalRates,
      nationalityRates,
      activityRates,
      riskCategoryOutcomes,
      rejectionReasons,
      predictionAccuracy: {
        recommendedAndApproved,
        recommendedAndRejected,
        avoidedAndApproved,
        avoidedAndRejected,
      },
      monthlyTrend,
    };
  }, [cases]);

  const totalWithOutcome = cases.filter(c => c.outcome && c.outcome !== 'pending').length;
  const overallAccuracy = useMemo(() => {
    const { recommendedAndApproved, avoidedAndRejected, recommendedAndRejected, avoidedAndApproved } = analytics.predictionAccuracy;
    const correct = recommendedAndApproved + avoidedAndRejected;
    const total = correct + recommendedAndRejected + avoidedAndApproved;
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  }, [analytics]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading analytics...
        </CardContent>
      </Card>
    );
  }

  if (totalWithOutcome < 3) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Not Enough Data</h3>
          <p className="text-muted-foreground">
            Record at least 3 outcomes to see analytics. Currently have {totalWithOutcome} outcome(s).
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prediction Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{overallAccuracy}%</p>
              {overallAccuracy >= 70 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <Progress value={overallAccuracy} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recommended → Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{analytics.predictionAccuracy.recommendedAndApproved}</p>
            <p className="text-xs text-muted-foreground">Correct recommendations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recommended → Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{analytics.predictionAccuracy.recommendedAndRejected}</p>
            <p className="text-xs text-muted-foreground">Wrong recommendations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avoided → Approved</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{analytics.predictionAccuracy.avoidedAndApproved}</p>
            <p className="text-xs text-muted-foreground">Missed opportunities</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Bank Approval Rates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Bank Approval Rates
            </CardTitle>
            <CardDescription>Historical approval rates by bank</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.bankApprovalRates.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.bankApprovalRates} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="bank" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => `${value}%`} />
                  <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No bank data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Rejection Reasons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Top Rejection Reasons
            </CardTitle>
            <CardDescription>Most common reasons for rejection</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.rejectionReasons.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analytics.rejectionReasons}
                    dataKey="count"
                    nameKey="reason"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ reason, count }) => `${reason}: ${count}`}
                  >
                    {analytics.rejectionReasons.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No rejection data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Nationality Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Approval Rates by Nationality
          </CardTitle>
          <CardDescription>How different nationalities perform in bank applications</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.nationalityRates.length > 0 ? (
            <div className="space-y-3">
              {analytics.nationalityRates.map((item) => (
                <div key={item.nationality} className="flex items-center gap-4">
                  <span className="w-24 text-sm font-medium truncate">{item.nationality}</span>
                  <div className="flex-1">
                    <Progress value={item.rate} className="h-2" />
                  </div>
                  <span className="w-16 text-sm text-right">
                    {item.rate}%
                    <span className="text-muted-foreground text-xs ml-1">
                      ({item.approved}/{item.approved + item.rejected})
                    </span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No nationality data yet</p>
          )}
        </CardContent>
      </Card>

      {/* Risk Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Risk Category Performance
          </CardTitle>
          <CardDescription>Outcomes by risk assessment category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {analytics.riskCategoryOutcomes.map((item) => {
              const total = item.approved + item.rejected;
              const rate = total > 0 ? Math.round((item.approved / total) * 100) : 0;
              return (
                <Card key={item.category} className={`${
                  item.category === 'low' ? 'border-green-200' :
                  item.category === 'medium' ? 'border-amber-200' :
                  'border-red-200'
                }`}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={
                        item.category === 'low' ? 'secondary' :
                        item.category === 'medium' ? 'secondary' : 'destructive'
                      } className={
                        item.category === 'low' ? 'bg-green-100 text-green-800' :
                        item.category === 'medium' ? 'bg-amber-100 text-amber-800' : ''
                      }>
                        {item.category.toUpperCase()} RISK
                      </Badge>
                      <span className="font-bold">{rate}%</span>
                    </div>
                    <Progress value={rate} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {item.approved} approved, {item.rejected} rejected
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      {(analytics.predictionAccuracy.recommendedAndRejected > 0 || analytics.predictionAccuracy.avoidedAndApproved > 0) && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              Learning Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {analytics.predictionAccuracy.recommendedAndRejected > 0 && (
                <p className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <span>
                    <strong>{analytics.predictionAccuracy.recommendedAndRejected}</strong> recommended bank(s) rejected the application. 
                    Consider reviewing bank matching criteria.
                  </span>
                </p>
              )}
              {analytics.predictionAccuracy.avoidedAndApproved > 0 && (
                <p className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>
                    <strong>{analytics.predictionAccuracy.avoidedAndApproved}</strong> "avoid" bank(s) actually approved. 
                    These banks may be more flexible than expected.
                  </span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

function formatRejectionReason(reason: string): string {
  const map: Record<string, string> = {
    'high_risk_activity': 'High Risk Activity',
    'nationality_restrictions': 'Nationality',
    'insufficient_documents': 'Documents',
    'source_of_funds': 'Source of Funds',
    'previous_rejection': 'Previous Rejection',
    'turnover_too_low': 'Low Turnover',
    'compliance_concerns': 'Compliance',
    'other': 'Other',
  };
  return map[reason] || reason;
}

export default OutcomeAnalyticsTab;
