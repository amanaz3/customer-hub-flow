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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Bug, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface QuickAddBugDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBugCreated: () => void;
}

interface TeamMember {
  id: string;
  name: string;
}

export const QuickAddBugDialog: React.FC<QuickAddBugDialogProps> = ({
  open,
  onOpenChange,
  onBugCreated,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [detectedPriority, setDetectedPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  useEffect(() => {
    if (open) {
      fetchTeamMembers();
      setWhatsappMessage('');
      setAssignedTo('');
      setDetectedPriority('medium');
    }
  }, [open]);

  useEffect(() => {
    // Auto-detect priority based on keywords
    if (whatsappMessage) {
      const message = whatsappMessage.toLowerCase();
      if (message.includes('urgent') || message.includes('critical') || message.includes('asap') || message.includes('emergency')) {
        setDetectedPriority('critical');
      } else if (message.includes('important') || message.includes('high priority') || message.includes('bug')) {
        setDetectedPriority('high');
      } else if (message.includes('minor') || message.includes('low priority')) {
        setDetectedPriority('low');
      } else {
        setDetectedPriority('medium');
      }
    }
  }, [whatsappMessage]);

  const fetchTeamMembers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    
    if (data) setTeamMembers(data);
  };

  const extractTitleFromMessage = (message: string): string => {
    // Get first line or first 60 characters as title
    const firstLine = message.split('\n')[0];
    return firstLine.length > 60 ? firstLine.substring(0, 60) + '...' : firstLine;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !whatsappMessage.trim()) {
      toast.error('Please paste the WhatsApp message');
      return;
    }

    setLoading(true);
    try {
      const title = extractTitleFromMessage(whatsappMessage);
      
      const { error } = await supabase
        .from('tasks')
        .insert({
          title: title,
          description: whatsappMessage,
          type: 'bug',
          priority: detectedPriority,
          status: 'todo',
          assigned_to: assignedTo || null,
          created_by: user.id,
          category: 'whatsapp_report',
        });

      if (error) throw error;

      toast.success('Bug reported successfully!');
      onBugCreated();
      onOpenChange(false);
      setWhatsappMessage('');
      setAssignedTo('');
    } catch (error: any) {
      console.error('Error creating bug:', error);
      toast.error('Failed to create bug: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-destructive" />
            Quick Add Bug from WhatsApp
          </DialogTitle>
          <DialogDescription>
            Paste the bug report from WhatsApp group chat. Priority will be auto-detected.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">
              WhatsApp Message
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Paste the bug report from WhatsApp here..."
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
              required
            />
            {whatsappMessage && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>Auto-detected priority:</span>
                <Badge 
                  variant={
                    detectedPriority === 'critical' ? 'destructive' :
                    detectedPriority === 'high' ? 'default' :
                    detectedPriority === 'low' ? 'secondary' : 'outline'
                  }
                >
                  {detectedPriority}
                </Badge>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={detectedPriority} onValueChange={(value: any) => setDetectedPriority(value)}>
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
            <Label htmlFor="assigned">Assign To (Optional)</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !whatsappMessage.trim()}>
              {loading ? 'Creating...' : 'Create Bug Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
