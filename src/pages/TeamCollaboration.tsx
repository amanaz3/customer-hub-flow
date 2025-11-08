import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/SecureAuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Activity, MessageSquare, FileText, Plus, Search, ListTodo, FolderKanban } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateTaskDialog } from '@/components/Team/CreateTaskDialog';
import { CreateProjectDialog } from '@/components/Team/CreateProjectDialog';
import { TaskCard } from '@/components/Team/TaskCard';
import { TaskDetailDialog } from '@/components/Team/TaskDetailDialog';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface ActivityItem {
  id: string;
  type: string;
  user_name: string;
  user_id: string;
  description: string;
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  type: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  project_id: string | null;
  created_at: string;
  assignee_name?: string;
  project_name?: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  owner_id: string | null;
  owner_name?: string;
  created_at: string;
}

interface Application {
  id: string;
  reference_number: number;
  status: string;
  application_type: string;
  customer_id: string;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_company?: string;
  customer_email?: string;
  recent_action?: string;
  recent_action_date?: string;
  recent_action_by?: string;
}

const TeamCollaboration: React.FC = () => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeCasesCount, setActiveCasesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const [caseStatusFilter, setCaseStatusFilter] = useState<string>('active');
  const [caseSearchQuery, setCaseSearchQuery] = useState('');

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          profiles!tasks_assigned_to_fkey(name),
          projects(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const tasksWithNames: Task[] = (data || []).map((task: any) => ({
        ...task,
        assignee_name: task.profiles?.name,
        project_name: task.projects?.name,
      }));

      setTasks(tasksWithNames);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          profiles!projects_owner_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const projectsWithOwner: Project[] = (data || []).map((project: any) => ({
        ...project,
        owner_name: project.profiles?.name,
      }));

      setProjects(projectsWithOwner);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  // Real-time updates for tasks
  useRealtimeSubscription({
    table: 'tasks',
    onUpdate: fetchTasks,
  });

  useRealtimeSubscription({
    table: 'task_comments',
    onUpdate: fetchTasks,
  });

  // Real-time updates for projects
  useRealtimeSubscription({
    table: 'projects',
    onUpdate: fetchProjects,
  });

  const fetchTeamData = async () => {
    try {
      setLoading(true);

      // Fetch team members
      const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('id, name, email, role, is_active')
        .eq('is_active', true)
        .order('name');

      if (membersError) throw membersError;
      setTeamMembers(members || []);

      // Fetch all applications with recent status changes
      const { data: applicationsData, error: casesError } = await supabase
        .from('account_applications')
        .select(`
          *,
          customers (
            name,
            company,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (casesError) throw casesError;
      
      // Fetch recent status changes for each application
      const applicationIds = (applicationsData || []).map((app: any) => app.id);
      const { data: statusChangesData } = await supabase
        .from('status_changes')
        .select(`
          customer_id,
          new_status,
          previous_status,
          created_at,
          changed_by,
          comment,
          profiles!status_changes_changed_by_fkey(name)
        `)
        .in('customer_id', (applicationsData || []).map((app: any) => app.customer_id))
        .order('created_at', { ascending: false });

      const applicationsWithCustomer: Application[] = (applicationsData || []).map((app: any) => {
        const recentChange = statusChangesData?.find((sc: any) => sc.customer_id === app.customer_id);
        return {
          ...app,
          customer_name: app.customers?.name,
          customer_company: app.customers?.company,
          customer_email: app.customers?.email,
          recent_action: recentChange ? `Status changed from ${recentChange.previous_status} to ${recentChange.new_status}` : null,
          recent_action_date: recentChange?.created_at,
          recent_action_by: recentChange?.profiles?.name,
        };
      });
      
      setApplications(applicationsWithCustomer);
      setActiveCasesCount(applicationsWithCustomer.filter(app => 
        !['complete', 'rejected'].includes(app.status)
      ).length);

      // Fetch recent activity (status changes with user info)
      const { data: statusChanges, error: activityError } = await supabase
        .from('status_changes')
        .select(`
          id,
          created_at,
          new_status,
          previous_status,
          customer_id,
          changed_by,
          profiles!status_changes_changed_by_fkey (name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activityError) throw activityError;

      const activities: ActivityItem[] = (statusChanges || []).map((item: any) => ({
        id: item.id,
        type: 'status_change',
        user_name: item.profiles?.name || 'Unknown User',
        user_id: item.changed_by,
        description: `Changed status from ${item.previous_status} to ${item.new_status}`,
        created_at: item.created_at,
      }));

      setRecentActivity(activities);
      
      // Fetch tasks
      await fetchTasks();
      
      // Fetch projects
      await fetchProjects();
    } catch (error) {
      console.error('Error fetching team data:', error);
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Count unique users active today
  const getActiveToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeUserIds = new Set(
      recentActivity
        .filter(activity => new Date(activity.created_at) >= today)
        .map(activity => activity.user_id)
    );
    
    return activeUserIds.size;
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const filteredApplications = applications.filter((app) => {
    const matchesSearch = 
      caseSearchQuery === '' ||
      app.reference_number.toString().includes(caseSearchQuery) ||
      app.customer_name?.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
      app.customer_company?.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
      app.customer_email?.toLowerCase().includes(caseSearchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (caseStatusFilter === 'active') {
      matchesStatus = !['complete', 'rejected'].includes(app.status);
    } else if (caseStatusFilter === 'all') {
      matchesStatus = true;
    } else {
      matchesStatus = app.status === caseStatusFilter;
    }
    
    return matchesSearch && matchesStatus;
  });

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Collaboration</h1>
          <p className="text-muted-foreground mt-1">
            View team members and recent activity
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getActiveToday()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {recentActivity.filter(a => new Date(a.created_at) >= new Date(new Date().setHours(0, 0, 0, 0))).length} actions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCasesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter((p) => p.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {projects.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.filter((m) => m.role === 'admin').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">
            <FolderKanban className="h-4 w-4 mr-2" />
            Projects ({projects.length})
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <ListTodo className="h-4 w-4 mr-2" />
            Tasks ({taskStats.total})
          </TabsTrigger>
          <TabsTrigger value="cases">
            <FileText className="h-4 w-4 mr-2" />
            Cases ({activeCasesCount})
          </TabsTrigger>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setCreateProjectOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => {
              const projectTasks = tasks.filter((t) => t.project_id === project.id);
              const statusBadgeColor = {
                planning: 'bg-blue-500/10 text-blue-500',
                active: 'bg-green-500/10 text-green-500',
                on_hold: 'bg-yellow-500/10 text-yellow-500',
                completed: 'bg-gray-500/10 text-gray-500',
                cancelled: 'bg-red-500/10 text-red-500',
              }[project.status] || 'bg-gray-500/10 text-gray-500';

              return (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        {project.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {project.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge className={statusBadgeColor}>
                        {project.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {project.owner_name && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{project.owner_name}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ListTodo className="h-4 w-4" />
                        <span>{projectTasks.length} tasks</span>
                      </div>

                      <Button 
                        className="w-full"
                        size="sm"
                        onClick={() => {
                          setSelectedProjectId(project.id);
                          setCreateTaskOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Task
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {projects.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No projects yet
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Tasks</CardTitle>
                  <CardDescription>
                    Track and manage team work
                  </CardDescription>
                </div>
                <Button onClick={() => setCreateTaskOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-3 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Task Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-3 rounded-lg border bg-card">
                  <div className="text-2xl font-bold">{taskStats.todo}</div>
                  <div className="text-xs text-muted-foreground">To Do</div>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <div className="text-2xl font-bold">{taskStats.in_progress}</div>
                  <div className="text-xs text-muted-foreground">In Progress</div>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <div className="text-2xl font-bold">{taskStats.done}</div>
                  <div className="text-xs text-muted-foreground">Done</div>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <div className="text-2xl font-bold">{taskStats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-2">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setTaskDetailOpen(true);
                    }}
                  />
                ))}
                {filteredTasks.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                      ? 'No tasks match your filters'
                      : 'No tasks yet. Create your first task!'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cases Management</CardTitle>
              <CardDescription>
                View and filter all application cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-3 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by reference, customer name, email..."
                    value={caseSearchQuery}
                    onChange={(e) => setCaseSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={caseStatusFilter} onValueChange={setCaseStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cases</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="waiting_for_documents">Waiting for Documents</SelectItem>
                    <SelectItem value="waiting_for_information">Waiting for Information</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                {filteredApplications.map((app) => {
                  const statusBadgeColor = {
                    draft: 'bg-gray-500/10 text-gray-500',
                    pending: 'bg-yellow-500/10 text-yellow-500',
                    in_review: 'bg-blue-500/10 text-blue-500',
                    waiting_for_documents: 'bg-orange-500/10 text-orange-500',
                    waiting_for_information: 'bg-orange-500/10 text-orange-500',
                    blocked: 'bg-red-500/10 text-red-500',
                    approved: 'bg-green-500/10 text-green-500',
                    complete: 'bg-green-500/10 text-green-500',
                    rejected: 'bg-red-500/10 text-red-500',
                  }[app.status] || 'bg-gray-500/10 text-gray-500';

                  const getNextStep = (status: string) => {
                    const nextSteps: { [key: string]: string } = {
                      draft: 'Complete application form and submit',
                      pending: 'Awaiting initial review',
                      in_review: 'Under review by team',
                      waiting_for_documents: 'Upload required documents',
                      waiting_for_information: 'Provide additional information',
                      blocked: 'Resolve blocking issues',
                      approved: 'Proceed to finalization',
                      complete: 'Application completed',
                      rejected: 'Application rejected',
                    };
                    return nextSteps[status] || 'No action required';
                  };

                  return (
                    <div
                      key={app.id}
                      className="flex items-start justify-between p-4 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-foreground">
                            #{app.reference_number}
                          </p>
                          <Badge className={statusBadgeColor}>
                            {app.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        
                        <div>
                          <p className="text-sm text-foreground font-medium">
                            {app.customer_company || app.customer_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {app.application_type?.replace(/_/g, ' ') || 'Application'}
                          </p>
                          {app.customer_email && (
                            <p className="text-xs text-muted-foreground">
                              {app.customer_email}
                            </p>
                          )}
                        </div>

                        {app.recent_action && (
                          <div className="pt-2 border-t border-border/50">
                            <p className="text-xs font-medium text-foreground flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              Recent Action:
                            </p>
                            <p className="text-xs text-muted-foreground ml-4">
                              {app.recent_action}
                            </p>
                            {app.recent_action_by && (
                              <p className="text-xs text-muted-foreground ml-4">
                                by {app.recent_action_by} • {formatDate(app.recent_action_date!)}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="pt-2 border-t border-border/50">
                          <p className="text-xs font-medium text-foreground flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Next Step:
                          </p>
                          <p className="text-xs text-muted-foreground ml-4">
                            {getNextStep(app.status)}
                          </p>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Created {formatDate(app.created_at)} • Updated {formatDate(app.updated_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {filteredApplications.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    {caseSearchQuery || caseStatusFilter !== 'active'
                      ? 'No cases match your filters'
                      : 'No cases found'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                All active team members in your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest actions from team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-2 p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="p-1.5 rounded-md bg-primary/10">
                      {activity.type === 'status_change' && (
                        <FileText className="h-3 w-3 text-primary" />
                      )}
                      {activity.type === 'comment' && (
                        <MessageSquare className="h-3 w-3 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">
                        {activity.user_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatDate(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent activity
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateProjectDialog
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        onProjectCreated={() => {
          fetchProjects();
          setCreateProjectOpen(false);
        }}
      />

      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={(open) => {
          setCreateTaskOpen(open);
          if (!open) setSelectedProjectId(undefined);
        }}
        onTaskCreated={fetchTasks}
        projectId={selectedProjectId}
      />
      <TaskDetailDialog
        taskId={selectedTaskId}
        open={taskDetailOpen}
        onOpenChange={setTaskDetailOpen}
        onTaskUpdated={fetchTasks}
      />
    </div>
  );
};

export default TeamCollaboration;
