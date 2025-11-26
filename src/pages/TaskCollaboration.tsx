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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Users, Activity, MessageSquare, FileText, Plus, Search, ListTodo, FolderKanban, Flag, Clock, ArrowRight, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateTaskDialog } from '@/components/Team/CreateTaskDialog';
import { CreateProductDialog } from '@/components/Team/CreateProductDialog';
import { TaskCard } from '@/components/Team/TaskCard';
import { TaskDetailDialog } from '@/components/Team/TaskDetailDialog';
import { QuickAddBugDialog } from '@/components/Team/QuickAddBugDialog';
import { QuickAddTaskFromWhatsApp } from '@/components/Team/QuickAddTaskFromWhatsApp';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { formatApplicationReferenceWithPrefix } from '@/utils/referenceNumberFormatter';

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
  parent_id?: string | null;
  created_at: string;
  assignee_name?: string;
  product_name?: string;
  module?: string | null;
  category?: string | null;
  architectural_component?: string | null;
  mission?: string | null;
  story?: string | null;
  github_repo?: string | null;
  github_branch?: string | null;
  importance?: string | null;
}

interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_path: string | null;
  file_type: string | null;
  attachment_type: 'file' | 'url';
}

interface Product {
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
  priority?: string;
  comments?: CaseComment[];
  recent_action?: RecentAction;
  next_step?: string;
  assigned_to_name?: string;
  assigned_to_email?: string;
}

interface CaseComment {
  id: string;
  text: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
}

interface RecentAction {
  changed_by_name: string;
  previous_status: string;
  new_status: string;
  created_at: string;
}

