import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/SecureAuthContext';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: () => void;
  projectId?: string;
}

interface TeamMember {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
}

export const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onOpenChange,
  onTaskCreated,
  projectId,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'task' as const,
    priority: 'medium' as const,
    status: 'todo' as const,
    assigned_to: '',
    project_id: projectId || '',
    module: '',
    category: '',
    mission: '',
    story: '',
    architectural_component: '',
  });

  useEffect(() => {
    if (open) {
      fetchTeamMembers();
      fetchProjects();
    }
  }, [open]);

  const fetchTeamMembers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    
    if (data) setTeamMembers(data);
  };

  const fetchProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('id, name')
      .in('status', ['planning', 'active'])
      .order('name');
    
    if (data) setProjects(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.title.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('tasks').insert([{
        title: formData.title.trim(),
        description: formData.description || null,
        type: formData.type,
        priority: formData.priority,
        status: formData.status,
        assigned_to: formData.assigned_to === 'unassigned' ? null : formData.assigned_to || null,
        project_id: formData.project_id === 'none' ? null : formData.project_id || null,
        module: formData.module || null,
        category: formData.category || null,
        mission: formData.mission || null,
        story: formData.story || null,
        architectural_component: formData.architectural_component || null,
        created_by: user.id,
      }]);

      if (error) throw error;

      toast.success('Task created successfully');
      onTaskCreated();
      onOpenChange(false);
      setFormData({
        title: '',
        description: '',
        type: 'task',
        priority: 'medium',
        status: 'todo',
        assigned_to: '',
        project_id: projectId || '',
        module: '',
        category: '',
        mission: '',
        story: '',
        architectural_component: '',
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task for your team
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="title" className="text-sm">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Task title..."
              required
              className="h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm">Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as any })}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="feature">Feature</SelectItem>
                  <SelectItem value="enhancement">Enhancement</SelectItem>
                  <SelectItem value="system_issue">System Issue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Priority</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v as any })}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as any })}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Assign To</Label>
              <Select value={formData.assigned_to || 'unassigned'} onValueChange={(v) => setFormData({ ...formData, assigned_to: v === 'unassigned' ? '' : v })}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!projectId && (
            <div className="space-y-1">
              <Label className="text-sm">Project</Label>
              <Select value={formData.project_id || 'none'} onValueChange={(v) => setFormData({ ...formData, project_id: v === 'none' ? '' : v })}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="No project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-sm">Module</Label>
              <Select value={formData.module} onValueChange={(v) => setFormData({ ...formData, module: v })}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cases">Cases</SelectItem>
                  <SelectItem value="products">Products</SelectItem>
                  <SelectItem value="notifications">Notifications</SelectItem>
                  <SelectItem value="customers">Customers</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="reports">Reports</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Architecture</Label>
              <Select value={formData.architectural_component} onValueChange={(v) => setFormData({ ...formData, architectural_component: v })}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frontend">Frontend</SelectItem>
                  <SelectItem value="backend">Backend</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="component_service">Component/Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-sm">Category</Label>
            <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="usability_testing">Usability Testing</SelectItem>
                <SelectItem value="code_review">Code Review</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="testing">Testing</SelectItem>
                <SelectItem value="documentation">Documentation</SelectItem>
                <SelectItem value="bug_fix">Bug Fix</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="mission" className="text-sm">Mission</Label>
            <Input
              id="mission"
              value={formData.mission}
              onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
              placeholder="High-level goal..."
              className="h-9"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="story" className="text-sm">Story</Label>
            <Textarea
              id="story"
              value={formData.story}
              onChange={(e) => setFormData({ ...formData, story: e.target.value })}
              placeholder="As a [user], I want to [action]..."
              rows={2}
              className="text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="description" className="text-sm">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add details..."
              rows={2}
              className="text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
