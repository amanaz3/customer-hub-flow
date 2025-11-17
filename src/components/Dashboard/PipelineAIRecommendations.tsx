import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Target, TrendingUp, Lightbulb, Users, Info } from "lucide-react";

interface PipelineAIRecommendationsProps {
  analysis: any;
  metrics: any;
  summary: any;
}

export const PipelineAIRecommendations = ({ analysis, metrics, summary }: PipelineAIRecommendationsProps) => {
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
      case "critical":
      case "urgent":
        return <Badge variant="destructive">{severity.toUpperCase()}</Badge>;
      case "medium":
        return <Badge variant="secondary">{severity.toUpperCase()}</Badge>;
      case "low":
      case "easy":
        return <Badge variant="outline">{severity.toUpperCase()}</Badge>;
      default:
        return <Badge>{severity.toUpperCase()}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          AI Pipeline Analysis & Recommendations
        </CardTitle>
        <CardDescription>
          Intelligent insights to optimize your application pipeline
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="bottlenecks" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="bottlenecks">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Bottlenecks
            </TabsTrigger>
            <TabsTrigger value="actions">
              <Target className="h-4 w-4 mr-2" />
              Actions
            </TabsTrigger>
            <TabsTrigger value="at-risk">
              <AlertTriangle className="h-4 w-4 mr-2" />
              At Risk
            </TabsTrigger>
            <TabsTrigger value="improvements">
              <TrendingUp className="h-4 w-4 mr-2" />
              Improvements
            </TabsTrigger>
            <TabsTrigger value="resources">
              <Users className="h-4 w-4 mr-2" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="predictions">
              <Info className="h-4 w-4 mr-2" />
              Predictions
            </TabsTrigger>
          </TabsList>

          {/* Critical Bottlenecks */}
          <TabsContent value="bottlenecks">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg mb-4">Critical Bottlenecks</h4>
                {analysis.critical_bottlenecks?.map((bottleneck: any, index: number) => (
                  <Card key={index} className="border-destructive/50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            {bottleneck.stage}
                          </CardTitle>
                          <CardDescription className="mt-2">{bottleneck.issue}</CardDescription>
                        </div>
                        {getSeverityBadge(bottleneck.severity)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-sm font-medium mb-1">Impact:</p>
                        <p className="text-sm">{bottleneck.impact}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {!analysis.critical_bottlenecks || analysis.critical_bottlenecks.length === 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>No critical bottlenecks detected. Pipeline is flowing smoothly!</AlertDescription>
                  </Alert>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Immediate Actions */}
          <TabsContent value="actions">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg mb-4">Immediate Actions Required</h4>
                {analysis.immediate_actions?.map((action: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{action.stage}</Badge>
                            {getSeverityBadge(action.priority)}
                          </div>
                          <CardTitle className="text-base">{action.action}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-sm font-medium mb-1">Expected Impact:</p>
                        <p className="text-sm">{action.expected_impact}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* At Risk Applications */}
          <TabsContent value="at-risk">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg mb-4">Applications At Risk</h4>
                {analysis.at_risk_applications?.map((app: any, index: number) => (
                  <Card key={index} className="border-yellow-500/50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{app.application_ref}</CardTitle>
                          <CardDescription className="mt-2">{app.reason}</CardDescription>
                        </div>
                        {getSeverityBadge(app.risk_level)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-sm font-medium mb-1">Recommendation:</p>
                        <p className="text-sm">{app.recommendation}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {!analysis.at_risk_applications || analysis.at_risk_applications.length === 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>No applications at risk. All applications are progressing normally!</AlertDescription>
                  </Alert>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Process Improvements */}
          <TabsContent value="improvements">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg mb-4">Process Improvement Opportunities</h4>
                {analysis.process_improvements?.map((improvement: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{improvement.stage}</Badge>
                            {getSeverityBadge(improvement.implementation_difficulty)}
                          </div>
                          <CardTitle className="text-base">{improvement.improvement}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-sm font-medium mb-1">Expected Benefit:</p>
                        <p className="text-sm">{improvement.expected_benefit}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Resource Allocation */}
          <TabsContent value="resources">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg mb-4">Resource Allocation Guidance</h4>
                {analysis.resource_allocation && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">High Priority Stages</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {analysis.resource_allocation.high_priority_stages?.map((stage: string, index: number) => (
                          <Badge key={index} variant="secondary">{stage}</Badge>
                        ))}
                      </div>
                      
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-sm font-medium mb-2">Rationale:</p>
                        <p className="text-sm">{analysis.resource_allocation.rationale}</p>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">Suggested Actions:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {analysis.resource_allocation.suggested_actions?.map((action: string, index: number) => (
                            <li key={index} className="text-sm">{action}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Predictions */}
          <TabsContent value="predictions">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-lg mb-4">Pipeline Trend Predictions</h4>
                {analysis.predictions?.map((prediction: string, index: number) => (
                  <Alert key={index}>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>{prediction}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
