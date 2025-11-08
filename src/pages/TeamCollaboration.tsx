import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/SecureAuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, ListTodo } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { CreateTaskDialog } from '@/components/Team/CreateTaskDialog';
import { TaskCard } from '@/components/Team/TaskCard';
import { TaskDetailDialog } from '@/components/Team/TaskDetailDialog';
import { TeamSidebar } from '@/components/Team/TeamSidebar';
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

const TeamCollaboration: React.FC = () => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

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

  // Real-time updates for tasks
  useRealtimeSubscription({
    table: 'tasks',
    onUpdate: fetchTasks,
  });

  useRealtimeSubscription({
    table: 'task_comments',
    onUpdate: fetchTasks,
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
    } catch (error) {
      console.error('Error fetching team data:', error);
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
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

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <TeamSidebar teamMembers={[]} recentActivity={[]} activeToday={0} />
          <div className="flex-1">
            <header className="h-14 border-b flex items-center px-6">
              <SidebarTrigger />
              <h1 className="text-xl font-bold ml-4">Team Collaboration</h1>
            </header>
            <div className="container mx-auto py-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
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
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <TeamSidebar
          teamMembers={teamMembers}
          recentActivity={recentActivity}
          activeToday={getActiveToday()}
        />
        
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center px-6 bg-background">
            <SidebarTrigger />
            <h1 className="text-xl font-bold ml-4">Team Collaboration</h1>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="container mx-auto py-6 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <ListTodo className="h-5 w-5" />
                        Team Tasks ({taskStats.total})
                      </CardTitle>
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
            </div>
          </main>

          {/* Dialogs */}
          <CreateTaskDialog
            open={createTaskOpen}
            onOpenChange={setCreateTaskOpen}
            onTaskCreated={fetchTasks}
          />
          <TaskDetailDialog
            taskId={selectedTaskId}
            open={taskDetailOpen}
            onOpenChange={setTaskDetailOpen}
            onTaskUpdated={fetchTasks}
          />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default TeamCollaboration;
