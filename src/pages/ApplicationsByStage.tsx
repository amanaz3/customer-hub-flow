import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Send,
  DollarSign,
  Eye,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type ApplicationStatus = 'draft' | 'submitted' | 'returned' | 'paid' | 'completed' | 'rejected' | 'under_review' | 'approved' | 'need more info';

interface Application {
  id: string;
  reference_number: number;
  status: ApplicationStatus;
  application_type: string | null;
  created_at: string;
  updated_at: string;
  customer: {
    name: string;
    company: string;
    email: string;
  } | null;
}

interface StageStats {
  status: ApplicationStatus;
  count: number;
  applications: Application[];
}

const statusConfig: Record<ApplicationStatus, { label: string; icon: any; color: string }> = {
  draft: { label: 'Draft', icon: FileText, color: 'bg-gray-500' },
  submitted: { label: 'Submitted', icon: Send, color: 'bg-blue-500' },
  returned: { label: 'Returned', icon: RefreshCw, color: 'bg-orange-500' },
  paid: { label: 'Paid', icon: DollarSign, color: 'bg-green-500' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'bg-emerald-500' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'bg-red-500' },
  under_review: { label: 'Under Review', icon: Eye, color: 'bg-purple-500' },
  approved: { label: 'Approved', icon: CheckCircle2, color: 'bg-teal-500' },
  'need more info': { label: 'Need More Info', icon: AlertCircle, color: 'bg-yellow-500' }
};

const ApplicationsByStage = () => {
  const [stageStats, setStageStats] = useState<StageStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<ApplicationStatus>('submitted');
  const navigate = useNavigate();

  const fetchApplicationsByStage = async () => {
    try {
      setLoading(true);
      const { data: applications, error } = await supabase
        .from('account_applications')
        .select(`
          id,
          reference_number,
          status,
          application_type,
          created_at,
          updated_at,
          customer:customers(name, company, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group applications by status
      const grouped = applications?.reduce((acc, app) => {
        const status = app.status as ApplicationStatus;
        if (!acc[status]) {
          acc[status] = {
            status,
            count: 0,
            applications: []
          };
        }
        acc[status].count++;
        acc[status].applications.push(app as Application);
        return acc;
      }, {} as Record<ApplicationStatus, StageStats>);

      // Convert to array and sort by count
      const statsArray = Object.values(grouped || {}).sort((a, b) => b.count - a.count);
      setStageStats(statsArray);

      // Set first stage with applications as selected
      if (statsArray.length > 0 && !statsArray.find(s => s.status === selectedStage)) {
        setSelectedStage(statsArray[0].status);
      }
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationsByStage();
  }, []);

  const getStageConfig = (status: ApplicationStatus) => {
    return statusConfig[status] || { label: status, icon: FileText, color: 'bg-gray-500' };
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const selectedStageData = stageStats.find(s => s.status === selectedStage);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Applications by Stage</h1>
          <p className="text-muted-foreground">
            View and manage applications organized by their current stage
          </p>
        </div>
        <Button onClick={fetchApplicationsByStage} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stage Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {stageStats.map((stage) => {
          const config = getStageConfig(stage.status);
          const Icon = config.icon;
          const isSelected = selectedStage === stage.status;
          
          return (
            <Card
              key={stage.status}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isSelected ? 'ring-2 ring-primary shadow-lg' : ''
              }`}
              onClick={() => setSelectedStage(stage.status)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${config.color} bg-opacity-10`}>
                    <Icon className={`h-5 w-5 text-${config.color.replace('bg-', '')}`} />
                  </div>
                  <Badge variant="secondary" className="text-lg font-bold">
                    {stage.count}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-sm">{config.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Stage Applications */}
      {selectedStageData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {(() => {
                    const Icon = getStageConfig(selectedStage).icon;
                    return <Icon className="h-5 w-5" />;
                  })()}
                  {getStageConfig(selectedStage).label} Applications
                </CardTitle>
                <CardDescription>
                  {selectedStageData.count} application{selectedStageData.count !== 1 ? 's' : ''} in this stage
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {selectedStageData.applications.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No applications in this stage
                  </div>
                ) : (
                  selectedStageData.applications.map((app) => (
                    <Card
                      key={app.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/applications/${app.id}`)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="font-mono">
                                #{app.reference_number}
                              </Badge>
                              <Badge className={getStageConfig(app.status).color}>
                                {getStageConfig(app.status).label}
                              </Badge>
                            </div>
                            <div>
                              <p className="font-semibold">
                                {app.customer?.name || 'Unknown Customer'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {app.customer?.company}
                              </p>
                            </div>
                            {app.application_type && (
                              <p className="text-sm text-muted-foreground">
                                Type: {app.application_type}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(app.created_at)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ApplicationsByStage;