const TaskCollaboration: React.FC = () => {
  const { user } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeCasesCount, setActiveCasesCount] = useState(0);
  const [maxReferenceNumber, setMaxReferenceNumber] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todo');
  const [priorityFilter, setPriorityFilter] = useState<string>('medium-high');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [importanceFilter, setImportanceFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [groupByModule, setGroupByModule] = useState<boolean>(true);
  const [showTaskStats, setShowTaskStats] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>();
  const [quickAddBugOpen, setQuickAddBugOpen] = useState(false);
  const [quickAddWhatsAppOpen, setQuickAddWhatsAppOpen] = useState(false);
  const [parentTaskIdForNewTask, setParentTaskIdForNewTask] = useState<string | undefined>(undefined);
  const [caseStatusFilter, setCaseStatusFilter] = useState<string>('active');
  const [caseSearchQuery, setCaseSearchQuery] = useState('');
  const [casePriorities, setCasePriorities] = useState<Record<string, string>>({});
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [caseComments, setCaseComments] = useState<Record<string, CaseComment[]>>({});
  const [selectedCase, setSelectedCase] = useState<Application | null>(null);
  const [caseDetailTab, setCaseDetailTab] = useState<string>('overview');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productTaskSearch, setProductTaskSearch] = useState('');
  const [productTaskStatusFilter, setProductTaskStatusFilter] = useState<string>('all');
  const [productTaskPriorityFilter, setProductTaskPriorityFilter] = useState<string>('all');
  const [taskAttachments, setTaskAttachments] = useState<Record<string, TaskAttachment[]>>({});

  useEffect(() => {
    fetchTeamData();
    
    // Subscribe to task changes (status, priority, assignee updates)
    const taskChannel = supabase
      .channel('tasks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('Task change detected:', payload);
          // Refetch all tasks when any task changes
          fetchTasks();
        }
      )
      .subscribe();
    
    // Subscribe to case/application changes
    const caseChannel = supabase
      .channel('applications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'account_applications'
        },
        (payload) => {
          console.log('Case/Application change detected:', payload);
          // Refetch all data when any case changes
          fetchTeamData();
        }
      )
      .subscribe();
    
    // Subscribe to task_attachments changes
    const attachmentChannel = supabase
      .channel('task_attachments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_attachments'
        },
        async (payload) => {
          console.log('Attachment change detected:', payload);
          // Refetch attachments for the affected task
          if (payload.new && 'task_id' in payload.new) {
            const taskId = (payload.new as any).task_id;
            await fetchTaskAttachments([taskId]);
          } else if (payload.old && 'task_id' in payload.old) {
            const taskId = (payload.old as any).task_id;
            await fetchTaskAttachments([taskId]);
          }
        }
      )
      .subscribe();

    return () => {
      taskChannel.unsubscribe();
      caseChannel.unsubscribe();
      attachmentChannel.unsubscribe();
    };
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
        product_name: task.projects?.name, // Still using 'projects' relation
      }));

      setTasks(tasksWithNames);
      
      // Fetch attachments for all tasks
      await fetchTaskAttachments(tasksWithNames.map(t => t.id));
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchTaskAttachments = async (taskIds: string[]) => {
    if (taskIds.length === 0) return;
    
    try {
      const { data, error } = await supabase
        .from('task_attachments')
        .select('id, task_id, file_name, file_path, file_type, attachment_type')
        .in('task_id', taskIds);

      if (error) throw error;

      // Group attachments by task_id
      const attachmentsByTask: Record<string, TaskAttachment[]> = {};
      (data || []).forEach((att: TaskAttachment) => {
        if (!attachmentsByTask[att.task_id]) {
          attachmentsByTask[att.task_id] = [];
        }
        attachmentsByTask[att.task_id].push(att);
      });

      // Merge with existing attachments (update only the specified task IDs)
      setTaskAttachments(prev => ({
        ...prev,
        ...attachmentsByTask
      }));
    } catch (error) {
      console.error('Error fetching task attachments:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      console.log('Fetching products...');
      // Still querying 'projects' table since database hasn't been migrated yet
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          profiles!projects_owner_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }

      console.log('Products fetched:', data);

      const productsWithOwner: Product[] = (data || []).map((product: any) => ({
        ...product,
        owner_name: product.profiles?.name,
      }));

      console.log('Products with owner:', productsWithOwner);
      setProducts(productsWithOwner);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    }
  };

  // Set default project filter to customer-hub-flow when products load
  useEffect(() => {
    if (products.length > 0 && projectFilter === 'all') {
      const customerHubFlow = products.find(p => p.name.toLowerCase() === 'customer-hub-flow');
      if (customerHubFlow) {
        setProjectFilter(customerHubFlow.id);
      }
    }
  }, [products]);

  // Helper to assign a task to a product
  const assignTaskToProduct = async (taskId: string, productId: string) => {
    try {
      // Still using 'project_id' column since database hasn't been migrated yet
      const { error } = await supabase
        .from('tasks')
        .update({ project_id: productId })
        .eq('id', taskId);
      if (error) throw error;
      toast.success('Task assigned to product');
      await fetchTasks();
    } catch (e) {
      console.error('Error assigning task to product:', e);
      toast.error('Failed to assign task');
    }
  };

  // Helper to remove a task from a product
  const removeTaskFromProduct = async (taskId: string) => {
    try {
      // Still using 'project_id' column since database hasn't been migrated yet
      const { error } = await supabase
        .from('tasks')
        .update({ project_id: null })
        .eq('id', taskId);
      if (error) throw error;
      toast.success('Task removed from product');
      await fetchTasks();
    } catch (e) {
      console.error('Error removing task from product:', e);
      toast.error('Failed to remove task');
    }
  };

  // Helper to delete a task
  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      if (error) throw error;
      toast.success('Task deleted');
      await fetchTasks();
    } catch (e) {
      console.error('Error deleting task:', e);
      toast.error('Failed to delete task');
    }
  };

  // Helper to update task importance
  const handleImportanceChange = async (taskId: string, importance: string | null) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ importance } as any)
        .eq('id', taskId);
      
      if (error) throw error;
      toast.success('Classification updated');
      await fetchTasks();
    } catch (e) {
      console.error('Error updating importance:', e);
      toast.error('Failed to update classification');
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

  // Real-time updates for products
  useRealtimeSubscription({
    table: 'projects', // Still using 'projects' table since database hasn't been migrated yet
    onUpdate: fetchProducts,
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

      // Fetch all applications with assigned user info
      const { data: applicationsData, error: casesError } = await supabase
        .from('account_applications')
        .select(`
          *,
          customers (
            name,
            company,
            email,
            user_id,
            profiles!customers_user_id_fkey (
              name,
              email
            )
          )
        `)
        .not('status', 'in', '(completed,paid,rejected)')
        .order('created_at', { ascending: false });

      if (casesError) throw casesError;

      // Fetch max reference number for auto-scaling formatter
      const { data: maxRefData } = await supabase
        .from('account_applications')
        .select('reference_number')
        .order('reference_number', { ascending: false })
        .limit(1)
        .single();
      
      if (maxRefData?.reference_number) {
        setMaxReferenceNumber(maxRefData.reference_number);
      }

      // Fetch recent status changes for all applications
      const customerIds = applicationsData?.map((app: any) => app.customer_id).filter(Boolean) || [];
      let statusChangesData: any[] = [];
      
      if (customerIds.length > 0) {
        const { data: statusData, error: statusError } = await supabase
          .from('status_changes')
          .select(`
            customer_id,
            previous_status,
            new_status,
            created_at,
            profiles!status_changes_changed_by_fkey (name)
          `)
          .in('customer_id', customerIds)
          .order('created_at', { ascending: false });

        if (!statusError && statusData) {
          statusChangesData = statusData;
        }
      }

      // Create a map of customer_id to most recent status change
      const recentActionsMap = new Map<string, RecentAction>();
      statusChangesData.forEach((change: any) => {
        if (!recentActionsMap.has(change.customer_id)) {
          recentActionsMap.set(change.customer_id, {
            changed_by_name: change.profiles?.name || 'Unknown',
            previous_status: change.previous_status,
            new_status: change.new_status,
            created_at: change.created_at,
          });
        }
      });
      
      const applicationsWithCustomer: Application[] = (applicationsData || []).map((app: any) => ({
        ...app,
        customer_name: app.customers?.name,
        customer_company: app.customers?.company,
        customer_email: app.customers?.email,
        assigned_to_name: app.customers?.profiles?.name,
        assigned_to_email: app.customers?.profiles?.email,
        priority: casePriorities[app.id] || 'medium',
        comments: caseComments[app.id] || [],
        recent_action: recentActionsMap.get(app.customer_id),
        next_step: getNextStep(app.status),
      }));
      
      setApplications(applicationsWithCustomer);
      // Since we're already filtering at DB level, all returned applications are active
      setActiveCasesCount(applicationsWithCustomer.length);

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
      
      // Fetch products
      await fetchProducts();
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

  // Group tasks by parent
  const parentTasks = tasks.filter(t => !t.parent_id);
  const subtasksByParent = tasks.reduce((acc, task) => {
    if (task.parent_id) {
      if (!acc[task.parent_id]) acc[task.parent_id] = [];
      acc[task.parent_id].push(task);
    }
    return acc;
  }, {} as Record<string, typeof tasks>);

  const filteredTasks = parentTasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || 
                            task.priority === priorityFilter ||
                            (priorityFilter === 'medium-high' && (task.priority === 'medium' || task.priority === 'high'));
    const matchesProject = projectFilter === 'all' || task.project_id === projectFilter;
    const matchesImportance = importanceFilter === 'all' || 
                              (importanceFilter === 'none' && !task.importance) ||
                              task.importance === importanceFilter;
    const matchesModule = moduleFilter === 'all' || 
                          (moduleFilter === 'none' && !task.module) ||
                          task.module === moduleFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesProject && matchesImportance && matchesModule;
  });

  // Get unique modules from tasks
  const uniqueModules = [...new Set(tasks.map(t => t.module).filter(Boolean))] as string[];

  // Priority order for sorting (higher = more urgent)
  const priorityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
  
  // Importance order for sorting (higher = more important)
  const importanceOrder: Record<string, number> = { 
    'must-have': 4, 
    'should-have': 3, 
    'good-to-have': 2, 
    'nice-to-have': 1,
    '': 0 
  };

  // Group and sort tasks by Module → Importance → Priority
  const groupedTasksByModule = groupByModule ? (() => {
    const grouped: Record<string, Task[]> = {};
    
    filteredTasks.forEach(task => {
      const module = task.module || 'Uncategorized';
      if (!grouped[module]) grouped[module] = [];
      grouped[module].push(task);
    });

    // Sort tasks within each module: first by importance (desc), then by priority (desc)
    Object.keys(grouped).forEach(module => {
      grouped[module].sort((a, b) => {
        const impA = importanceOrder[a.importance || ''] || 0;
        const impB = importanceOrder[b.importance || ''] || 0;
        if (impB !== impA) return impB - impA;
        
        const priA = priorityOrder[a.priority] || 0;
        const priB = priorityOrder[b.priority] || 0;
        return priB - priA;
      });
    });

    return grouped;
  })() : null;

  const filteredApplications = applications.filter((app) => {
    const matchesSearch = 
      caseSearchQuery === '' ||
      app.reference_number.toString().includes(caseSearchQuery) ||
      app.customer_name?.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
      app.customer_company?.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
      app.customer_email?.toLowerCase().includes(caseSearchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (caseStatusFilter === 'active') {
      matchesStatus = !['completed', 'paid', 'rejected'].includes(app.status.toLowerCase());
    } else if (caseStatusFilter === 'all') {
      matchesStatus = true;
    } else {
      matchesStatus = app.status === caseStatusFilter;
    }
    
    return matchesSearch && matchesStatus;
  });

  const handlePriorityChange = (caseId: string, priority: string) => {
    setCasePriorities(prev => ({
      ...prev,
      [caseId]: priority
    }));
    toast.success('Priority updated');
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedCaseId || !user) return;
    
    const comment: CaseComment = {
      id: Date.now().toString(),
      text: newComment,
      created_by: user.id,
      created_by_name: user.email || 'Unknown',
      created_at: new Date().toISOString(),
    };
    
    setCaseComments(prev => ({
      ...prev,
      [selectedCaseId]: [...(prev[selectedCaseId] || []), comment]
    }));
    
    setNewComment('');
    setCommentDialogOpen(false);
    toast.success('Comment added');
  };

  const getNextStep = (status: string): string => {
    const nextSteps: Record<string, string> = {
      'draft': 'Complete application form',
      'pending': 'Review and validate information',
      'in_review': 'Assess compliance requirements',
      'waiting_for_documents': 'Upload required documents',
      'waiting_for_information': 'Provide additional information',
      'blocked': 'Resolve blocking issues',
      'approved': 'Proceed with implementation',
      'complete': 'Case closed successfully',
      'rejected': 'Review rejection reasons',
    };
    return nextSteps[status] || 'Update case status';
  };

  // Filter tasks by project before calculating stats
  const projectFilteredTasks = projectFilter === 'all' 
    ? tasks 
    : tasks.filter((t) => t.project_id === projectFilter);

  // Helper to recursively count all subtasks for a given task
  const countAllSubtasksForTask = (taskId: string, allTasks: typeof tasks): number => {
    const directChildren = allTasks.filter(t => t.parent_id === taskId);
    let total = directChildren.length;
    
    directChildren.forEach(child => {
      total += countAllSubtasksForTask(child.id, allTasks);
    });
    
    return total;
  };

  // Separate parent tasks and calculate total subtasks recursively
  const statsParentTasks = projectFilteredTasks.filter((t) => !t.parent_id);
  
  console.log('Total tasks in projectFilteredTasks:', projectFilteredTasks.length);
  console.log('Parent tasks count:', statsParentTasks.length);
  console.log('All tasks with parent_id:', projectFilteredTasks.filter(t => t.parent_id).length);
  
  // Debug: Show which tasks have parent_id set
  const tasksWithParent = projectFilteredTasks.filter(t => t.parent_id);
  console.log('Tasks with parent_id:', tasksWithParent.map(t => ({
    title: t.title,
    parent_id: t.parent_id,
    id: t.id
  })));
  
  // Count all nested subtasks for all parent tasks
  let totalSubtasksCount = 0;
  statsParentTasks.forEach(parentTask => {
    const count = countAllSubtasksForTask(parentTask.id, projectFilteredTasks);
    if (count > 0) {
      console.log(`Task "${parentTask.title}" (id: ${parentTask.id}) has ${count} total subtasks`);
    }
    totalSubtasksCount += count;
  });
  
  console.log('Total subtasks count:', totalSubtasksCount);

  const taskStats = {
    tasks: statsParentTasks.length,
    subtasks: totalSubtasksCount,
    total: projectFilteredTasks.length,
    todo: projectFilteredTasks.filter((t) => t.status === 'todo').length,
    in_progress: projectFilteredTasks.filter((t) => t.status === 'in_progress').length,
    done: projectFilteredTasks.filter((t) => t.status === 'done').length,
    importance_none: projectFilteredTasks.filter((t) => !t.importance).length,
    importance_must: projectFilteredTasks.filter((t) => t.importance === 'must').length,
    importance_should: projectFilteredTasks.filter((t) => t.importance === 'should').length,
    importance_good_to_have: projectFilteredTasks.filter((t) => t.importance === 'good-to-have').length,
    importance_nice_to_have: projectFilteredTasks.filter((t) => t.importance === 'nice-to-have').length,
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
    <TooltipProvider>
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Track Tasks</h1>
          <p className="text-muted-foreground mt-1">
            Manage projects, tasks, and team activities
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
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter((p) => p.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {products.length} total
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

      <Tabs defaultValue="cases" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cases">
            <FileText className="h-4 w-4 mr-2" />
            Cases ({activeCasesCount})
          </TabsTrigger>
          <TabsTrigger value="products" onClick={() => setSelectedProduct(null)}>
            <FolderKanban className="h-4 w-4 mr-2" />
            Products ({products.length})
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <ListTodo className="h-4 w-4 mr-2" />
            Tasks ({taskStats.total})
          </TabsTrigger>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          {!selectedProduct ? (
            <>
              <div className="flex justify-end mb-4">
                <Button onClick={() => setCreateProductOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Product
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => {
                  const productTasks = tasks.filter((t) => t.project_id === product.id); // Still using 'project_id'
                  const statusBadgeColor = {
                    planning: 'bg-blue-500/10 text-blue-500',
                    active: 'bg-green-500/10 text-green-500',
                    on_hold: 'bg-yellow-500/10 text-yellow-500',
                    completed: 'bg-gray-500/10 text-gray-500',
                    cancelled: 'bg-red-500/10 text-red-500',
                  }[product.status] || 'bg-gray-500/10 text-gray-500';

                  return (
                    <Card 
                      key={product.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{product.name}</CardTitle>
                            {product.description && (
                              <CardDescription className="mt-1 line-clamp-2">
                                {product.description}
                              </CardDescription>
                            )}
                          </div>
                          <Badge className={statusBadgeColor}>
                            {product.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {product.owner_name && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>{product.owner_name}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ListTodo className="h-4 w-4" />
                            <span>{productTasks.length} tasks</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {products.length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    No products yet
                  </div>
                )}
              </div>
            </>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedProduct(null)}
                    >
                      <ArrowRight className="h-4 w-4 rotate-180" />
                    </Button>
                    <div>
                      <CardTitle>{selectedProduct.name}</CardTitle>
                      {selectedProduct.description && (
                        <CardDescription className="mt-1">
                          {selectedProduct.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <Button 
                    onClick={() => {
                      setSelectedProductId(selectedProduct.id);
                      setCreateTaskOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg border bg-card">
                      <div className="text-sm text-muted-foreground mb-1">Status</div>
                      <Badge className={
                        {
                          planning: 'bg-blue-500/10 text-blue-500',
                          active: 'bg-green-500/10 text-green-500',
                          on_hold: 'bg-yellow-500/10 text-yellow-500',
                          completed: 'bg-gray-500/10 text-gray-500',
                          cancelled: 'bg-red-500/10 text-red-500',
                        }[selectedProduct.status] || 'bg-gray-500/10 text-gray-500'
                      }>
                        {selectedProduct.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    {selectedProduct.owner_name && (
                      <div className="p-3 rounded-lg border bg-card">
                        <div className="text-sm text-muted-foreground mb-1">Owner</div>
                        <div className="text-sm font-medium">{selectedProduct.owner_name}</div>
                      </div>
                    )}
                    <div className="p-3 rounded-lg border bg-card">
                      <div className="text-sm text-muted-foreground mb-1">Tasks</div>
                      <div className="text-2xl font-bold">
                        {tasks.filter((t) => t.project_id === selectedProduct.id).length} {/* Still using 'project_id' */}
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">Product Tasks</h3>
                    
                    {/* Task Filters */}
                    <div className="flex gap-3 mb-6">
                      <Select value={productTaskStatusFilter} onValueChange={setProductTaskStatusFilter}>
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
                      <Select value={productTaskPriorityFilter} onValueChange={setProductTaskPriorityFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Priority</SelectItem>
                          <SelectItem value="medium-high">Medium & High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={importanceFilter} onValueChange={setImportanceFilter}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Value" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Values</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="must">Must</SelectItem>
                          <SelectItem value="should">Should</SelectItem>
                          <SelectItem value="good-to-have">Good</SelectItem>
                          <SelectItem value="nice-to-have">Nice</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Task Stats Toggle */}
                    <div className="mb-4 flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowTaskStats(!showTaskStats)}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className={`h-4 w-4 transition-transform ${showTaskStats ? 'rotate-90' : ''}`} />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {showTaskStats ? 'Hide' : 'Show'} Statistics
                      </span>
                    </div>

                    {/* Task Stats */}
                    {showTaskStats && (() => {
                      const productFilteredTasks = tasks.filter(t => t.project_id === selectedProduct.id);
                      const productParentTasks = productFilteredTasks.filter(t => !t.parent_id);
                      
                      const countAllSubtasksForProductTask = (taskId: string, allTasks: Task[]): number => {
                        const directChildren = allTasks.filter(t => t.parent_id === taskId);
                        let total = directChildren.length;
                        directChildren.forEach(child => {
                          total += countAllSubtasksForProductTask(child.id, allTasks);
                        });
                        return total;
                      };
                      
                      let totalProductSubtasks = 0;
                      productParentTasks.forEach(parentTask => {
                        totalProductSubtasks += countAllSubtasksForProductTask(parentTask.id, productFilteredTasks);
                      });
                      
                      const productTaskStats = {
                        tasks: productParentTasks.length,
                        subtasks: totalProductSubtasks,
                        total: productFilteredTasks.length,
                        todo: productFilteredTasks.filter((t) => t.status === 'todo').length,
                        in_progress: productFilteredTasks.filter((t) => t.status === 'in_progress').length,
                        done: productFilteredTasks.filter((t) => t.status === 'done').length,
                        importance_none: productFilteredTasks.filter((t) => !t.importance).length,
                        importance_must: productFilteredTasks.filter((t) => t.importance === 'must').length,
                        importance_should: productFilteredTasks.filter((t) => t.importance === 'should').length,
                        importance_good_to_have: productFilteredTasks.filter((t) => t.importance === 'good-to-have').length,
                        importance_nice_to_have: productFilteredTasks.filter((t) => t.importance === 'nice-to-have').length,
                      };
                      
                      return (
                        <>
                          <div className="grid grid-cols-7 gap-4 mb-4">
                            <div className="p-3 rounded-lg border bg-card">
                              <div className="text-2xl font-bold">{productTaskStats.tasks}</div>
                              <div className="text-xs text-muted-foreground">Tasks</div>
                            </div>
                            <div className="p-3 rounded-lg border bg-card">
                              <div className="text-2xl font-bold">{productTaskStats.subtasks}</div>
                              <div className="text-xs text-muted-foreground">Subtasks</div>
                            </div>
                            <div className="p-3 rounded-lg border bg-card">
                              <div className="text-2xl font-bold">{productTaskStats.total}</div>
                              <div className="text-xs text-muted-foreground">Total</div>
                            </div>
                            <div className="p-3 rounded-lg border bg-card">
                              <div className="text-2xl font-bold">{productTaskStats.todo}</div>
                              <div className="text-xs text-muted-foreground">To Do</div>
                            </div>
                            <div className="p-3 rounded-lg border bg-card">
                              <div className="text-2xl font-bold">{productTaskStats.in_progress}</div>
                              <div className="text-xs text-muted-foreground">In Progress</div>
                            </div>
                            <div className="p-3 rounded-lg border bg-card">
                              <div className="text-2xl font-bold">{productTaskStats.done}</div>
                              <div className="text-xs text-muted-foreground">Done</div>
                            </div>
                          </div>

                          {/* Importance Classification Stats */}
                          <div className="grid grid-cols-5 gap-4 mb-6">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="p-3 rounded-lg border bg-card cursor-help">
                                  <div className="text-2xl font-bold">{productTaskStats.importance_none}</div>
                                  <div className="text-xs text-muted-foreground">None</div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-medium">No Classification</p>
                                <p className="text-xs text-muted-foreground">Tasks with no importance classification set</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="p-3 rounded-lg border bg-red-50 border-red-200 cursor-help">
                                  <div className="text-2xl font-bold text-red-800">{productTaskStats.importance_must}</div>
                                  <div className="text-xs text-red-600">Must</div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-medium">Must Have</p>
                                <p className="text-xs text-muted-foreground">Critical tasks that are required for project success</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="p-3 rounded-lg border bg-orange-50 border-orange-200 cursor-help">
                                  <div className="text-2xl font-bold text-orange-800">{productTaskStats.importance_should}</div>
                                  <div className="text-xs text-orange-600">Should</div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-medium">Should Have</p>
                                <p className="text-xs text-muted-foreground">Important tasks that add significant value</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="p-3 rounded-lg border bg-blue-50 border-blue-200 cursor-help">
                                  <div className="text-2xl font-bold text-blue-800">{productTaskStats.importance_good_to_have}</div>
                                  <div className="text-xs text-blue-600">Good-to-have</div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-medium">Good to Have</p>
                                <p className="text-xs text-muted-foreground">Nice improvements that enhance the project</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="p-3 rounded-lg border bg-gray-50 border-gray-200 cursor-help">
                                  <div className="text-2xl font-bold text-gray-800">{productTaskStats.importance_nice_to_have}</div>
                                  <div className="text-xs text-gray-600">Nice-to-have</div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-medium">Nice to Have</p>
                                <p className="text-xs text-muted-foreground">Optional enhancements with low priority</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </>
                      );
                    })()}

                    {/* Search Bar */}
                    <div className="mb-6">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search tasks..."
                          value={productTaskSearch}
                          onChange={(e) => setProductTaskSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      {tasks
                        .filter((t) => t.project_id === selectedProduct.id && !t.parent_id) // Only top-level tasks
                        .filter((t) => {
                          // Search filter
                          if (productTaskSearch && !t.title.toLowerCase().includes(productTaskSearch.toLowerCase())) {
                            return false;
                          }
                          // Status filter
                          if (productTaskStatusFilter !== 'all' && t.status !== productTaskStatusFilter) {
                            return false;
                          }
                          // Priority filter
                          if (productTaskPriorityFilter !== 'all') {
                            if (productTaskPriorityFilter === 'medium-high') {
                              if (t.priority !== 'medium' && t.priority !== 'high') return false;
                            } else if (t.priority !== productTaskPriorityFilter) {
                              return false;
                            }
                          }
                          // Importance filter
                          if (importanceFilter !== 'all') {
                            if (importanceFilter === 'none') {
                              if (t.importance) return false;
                            } else if (t.importance !== importanceFilter) {
                              return false;
                            }
                          }
                          return true;
                        })
                        .map((task) => {
                          // Find all subtasks recursively for this task
                          const getSubtasksRecursive = (parentId: string): Task[] => {
                            return tasks.filter(t => t.parent_id === parentId);
                          };
                          
                          return (
                            <TaskCard
                              key={task.id}
                              task={task}
                              attachments={taskAttachments[task.id] || []}
                              subtasks={getSubtasksRecursive(task.id)}
                              subtaskAttachments={taskAttachments}
                              onClick={() => {
                                setSelectedTaskId(task.id);
                                setTaskDetailOpen(true);
                              }}
                              showActions
                              onRemoveFromProduct={removeTaskFromProduct}
                              onDelete={deleteTask}
                              onImportanceChange={handleImportanceChange}
                              onAddSubtask={(parentId) => {
                                setParentTaskIdForNewTask(parentId);
                                setSelectedProductId(selectedProduct.id);
                                setCreateTaskOpen(true);
                              }}
                            />
                          );
                        })}
                      {tasks
                        .filter((t) => t.project_id === selectedProduct.id && !t.parent_id) // Only top-level tasks
                        .filter((t) => {
                          // Search filter
                          if (productTaskSearch && !t.title.toLowerCase().includes(productTaskSearch.toLowerCase())) {
                            return false;
                          }
                          // Status filter
                          if (productTaskStatusFilter !== 'all' && t.status !== productTaskStatusFilter) {
                            return false;
                          }
                          // Priority filter
                          if (productTaskPriorityFilter !== 'all') {
                            if (productTaskPriorityFilter === 'medium-high') {
                              if (t.priority !== 'medium' && t.priority !== 'high') return false;
                            } else if (t.priority !== productTaskPriorityFilter) {
                              return false;
                            }
                          }
                          // Importance filter
                          if (importanceFilter !== 'all') {
                            if (importanceFilter === 'none') {
                              if (t.importance) return false;
                            } else if (t.importance !== importanceFilter) {
                              return false;
                            }
                          }
                          return true;
                        }).length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          {productTaskSearch || productTaskStatusFilter !== 'all' || productTaskPriorityFilter !== 'all' || importanceFilter !== 'all'
                            ? 'No tasks match your filters'
                            : 'No tasks yet. Create your first task for this product!'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
            <Button onClick={() => setQuickAddWhatsAppOpen(true)} variant="default">
              <Plus className="h-4 w-4 mr-2" />
              Add from WhatsApp
            </Button>
            <Button onClick={() => setCreateTaskOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-3 mb-6">
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="w-[200px]">
                    <div className="flex items-center gap-2">
                      <FolderKanban className="h-4 w-4" />
                      <SelectValue placeholder="All Projects" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <FolderKanban className="h-4 w-4" />
                        <span>All Projects</span>
                      </div>
                    </SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    <SelectItem value="medium-high">Medium & High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={importanceFilter} onValueChange={setImportanceFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Importance" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="all">All Importance</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="must-have">Must Have</SelectItem>
                    <SelectItem value="should-have">Should Have</SelectItem>
                    <SelectItem value="good-to-have">Good to Have</SelectItem>
                    <SelectItem value="nice-to-have">Nice to Have</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={moduleFilter} onValueChange={setModuleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Module" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="all">All Modules</SelectItem>
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {uniqueModules.map((module) => (
                      <SelectItem key={module} value={module}>
                        {module.charAt(0).toUpperCase() + module.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant={groupByModule ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGroupByModule(!groupByModule)}
                  className="whitespace-nowrap"
                >
                  {groupByModule ? "Grouped by Module" : "Flat View"}
                </Button>
              </div>

              {/* Task Stats Toggle */}
              <div className="mb-4 flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowTaskStats(!showTaskStats)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className={`h-4 w-4 transition-transform ${showTaskStats ? 'rotate-90' : ''}`} />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {showTaskStats ? 'Hide' : 'Show'} Statistics
                </span>
              </div>

              {/* Task Stats */}
              {showTaskStats && (
                <>
              <div className="grid grid-cols-7 gap-4 mb-4">
                <div className="p-3 rounded-lg border bg-card">
                  <div className="text-2xl font-bold">{taskStats.tasks}</div>
                  <div className="text-xs text-muted-foreground">Tasks</div>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <div className="text-2xl font-bold">{taskStats.subtasks}</div>
                  <div className="text-xs text-muted-foreground">Subtasks</div>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <div className="text-2xl font-bold">{taskStats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
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
              </div>

              {/* Importance Classification Stats */}
              <div className="grid grid-cols-5 gap-4 mb-6">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-3 rounded-lg border bg-card cursor-help">
                      <div className="text-2xl font-bold">{taskStats.importance_none}</div>
                      <div className="text-xs text-muted-foreground">None</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">No Classification</p>
                    <p className="text-xs text-muted-foreground">Tasks with no importance classification set</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-3 rounded-lg border bg-red-50 border-red-200 cursor-help">
                      <div className="text-2xl font-bold text-red-800">{taskStats.importance_must}</div>
                      <div className="text-xs text-red-600">Must</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">Must Have</p>
                    <p className="text-xs text-muted-foreground">Critical tasks that are required for project success</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-3 rounded-lg border bg-orange-50 border-orange-200 cursor-help">
                      <div className="text-2xl font-bold text-orange-800">{taskStats.importance_should}</div>
                      <div className="text-xs text-orange-600">Should</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">Should Have</p>
                    <p className="text-xs text-muted-foreground">Important tasks that add significant value</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-3 rounded-lg border bg-blue-50 border-blue-200 cursor-help">
                      <div className="text-2xl font-bold text-blue-800">{taskStats.importance_good_to_have}</div>
                      <div className="text-xs text-blue-600">Good-to-have</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">Good to Have</p>
                    <p className="text-xs text-muted-foreground">Nice improvements that enhance the project</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-3 rounded-lg border bg-gray-50 border-gray-200 cursor-help">
                      <div className="text-2xl font-bold text-gray-800">{taskStats.importance_nice_to_have}</div>
                      <div className="text-xs text-gray-600">Nice-to-have</div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">Nice to Have</p>
                    <p className="text-xs text-muted-foreground">Optional enhancements with low priority</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              </>
              )}

              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-4">
                {groupByModule && groupedTasksByModule ? (
                  // Grouped by Module View
                  Object.entries(groupedTasksByModule).map(([module, moduleTasks]) => (
                    <div key={module} className="space-y-2">
                      <div className="flex items-center gap-2 py-2 border-b">
                        <Badge variant="outline" className="bg-primary/10 text-primary font-medium">
                          {module}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {moduleTasks.length} task{moduleTasks.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          Sorted: Importance → Priority
                        </span>
                      </div>
                      <div className="space-y-2 pl-2">
                        {moduleTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            attachments={taskAttachments[task.id] || []}
                            subtasks={tasks}
                            subtaskAttachments={taskAttachments}
                            onClick={(taskId) => {
                              setSelectedTaskId(taskId);
                              setTaskDetailOpen(true);
                            }}
                            showActions
                            onDelete={deleteTask}
                            onAddSubtask={(parentId) => {
                              setParentTaskIdForNewTask(parentId);
                              setCreateTaskOpen(true);
                            }}
                            onImportanceChange={handleImportanceChange}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  // Flat View
                  filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      attachments={taskAttachments[task.id] || []}
                      subtasks={tasks}
                      subtaskAttachments={taskAttachments}
                      onClick={(taskId) => {
                        setSelectedTaskId(taskId);
                        setTaskDetailOpen(true);
                      }}
                      showActions
                      onDelete={deleteTask}
                      onAddSubtask={(parentId) => {
                        setParentTaskIdForNewTask(parentId);
                        setCreateTaskOpen(true);
                      }}
                      onImportanceChange={handleImportanceChange}
                    />
                  ))
                )}
                {filteredTasks.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || projectFilter !== 'all' || importanceFilter !== 'all' || moduleFilter !== 'all'
                      ? 'No tasks match your filters'
                      : 'No tasks yet. Create your first task!'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cases" className="space-y-4">
          <div className="flex flex-col gap-4">
            {/* Filters Bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search cases..."
                      value={caseSearchQuery}
                      onChange={(e) => setCaseSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={caseStatusFilter} onValueChange={setCaseStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
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
              </CardContent>
            </Card>

            {/* Split Pane View */}
            <div className="h-[calc(100vh-380px)] border rounded-lg bg-card">
              <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg">
                {/* Left Panel - Case List */}
                <ResizablePanel defaultSize={40} minSize={30} className="p-4">
                  <div className="h-full overflow-y-auto pr-2">
                    {filteredApplications.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        {caseSearchQuery || caseStatusFilter !== 'active'
                          ? 'No cases match your filters'
                          : 'No cases found'}
                      </div>
                    ) : (
                      <div className="space-y-2 py-2">
                        {filteredApplications.map((app) => {
                          const isSelected = selectedCase?.id === app.id;
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

                          const priorityColor = {
                            critical: 'text-red-500',
                            high: 'text-orange-500',
                            medium: 'text-yellow-500',
                            low: 'text-blue-500',
                          }[app.priority || 'medium'] || 'text-yellow-500';

                          return (
                            <div
                              key={app.id}
                              onClick={() => setSelectedCase(app)}
                              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-primary/10 border-primary'
                                  : 'bg-card hover:bg-accent/50 border-border'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-foreground">
                                    {formatApplicationReferenceWithPrefix(app.reference_number, maxReferenceNumber, app.created_at, app.application_type)}
                                  </span>
                                  <Badge className={`${statusBadgeColor} text-xs`}>
                                    {app.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                                <Flag className={`h-4 w-4 ${priorityColor}`} />
                              </div>
                              
                              <p className="text-sm font-medium text-foreground mb-1">
                                {app.customer_company || app.customer_name || 'Unknown'}
                              </p>
                              
                              {app.assigned_to_name && (
                                <div className="flex items-center gap-1.5 mt-2">
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                      {getInitials(app.assigned_to_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-muted-foreground">
                                    {app.assigned_to_name}
                                  </span>
                                </div>
                              )}
                              {!app.assigned_to_name && (
                                <span className="text-xs text-amber-600">⚠ Unassigned</span>
                              )}
                              
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(app.created_at)}
                                </span>
                                {app.comments && app.comments.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" />
                                    {app.comments.length}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle className="bg-border" />

                {/* Right Panel - Case Details */}
                <ResizablePanel defaultSize={60} minSize={40} className="p-4">
                  <div className="h-full overflow-y-auto pr-2">
                    {!selectedCase ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                          <p className="text-sm">Select a case to view details</p>
                        </div>
                      </div>
                    ) : (
                      <div className="py-4">
                        {/* Header */}
                        <div className="mb-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-semibold text-foreground">
                                {formatApplicationReferenceWithPrefix(selectedCase.reference_number, maxReferenceNumber, selectedCase.created_at, selectedCase.application_type)}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {selectedCase.application_type?.replace('_', ' ') || 'Application'}
                              </p>
                            </div>
                            <Select
                              value={selectedCase.priority || 'medium'}
                              onValueChange={(value) => handlePriorityChange(selectedCase.id, value)}
                            >
                              <SelectTrigger className="w-32 h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-background z-50">
                                <SelectItem value="critical">🔴 Critical</SelectItem>
                                <SelectItem value="high">🟠 High</SelectItem>
                                <SelectItem value="medium">🟡 Medium</SelectItem>
                                <SelectItem value="low">🔵 Low</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Tabs */}
                        <Tabs value={caseDetailTab} onValueChange={setCaseDetailTab}>
                          <TabsList className="w-full justify-start">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="comments">
                              Comments ({selectedCase.comments?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger value="history">History</TabsTrigger>
                          </TabsList>

                          <TabsContent value="overview" className="space-y-4 mt-4">
                            {/* Customer Info */}
                            <div className="p-4 rounded-lg border bg-card">
                              <h4 className="text-sm font-semibold text-foreground mb-3">Customer Information</h4>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Name:</span>
                                  <span className="ml-2 text-foreground font-medium">
                                    {selectedCase.customer_name || 'N/A'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Company:</span>
                                  <span className="ml-2 text-foreground font-medium">
                                    {selectedCase.customer_company || 'N/A'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Email:</span>
                                  <span className="ml-2 text-foreground">
                                    {selectedCase.customer_email || 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Assignment Info */}
                            <div className="p-4 rounded-lg border bg-card">
                              <h4 className="text-sm font-semibold text-foreground mb-3">Assignment</h4>
                              {selectedCase.assigned_to_name ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                      {getInitials(selectedCase.assigned_to_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium text-foreground">
                                      {selectedCase.assigned_to_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {selectedCase.assigned_to_email}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-amber-600">⚠ This case is unassigned</p>
                              )}
                            </div>

                            {/* Status & Next Steps */}
                            <div className="p-4 rounded-lg border bg-card">
                              <h4 className="text-sm font-semibold text-foreground mb-3">Status</h4>
                              <Badge className={`mb-3 ${
                                {
                                  draft: 'bg-gray-500/10 text-gray-500',
                                  pending: 'bg-yellow-500/10 text-yellow-500',
                                  in_review: 'bg-blue-500/10 text-blue-500',
                                  waiting_for_documents: 'bg-orange-500/10 text-orange-500',
                                  waiting_for_information: 'bg-orange-500/10 text-orange-500',
                                  blocked: 'bg-red-500/10 text-red-500',
                                  approved: 'bg-green-500/10 text-green-500',
                                  complete: 'bg-green-500/10 text-green-500',
                                  rejected: 'bg-red-500/10 text-red-500',
                                }[selectedCase.status] || 'bg-gray-500/10 text-gray-500'
                              }`}>
                                {selectedCase.status.replace('_', ' ')}
                              </Badge>
                              
                              {selectedCase.next_step && (
                                <div className="mt-3 p-3 rounded-md bg-primary/5 border border-primary/20">
                                  <div className="flex items-start gap-2">
                                    <ArrowRight className="h-4 w-4 text-primary mt-0.5" />
                                    <div>
                                      <p className="text-xs font-medium text-primary mb-1">Next Step:</p>
                                      <p className="text-sm text-foreground">{selectedCase.next_step}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Recent Action */}
                            {selectedCase.recent_action && (
                              <div className="p-4 rounded-lg border bg-card">
                                <h4 className="text-sm font-semibold text-foreground mb-3">Recent Action</h4>
                                <div className="space-y-2">
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-medium text-foreground">
                                      {selectedCase.recent_action.changed_by_name}
                                    </span>
                                    {' '}changed status from{' '}
                                    <span className="font-medium text-foreground">
                                      {selectedCase.recent_action.previous_status}
                                    </span>
                                    {' '}to{' '}
                                    <span className="font-medium text-foreground">
                                      {selectedCase.recent_action.new_status}
                                    </span>
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(selectedCase.recent_action.created_at)}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Timestamps */}
                            <div className="p-4 rounded-lg border bg-card">
                              <h4 className="text-sm font-semibold text-foreground mb-3">Timeline</h4>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Created:</span>
                                  <span className="ml-2 text-foreground">
                                    {formatDate(selectedCase.created_at)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Last Updated:</span>
                                  <span className="ml-2 text-foreground">
                                    {formatDate(selectedCase.updated_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="comments" className="space-y-4 mt-4">
                            <div className="space-y-3">
                              {selectedCase.comments && selectedCase.comments.length > 0 ? (
                                selectedCase.comments.map((comment) => (
                                  <div key={comment.id} className="p-3 rounded-lg border bg-card">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium text-foreground">
                                        {comment.created_by_name}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDate(comment.created_at)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-foreground">{comment.text}</p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                  No comments yet
                                </p>
                              )}
                            </div>
                            
                            <Button
                              onClick={() => {
                                setSelectedCaseId(selectedCase.id);
                                setCommentDialogOpen(true);
                              }}
                              className="w-full"
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Add Comment
                            </Button>
                          </TabsContent>

                          <TabsContent value="history" className="space-y-4 mt-4">
                            {selectedCase.recent_action ? (
                              <div className="space-y-3">
                                <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                                  <div className="p-2 rounded-full bg-primary/10">
                                    <Activity className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground mb-1">
                                      Status Changed
                                    </p>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {selectedCase.recent_action.changed_by_name} changed status from{' '}
                                      <span className="font-medium text-foreground">
                                        {selectedCase.recent_action.previous_status}
                                      </span>
                                      {' '}to{' '}
                                      <span className="font-medium text-foreground">
                                        {selectedCase.recent_action.new_status}
                                      </span>
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDate(selectedCase.recent_action.created_at)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-8">
                                No history available
                              </p>
                            )}
                          </TabsContent>
                        </Tabs>
                      </div>
                    )}
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </div>
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
      <CreateProductDialog
        open={createProductOpen}
        onOpenChange={setCreateProductOpen}
        onProductCreated={() => {
          fetchProducts();
          setCreateProductOpen(false);
        }}
      />

      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={(open) => {
          setCreateTaskOpen(open);
          if (!open) {
            setSelectedProductId(undefined);
            setParentTaskIdForNewTask(undefined);
          }
        }}
        onTaskCreated={() => {
          fetchTasks();
          setParentTaskIdForNewTask(undefined);
        }}
        productId={selectedProductId}
        parentTaskId={parentTaskIdForNewTask}
      />
      <TaskDetailDialog
        taskId={selectedTaskId}
        open={taskDetailOpen}
        onOpenChange={setTaskDetailOpen}
        onTaskUpdated={fetchTasks}
      />

      {/* Comments Dialog */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Case Comments</DialogTitle>
            <DialogDescription>
              Add comments about the assigned agent's work on this case
            </DialogDescription>
          </DialogHeader>
          
          {selectedCaseId && caseComments[selectedCaseId] && caseComments[selectedCaseId].length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {caseComments[selectedCaseId].map((comment) => (
                <div key={comment.id} className="p-3 rounded-lg border bg-muted/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{comment.created_by_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm">{comment.text}</p>
                </div>
              ))}
            </div>
          )}
          
          <Textarea
            placeholder="Add your comment about this case..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={4}
          />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddComment} disabled={!newComment.trim()}>
              Add Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QuickAddBugDialog
        open={quickAddBugOpen}
        onOpenChange={setQuickAddBugOpen}
        onBugCreated={fetchTasks}
      />

      <QuickAddTaskFromWhatsApp
        open={quickAddWhatsAppOpen}
        onOpenChange={setQuickAddWhatsAppOpen}
        onTasksCreated={fetchTasks}
      />
    </div>
    </TooltipProvider>
  );
};

export default TaskCollaboration;
