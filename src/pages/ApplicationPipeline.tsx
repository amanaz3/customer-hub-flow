import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, Sparkles, TrendingUp, AlertTriangle, 
  FileText, Clock, CheckCircle2, XCircle, ArrowRight 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ApplicationPipelineChart } from "@/components/Dashboard/ApplicationPipelineChart";
import { PipelineAIRecommendations } from "@/components/Dashboard/PipelineAIRecommendations";
import { PipelineStageDetails } from "@/components/Dashboard/PipelineStageDetails";
import { ApplicationPerformanceAnalytics } from "@/components/Dashboard/ApplicationPerformanceAnalytics";

interface Application {
  id: string;
  reference_number: number;
  status: string;
  created_at: string;
  updated_at: string;
  application_type: string;
  customer_id: string;
  customer?: {
    name: string;
    company: string;
  };
}

const ApplicationPipeline = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const { toast } = useToast();

  const stageOrder = ['draft', 'submitted', 'under_review', 'approved', 'paid', 'completed'];
  const stageLabels: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    under_review: 'Under Review',
    approved: 'Approved',
    paid: 'Paid',
    completed: 'Completed',
  };

  const stageIcons: Record<string, any> = {
    draft: FileText,
    submitted: TrendingUp,
    under_review: Clock,
    approved: CheckCircle2,
    paid: CheckCircle2,
    completed: CheckCircle2,
  };

  useEffect(() => {
    fetchApplications();

    // Set up real-time subscription
    const channel = supabase
      .channel('application-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'account_applications'
        },
        () => {
          console.log('Application change detected, refetching...');
          fetchApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('account_applications')
        .select(`
          *,
          customer:customers(name, company)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzeWithAI = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-application-pipeline');

      if (error) throw error;

      if (data) {
        setAnalysis(data);
        toast({
          title: "Analysis Complete",
          description: "AI recommendations generated successfully",
        });
      }
    } catch (error: any) {
      console.error('Error analyzing pipeline:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to generate recommendations",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Calculate pipeline metrics
  const pipelineData = stageOrder.map(status => {
    const count = applications.filter(app => app.status === status).length;
    return { status: stageLabels[status], count };
  });

  const activeApps = applications.filter(app => 
    app.status !== 'completed' && app.status !== 'rejected'
  );
  const completedApps = applications.filter(app => app.status === 'completed');
  const rejectedApps = applications.filter(app => app.status === 'rejected');

  // Calculate conversion rates
  const conversionRates = stageOrder.slice(0, -1).map((status, idx) => {
    const current = applications.filter(app => app.status === status).length;
    const next = applications.filter(app => app.status === stageOrder[idx + 1]).length;
    const rate = current > 0 ? (next / current * 100).toFixed(1) : '0';
    return {
      from: stageLabels[status],
      to: stageLabels[stageOrder[idx + 1]],
      rate: parseFloat(rate),
    };
  });

  const avgConversionRate = conversionRates.reduce((sum, cr) => sum + cr.rate, 0) / conversionRates.length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Application Pipeline</h2>
          <p className="text-muted-foreground">
            Monitor application flow and identify bottlenecks with AI-powered insights
          </p>
        </div>
        <Button onClick={analyzeWithAI} disabled={analyzing || loading}>
          {analyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              AI Analysis
            </>
          )}
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeApps.length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeApps.length}</div>
            <p className="text-xs text-muted-foreground">
              Active in pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedApps.length}</div>
            <p className="text-xs text-muted-foreground">
              Successfully processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgConversionRate.toFixed(1)}%</div>
            <Progress value={avgConversionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Visualization */}
      <ApplicationPipelineChart data={pipelineData} />

      {/* AI Recommendations */}
      {analysis && (
        <PipelineAIRecommendations analysis={analysis.analysis} metrics={analysis.metrics} summary={analysis.summary} />
      )}

      {/* Detailed Views */}
      <Tabs defaultValue="stages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stages">Stage Details</TabsTrigger>
          <TabsTrigger value="conversion">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
          <TabsTrigger value="applications">All Applications</TabsTrigger>
        </TabsList>

        {/* Stage Details */}
        <TabsContent value="stages">
          <PipelineStageDetails 
            applications={applications} 
            stageOrder={stageOrder}
            stageLabels={stageLabels}
            stageIcons={stageIcons}
          />
        </TabsContent>

        {/* Conversion Funnel */}
        <TabsContent value="conversion">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel Analysis</CardTitle>
              <CardDescription>Track how applications move through each stage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {conversionRates.map((cr, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{cr.from}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{cr.to}</span>
                      </div>
                      <Badge variant={cr.rate >= 70 ? "default" : cr.rate >= 50 ? "secondary" : "destructive"}>
                        {cr.rate}%
                      </Badge>
                    </div>
                    <Progress value={cr.rate} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Analytics */}
        <TabsContent value="analytics">
          <ApplicationPerformanceAnalytics />
        </TabsContent>

        {/* All Applications */}
        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>All Applications</CardTitle>
              <CardDescription>Complete list of applications in the pipeline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Ref #</th>
                      <th className="text-left p-2">Customer</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Created</th>
                      <th className="text-left p-2">Days Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => {
                      const daysActive = Math.round(
                        (new Date().getTime() - new Date(app.created_at).getTime()) / (1000 * 60 * 60 * 24)
                      );
                      
                      return (
                        <tr key={app.id} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">#{app.reference_number}</td>
                          <td className="p-2">
                            <div>
                              <p className="font-medium">{app.customer?.name}</p>
                              <p className="text-sm text-muted-foreground">{app.customer?.company}</p>
                            </div>
                          </td>
                          <td className="p-2 text-sm">{app.application_type}</td>
                          <td className="p-2">
                            <Badge variant={
                              app.status === 'completed' ? 'default' :
                              app.status === 'rejected' ? 'destructive' :
                              'secondary'
                            }>
                              {stageLabels[app.status] || app.status}
                            </Badge>
                          </td>
                          <td className="p-2 text-sm">
                            {new Date(app.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-2">
                            <Badge variant={
                              daysActive > 14 ? 'destructive' :
                              daysActive > 7 ? 'secondary' :
                              'outline'
                            }>
                              {daysActive} days
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApplicationPipeline;
