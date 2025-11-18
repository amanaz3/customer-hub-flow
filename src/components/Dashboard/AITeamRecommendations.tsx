import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Sparkles, AlertTriangle, Users, Target, TrendingUp, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TeamMember {
  user_id: string;
  user_name: string;
  user_email: string;
  target_applications: number;
  actual_applications: number;
  target_revenue: number;
  actual_revenue: number;
  target_completed: number;
  actual_completed: number;
  completion_rate: number;
}

interface Recommendations {
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
  collaboration_opportunities: Array<{
    members: string[];
    reason: string;
    expected_impact: string;
  }>;
  individual_guidance?: Array<{
    member_name: string;
    guidance: string;
    support_needed: string;
  }>;
}

interface AITeamRecommendationsProps {
  teamData: TeamMember[];
  period: number;
  periodType: string;
}

export const AITeamRecommendations = ({ teamData, period, periodType }: AITeamRecommendationsProps) => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const { toast } = useToast();

  const analyzeTeam = async () => {
    if (teamData.length === 0) {
      toast({
        title: "No Data",
        description: "No team data available to analyze",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-team-targets', {
        body: {
          teamData,
          period,
          periodType,
        },
      });

      if (error) throw error;

      if (data?.recommendations) {
        setRecommendations(data.recommendations);
        toast({
          title: "Analysis Complete",
          description: "AI recommendations generated successfully",
        });
      }
    } catch (error: any) {
      console.error("Error analyzing team:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to generate recommendations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Performance Insights
            </CardTitle>
            <CardDescription>
              Get intelligent recommendations to improve team performance
            </CardDescription>
          </div>
          <Button onClick={analyzeTeam} disabled={loading || teamData.length === 0}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze Team
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {recommendations && (
        <CardContent>
          <Tabs defaultValue="insights" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="insights">
                <Info className="h-4 w-4 mr-2" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="actions">
                <Target className="h-4 w-4 mr-2" />
                Actions
              </TabsTrigger>
              <TabsTrigger value="blockers">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Blockers
              </TabsTrigger>
              <TabsTrigger value="collaboration">
                <Users className="h-4 w-4 mr-2" />
                Collaboration
              </TabsTrigger>
              <TabsTrigger value="guidance">
                <TrendingUp className="h-4 w-4 mr-2" />
                Guidance
              </TabsTrigger>
            </TabsList>

            {/* Key Insights */}
            <TabsContent value="insights">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg mb-4">Key Performance Insights</h4>
                  {recommendations.key_insights.map((insight, index) => (
                    <Alert key={index}>
                      <Info className="h-4 w-4" />
                      <AlertDescription>{insight}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Immediate Actions */}
            <TabsContent value="actions">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg mb-4">Immediate Actions Required</h4>
                  {recommendations.immediate_actions.map((action, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{action.action}</CardTitle>
                            <CardDescription className="mt-2">Assigned to: {action.who}</CardDescription>
                          </div>
                          {getPriorityBadge(action.priority)}
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Blockers & Risks */}
            <TabsContent value="blockers">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg mb-4">Identified Blockers & Risks</h4>
                  {recommendations.blockers_and_risks.map((blocker, index) => (
                    <Card key={index} className="border-destructive/50">
                      <CardHeader>
                        <CardTitle className="text-base flex items-start gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                          {blocker.blocker}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-2">Affected Team Members:</p>
                          <div className="flex flex-wrap gap-2">
                            {blocker.affected_members.map((member, idx) => (
                              <Badge key={idx} variant="secondary">{member}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Mitigation Strategy:</p>
                          <p className="text-sm text-muted-foreground">{blocker.mitigation}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Collaboration Opportunities */}
            <TabsContent value="collaboration">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg mb-4">Collaboration Opportunities</h4>
                  {recommendations.collaboration_opportunities.map((collab, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-start gap-2">
                          <Users className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex flex-wrap gap-2 mb-3">
                              {collab.members.map((member, idx) => (
                                <Badge key={idx}>{member}</Badge>
                              ))}
                            </div>
                            <CardDescription className="mb-3">
                              <span className="font-medium">Reason:</span> {collab.reason}
                            </CardDescription>
                            <div className="bg-muted p-3 rounded-md">
                              <p className="text-sm font-medium mb-1">Expected Impact:</p>
                              <p className="text-sm">{collab.expected_impact}</p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Individual Guidance */}
            <TabsContent value="guidance">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg mb-4">Individual Performance Guidance</h4>
                  {recommendations.individual_guidance && recommendations.individual_guidance.length > 0 ? (
                    recommendations.individual_guidance.map((guidance, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="text-base">{guidance.member_name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <p className="text-sm font-medium mb-2">Guidance:</p>
                            <p className="text-sm text-muted-foreground">{guidance.guidance}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-2">Support Needed:</p>
                            <p className="text-sm text-muted-foreground">{guidance.support_needed}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        No specific individual guidance needed. Team members are performing well or have adequate support.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
};
