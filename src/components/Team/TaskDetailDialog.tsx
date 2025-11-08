import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/SecureAuthContext';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { MessageSquare, Trash2 } from 'lucide-react';

interface TaskDetailDialogProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: () => void;
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
  created_by: string;
  module: string | null;
  category: string | null;
  mission: string | null;
  story: string | null;
}

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  user_id: string;
  profiles: { name: string };
}

export const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({
  taskId,
  open,
  onOpenChange,
  onTaskUpdated,
}) => {
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    if (taskId && open) {
      fetchTask();
      fetchComments();
      fetchTeamMembers();
    }
  }, [taskId, open]);

  const fetchTask = async () => {
    if (!taskId) return;
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();
    
    if (data) setTask(data);
  };

  const fetchComments = async () => {
    if (!taskId) return;
    const { data } = await supabase
      .from('task_comments')
      .select('*, profiles(name)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });
    
    if (data) setComments(data);
  };

  const fetchTeamMembers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('is_active', true);
    
    if (data) setTeamMembers(data);
  };

  const handleUpdate = async (updates: Partial<Task>) => {
    if (!taskId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates as any)
        .eq('id', taskId);

      if (error) throw error;

      toast.success('Task updated');
      fetchTask();
      onTaskUpdated();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!taskId || !newComment.trim() || !user) return;

    try {
      const { error } = await supabase.from('task_comments').insert([{
        task_id: taskId,
        user_id: user.id,
        comment: newComment.trim(),
      }]);

      if (error) throw error;

      setNewComment('');
      fetchComments();
      toast.success('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleDelete = async () => {
    if (!taskId || !confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast.success('Task deleted');
      onTaskUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Task Details</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div>
            {editing ? (
              <Input
                value={task.title}
                onChange={(e) => setTask({ ...task, title: e.target.value })}
                onBlur={() => {
                  handleUpdate({ title: task.title });
                  setEditing(false);
                }}
                autoFocus
              />
            ) : (
              <h2
                className="text-xl font-semibold cursor-pointer hover:text-primary"
                onClick={() => setEditing(true)}
              >
                {task.title}
              </h2>
            )}
          </div>

          {/* Properties */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={task.status} onValueChange={(v) => handleUpdate({ status: v as 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked' })}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={task.priority} onValueChange={(v) => handleUpdate({ priority: v as 'low' | 'medium' | 'high' | 'critical' })}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={task.type} onValueChange={(v) => handleUpdate({ type: v as any })}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select
                value={task.assigned_to || 'unassigned'}
                onValueChange={(v) => handleUpdate({ assigned_to: v === 'unassigned' ? null : v })}
              >
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label>Module</Label>
              <Select value={task.module || 'none'} onValueChange={(v) => handleUpdate({ module: v === 'none' ? null : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="No module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No module</SelectItem>
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

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={task.category || 'none'} onValueChange={(v) => handleUpdate({ category: v === 'none' ? null : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="No category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
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
          </div>

          {/* Mission */}
          {(task.mission || editing) && (
            <div className="space-y-2">
              <Label>Mission</Label>
              <Input
                value={task.mission || ''}
                onChange={(e) => setTask({ ...task, mission: e.target.value })}
                onBlur={() => handleUpdate({ mission: task.mission })}
                placeholder="High-level goal or objective..."
              />
            </div>
          )}

          {/* Story */}
          {(task.story || editing) && (
            <div className="space-y-2">
              <Label>Story</Label>
              <Textarea
                value={task.story || ''}
                onChange={(e) => setTask({ ...task, story: e.target.value })}
                onBlur={() => handleUpdate({ story: task.story })}
                placeholder="As a [user type], I want to [action] so that [benefit]..."
                rows={3}
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={task.description || ''}
              onChange={(e) => setTask({ ...task, description: e.target.value })}
              onBlur={() => handleUpdate({ description: task.description })}
              placeholder="Add a description..."
              rows={4}
            />
          </div>

          <Separator />

          {/* Comments */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <Label>Comments ({comments.length})</Label>
            </div>

            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(comment.profiles.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{comment.profiles.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{comment.comment}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                Send
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
