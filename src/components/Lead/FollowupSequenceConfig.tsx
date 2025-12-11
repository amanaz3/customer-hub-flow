import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings2,
  Phone,
  MessageCircle,
  Mail,
  FileText,
  Plus,
  Trash2,
  Save,
  Loader2,
  GripVertical,
} from 'lucide-react';

interface FollowupStep {
  id: string;
  day_offset: number;
  action_type: 'whatsapp' | 'call' | 'email' | 'note';
  action_title: string;
  action_description: string | null;
  auto_mark_cold: boolean;
  is_enabled: boolean;
}

const actionIcons: Record<string, React.ReactNode> = {
  call: <Phone className="h-4 w-4" />,
  whatsapp: <MessageCircle className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  note: <FileText className="h-4 w-4" />,
};

const actionColors: Record<string, string> = {
  call: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  whatsapp: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  email: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  note: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export function FollowupSequenceConfig() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [steps, setSteps] = useState<FollowupStep[]>([]);
  const [editingStep, setEditingStep] = useState<FollowupStep | null>(null);
  const { toast } = useToast();

  const fetchSteps = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lead_followup_sequence')
        .select('*')
        .order('day_offset', { ascending: true });

      if (error) throw error;
      setSteps((data || []) as FollowupStep[]);
    } catch (error: any) {
      console.error('Error fetching sequence:', error);
      toast({
        title: 'Error',
        description: 'Failed to load follow-up sequence',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSteps();
    }
  }, [open]);

  const handleSaveStep = async () => {
    if (!editingStep) return;

    setSaving(true);
    try {
      if (editingStep.id.startsWith('new-')) {
        // Insert new step
        const { error } = await supabase
          .from('lead_followup_sequence')
          .insert({
            day_offset: editingStep.day_offset,
            action_type: editingStep.action_type,
            action_title: editingStep.action_title,
            action_description: editingStep.action_description,
            auto_mark_cold: editingStep.auto_mark_cold,
            is_enabled: editingStep.is_enabled,
          });
        if (error) throw error;
      } else {
        // Update existing step
        const { error } = await supabase
          .from('lead_followup_sequence')
          .update({
            day_offset: editingStep.day_offset,
            action_type: editingStep.action_type,
            action_title: editingStep.action_title,
            action_description: editingStep.action_description,
            auto_mark_cold: editingStep.auto_mark_cold,
            is_enabled: editingStep.is_enabled,
          })
          .eq('id', editingStep.id);
        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Step saved successfully',
      });
      setEditingStep(null);
      fetchSteps();
    } catch (error: any) {
      console.error('Error saving step:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save step',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStep = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lead_followup_sequence')
        .delete()
        .eq('id', id);
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Step deleted',
      });
      fetchSteps();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete step',
        variant: 'destructive',
      });
    }
  };

  const handleToggleEnabled = async (step: FollowupStep) => {
    try {
      const { error } = await supabase
        .from('lead_followup_sequence')
        .update({ is_enabled: !step.is_enabled })
        .eq('id', step.id);
      if (error) throw error;
      fetchSteps();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update step',
        variant: 'destructive',
      });
    }
  };

  const addNewStep = () => {
    const maxDay = steps.length > 0 ? Math.max(...steps.map(s => s.day_offset)) + 1 : 0;
    setEditingStep({
      id: `new-${Date.now()}`,
      day_offset: maxDay,
      action_type: 'whatsapp',
      action_title: '',
      action_description: '',
      auto_mark_cold: false,
      is_enabled: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-2" />
          Follow-up Sequence
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Configure Lead Follow-up Sequence
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : editingStep ? (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Day Offset</Label>
                <Input
                  type="number"
                  min={0}
                  value={editingStep.day_offset}
                  onChange={(e) =>
                    setEditingStep({ ...editingStep, day_offset: parseInt(e.target.value) || 0 })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">Days after lead creation</p>
              </div>
              <div>
                <Label>Action Type</Label>
                <Select
                  value={editingStep.action_type}
                  onValueChange={(v) => setEditingStep({ ...editingStep, action_type: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="note">Note / Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Action Title</Label>
              <Input
                value={editingStep.action_title}
                onChange={(e) => setEditingStep({ ...editingStep, action_title: e.target.value })}
                placeholder="e.g., Send Welcome Message"
              />
            </div>
            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                value={editingStep.action_description || ''}
                onChange={(e) => setEditingStep({ ...editingStep, action_description: e.target.value })}
                placeholder="Detailed instructions for this step..."
                rows={2}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingStep.auto_mark_cold}
                  onCheckedChange={(v) => setEditingStep({ ...editingStep, auto_mark_cold: v })}
                />
                <Label className="text-sm">Auto-mark lead as Cold if no response</Label>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setEditingStep(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveStep} disabled={saving || !editingStep.action_title}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Save Step
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              {steps.map((step) => (
                <Card
                  key={step.id}
                  className={`transition-opacity ${!step.is_enabled ? 'opacity-50' : ''}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 min-w-[60px]">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="font-mono">
                          Day {step.day_offset}
                        </Badge>
                      </div>
                      <div className={`p-2 rounded-full ${actionColors[step.action_type]}`}>
                        {actionIcons[step.action_type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{step.action_title}</p>
                        {step.action_description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {step.action_description}
                          </p>
                        )}
                      </div>
                      {step.auto_mark_cold && (
                        <Badge variant="secondary" className="text-xs">
                          Auto Cold
                        </Badge>
                      )}
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={step.is_enabled}
                          onCheckedChange={() => handleToggleEnabled(step)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingStep(step)}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteStep(step.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button onClick={addNewStep} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}