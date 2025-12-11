import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Lead, LeadActivity, LeadScore, LeadStatus } from '@/types/lead';

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          assigned_user:profiles!leads_assigned_to_fkey(id, name, email),
          product_interest:products!leads_product_interest_id_fkey(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads((data || []) as unknown as Lead[]);
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch leads',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const createLead = async (leadData: {
    name: string;
    email?: string | null;
    mobile?: string | null;
    company?: string | null;
    source?: string | null;
    score?: LeadScore;
    notes?: string | null;
    product_interest_id?: string | null;
    assigned_to?: string | null;
    estimated_value?: number | null;
    next_follow_up?: string | null;
  }) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Lead created successfully',
      });
      
      await fetchLeads();
      return data;
    } catch (error: any) {
      console.error('Error creating lead:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create lead',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Lead updated successfully',
      });
      
      await fetchLeads();
      return true;
    } catch (error: any) {
      console.error('Error updating lead:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update lead',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Lead deleted successfully',
      });
      
      await fetchLeads();
      return true;
    } catch (error: any) {
      console.error('Error deleting lead:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete lead',
        variant: 'destructive',
      });
      return false;
    }
  };

  const convertToCustomer = async (lead: Lead) => {
    try {
      // Create customer from lead
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert([{
          name: lead.name,
          email: lead.email || '',
          mobile: lead.mobile || '',
          company: lead.company || '',
          user_id: lead.assigned_to,
          lead_source: (lead.source || 'Website') as any,
          license_type: 'Mainland',
          amount: lead.estimated_value || 0,
          status: 'Draft',
        }])
        .select()
        .single();

      if (customerError) throw customerError;

      // Update lead as converted
      const { error: leadError } = await supabase
        .from('leads')
        .update({
          status: 'converted' as LeadStatus,
          converted_customer_id: customer.id,
          converted_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      if (leadError) throw leadError;

      toast({
        title: 'Success',
        description: 'Lead converted to customer successfully',
      });

      await fetchLeads();
      return customer;
    } catch (error: any) {
      console.error('Error converting lead:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to convert lead',
        variant: 'destructive',
      });
      return null;
    }
  };

  return {
    leads,
    loading,
    fetchLeads,
    createLead,
    updateLead,
    deleteLead,
    convertToCustomer,
  };
};

export const useLeadActivities = (leadId: string | undefined) => {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchActivities = useCallback(async () => {
    if (!leadId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lead_activities')
        .select(`
          *,
          creator:profiles!lead_activities_created_by_fkey(id, name)
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivities((data || []) as unknown as LeadActivity[]);
    } catch (error: any) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const addActivity = async (activityData: {
    activity_type: string;
    description?: string | null;
    created_by?: string | null;
  }) => {
    try {
      const { error } = await supabase
        .from('lead_activities')
        .insert([{ ...activityData, lead_id: leadId }]);

      if (error) throw error;
      
      // Update last_contacted_at on lead
      if (activityData.activity_type !== 'note') {
        await supabase
          .from('leads')
          .update({ last_contacted_at: new Date().toISOString() })
          .eq('id', leadId);
      }
      
      toast({
        title: 'Success',
        description: 'Activity logged successfully',
      });
      
      await fetchActivities();
      return true;
    } catch (error: any) {
      console.error('Error adding activity:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to log activity',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    activities,
    loading,
    fetchActivities,
    addActivity,
  };
};
