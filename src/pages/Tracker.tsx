import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Layers, 
  UserCheck, 
  Database, 
  BarChart3, 
  Activity, 
  Target 
} from "lucide-react";

const Tracker = () => {
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
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/');
    }
  };

  if (!isAdmin) {
    return null;
  }

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('github_repo, github_branch')
        .not('github_repo', 'is', null)
        .not('github_branch', 'is', null);

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group branches by repo
  const branchesByRepo: Record<string, Set<string>> = tasks.reduce((acc: Record<string, Set<string>>, task) => {
    if (task.github_repo && task.github_branch) {
      if (!acc[task.github_repo]) {
        acc[task.github_repo] = new Set();
      }
      acc[task.github_repo].add(task.github_branch);
    }
    return acc;
  }, {});

  const trackerCards = [
    {
      title: "360° AI View",
      description: "Comprehensive AI insights across all tracking dimensions",
      icon: Activity,
      path: "/360-degree",
      color: "text-gradient-to-r from-primary to-purple-600",
      featured: true
    },
    {
      title: "By Stage",
      description: "View applications organized by their current stage",
      icon: Layers,
      path: "/applications-by-stage",
      color: "text-blue-600"
    },
    {
      title: "By Team",
      description: "View applications organized by team members with funnel and heat map",
      icon: UserCheck,
      path: "/applications-by-team",
      color: "text-green-600"
    },
    {
      title: "By Legacy",
      description: "View legacy applications with missing completion data",
      icon: Database,
      path: "/legacy-applications",
      color: "text-orange-600"
    },
    {
      title: "Application Pipeline",
      description: "Visual pipeline with AI recommendations and performance analytics",
      icon: BarChart3,
      path: "/application-pipeline",
      color: "text-purple-600"
    },
    {
      title: "Application Monitor",
      description: "Real-time monitoring of application status and alerts",
      icon: Activity,
      path: "/application-monitor",
      color: "text-red-600"
    },
    {
      title: "Team Targets",
      description: "Track and manage team targets and goals",
      icon: Target,
      path: "/team-targets",
      color: "text-teal-600"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tracker</h1>
        <p className="text-muted-foreground">
          Comprehensive application tracking and monitoring dashboard
        </p>
      </div>

      {/* GitHub Branches Section */}
      {Object.keys(branchesByRepo).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub Branches
            </CardTitle>
            <CardDescription>
              Active branches across all projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(branchesByRepo).map(([repo, branches]) => (
                <div key={repo} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-600">
                      <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                      </svg>
                      {repo}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {branches.size} {branches.size === 1 ? 'branch' : 'branches'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-4">
                    {Array.from(branches).map((branch) => (
                      <Badge 
                        key={branch} 
                        variant="outline" 
                        className="bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                      >
                        <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 3v12"></path>
                          <circle cx="18" cy="6" r="3"></circle>
                          <circle cx="6" cy="18" r="3"></circle>
                          <path d="M18 9a9 9 0 01-9 9"></path>
                        </svg>
                        {branch}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trackerCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.path}
              className={`cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 ${
                card.featured ? 'col-span-full border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5' : ''
              }`}
              onClick={() => navigate(card.path)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${card.featured ? 'bg-gradient-to-br from-primary/20 to-purple-500/20' : 'bg-muted'} ${card.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      {card.title}
                      {card.featured && <Badge variant="secondary" className="text-xs">New</Badge>}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {card.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Tracker;
