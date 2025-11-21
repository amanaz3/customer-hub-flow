import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface QuickAddTaskFromWhatsAppProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTasksCreated: () => void;
}

interface Project {
  id: string;
  name: string;
}

export const QuickAddTaskFromWhatsApp: React.FC<QuickAddTaskFromWhatsAppProps> = ({
  open,
  onOpenChange,
  onTasksCreated,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  useEffect(() => {
    if (open) {
      fetchProjects();
    }
  }, [open]);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
      return;
    }

    setProjects(data || []);
    if (data && data.length > 0) {
      setSelectedProjectId(data[0].id);
    }
  };

  const parseWhatsAppMessage = (message: string) => {
    const lines = message.split('\n').filter(line => line.length > 0);
    
    if (lines.length === 0) {
      return [];
    }

    interface ParsedTask {
      title: string;
      level: number;
      originalLine: string;
      children: ParsedTask[];
    }

    // Determine indentation level (spaces, tabs, or depth indicators)
    const getIndentLevel = (line: string): number => {
      const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0;
      // Count tabs as 2 spaces
      const tabs = (line.match(/^\t+/)?.[0].length || 0) * 2;
      return Math.floor((leadingSpaces + tabs) / 2);
    };

    // Clean task title
    const cleanTitle = (line: string): string => {
      return line.trim()
        .replace(/^[\d]+[\.\)]\s*/, '') // Remove "1. " or "1) "
        .replace(/^[-*•]\s*/, '')        // Remove "- " or "* " or "• "
        .replace(/^\[\s*[x ]\s*\]\s*/i, '') // Remove "[ ] " or "[x] "
        .trim();
    };

    // Build hierarchical structure
    const parsed: ParsedTask[] = [];
    const stack: ParsedTask[] = [];

    lines.forEach(line => {
      const level = getIndentLevel(line);
      const title = cleanTitle(line);
      
      if (!title) return;

      const task: ParsedTask = { title, level, originalLine: line.trim(), children: [] };

      // Find parent based on level
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length === 0) {
        // Root level task
        parsed.push(task);
      } else {
        // Add as child to parent
        stack[stack.length - 1].children.push(task);
      }

      stack.push(task);
    });

    return parsed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !whatsappMessage.trim()) {
      toast.error('Please paste a message');
      return;
    }

    if (!selectedProjectId) {
      toast.error('Please select a project');
      return;
    }

    setLoading(true);
    try {
      const parsedTasks = parseWhatsAppMessage(whatsappMessage);

      if (parsedTasks.length === 0) {
        toast.error('Could not extract tasks from message');
        setLoading(false);
        return;
      }

      // Recursive function to create tasks and their children
      const createTasksRecursively = async (
        tasks: any[],
        parentId: string | null = null
      ): Promise<number> => {
        let count = 0;
        
        for (const task of tasks) {
          const { data: createdTask, error } = await supabase
            .from('tasks')
            .insert({
              title: task.title,
              type: 'task' as const,
              priority: 'medium' as const,
              status: 'todo' as const,
              created_by: user.id,
              parent_id: parentId,
              project_id: selectedProjectId,
              description: task.originalLine || task.title,
            })
            .select()
            .single();

          if (error) throw error;
          count++;

          // Create children recursively
          if (task.children && task.children.length > 0) {
            count += await createTasksRecursively(task.children, createdTask.id);
          }
        }

        return count;
      };

      const totalCount = await createTasksRecursively(parsedTasks);

      toast.success(
        `Created ${totalCount} task${totalCount !== 1 ? 's' : ''} with nested hierarchy`
      );
      
      setWhatsappMessage('');
      onTasksCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating tasks:', error);
      toast.error('Failed to create tasks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Task from WhatsApp</DialogTitle>
          <DialogDescription>
            Paste a WhatsApp message. Use indentation to create nested tasks (parent → child → grandchild).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>WhatsApp Message</Label>
            <Textarea
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              placeholder={`Example:
Setup new feature
  Create database schema
    Add tables
    Add indexes
  Build API endpoints
    User endpoints
    Auth endpoints
  Design UI components
  Write tests`}
              className="min-h-[200px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Supports numbered lists (1. 2.), bullets (- * •), checkboxes ([ ] [x]), and indentation for nesting
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !whatsappMessage.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Tasks
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
