import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, Target, AlertCircle } from "lucide-react";
import { ForecastData } from "@/services/forecastService";

interface ForecastWidgetProps {
  forecast: ForecastData;
}

export const ForecastWidget = ({ forecast }: ForecastWidgetProps) => {
  const statusConfig = {
    'on-track': {
      color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
      icon: TrendingUp,
      label: 'On Track',
    },
    'at-risk': {
      color: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
      icon: AlertCircle,
      label: 'At Risk',
    },
    'off-track': {
      color: 'bg-red-500/10 text-red-700 border-red-500/20',
      icon: AlertCircle,
      label: 'Off Track',
    },
  };

  const config = statusConfig[forecast.status];
  const StatusIcon = config.icon;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Forecast & Pace Tracking
          </CardTitle>
          <Badge className={`${config.color} border`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Pace Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-medium text-muted-foreground">Current Pace</p>
            </div>
            <p className="text-2xl font-bold">{forecast.currentPace.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">applications/day</p>
          </div>

          <div className="p-4 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <p className="text-sm font-medium text-muted-foreground">Days Remaining</p>
            </div>
            <p className="text-2xl font-bold">{forecast.daysRemaining}</p>
            <p className="text-xs text-muted-foreground">of {forecast.daysElapsed + forecast.daysRemaining} days</p>
          </div>

          <div className="p-4 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-medium text-muted-foreground">Required Pace</p>
            </div>
            <p className="text-2xl font-bold">{forecast.requiredPaceApplications.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">applications/day needed</p>
          </div>
        </div>

        {/* Projections */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-3">End-of-Month Projections</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Applications</span>
              <span className="font-semibold">{forecast.projectedApplications}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Completed</span>
              <span className="font-semibold">{forecast.projectedCompleted}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Revenue</span>
              <span className="font-semibold">AED {forecast.projectedRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-3">Actionable Insights</h4>
          <div className="space-y-2">
            {forecast.insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-2 p-2 rounded bg-muted/20">
                <div className="mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                </div>
                <p className="text-sm text-muted-foreground flex-1">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
