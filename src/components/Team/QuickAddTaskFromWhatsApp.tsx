import React, { useState } from 'react';
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
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface QuickAddTaskFromWhatsAppProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTasksCreated: () => void;
}

export const QuickAddTaskFromWhatsApp: React.FC<QuickAddTaskFromWhatsAppProps> = ({
  open,
  onOpenChange,
  onTasksCreated,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');

  const parseWhatsAppMessage = (message: string) => {
    const lines = message.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return { parentTitle: '', subtasks: [] };
    }

    // First line is the parent task title
    const parentTitle = lines[0].trim();
    
    // Remaining lines are subtasks
    // Look for common patterns: numbers (1., 2.), bullets (-, *, •), checkboxes ([ ], [x])
    const subtasks = lines.slice(1)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Remove common prefixes
        return line
          .replace(/^[\d]+[\.\)]\s*/, '') // Remove "1. " or "1) "
          .replace(/^[-*•]\s*/, '')        // Remove "- " or "* " or "• "
          .replace(/^\[\s*[x ]\s*\]\s*/i, '') // Remove "[ ] " or "[x] "
          .trim();
      })
      .filter(line => line.length > 0);

    return { parentTitle, subtasks };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !whatsappMessage.trim()) {
      toast.error('Please paste a message');
      return;
    }

    setLoading(true);
    try {
      const { parentTitle, subtasks } = parseWhatsAppMessage(whatsappMessage);

      if (!parentTitle) {
        toast.error('Could not extract task title from message');
        setLoading(false);
        return;
      }

      // Create parent task
      const { data: parentTask, error: parentError } = await supabase
        .from('tasks')
        .insert({
          title: parentTitle,
          type: 'task' as const,
          priority: 'medium' as const,
          status: 'todo' as const,
          created_by: user.id,
          description: whatsappMessage, // Store original message as description
        })
        .select()
        .single();

      if (parentError) throw parentError;

      // Create subtasks
      if (subtasks.length > 0) {
        const subtaskInserts = subtasks.map(subtaskTitle => ({
          title: subtaskTitle,
          type: 'task' as const,
          priority: 'medium' as const,
          status: 'todo' as const,
          created_by: user.id,
          parent_id: parentTask.id,
        }));

        const { error: subtaskError } = await supabase
          .from('tasks')
          .insert(subtaskInserts);

        if (subtaskError) throw subtaskError;
      }

      toast.success(
        `Created task "${parentTitle}" with ${subtasks.length} subtask${subtasks.length !== 1 ? 's' : ''}`
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
            Paste a WhatsApp message. First line = main task, following lines = subtasks
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>WhatsApp Message</Label>
            <Textarea
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              placeholder={`Example:
Setup new feature
- Create database schema
- Build API endpoints
- Design UI components
- Write tests`}
              className="min-h-[200px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Supports: numbered lists (1. 2.), bullets (- * •), checkboxes ([ ] [x])
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
