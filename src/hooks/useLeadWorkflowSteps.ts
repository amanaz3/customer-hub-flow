import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LeadWorkflowStep {
  id: string;
  lead_id: string;
  step_key: string;
  step_name: string;
  step_order: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  started_at: string | null;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowSettings {
  id: string;
  setting_key: string;
  setting_value: Record<string, any>;
  is_enabled: boolean;
}

export const useLeadWorkflowSteps = (leadId?: string) => {
  const [steps, setSteps] = useState<LeadWorkflowStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchSteps = useCallback(async () => {
    if (!leadId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lead_workflow_steps')
        .select('*')
        .eq('lead_id', leadId)
        .order('step_order', { ascending: true });

      if (error) throw error;
      setSteps((data as LeadWorkflowStep[]) || []);
    } catch (error) {
      console.error('Error fetching lead workflow steps:', error);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  const updateStepStatus = async (
    stepId: string, 
    newStatus: LeadWorkflowStep['status'],
    notes?: string
  ) => {
    setUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: Partial<LeadWorkflowStep> = {
        status: newStatus,
        notes: notes || null,
      };

      if (newStatus === 'in_progress' && !steps.find(s => s.id === stepId)?.started_at) {
        updateData.started_at = new Date().toISOString();
      }

      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.completed_by = user?.id || null;
      }

      const { error } = await supabase
        .from('lead_workflow_steps')
        .update(updateData)
        .eq('id', stepId);

      if (error) throw error;
      
      toast.success('Step updated successfully');
      await fetchSteps();
    } catch (error) {
      console.error('Error updating step status:', error);
      toast.error('Failed to update step');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchSteps();
  }, [fetchSteps]);

  return { steps, loading, updating, updateStepStatus, refreshSteps: fetchSteps };
};

export const useWorkflowSettings = () => {
  const [settings, setSettings] = useState<WorkflowSettings[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lead_workflow_settings')
        .select('*');

      if (error) throw error;
      setSettings((data as WorkflowSettings[]) || []);
    } catch (error) {
      console.error('Error fetching workflow settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSetting = async (settingKey: string, value: Record<string, any>, isEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from('lead_workflow_settings')
        .update({ setting_value: value, is_enabled: isEnabled })
        .eq('setting_key', settingKey);

      if (error) throw error;
      toast.success('Settings updated');
      await fetchSettings();
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update settings');
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, updateSetting, refreshSettings: fetchSettings };
};

export const useBulkLeadWorkflow = () => {
  const [processing, setProcessing] = useState(false);

  const bulkMoveLeads = async (leadIds: string[], targetStep: string) => {
    setProcessing(true);
    try {
      // Mark current step as completed for all leads
      const { error: completeError } = await supabase
        .from('lead_workflow_steps')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString() 
        })
        .in('lead_id', leadIds)
        .lt('step_order', getStepOrder(targetStep));

      if (completeError) throw completeError;

      // Set target step to in_progress
      const { error: startError } = await supabase
        .from('lead_workflow_steps')
        .update({ 
          status: 'in_progress', 
          started_at: new Date().toISOString() 
        })
        .in('lead_id', leadIds)
        .eq('step_key', targetStep);

      if (startError) throw startError;

      toast.success(`${leadIds.length} leads moved to ${targetStep}`);
    } catch (error) {
      console.error('Error in bulk move:', error);
      toast.error('Failed to move leads');
    } finally {
      setProcessing(false);
    }
  };

  return { bulkMoveLeads, processing };
};

const getStepOrder = (stepKey: string): number => {
  const order: Record<string, number> = {
    'import': 1,
    'qualify': 2,
    'nurture': 3,
    'propose': 4,
    'convert': 5
  };
  return order[stepKey] || 1;
};
