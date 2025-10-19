import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ComparisonData } from "@/services/comparisonService";
import { format } from "date-fns";

interface MonthComparisonWidgetProps {
  comparison: ComparisonData;
}

export const MonthComparisonWidget = ({ comparison }: MonthComparisonWidgetProps) => {
  const { current, previous, changes } = comparison;

  const getMonthLabel = (month: number, year: number) => {
    const date = new Date(year, month - 1, 1);
    return format(date, "MMMM yyyy");
  };

  const getTrendIcon = (percent: number) => {
    if (percent > 0) return <TrendingUp className="h-4 w-4 text-emerald-600" />;
    if (percent < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = (percent: number) => {
    if (percent > 0) return "text-emerald-600";
    if (percent < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  const formatValue = (value: number, isRevenue: boolean = false) => {
    if (isRevenue) {
      return `AED ${value.toLocaleString()}`;
    }
    return value.toString();
  };

  const formatPercent = (percent: number) => {
    const sign = percent > 0 ? "+" : "";
    return `${sign}${percent.toFixed(1)}%`;
  };

  const metrics = [
    {
      label: "Applications",
      current: current.applications,
      previous: previous.applications,
      change: changes.applications,
      percent: changes.applicationsPercent,
      isRevenue: false,
    },
    {
      label: "Completed",
      current: current.completed,
      previous: previous.completed,
      change: changes.completed,
      percent: changes.completedPercent,
      isRevenue: false,
    },
    {
      label: "Revenue",
      current: current.revenue,
      previous: previous.revenue,
      change: changes.revenue,
      percent: changes.revenuePercent,
      isRevenue: true,
    },
    {
      label: "Completion Rate",
      current: current.completionRate,
      previous: previous.completionRate,
      change: changes.completionRate,
      percent: changes.completionRatePercent,
      isRevenue: false,
      suffix: "%",
    },
  ];

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Month-over-Month Performance
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Comparing {getMonthLabel(current.month, current.year)} to {getMonthLabel(previous.month, previous.year)}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {metric.label}
                </p>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-2xl font-bold">
                      {formatValue(metric.current, metric.isRevenue)}
                      {metric.suffix || ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Current: {getMonthLabel(current.month, current.year)}
                    </p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">
                      Previous: {formatValue(metric.previous, metric.isRevenue)}
                      {metric.suffix || ""}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getTrendIcon(metric.percent)}
                <div className="text-right">
                  <p className={`text-lg font-bold ${getTrendColor(metric.percent)}`}>
                    {formatPercent(metric.percent)}
                  </p>
                  <p className={`text-xs ${getTrendColor(metric.percent)}`}>
                    {metric.change > 0 ? "+" : ""}
                    {metric.isRevenue
                      ? `AED ${metric.change.toLocaleString()}`
                      : metric.change.toFixed(metric.suffix ? 1 : 0)}
                    {metric.suffix || ""}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
