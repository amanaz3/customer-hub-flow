import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface LeadCampaign {
  id: string;
  name: string;
  description: string | null;
  assigned_to: string | null;
  status: 'active' | 'completed' | 'paused';
  start_date: string;
  expected_completion_date: string | null;
  actual_completion_date: string | null;
  excel_file_path: string | null;
  excel_file_name: string | null;
  outreach_template: {
    email?: { professional: string; friendly: string };
    whatsapp?: { professional: string; friendly: string };
    linkedin?: { professional: string; friendly: string };
  } | null;
  lead_count: number;
  converted_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  assigned_user?: {
    id: string;
    name: string;
    email: string;
  };
}

export function useLeadCampaigns() {
  const [campaigns, setCampaigns] = useState<LeadCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lead_campaigns')
        .select(`
          *,
          assigned_user:profiles!lead_campaigns_assigned_to_fkey(id, name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns((data || []) as LeadCampaign[]);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaigns',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const createCampaign = async (campaign: {
    name: string;
    description?: string;
    assigned_to?: string;
    expected_completion_date?: string;
  }) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('lead_campaigns')
        .insert({
          name: campaign.name,
          description: campaign.description,
          assigned_to: campaign.assigned_to,
          expected_completion_date: campaign.expected_completion_date,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchCampaigns();
      toast({ title: 'Success', description: 'Campaign created successfully' });
      return data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to create campaign',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateCampaign = async (id: string, updates: Partial<LeadCampaign>) => {
    try {
      const { error } = await supabase
        .from('lead_campaigns')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      await fetchCampaigns();
      toast({ title: 'Success', description: 'Campaign updated successfully' });
      return true;
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to update campaign',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lead_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchCampaigns();
      toast({ title: 'Success', description: 'Campaign deleted successfully' });
      return true;
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete campaign',
        variant: 'destructive',
      });
      return false;
    }
  };

  const uploadExcelFile = async (campaignId: string, file: File) => {
    try {
      const filePath = `${campaignId}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('campaign-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('lead_campaigns')
        .update({
          excel_file_path: filePath,
          excel_file_name: file.name,
        })
        .eq('id', campaignId);

      if (updateError) throw updateError;

      await fetchCampaigns();
      return true;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload Excel file',
        variant: 'destructive',
      });
      return false;
    }
  };

  const assignLeadsToCampaign = async (campaignId: string, leadIds: string[]) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ campaign_id: campaignId })
        .in('id', leadIds);

      if (error) throw error;
      
      await fetchCampaigns();
      toast({ 
        title: 'Success', 
        description: `${leadIds.length} leads assigned to campaign` 
      });
      return true;
    } catch (error) {
      console.error('Error assigning leads:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign leads to campaign',
        variant: 'destructive',
      });
      return false;
    }
  };

  const saveOutreachTemplate = async (
    campaignId: string, 
    template: LeadCampaign['outreach_template']
  ) => {
    try {
      const { error } = await supabase
        .from('lead_campaigns')
        .update({ outreach_template: template })
        .eq('id', campaignId);

      if (error) throw error;
      
      await fetchCampaigns();
      toast({ 
        title: 'Success', 
        description: 'Outreach template saved for campaign' 
      });
      return true;
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: 'Failed to save outreach template',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    campaigns,
    isLoading,
    fetchCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    uploadExcelFile,
    assignLeadsToCampaign,
    saveOutreachTemplate,
  };
}
