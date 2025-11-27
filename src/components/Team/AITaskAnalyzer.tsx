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
import { Loader2, Sparkles, FileText, MessageSquare, Mail } from 'lucide-react';

interface AITaskAnalyzerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTasksCreated: () => void;
}

interface Project {
  id: string;
  name: string;
}

export const AITaskAnalyzer: React.FC<AITaskAnalyzerProps> = ({
  open,
  onOpenChange,
  onTasksCreated,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [rawText, setRawText] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  useEffect(() => {
    if (open) {
      fetchProjects();
      setRawText('');
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

  const handleAnalyze = async () => {
    if (!rawText.trim()) {
      toast.error('Please enter some text to analyze');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-tasks-ai', {
        body: {
          rawText: rawText.trim(),
          projectId: selectedProjectId || null
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Successfully created ${data.tasksCreated} tasks with AI analysis!`);
        onTasksCreated();
        onOpenChange(false);
        setRawText('');
      } else {
        throw new Error(data?.error || 'Failed to analyze tasks');
      }
    } catch (error: any) {
      console.error('Error analyzing tasks:', error);
      
      if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        toast.error('Rate limit exceeded. Please try again in a few moments.');
      } else if (error.message?.includes('402') || error.message?.includes('payment')) {
        toast.error('AI credits exhausted. Please add credits to your workspace.');
      } else {
        toast.error(error.message || 'Failed to analyze and create tasks');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle>AI Task Analyzer</DialogTitle>
          </div>
          <DialogDescription>
            Paste any text (WhatsApp messages, emails, notes, bug reports) and AI will automatically extract, classify, and organize tasks with importance, priority, modules, and hierarchy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project-select">Project (Optional)</Label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger id="project-select">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Text Input */}
          <div className="space-y-2">
            <Label htmlFor="raw-text">
              Paste Your Text
            </Label>
            <Textarea
              id="raw-text"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Paste anything here - AI will figure it out!

Examples:
• WhatsApp messages with tasks
• Unordered bug lists  
• Email with feature requests
• Nested task hierarchies
• Mixed priorities and types

AI will automatically:
✓ Extract all tasks
✓ Classify types (bug/feature/enhancement)
✓ Assign importance (must/should/good/nice)
✓ Set priority (critical/high/medium/low)
✓ Detect modules/categories
✓ Build parent-child hierarchy
✓ Provide reasoning for assignments`}
              className="min-h-[300px] font-mono text-sm"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Supports any format: bullets, numbers, indentation, mixed styles
            </p>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <MessageSquare className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <div className="font-medium text-foreground">WhatsApp</div>
                <div className="text-muted-foreground">Copy-paste group chats</div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/50 border border-accent">
              <FileText className="h-4 w-4 text-accent-foreground mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <div className="font-medium text-foreground">Notes</div>
                <div className="text-muted-foreground">Raw brain dumps</div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50 border border-secondary">
              <Mail className="h-4 w-4 text-secondary-foreground mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <div className="font-medium text-foreground">Emails</div>
                <div className="text-muted-foreground">Feature requests</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAnalyze}
            disabled={loading || !rawText.trim()}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Analyze & Create Tasks
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
