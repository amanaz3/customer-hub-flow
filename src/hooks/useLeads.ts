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

  const convertToCustomer = async (lead: Lead, servicesPurchased?: string[]) => {
    try {
      // 1. Create customer from lead with all relevant info transferred
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
          product_id: lead.product_interest_id,
          customer_notes: lead.notes ? `Converted from Lead #${lead.reference_number}. Original notes: ${lead.notes}` : `Converted from Lead #${lead.reference_number}`,
        }])
        .select()
        .single();

      if (customerError) throw customerError;

      // 2. Update lead status to converted
      const { error: leadError } = await supabase
        .from('leads')
        .update({
          status: 'converted' as LeadStatus,
          converted_customer_id: customer.id,
          converted_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      if (leadError) throw leadError;

      // 3. Log conversion activity on the lead
      await supabase
        .from('lead_activities')
        .insert([{
          lead_id: lead.id,
          activity_type: 'note',
          description: `Lead converted to Customer. Customer ID: ${customer.id}, Reference: ${customer.reference_number}`,
          created_by: lead.assigned_to,
        }]);

      // 4. Create onboarding workflow notification for sales assistant
      if (lead.assigned_to) {
        // Notify sales assistant of successful conversion
        await supabase
          .from('notifications')
          .insert([{
            user_id: lead.assigned_to,
            type: 'success',
            title: '🎉 Lead Converted Successfully',
            message: `${lead.name} (${lead.company || 'No Company'}) has been converted to a customer. Next steps: Grant portal access, send document checklist, schedule onboarding call.`,
            customer_id: customer.id,
            action_url: `/customers/${customer.id}`,
          }]);

        // Create onboarding task notification
        await supabase
          .from('notifications')
          .insert([{
            user_id: lead.assigned_to,
            type: 'info',
            title: '📋 Onboarding Tasks Required',
            message: `Customer ${lead.name} needs onboarding: 1) Grant portal access 2) Send document checklist 3) Schedule onboarding call`,
            customer_id: customer.id,
            action_url: `/customers/${customer.id}`,
          }]);
      }

      // 5. Add initial comment on customer for onboarding tracking
      if (lead.assigned_to) {
        await supabase
          .from('comments')
          .insert([{
            customer_id: customer.id,
            comment: `📌 ONBOARDING CHECKLIST:\n□ Grant portal access\n□ Send document checklist\n□ Schedule onboarding call\n\nConverted from Lead #${lead.reference_number}`,
            created_by: lead.assigned_to,
          }]);
      }

      toast({
        title: 'Lead Converted Successfully! 🎉',
        description: 'Customer created. Onboarding notifications sent to sales assistant.',
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
