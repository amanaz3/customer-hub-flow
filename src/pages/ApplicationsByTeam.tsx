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
  Calendar,
  Mail,
  MessageSquare,
  Eye,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApplicationsGanttChart } from "@/components/Application/ApplicationsGanttChart";
import { TeamApplicationsHeatMap } from "@/components/Application/TeamApplicationsHeatMap";
import { ApplicationsFunnelChart } from "@/components/Application/ApplicationsFunnelChart";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [filterPeriod, setFilterPeriod] = useState<'last30days' | 'last60days' | 'last90days' | 'custom'>('last60days');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [customEmailDialogOpen, setCustomEmailDialogOpen] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [reportPreviewOpen, setReportPreviewOpen] = useState(false);
  const [selectedMemberForEmail, setSelectedMemberForEmail] = useState<TeamStats | null>(null);
  const [applicationComments, setApplicationComments] = useState<Record<string, Array<{
    comment: string;
    created_at: string;
    previous_status: string;
    new_status: string;
  }>>>({});
  const navigate = useNavigate();

  const fetchCommentsForApplications = async (applicationIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('application_status_changes')
        .select('application_id, comment, created_at, previous_status, new_status')
        .in('application_id', applicationIds)
        .not('comment', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const commentsByApp: Record<string, Array<{
        comment: string;
        created_at: string;
        previous_status: string;
        new_status: string;
      }>> = {};

      data?.forEach(item => {
        if (!commentsByApp[item.application_id]) {
          commentsByApp[item.application_id] = [];
        }
        commentsByApp[item.application_id].push({
          comment: item.comment!,
          created_at: item.created_at,
          previous_status: item.previous_status,
          new_status: item.new_status,
        });
      });

      setApplicationComments(commentsByApp);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

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
      
      // Apply date filter based on period
      if (filterPeriod === 'last30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = query.gte('created_at', thirtyDaysAgo.toISOString());
      } else if (filterPeriod === 'last60days') {
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        query = query.gte('created_at', sixtyDaysAgo.toISOString());
      } else if (filterPeriod === 'last90days') {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        query = query.gte('created_at', ninetyDaysAgo.toISOString());
      } else {
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

      // Fetch comments for all applications
      const allAppIds = statsArray.flatMap(team => team.applications.map(app => app.id));
      if (allAppIds.length > 0) {
        await fetchCommentsForApplications(allAppIds);
      }

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

  const sendEmailReport = async (teamMember: TeamStats, recipientEmail?: string) => {
    if (!aiInsights) {
      toast.error('Please load AI insights first before sending report');
      return;
    }

    const targetEmail = recipientEmail || teamMember.user.email;

    setSendingEmail(true);
    try {
      const stuckApps = teamMember.applications.filter(app => {
        const daysSinceUpdate = Math.floor(
          (Date.now() - new Date(app.updated_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceUpdate > 7 && !['completed', 'rejected', 'paid'].includes(app.status);
      });

      // Gather comments for this team member's applications
      const comments = teamMember.applications
        .filter(app => applicationComments[app.id] && applicationComments[app.id].length > 0)
        .flatMap(app => 
          applicationComments[app.id].slice(0, 2).map(comment => ({
            applicationRef: app.reference_number,
            comment: comment.comment,
            date: comment.created_at,
            status: `${comment.previous_status} → ${comment.new_status}`
          }))
        )
        .slice(0, 10); // Limit to 10 most recent

      const { data, error } = await supabase.functions.invoke('send-team-member-report', {
        body: {
          teamMemberName: teamMember.user.name,
          teamMemberEmail: targetEmail,
          applications: teamMember.applications,
          stuckApps,
          aiSummary: aiInsights.summary,
          blockers: aiInsights.blockers,
          immediateActions: aiInsights.immediateActions,
          comments
        }
      });

      if (error) throw error;

      toast.success(`Report sent successfully to ${targetEmail}`);
      setCustomEmailDialogOpen(false);
      setCustomEmail('');
    } catch (error: any) {
      console.error('Error sending email report:', error);
      toast.error(`Failed to send report: ${error.message || 'Unknown error'}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendCustomEmail = () => {
    if (!customEmail || !selectedMemberForEmail) return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    sendEmailReport(selectedMemberForEmail, customEmail);
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
  }, [filterPeriod, selectedYear, selectedMonth]);

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
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by:</span>
            </div>
            <Select
              value={filterPeriod}
              onValueChange={(value: 'last30days' | 'last60days' | 'last90days' | 'custom') => setFilterPeriod(value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="last60days">Last 60 Days</SelectItem>
                <SelectItem value="last90days">Last 90 Days</SelectItem>
                <SelectItem value="custom">Custom Period</SelectItem>
              </SelectContent>
            </Select>
            
            {filterPeriod === 'custom' && (
              <>
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
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Overview Dashboard */}
      {!loading && (
        <div className="space-y-6">
          <ApplicationsFunnelChart 
            applications={teamStats.flatMap(team => 
              team.applications.map(app => ({
                id: app.id,
                status: app.status,
                updated_at: app.updated_at,
              }))
            )} 
          />
          <TeamApplicationsHeatMap 
            applications={teamStats.flatMap(team => 
              team.applications.map(app => ({
                id: app.id,
                status: app.status,
                user_id: team.user.id,
                created_at: app.created_at,
                updated_at: app.updated_at,
              }))
            )} 
            teamMembers={teamStats.map(team => team.user)}
          />
        </div>
      )}

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

      {/* Custom Email Dialog */}
      <Dialog open={customEmailDialogOpen} onOpenChange={setCustomEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Report to Custom Email</DialogTitle>
            <DialogDescription>
              Enter the email address where you want to send the team member report
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="custom-email">Email Address</Label>
              <Input
                id="custom-email"
                type="email"
                placeholder="example@company.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendCustomEmail();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendCustomEmail} disabled={sendingEmail || !customEmail}>
              <Mail className="h-4 w-4 mr-2" />
              {sendingEmail ? 'Sending...' : 'Send Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              {selectedTeamData.user.id !== 'unassigned' && aiInsights && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setSelectedMemberForEmail(selectedTeamData);
                      setReportPreviewOpen(true);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Report
                  </Button>
                  <Button
                    onClick={() => sendEmailReport(selectedTeamData)}
                    disabled={sendingEmail}
                    variant="outline"
                    size="sm"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {sendingEmail ? 'Sending...' : 'Email Report'}
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedMemberForEmail(selectedTeamData);
                      setCustomEmailDialogOpen(true);
                    }}
                    disabled={sendingEmail}
                    variant="outline"
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send to Custom Email
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="applications" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="applications">
                  <FileText className="h-4 w-4 mr-2" />
                  Applications
                </TabsTrigger>
                <TabsTrigger value="insights">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  AI Insights
                </TabsTrigger>
                <TabsTrigger value="comments">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Comments
                </TabsTrigger>
                <TabsTrigger value="metrics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Metrics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="applications" className="mt-4">
                <ApplicationsGanttChart applications={selectedTeamData.applications} />
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

              <TabsContent value="comments" className="mt-4">
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {selectedTeamData.applications
                      .filter(app => applicationComments[app.id] && applicationComments[app.id].length > 0)
                      .map(app => {
                        const comments = applicationComments[app.id];
                        const daysStuck = Math.floor(
                          (Date.now() - new Date(app.updated_at).getTime()) / (1000 * 60 * 60 * 24)
                        );
                        const isStuck = daysStuck > 7 && !['completed', 'rejected', 'paid'].includes(app.status);

                        return (
                          <Card key={app.id} className={isStuck ? 'border-red-200 bg-red-50/50' : ''}>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-base">
                                    Application #{app.reference_number}
                                  </CardTitle>
                                  {getStatusBadge(app.status)}
                                  {isStuck && (
                                    <Badge variant="destructive" className="gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      Stuck {daysStuck}d
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/application/${app.id}`)}
                                >
                                  View Details
                                </Button>
                              </div>
                              <CardDescription>
                                {app.customer?.name} - {app.customer?.company}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <p className="text-sm font-medium text-muted-foreground">Status Change History:</p>
                                {comments.map((comment, idx) => (
                                  <div
                                    key={idx}
                                    className="border-l-4 border-purple-500 pl-4 py-2 bg-purple-50/50 rounded-r"
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="outline" className="font-mono text-xs">
                                        {comment.previous_status} → {comment.new_status}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(comment.created_at).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                    </div>
                                    <p className="text-sm">{comment.comment}</p>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    {selectedTeamData.applications.filter(
                      app => applicationComments[app.id] && applicationComments[app.id].length > 0
                    ).length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No status change comments found for this team member's applications.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
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

      {/* Report Preview Dialog */}
      <Dialog open={reportPreviewOpen} onOpenChange={setReportPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Team Performance Report Preview</DialogTitle>
          </DialogHeader>
          {selectedMemberForEmail && aiInsights && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-violet-600 text-white p-6 rounded-lg">
                <h2 className="text-2xl font-bold mb-2">Team Performance Report</h2>
                <p className="text-lg opacity-90">{selectedMemberForEmail.user.name}</p>
              </div>

              {/* Overview */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold border-b pb-2">📊 Overview</h3>
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <p><strong>Total Applications:</strong> {selectedMemberForEmail.applications.length}</p>
                  <div>
                    <p className="font-semibold mb-2">Status Breakdown:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {Object.entries(
                        selectedMemberForEmail.applications.reduce((acc, app) => {
                          acc[app.status] = (acc[app.status] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([status, count]) => (
                        <li key={status}>
                          <strong>{status.replace('_', ' ').toUpperCase()}</strong>: {count}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* AI Summary */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold border-b pb-2">🤖 AI Performance Analysis</h3>
                <div className="bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500 p-4 rounded">
                  <p>{aiInsights.summary}</p>
                </div>
              </div>

              {/* Stuck Applications */}
              {aiInsights.metrics.stuckApps > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold border-b pb-2 text-destructive">
                    ⚠️ Stuck/Delayed Applications ({aiInsights.metrics.stuckApps})
                  </h3>
                  <div className="space-y-2">
                    {selectedMemberForEmail.applications
                      .filter(app => {
                        const daysSinceUpdate = Math.floor((Date.now() - new Date(app.updated_at).getTime()) / (1000 * 60 * 60 * 24));
                        return daysSinceUpdate >= 7 && app.status !== 'completed' && app.status !== 'rejected';
                      })
                      .map((app) => {
                        const daysStuck = Math.floor((Date.now() - new Date(app.updated_at).getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <div key={app.id} className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3 rounded flex justify-between items-center">
                            <div>
                              <p className="font-bold">#{app.reference_number}</p>
                              <p className="text-sm">{app.customer?.name || 'N/A'} - {app.customer?.company || 'N/A'}</p>
                              <span className="text-xs bg-yellow-200 dark:bg-yellow-900 px-2 py-1 rounded">
                                {app.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                            <div className="text-destructive font-bold flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {daysStuck} days
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Blockers */}
              {aiInsights.blockers && aiInsights.blockers.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold border-b pb-2 text-destructive">🚧 Identified Blockers</h3>
                  <div className="space-y-3">
                    {aiInsights.blockers.map((blocker, idx) => (
                      <div key={idx} className="bg-red-50 dark:bg-red-950 border-l-4 border-red-500 p-4 rounded">
                        <p className="font-bold mb-2">{blocker.blocker}</p>
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Affected Applications:</strong> {blocker.affectedApps.map(ref => `#${ref}`).join(', ')}
                        </p>
                        <div className="bg-background p-2 rounded text-sm">
                          <strong>💡 Recommendation:</strong> {blocker.recommendation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Immediate Actions */}
              {aiInsights.immediateActions && aiInsights.immediateActions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold border-b pb-2 text-blue-600 dark:text-blue-400">
                    🎯 Immediate Actions Required
                  </h3>
                  <div className="space-y-3">
                    {aiInsights.immediateActions.map((action, idx) => {
                      const priorityColor = action.priority === 'high' ? 'border-red-500' : action.priority === 'medium' ? 'border-orange-500' : 'border-green-500';
                      const bgColor = action.priority === 'high' ? 'bg-red-500' : action.priority === 'medium' ? 'bg-orange-500' : 'bg-green-500';
                      return (
                        <div key={idx} className={`border-l-4 ${priorityColor} p-4 rounded bg-muted`}>
                          <div className="flex justify-between items-center mb-2">
                            <p className="font-bold">{action.action}</p>
                            <span className={`text-xs px-2 py-1 rounded uppercase font-semibold ${bgColor} text-white`}>
                              {action.priority}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{action.reason}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Comments */}
              {applicationComments && Object.keys(applicationComments).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold border-b pb-2 text-purple-600 dark:text-purple-400">
                    💬 Recent Status Comments
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(applicationComments).flatMap(([appId, comments]) => {
                      const app = selectedMemberForEmail.applications.find(a => a.id === appId);
                      return comments.slice(0, 3).map((comment, idx) => (
                        <div key={`${appId}-${idx}`} className="bg-purple-50 dark:bg-purple-950 border-l-4 border-purple-500 p-4 rounded">
                          <p className="font-bold mb-2">App #{app?.reference_number} - {comment.new_status}</p>
                          <p className="text-sm mb-2">{comment.comment}</p>
                          <p className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleDateString()}</p>
                        </div>
                      ));
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicationsByTeam;
