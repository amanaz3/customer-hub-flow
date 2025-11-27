import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SecureAuthContext';

interface WorkflowStep {
  id: string;
  application_id: string;
  step_key: string;
  step_name: string;
  step_order: number;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  assigned_to: string | null;
  notes: string | null;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useWorkflowSteps = (applicationId: string | undefined) => {
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (applicationId) {
      fetchSteps();
    }
  }, [applicationId]);

  const fetchSteps = async () => {
    if (!applicationId) return;
    
    try {
      const { data, error } = await supabase
        .from('application_workflow_steps')
        .select('*')
        .eq('application_id', applicationId)
        .order('step_order');

      if (error) throw error;
      setSteps((data || []) as WorkflowStep[]);
    } catch (error) {
      console.error('Error fetching workflow steps:', error);
      toast({
        title: "Error",
        description: "Failed to load workflow steps",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStepStatus = async (
    stepId: string, 
    newStatus: 'pending' | 'in_progress' | 'completed' | 'blocked',
    notes?: string
  ) => {
    if (!user) return;
    
    setUpdating(true);
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (notes) {
        updateData.notes = notes;
      }

      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.completed_by = user.id;
      }

      const { error } = await supabase
        .from('application_workflow_steps')
        .update(updateData)
        .eq('id', stepId);

      if (error) throw error;

      await fetchSteps();
      
      toast({
        title: "Success",
        description: "Step status updated successfully",
      });
    } catch (error) {
      console.error('Error updating step status:', error);
      toast({
        title: "Error",
        description: "Failed to update step status",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  return {
    steps,
    loading,
    updating,
    updateStepStatus,
    refreshSteps: fetchSteps,
  };
};
