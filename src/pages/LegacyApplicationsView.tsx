import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  RefreshCw, 
  Calendar, 
  FileText,
  AlertTriangle,
  Clock,
  ArrowLeft
} from "lucide-react";

interface Application {
  id: string;
  reference_number: number;
  status: string;
  application_type: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  completed_actual: string | null;
  customer: {
    name: string;
    company: string;
    email: string;
  } | null;
}

const statusColors: Record<string, string> = {
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

const LegacyApplicationsView = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to access this page");
        navigate('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        toast.error("Access denied. Admin privileges required.");
        navigate('/');
        return;
      }

      setIsAdmin(true);
      fetchLegacyApplications();
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/');
    }
  };

  const fetchLegacyApplications = async () => {
    try {
      setLoading(true);

      // Fetch applications with null completed_at but completed status
      // Or applications with missing data that need review
      let query = supabase
        .from('account_applications')
        .select(`
          id,
          reference_number,
          status,
          application_type,
          created_at,
          updated_at,
          completed_at,
          completed_actual,
          customer:customers(name, company, email)
        `)
        .order('created_at', { ascending: false });

      // Apply status filter
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus as any);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter for legacy applications (null completed_at when status is completed)
      const legacyApps = data?.filter(app => 
        (app.status === 'completed' && !app.completed_at) ||
        (app.status === 'paid' && !app.completed_at)
      ) || [];

      setApplications(legacyApps);
    } catch (error) {
      console.error('Error fetching legacy applications:', error);
      toast.error("Failed to load legacy applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchLegacyApplications();
    }
  }, [filterStatus, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/applications-by-team')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Legacy Applications View</h1>
            <p className="text-muted-foreground">
              Applications with missing completion data requiring review
            </p>
          </div>
        </div>
        <Button onClick={fetchLegacyApplications} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by status:</span>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Legacy Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Missing Completion Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {applications.filter(app => app.status === 'completed' && !app.completed_at).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid Without Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {applications.filter(app => app.status === 'paid' && !app.completed_at).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle>Legacy Applications</CardTitle>
          <CardDescription>
            These applications require data correction or review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            {applications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No legacy applications found
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <Card
                    key={app.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/applications/${app.id}`)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="font-mono">
                              #{app.reference_number}
                            </Badge>
                            <Badge className={statusColors[app.status] || 'bg-gray-500'}>
                              {app.status}
                            </Badge>
                            {!app.completed_at && (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Missing Completion Date
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
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              Created: {new Date(app.created_at).toLocaleDateString()}
                            </div>
                            {app.completed_actual && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                System Complete: {new Date(app.completed_actual).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default LegacyApplicationsView;
