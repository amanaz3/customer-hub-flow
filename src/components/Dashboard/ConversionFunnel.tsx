import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
  conversionRate: number;
}

export const ConversionFunnel = () => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const { data: funnel, isLoading } = useQuery({
    queryKey: ['conversion-funnel', currentMonth, currentYear],
    queryFn: async () => {
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

      const { data: customers } = await supabase
        .from('customers')
        .select('status')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (!customers) return [];

      const stages = [
        { key: 'Draft', label: 'Draft' },
        { key: 'Submitted', label: 'Submitted' },
        { key: 'Sent to Bank', label: 'Sent to Bank' },
        { key: 'Complete', label: 'Complete' },
        { key: 'Paid', label: 'Paid' },
      ];

      const total = customers.length;
      let previousCount = total;

      const funnelData: FunnelStage[] = stages.map((stage, index) => {
        const count = customers.filter(c => {
          const statusIndex = stages.findIndex(s => s.key === c.status);
          return statusIndex >= index;
        }).length;

        const percentage = total > 0 ? (count / total) * 100 : 0;
        const conversionRate = previousCount > 0 ? (count / previousCount) * 100 : 100;
        previousCount = count;

        return {
          stage: stage.label,
          count,
          percentage,
          conversionRate,
        };
      });

      return funnelData;
    },
  });

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading funnel...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-primary" />
          Conversion Funnel Analysis
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Track conversion rates through each stage of the application process
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {funnel?.map((stage, index) => (
            <div key={stage.stage} className="relative">
              <div
                className="flex items-center justify-between p-4 rounded-lg transition-all"
                style={{
                  background: `linear-gradient(90deg, hsl(var(--primary) / 0.1) ${stage.percentage}%, transparent ${stage.percentage}%)`,
                  marginLeft: `${index * 15}px`,
                  marginRight: `${index * 15}px`,
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{stage.stage}</p>
                      <p className="text-xs text-muted-foreground">
                        {stage.count} applications ({stage.percentage.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                </div>
                {index > 0 && (
                  <div className="text-right">
                    <p className={`text-sm font-bold ${
                      stage.conversionRate >= 80 ? 'text-emerald-600' :
                      stage.conversionRate >= 60 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {stage.conversionRate.toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">conversion</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">Key Insights</h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            {funnel && funnel[1] && funnel[1].conversionRate < 80 && (
              <p>• {(100 - funnel[1].conversionRate).toFixed(0)}% drop-off after Draft - review submission process</p>
            )}
            {funnel && funnel[3] && funnel[3].conversionRate < 70 && (
              <p>• Bank approval rate at {funnel[3].conversionRate.toFixed(0)}% - consider pre-qualification</p>
            )}
            {funnel && funnel[4] && funnel[4].conversionRate < 90 && (
              <p>• {(100 - funnel[4].conversionRate).toFixed(0)}% incomplete payments - follow up on invoices</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
