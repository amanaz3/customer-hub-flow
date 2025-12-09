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

interface StrategicInsights {
  customer_health: {
    total_customers: number;
    high_value_count: number;
    at_risk_count: number;
    growth_potential_count: number;
  };
  key_insights: string[];
  strategic_recommendations: Array<{
    priority: string;
    action: string;
    expected_impact: string;
    category: string;
  }>;
  industry_analysis: Array<{
    industry: string;
    revenue: number;
    customer_count: number;
    growth_trend: string;
    recommendation: string;
  }>;
  action_plans: Array<{
    title: string;
    steps: string[];
    timeline: string;
    owner: string;
  }>;
}

const AI360View = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [teamTargetInsights, setTeamTargetInsights] = useState<TeamTargetInsights | null>(null);
  const [pipelineInsights, setPipelineInsights] = useState<PipelineInsights | null>(null);
  const [monitorInsights, setMonitorInsights] = useState<MonitorInsights | null>(null);
  const [strategicInsights, setStrategicInsights] = useState<StrategicInsights | null>(null);

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

  // Fetch customers data for strategic analysis
  const { data: customersData } = useQuery({
    queryKey: ['customers-360'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const analyzeAll = async () => {
    if (!teamTargetData && !applicationsData && !customersData) {
      toast.error("No data available to analyze");
      return;
    }

    setAnalyzing(true);
    const results = await Promise.allSettled([
      analyzeTeamTargets(),
      analyzePipeline(),
      analyzeMonitor(),
      analyzeStrategic()
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

  const analyzeStrategic = async () => {
    if (!customersData || customersData.length === 0) return;

    try {
      // Calculate customer metrics locally
      const totalCustomers = customersData.length;
      const highValueCustomers = customersData.filter(c => c.amount >= 50000).length;
      const atRiskCustomers = customersData.filter(c => c.status === 'Rejected' || c.status === 'rejected').length;
      const growthPotential = customersData.filter(c => (c.status === 'Complete' || c.status === 'completed') && c.amount < 50000).length;

      // Industry extraction
      const industryMap = new Map<string, { revenue: number; count: number }>();
      customersData.forEach(customer => {
        const industry = customer.license_type || 'Other';
        const existing = industryMap.get(industry) || { revenue: 0, count: 0 };
        industryMap.set(industry, {
          revenue: existing.revenue + (customer.amount || 0),
          count: existing.count + 1
        });
      });

      const industryAnalysis = Array.from(industryMap.entries())
        .map(([industry, data]) => ({
          industry,
          revenue: data.revenue,
          customer_count: data.count,
          growth_trend: data.revenue > 100000 ? 'Growing' : 'Stable',
          recommendation: data.count > 5 ? 'Focus on retention' : 'Expand customer base'
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Generate insights
      const insights: StrategicInsights = {
        customer_health: {
          total_customers: totalCustomers,
          high_value_count: highValueCustomers,
          at_risk_count: atRiskCustomers,
          growth_potential_count: growthPotential
        },
        key_insights: [
          `${highValueCustomers} high-value customers contributing to majority of revenue`,
          `${atRiskCustomers} customers identified as at-risk requiring immediate attention`,
          `${growthPotential} customers show growth potential with targeted upselling`,
          `Top industry: ${industryAnalysis[0]?.industry || 'N/A'} with AED ${(industryAnalysis[0]?.revenue || 0).toLocaleString()} revenue`
        ],
        strategic_recommendations: [
          {
            priority: 'high',
            action: 'Implement retention program for at-risk customers',
            expected_impact: `Prevent potential loss of ${atRiskCustomers} customers`,
            category: 'Retention'
          },
          {
            priority: 'high',
            action: 'Launch upsell campaign for growth-potential segment',
            expected_impact: `Potential 20-30% revenue increase from ${growthPotential} customers`,
            category: 'Growth'
          },
          {
            priority: 'medium',
            action: 'Develop VIP program for high-value customers',
            expected_impact: 'Increase customer lifetime value and referrals',
            category: 'Retention'
          },
          {
            priority: 'medium',
            action: 'Expand presence in top-performing industries',
            expected_impact: 'Capitalize on proven market segments',
            category: 'Expansion'
          }
        ],
        industry_analysis: industryAnalysis,
        action_plans: [
          {
            title: 'Customer Retention Initiative',
            steps: [
              'Identify top 20 at-risk customers',
              'Schedule personal outreach calls',
              'Offer loyalty incentives or service upgrades',
              'Track engagement and conversion'
            ],
            timeline: '2 weeks',
            owner: 'Account Management'
          },
          {
            title: 'Revenue Growth Campaign',
            steps: [
              'Segment customers by service usage',
              'Identify cross-sell opportunities',
              'Create personalized proposals',
              'Execute targeted outreach'
            ],
            timeline: '4 weeks',
            owner: 'Sales Team'
          }
        ]
      };

      setStrategicInsights(insights);
    } catch (error: any) {
      console.error("Error analyzing strategic data:", error);
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

  const hasAnyInsights = teamTargetInsights || pipelineInsights || monitorInsights || strategicInsights;

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
          disabled={analyzing || (!teamTargetData && !applicationsData && !customersData)}
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
            application pipeline, real-time monitoring, and strategic customer intelligence.
          </AlertDescription>
        </Alert>
      )}

      {hasAnyInsights && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="strategic">Strategic</TabsTrigger>
            <TabsTrigger value="targets">Team Targets</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="monitor">Monitor</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              {/* Strategic Health Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-600" />
                    Customer Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {strategicInsights ? (
                      <>
                        <div className="text-2xl font-bold">
                          {strategicInsights.customer_health?.total_customers || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Total customers</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <Badge variant="outline" className="text-xs text-green-600">
                            {strategicInsights.customer_health?.high_value_count || 0} high-value
                          </Badge>
                          <Badge variant="outline" className="text-xs text-orange-600">
                            {strategicInsights.customer_health?.at_risk_count || 0} at-risk
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

          <TabsContent value="strategic" className="space-y-4">
            {strategicInsights ? (
              <>
                {/* Key Strategic Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-emerald-600" />
                      Strategic Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {strategicInsights.key_insights?.map((insight, idx) => (
                        <li key={idx} className="flex gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Strategic Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      Strategic Recommendations
                    </CardTitle>
                    <CardDescription>Priority actions to drive growth and retention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-3">
                        {strategicInsights.strategic_recommendations?.map((rec, idx) => (
                          <Card key={idx}>
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-xs">{rec.category}</Badge>
                                    {getPriorityBadge(rec.priority)}
                                  </div>
                                  <p className="font-medium">{rec.action}</p>
                                </div>
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

                {/* Industry Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      Industry Analysis
                    </CardTitle>
                    <CardDescription>Revenue and customer breakdown by industry</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {strategicInsights.industry_analysis?.map((industry, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">{industry.industry}</p>
                            <p className="text-sm text-muted-foreground">
                              {industry.customer_count} customers • {industry.growth_trend}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">AED {industry.revenue.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{industry.recommendation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Action Plans */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Action Plans
                    </CardTitle>
                    <CardDescription>Step-by-step plans to execute recommendations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {strategicInsights.action_plans?.map((plan, idx) => (
                        <Card key={idx}>
                          <CardHeader>
                            <CardTitle className="text-base">{plan.title}</CardTitle>
                            <CardDescription>
                              Timeline: {plan.timeline} • Owner: {plan.owner}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ol className="list-decimal list-inside space-y-1 text-sm">
                              {plan.steps.map((step, stepIdx) => (
                                <li key={stepIdx}>{step}</li>
                              ))}
                            </ol>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Alert>
                <AlertDescription>
                  No strategic insights available. Click "Generate 360° Analysis" to analyze.
                </AlertDescription>
              </Alert>
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
