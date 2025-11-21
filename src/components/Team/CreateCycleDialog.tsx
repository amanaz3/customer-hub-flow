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

interface CreateCycleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCycleCreated: () => void;
  cycle?: {
    id: string;
    name: string;
    description: string | null;
    start_date: string;
    end_date: string;
    status: 'planning' | 'active' | 'completed' | 'loveable-stage' | 'dev-stage' | 'qa-stage' | 'live-stage';
  };
}

export const CreateCycleDialog: React.FC<CreateCycleDialogProps> = ({
  open,
  onOpenChange,
  onCycleCreated,
  cycle,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    status: 'planning' | 'active' | 'completed' | 'loveable-stage' | 'dev-stage' | 'qa-stage' | 'live-stage';
  }>({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'planning',
  });

  useEffect(() => {
    if (cycle) {
      setFormData({
        name: cycle.name,
        description: cycle.description || '',
        start_date: cycle.start_date,
        end_date: cycle.end_date,
        status: cycle.status,
      });
    } else {
      // Set default dates for new cycle (2 weeks from today)
      const today = new Date();
      const twoWeeksLater = new Date(today);
      twoWeeksLater.setDate(today.getDate() + 14);

      setFormData({
        name: '',
        description: '',
        start_date: today.toISOString().split('T')[0],
        end_date: twoWeeksLater.toISOString().split('T')[0],
        status: 'planning',
      });
    }
  }, [cycle, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name.trim()) return;

    // Validate dates
    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      toast.error('End date must be after start date');
      return;
    }

    setLoading(true);
    try {
      if (cycle) {
        // Update existing cycle
        const { error } = await supabase
          .from('cycles')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            start_date: formData.start_date,
            end_date: formData.end_date,
            status: formData.status,
          })
          .eq('id', cycle.id);

        if (error) throw error;
        toast.success('Cycle updated successfully');
      } else {
        // Create new cycle
        const { error } = await supabase.from('cycles').insert([
          {
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            start_date: formData.start_date,
            end_date: formData.end_date,
            status: formData.status,
            created_by: user.id,
          },
        ]);

        if (error) throw error;
        toast.success('Cycle created successfully');
      }

      onCycleCreated();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving cycle:', error);
      toast.error(error.message || 'Failed to save cycle');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    const today = new Date();
    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(today.getDate() + 14);

    setFormData({
      name: '',
      description: '',
      start_date: today.toISOString().split('T')[0],
      end_date: twoWeeksLater.toISOString().split('T')[0],
      status: 'planning',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{cycle ? 'Edit Cycle' : 'Create New Cycle'}</DialogTitle>
          <DialogDescription>
            {cycle
              ? 'Update cycle details and status'
              : 'Create a new time-boxed work cycle (sprint)'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Cycle Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Sprint 12, Q1 2024"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Cycle goals and focus areas..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="loveable-stage">Loveable Stage</SelectItem>
                <SelectItem value="dev-stage">Dev Stage</SelectItem>
                <SelectItem value="qa-stage">QA Stage</SelectItem>
                <SelectItem value="live-stage">Live Stage</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {formData.status === 'planning' && 'Not started yet'}
              {formData.status === 'active' && 'Currently in progress'}
              {formData.status === 'loveable-stage' && 'In Loveable stage'}
              {formData.status === 'dev-stage' && 'In development stage'}
              {formData.status === 'qa-stage' && 'In QA stage'}
              {formData.status === 'live-stage' && 'Live/deployed'}
              {formData.status === 'completed' && 'Finished'}
            </p>
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : cycle ? 'Update Cycle' : 'Create Cycle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
