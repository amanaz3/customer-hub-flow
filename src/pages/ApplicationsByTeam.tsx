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
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  const navigate = useNavigate();

  const fetchApplicationsByTeam = async () => {
    try {
      setLoading(true);
      
      // Fetch all applications with customer and user info
      const { data: applications, error: appsError } = await supabase
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
        `)
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;

      // Group applications by user
      const grouped = applications?.reduce((acc, app) => {
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
            } : null
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
            } : null
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

  useEffect(() => {
    fetchApplicationsByTeam();
  }, []);

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

      {/* Selected Team Member's Applications */}
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
                  <CardTitle>{selectedTeamData.user.name}</CardTitle>
                  <CardDescription>
                    {selectedTeamData.count} application{selectedTeamData.count !== 1 ? 's' : ''}
                    {selectedTeamData.user.email && ` • ${selectedTeamData.user.email}`}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {selectedTeamData.applications.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No applications found
                  </div>
                ) : (
                  selectedTeamData.applications.map((app) => (
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
                              {getStatusBadge(app.status)}
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

export default ApplicationsByTeam;
