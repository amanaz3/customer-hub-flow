import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, 
  Sparkles, 
  Target, 
  Users, 
  TrendingUp, 
  Activity,
  AlertTriangle,
  CheckCircle2,
  Brain,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { targetManagementService } from "@/services/targetManagementService";

interface TeamTargetInsights {
  key_insights: string[];
  immediate_actions: Array<{
    action: string;
    priority: "high" | "medium" | "low";
    who: string;
  }>;
  blockers_and_risks: Array<{
    blocker: string;
    affected_members: string[];
    mitigation: string;
  }>;
}

interface PipelineInsights {
  recommendations: Array<{
    priority: string;
    action: string;
    expected_impact: string;
  }>;
  bottlenecks: string[];
}

interface MonitorInsights {
  alerts: Array<{
    severity: string;
    message: string;
    recommendation: string;
  }>;
  trends: string[];
}

const AI360View = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [teamTargetInsights, setTeamTargetInsights] = useState<TeamTargetInsights | null>(null);
  const [pipelineInsights, setPipelineInsights] = useState<PipelineInsights | null>(null);
  const [monitorInsights, setMonitorInsights] = useState<MonitorInsights | null>(null);

  // Fetch team target data
  const { data: teamTargetData } = useQuery({
    queryKey: ['team-targets-360'],
    queryFn: async () => {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      return await targetManagementService.getAllUsersTargetSummary('monthly', currentMonth, currentYear);
    },
  });

  // Fetch applications data
  const { data: applicationsData } = useQuery({
    queryKey: ['applications-360'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('account_applications')
        .select('*, customers(name, user_id)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const analyzeAll = async () => {
    if (!teamTargetData && !applicationsData) {
      toast.error("No data available to analyze");
      return;
    }

    setAnalyzing(true);
    const results = await Promise.allSettled([
      analyzeTeamTargets(),
      analyzePipeline(),
      analyzeMonitor()
    ]);

    // Check results and show appropriate messages
    const failedCount = results.filter(r => r.status === 'rejected').length;
    if (failedCount === 0) {
      toast.success("360° AI analysis complete");
    } else if (failedCount < results.length) {
      toast.info(`Partial analysis complete (${results.length - failedCount}/${results.length} successful)`);
    } else {
      toast.error("Analysis failed. Please try again.");
    }

    setAnalyzing(false);
  };

  const analyzeTeamTargets = async () => {
    if (!teamTargetData || teamTargetData.length === 0) return;

    try {
      const { data, error } = await supabase.functions.invoke('analyze-team-targets', {
        body: {
          teamData: teamTargetData,
          period: new Date().getMonth() + 1,
          periodType: 'monthly',
        },
      });

      if (error) throw error;
      if (data?.recommendations) {
        setTeamTargetInsights(data.recommendations);
      }
    } catch (error: any) {
      console.error("Error analyzing team targets:", error);
      throw error;
    }
  };

  const analyzePipeline = async () => {
    if (!applicationsData || applicationsData.length === 0) return;

    try {
      const { data, error } = await supabase.functions.invoke('analyze-application-pipeline', {
        body: { applications: applicationsData },
      });

      if (error) throw error;
      if (data?.analysis) {
        setPipelineInsights(data.analysis);
      }
    } catch (error: any) {
      console.error("Error analyzing pipeline:", error);
      throw error;
    }
  };

  const analyzeMonitor = async () => {
    if (!applicationsData || applicationsData.length === 0) return;

    try {
      const { data, error } = await supabase.functions.invoke('analyze-monitor-insights', {
        body: { applications: applicationsData },
      });

      if (error) throw error;
      if (data?.insights) {
        setMonitorInsights(data.insights);
      }
    } catch (error: any) {
      console.error("Error analyzing monitor:", error);
      throw error;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return <Badge variant="destructive">High Priority</Badge>;
      case "medium":
        return <Badge variant="secondary">Medium Priority</Badge>;
      case "low":
        return <Badge variant="outline">Low Priority</Badge>;
      default:
        return null;
    }
  };

  const hasAnyInsights = teamTargetInsights || pipelineInsights || monitorInsights;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
              <Eye className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">360° AI View</h1>
              <p className="text-muted-foreground">
                Comprehensive AI insights across all tracking dimensions
              </p>
            </div>
          </div>
        </div>
        <Button 
          onClick={analyzeAll} 
          disabled={analyzing || (!teamTargetData && !applicationsData)}
          size="lg"
          className="gap-2"
        >
          {analyzing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="h-5 w-5" />
              Generate 360° Analysis
            </>
          )}
        </Button>
      </div>

      {!hasAnyInsights && !analyzing && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            Click "Generate 360° Analysis" to get comprehensive AI-powered insights across team targets, 
            application pipeline, and real-time monitoring.
          </AlertDescription>
        </Alert>
      )}

      {hasAnyInsights && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="targets">Team Targets</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="monitor">Monitor</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-teal-600" />
                    Team Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {teamTargetInsights ? (
                      <>
                        <div className="text-2xl font-bold">
                          {teamTargetInsights.key_insights?.length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Key insights identified</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {Array.isArray(teamTargetInsights.immediate_actions) ? teamTargetInsights.immediate_actions.length : 0} actions
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {Array.isArray(teamTargetInsights.blockers_and_risks) ? teamTargetInsights.blockers_and_risks.length : 0} risks
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">No data yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    Pipeline Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {pipelineInsights ? (
                      <>
                        <div className="text-2xl font-bold">
                          {pipelineInsights.bottlenecks?.length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Bottlenecks detected</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {pipelineInsights.recommendations?.length || 0} recommendations
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">No data yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-red-600" />
                    Real-time Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {monitorInsights ? (
                      <>
                        <div className="text-2xl font-bold">
                          {monitorInsights.alerts?.length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Active alerts</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {monitorInsights.trends?.length || 0} trends
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">No data yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Combined Critical Actions */}
            {teamTargetInsights?.immediate_actions && teamTargetInsights.immediate_actions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Critical Actions Required
                  </CardTitle>
                  <CardDescription>High-priority items needing immediate attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {teamTargetInsights.immediate_actions
                        .filter(a => a.priority === 'high')
                        .map((action, idx) => (
                          <Alert key={idx} variant="destructive">
                            <AlertDescription>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <p className="font-medium">{action.action}</p>
                                  <p className="text-sm mt-1">Assigned to: {action.who}</p>
                                </div>
                                {getPriorityBadge(action.priority)}
                              </div>
                            </AlertDescription>
                          </Alert>
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="targets" className="space-y-4">
            {teamTargetInsights ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Key Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {teamTargetInsights.key_insights?.map((insight, idx) => (
                        <li key={idx} className="flex gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-orange-600" />
                      Immediate Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {teamTargetInsights.immediate_actions?.map((action, idx) => (
                          <Alert key={idx}>
                            <AlertDescription>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <p className="font-medium">{action.action}</p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Assigned to: {action.who}
                                  </p>
                                </div>
                                {getPriorityBadge(action.priority)}
                              </div>
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Blockers & Risks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {teamTargetInsights.blockers_and_risks?.map((item, idx) => (
                          <Card key={idx}>
                            <CardHeader>
                              <CardTitle className="text-base">{item.blocker}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div>
                                <p className="text-sm font-medium">Affected Members:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.affected_members?.map((member, i) => (
                                    <Badge key={i} variant="secondary">{member}</Badge>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Mitigation:</p>
                                <p className="text-sm text-muted-foreground mt-1">{item.mitigation}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Alert>
                <AlertDescription>
                  No team target insights available. Click "Generate 360° Analysis" to analyze.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="pipeline" className="space-y-4">
            {pipelineInsights ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      Identified Bottlenecks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {pipelineInsights.bottlenecks?.map((bottleneck, idx) => (
                        <li key={idx} className="flex gap-2">
                          <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                          <span>{bottleneck}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {pipelineInsights.recommendations?.map((rec, idx) => (
                          <Card key={idx}>
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <p className="font-medium flex-1">{rec.action}</p>
                                {getPriorityBadge(rec.priority)}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Expected Impact: {rec.expected_impact}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Alert>
                <AlertDescription>
                  No pipeline insights available. Click "Generate 360° Analysis" to analyze.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="monitor" className="space-y-4">
            {monitorInsights ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-red-600" />
                      Active Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {monitorInsights.alerts?.map((alert, idx) => (
                          <Alert 
                            key={idx} 
                            variant={alert.severity === 'high' ? 'destructive' : 'default'}
                          >
                            <AlertDescription>
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-4">
                                  <p className="font-medium flex-1">{alert.message}</p>
                                  <Badge variant={
                                    alert.severity === 'high' ? 'destructive' : 
                                    alert.severity === 'medium' ? 'secondary' : 'outline'
                                  }>
                                    {alert.severity}
                                  </Badge>
                                </div>
                                <p className="text-sm">
                                  <strong>Recommendation:</strong> {alert.recommendation}
                                </p>
                              </div>
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Identified Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {monitorInsights.trends?.map((trend, idx) => (
                        <li key={idx} className="flex gap-2">
                          <TrendingUp className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                          <span>{trend}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Alert>
                <AlertDescription>
                  No monitor insights available. Click "Generate 360° Analysis" to analyze.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AI360View;
