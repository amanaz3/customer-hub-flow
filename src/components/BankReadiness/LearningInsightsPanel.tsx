import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingUp, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react';

interface LearningInsightsPanelProps {
  insights: string[];
  onRefresh?: () => void;
  isDemo?: boolean;
}

const LearningInsightsPanel: React.FC<LearningInsightsPanelProps> = ({
  insights,
  onRefresh,
  isDemo = false,
}) => {
  if (insights.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Rules Are Performing Well</h3>
          <p className="text-muted-foreground text-sm">
            No significant patterns suggest rule adjustments are needed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Learning Insights
            {isDemo && (
              <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700">Demo</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Patterns from outcomes that may suggest rule improvements
          </CardDescription>
        </div>
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight, index) => {
            const isWarning = insight.includes('rejected') || insight.includes('rejection');
            const isOpportunity = insight.includes('approved') || insight.includes('flexible');
            
            return (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  isWarning ? 'bg-red-50 dark:bg-red-950/20' :
                  isOpportunity ? 'bg-green-50 dark:bg-green-950/20' :
                  'bg-muted/50'
                }`}
              >
                {isWarning ? (
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm">{insight}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {isWarning ? 'Review' : 'Opportunity'}
                </Badge>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            💡 These insights are generated from recorded outcomes. 
            Consider adjusting rules in the Bank Readiness Rules configuration when patterns persist.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LearningInsightsPanel;
