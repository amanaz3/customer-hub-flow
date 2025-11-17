import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  FileText, 
  Clock, 
  User,
  RefreshCw,
  Users,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  BarChart3,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ApplicationStatus = 'draft' | 'submitted' | 'returned' | 'paid' | 'completed' | 'rejected' | 'under_review' | 'approved' | 'need more info';

interface StatusChange {
  previous_status: string;
  new_status: string;
  created_at: string;
  changed_by_role: string;
}

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
  statusChanges?: StatusChange[];
}

interface AIInsights {
  summary: string;
  performanceLevel: 'excellent' | 'good' | 'needs_improvement' | 'at_risk';
  immediateActions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
  }>;
  blockers: Array<{
    blocker: string;
    affectedApps: number[];
    recommendation: string;
  }>;
  collaborationOpportunities?: string[];
  individualGuidance?: string;
  metrics: {
    totalApps: number;
    recentApps: number;
    stuckApps: number;
    bouncingApps: number;
    statusDistribution: Record<string, number>;
  };
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface TeamStats {
  user: TeamMember;
  count: number;
  applications: Application[];
}

const statusColors: Record<ApplicationStatus, string> = {
  draft: 'bg-gray-500',
  submitted: 'bg-blue-500',
  returned: 'bg-orange-500',
  paid: 'bg-green-500',
  completed: 'bg-emerald-500',
  rejected: 'bg-red-500',
  under_review: 'bg-purple-500',
  approved: 'bg-teal-500',
  'need more info': 'bg-yellow-500'
};

