import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, AlertTriangle } from "lucide-react";

interface Application {
  id: string;
  status: string;
  updated_at: string;
}

interface ApplicationsFunnelChartProps {
  applications: Application[];
}

const funnelStages = [
  { key: 'draft', label: 'Draft', color: 'hsl(var(--chart-1))' },
  { key: 'submitted', label: 'Submitted', color: 'hsl(var(--chart-2))' },
  { key: 'under_review', label: 'Under Review', color: 'hsl(var(--chart-3))' },
  { key: 'approved', label: 'Approved', color: 'hsl(var(--chart-4))' },
  { key: 'paid', label: 'Paid', color: 'hsl(var(--chart-5))' },
  { key: 'completed', label: 'Completed', color: 'hsl(142 76% 36%)' },
];

const sideStatuses = [
  { key: 'need more info', label: 'Need More Info', color: 'hsl(262 83% 58%)' },
  { key: 'returned', label: 'Returned', color: 'hsl(25 95% 53%)' },
  { key: 'rejected', label: 'Rejected', color: 'hsl(0 84% 60%)' },
];

export const ApplicationsFunnelChart = ({ applications }: ApplicationsFunnelChartProps) => {
  // Calculate counts for each stage
  const stageCounts = funnelStages.map(stage => {
    const appsInStage = applications.filter(app => app.status === stage.key);
    const stuckCount = appsInStage.filter(app => {
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(app.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceUpdate > 7;
    }).length;

    return {
      ...stage,
      count: appsInStage.length,
      stuck: stuckCount,
    };
  });

  const sideCounts = sideStatuses.map(status => {
    const appsInStatus = applications.filter(app => app.status === status.key);
    return {
      ...status,
      count: appsInStatus.length,
    };
  });

  const maxCount = Math.max(...stageCounts.map(s => s.count), 1);
  const totalApps = applications.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Pipeline Funnel</CardTitle>
        <CardDescription>
          Visual representation of application flow through stages
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6">
          {/* Main Funnel */}
          <div className="flex-1 space-y-2">
            {stageCounts.map((stage, idx) => {
              const widthPercent = (stage.count / maxCount) * 100;
              const conversionRate = totalApps > 0 ? ((stage.count / totalApps) * 100).toFixed(1) : '0';
              const isBottleneck = idx > 0 && stage.count > stageCounts[idx - 1].count * 1.2;

              return (
                <div key={stage.key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{stage.label}</span>
                      {isBottleneck && (
                        <Badge variant="destructive" className="gap-1 text-xs">
                          <AlertTriangle className="h-3 w-3" />
                          Bottleneck
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{conversionRate}%</span>
                      <Badge className="font-bold min-w-[50px] justify-center">
                        {stage.count}
                      </Badge>
                    </div>
                  </div>
                  <div className="relative">
                    <div
                      className="h-12 rounded-lg flex items-center justify-between px-4 text-white transition-all duration-300"
                      style={{
                        backgroundColor: stage.color,
                        width: `${Math.max(widthPercent, 20)}%`,
                      }}
                    >
                      <span className="text-sm font-medium">{stage.count} apps</span>
                      {stage.stuck > 0 && (
                        <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded">
                          <AlertTriangle className="h-3 w-3" />
                          <span className="text-xs font-semibold">{stage.stuck} stuck</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {idx < stageCounts.length - 1 && (
                    <div className="flex items-center justify-center py-1">
                      <ArrowDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Side Statuses */}
          <div className="w-64 space-y-3">
            <div className="text-sm font-medium mb-4">Side Flows</div>
            {sideCounts.map(status => (
              <div
                key={status.key}
                className="p-3 rounded-lg text-white"
                style={{ backgroundColor: status.color }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{status.label}</span>
                  <Badge variant="secondary" className="bg-white/20 text-white border-0 font-bold">
                    {status.count}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{totalApps}</div>
            <div className="text-sm text-muted-foreground">Total Applications</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stageCounts[stageCounts.length - 1].count}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">
              {stageCounts.reduce((sum, s) => sum + s.stuck, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Stuck (7+ days)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {sideCounts.reduce((sum, s) => sum + s.count, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Side Flows</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
