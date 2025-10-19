import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, AlertCircle, CheckCircle, TrendingDown } from "lucide-react";

interface InsightsBannerProps {
  forecast?: {
    status: 'on-track' | 'at-risk' | 'off-track';
    insights: string[];
  };
  comparison?: {
    changes: {
      applicationsPercent: number;
      completedPercent: number;
      completionRatePercent: number;
    };
  };
}

export const InsightsBanner = ({ forecast, comparison }: InsightsBannerProps) => {
  if (!forecast && !comparison) return null;

  const getStatusConfig = () => {
    if (forecast?.status === 'on-track') {
      return {
        icon: CheckCircle,
        variant: 'default' as const,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-500/10',
      };
    }
    if (forecast?.status === 'at-risk') {
      return {
        icon: AlertCircle,
        variant: 'default' as const,
        color: 'text-amber-600',
        bgColor: 'bg-amber-500/10',
      };
    }
    if (forecast?.status === 'off-track') {
      return {
        icon: AlertCircle,
        variant: 'destructive' as const,
        color: 'text-red-600',
        bgColor: 'bg-red-500/10',
      };
    }
    return {
      icon: TrendingUp,
      variant: 'default' as const,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const generateInsights = () => {
    const insights: string[] = [];

    if (forecast) {
      insights.push(forecast.insights[0]);
    }

    if (comparison) {
      const { applicationsPercent, completedPercent, completionRatePercent } = comparison.changes;
      
      if (applicationsPercent > 20) {
        insights.push(`📈 Great momentum! Applications up ${applicationsPercent.toFixed(0)}% vs last month.`);
      } else if (applicationsPercent < -20) {
        insights.push(`📉 Applications down ${Math.abs(applicationsPercent).toFixed(0)}% - review pipeline.`);
      }

      if (completionRatePercent < -5) {
        insights.push(`⚠️ Completion rate dropped ${Math.abs(completionRatePercent).toFixed(0)}% - focus on closing deals.`);
      }
    }

    return insights.slice(0, 2); // Show max 2 insights
  };

  const insights = generateInsights();

  if (insights.length === 0) return null;

  return (
    <Alert className={`${config.bgColor} border-l-4`}>
      <Icon className={`h-4 w-4 ${config.color}`} />
      <AlertDescription className="ml-2">
        <div className="space-y-1">
          {insights.map((insight, index) => (
            <p key={index} className="text-sm font-medium">{insight}</p>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
};