const ApplicationsByTeam = () => {
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const navigate = useNavigate();

  const fetchApplicationsByTeam = async () => {
    try {
      setLoading(true);
      
      // Build query with date filters
      let query = supabase
        .from('account_applications')
        .select(`
          id,
          reference_number,
          status,
          application_type,
          created_at,
          updated_at,
          customer:customers(
            name,
            company,
            email,
            user_id,
            user:profiles!customers_user_id_fkey(
              id,
              name,
              email,
              role
            )
          )
        `);
      
      // Apply year filter
      const startOfYear = new Date(selectedYear, 0, 1).toISOString();
      const endOfYear = new Date(selectedYear, 11, 31, 23, 59, 59).toISOString();
      query = query.gte('created_at', startOfYear).lte('created_at', endOfYear);
      
      // Apply month filter if not 'all'
      if (selectedMonth !== 'all') {
        const startOfMonth = new Date(selectedYear, selectedMonth, 1).toISOString();
        const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59).toISOString();
        query = query.gte('created_at', startOfMonth).lte('created_at', endOfMonth);
      }
      
      const { data: applications, error: appsError } = await query.order('created_at', { ascending: false });

      if (appsError) throw appsError;

      // Fetch status changes for all applications
      const appIds = applications?.map(app => app.id) || [];
      const { data: statusChanges } = await supabase
        .from('application_status_changes')
        .select('application_id, previous_status, new_status, created_at, changed_by_role')
        .in('application_id', appIds)
        .order('created_at', { ascending: true });

      // Map status changes to applications
      const appsWithHistory = applications?.map(app => ({
        ...app,
        statusChanges: statusChanges?.filter(sc => sc.application_id === app.id) || []
      }));

      // Group applications by user
      const grouped = appsWithHistory?.reduce((acc, app) => {
        const userId = app.customer?.user_id;
        const user = app.customer?.user;
        
        if (!userId || !user) {
          // Handle unassigned applications
          if (!acc['unassigned']) {
            acc['unassigned'] = {
              user: {
                id: 'unassigned',
                name: 'Unassigned',
                email: '',
                role: ''
              },
              count: 0,
              applications: []
            };
          }
          acc['unassigned'].count++;
          acc['unassigned'].applications.push({
            id: app.id,
            reference_number: app.reference_number,
            status: app.status as ApplicationStatus,
            application_type: app.application_type,
            created_at: app.created_at,
            updated_at: app.updated_at,
            customer: app.customer ? {
              name: app.customer.name,
              company: app.customer.company,
              email: app.customer.email
            } : null,
            statusChanges: app.statusChanges
          });
        } else {
          if (!acc[userId]) {
            acc[userId] = {
              user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
              },
              count: 0,
              applications: []
            };
          }
          acc[userId].count++;
          acc[userId].applications.push({
            id: app.id,
            reference_number: app.reference_number,
            status: app.status as ApplicationStatus,
            application_type: app.application_type,
            created_at: app.created_at,
            updated_at: app.updated_at,
            customer: app.customer ? {
              name: app.customer.name,
              company: app.customer.company,
              email: app.customer.email
            } : null,
            statusChanges: app.statusChanges
          });
        }
        return acc;
      }, {} as Record<string, TeamStats>);

      // Convert to array and sort by count
      const statsArray = Object.values(grouped || {}).sort((a, b) => b.count - a.count);
      setTeamStats(statsArray);

      // Set first team member as selected
      if (statsArray.length > 0 && !selectedUserId) {
        setSelectedUserId(statsArray[0].user.id);
      }
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchAIInsights = async (teamMember: TeamStats) => {
    if (teamMember.user.id === 'unassigned') {
      console.log('Skipping AI insights for unassigned');
      return;
    }
    
    console.log('Fetching AI insights for team member:', {
      id: teamMember.user.id,
      name: teamMember.user.name,
      applicationCount: teamMember.count
    });
    
    setLoadingInsights(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-team-performance', {
        body: {
          teamData: {
            id: teamMember.user.id,
            name: teamMember.user.name,
            email: teamMember.user.email,
            applicationCount: teamMember.count,
            applications: teamMember.applications
          },
          period: 'current',
          periodType: 'monthly'
        }
      });

      console.log('AI insights response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      
      setAiInsights(data);
      console.log('AI insights set successfully');
    } catch (error: any) {
      console.error('Error fetching AI insights:', error);
      toast.error(`Failed to load AI insights: ${error.message || 'Unknown error'}`);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    fetchApplicationsByTeam();
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    if (selectedUserId && teamStats.length > 0) {
      const teamMember = teamStats.find(t => t.user.id === selectedUserId);
      if (teamMember) {
        console.log('Fetching AI insights for:', teamMember.user.name);
        fetchAIInsights(teamMember);
      }
    }
  }, [selectedUserId, teamStats]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    return (
      <Badge className={statusColors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
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

  const selectedTeamData = teamStats.find(t => t.user.id === selectedUserId);

  const getPerformanceBadge = (level: string) => {
    switch (level) {
      case 'excellent':
        return <Badge className="bg-green-500">Excellent</Badge>;
      case 'good':
        return <Badge className="bg-blue-500">Good</Badge>;
      case 'needs_improvement':
        return <Badge className="bg-yellow-500">Needs Improvement</Badge>;
      case 'at_risk':
        return <Badge className="bg-red-500">At Risk</Badge>;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge className="bg-orange-500">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Applications by Team</h1>
          <p className="text-muted-foreground">
            View and manage applications organized by team member
          </p>
        </div>
        <Button onClick={fetchApplicationsByTeam} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Date Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by:</span>
            </div>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(value === 'all' ? 'all' : parseInt(value))}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {Array.from({ length: 12 }, (_, i) => i).map((month) => (
                  <SelectItem key={month} value={month.toString()}>
                    {new Date(2024, month).toLocaleString('en-US', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Team Member Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {teamStats.map((team) => {
          const isSelected = selectedUserId === team.user.id;
          
          return (
            <Card
              key={team.user.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isSelected ? 'ring-2 ring-primary shadow-lg' : ''
              }`}
              onClick={() => setSelectedUserId(team.user.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {team.user.id === 'unassigned' ? (
                        <Users className="h-6 w-6" />
                      ) : (
                        getInitials(team.user.name)
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <Badge variant="secondary" className="text-lg font-bold">
                    {team.count}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-sm truncate">{team.user.name}</p>
                {team.user.role && (
                  <p className="text-xs text-muted-foreground capitalize">{team.user.role}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Team Member's Applications with AI Insights */}
      {selectedTeamData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedTeamData.user.id === 'unassigned' ? (
                      <Users className="h-5 w-5" />
                    ) : (
                      getInitials(selectedTeamData.user.name)
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {selectedTeamData.user.name}
                    {aiInsights && getPerformanceBadge(aiInsights.performanceLevel)}
                  </CardTitle>
                  <CardDescription>
                    {selectedTeamData.count} application{selectedTeamData.count !== 1 ? 's' : ''}
                    {selectedTeamData.user.email && ` • ${selectedTeamData.user.email}`}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="applications" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="applications">
                  <FileText className="h-4 w-4 mr-2" />
                  Applications
                </TabsTrigger>
                <TabsTrigger value="insights">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  AI Insights
                </TabsTrigger>
                <TabsTrigger value="metrics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Metrics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="applications" className="mt-4">
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-3">
                    {selectedTeamData.applications.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        No applications found
                      </div>
                    ) : (
                      selectedTeamData.applications.map((app) => {
                        const daysSinceUpdate = Math.floor((Date.now() - new Date(app.updated_at).getTime()) / (1000 * 60 * 60 * 24));
                        const isStuck = daysSinceUpdate > 7 && !['completed', 'rejected', 'paid'].includes(app.status);
                        const hasBounced = app.statusChanges && app.statusChanges.length >= 3;

                        return (
                          <Card
                            key={app.id}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => navigate(`/applications/${app.id}`)}
                          >
                            <CardContent className="pt-6">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge variant="outline" className="font-mono">
                                        #{app.reference_number}
                                      </Badge>
                                      {getStatusBadge(app.status)}
                                      {isStuck && (
                                        <Badge variant="destructive" className="gap-1">
                                          <AlertTriangle className="h-3 w-3" />
                                          Stuck ({daysSinceUpdate}d)
                                        </Badge>
                                      )}
                                      {hasBounced && (
                                        <Badge className="bg-orange-500 gap-1">
                                          <RefreshCw className="h-3 w-3" />
                                          Multiple Changes
                                        </Badge>
                                      )}
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

                                {app.statusChanges && app.statusChanges.length > 0 && (
                                  <div className="border-t pt-3">
                                    <p className="text-xs font-semibold mb-2">Recent Status Changes:</p>
                                    <div className="space-y-1">
                                      {app.statusChanges.slice(-3).map((change, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                                          <ArrowRight className="h-3 w-3" />
                                          <span className="capitalize">{change.previous_status}</span>
                                          <span>→</span>
                                          <span className="capitalize font-medium">{change.new_status}</span>
                                          <span className="text-[10px]">
                                            ({formatDate(change.created_at)})
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="insights" className="mt-4">
                {loadingInsights ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : aiInsights ? (
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-6">
                      {/* Summary */}
                      <Alert>
                        <TrendingUp className="h-4 w-4" />
                        <AlertDescription>{aiInsights.summary}</AlertDescription>
                      </Alert>

                      {/* Immediate Actions */}
                      {aiInsights.immediateActions.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Immediate Actions</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {aiInsights.immediateActions.map((action, idx) => (
                              <div key={idx} className="border-l-4 border-primary pl-4 py-2">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="font-semibold">{action.action}</p>
                                  {getPriorityBadge(action.priority)}
                                </div>
                                <p className="text-sm text-muted-foreground">{action.reason}</p>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}

                      {/* Blockers */}
                      {aiInsights.blockers.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-red-500" />
                              Identified Blockers
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {aiInsights.blockers.map((blocker, idx) => (
                              <div key={idx} className="space-y-2">
                                <p className="font-semibold">{blocker.blocker}</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm text-muted-foreground">Affected:</span>
                                  {blocker.affectedApps.map(appRef => (
                                    <Badge key={appRef} variant="outline" className="font-mono">
                                      #{appRef}
                                    </Badge>
                                  ))}
                                </div>
                                <Alert>
                                  <Lightbulb className="h-4 w-4" />
                                  <AlertDescription>{blocker.recommendation}</AlertDescription>
                                </Alert>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}

                      {/* Collaboration Opportunities */}
                      {aiInsights.collaborationOpportunities && aiInsights.collaborationOpportunities.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Collaboration Opportunities</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {aiInsights.collaborationOpportunities.map((opp, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <ArrowRight className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                                  <span className="text-sm">{opp}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                      {/* Individual Guidance */}
                      {aiInsights.individualGuidance && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Personalized Guidance</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm">{aiInsights.individualGuidance}</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Select a team member to view AI insights
                  </div>
                )}
              </TabsContent>

              <TabsContent value="metrics" className="mt-4">
                {aiInsights?.metrics ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">{aiInsights.metrics.totalApps}</div>
                          <p className="text-sm text-muted-foreground">Total Applications</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">{aiInsights.metrics.recentApps}</div>
                          <p className="text-sm text-muted-foreground">Recent (30d)</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-red-500">{aiInsights.metrics.stuckApps}</div>
                          <p className="text-sm text-muted-foreground">Stuck Apps</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold text-orange-500">{aiInsights.metrics.bouncingApps}</div>
                          <p className="text-sm text-muted-foreground">Status Reversals</p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Status Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(aiInsights.metrics.statusDistribution).map(([status, count]) => (
                            <div key={status} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getStatusBadge(status as ApplicationStatus)}
                                <span className="text-sm capitalize">{status}</span>
                              </div>
                              <span className="font-semibold">{count}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Select a team member to view metrics
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ApplicationsByTeam;
