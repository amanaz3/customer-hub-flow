import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Lead, LeadActivity, LeadScore, LeadStatus } from '@/types/lead';

// Dummy leads for demo/testing - covers all workflow stages
const dummyLeads: Lead[] = [
  // IMPORT STAGE (status: 'new')
  {
    id: 'dummy-1',
    reference_number: 1001,
    name: 'Fatima Al Rashid',
    email: 'fatima@consulting.ae',
    mobile: '+971502345678',
    company: 'Al Rashid Consulting',
    source: 'Exhibition',
    score: 'warm',
    status: 'new',
    estimated_value: 25000,
    notes: 'Met at GITEX, interested in corporate services',
    next_follow_up: new Date(Date.now() + 172800000).toISOString(),
    last_contacted_at: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    assigned_to: null,
    product_interest_id: 'prod-4',
    converted_customer_id: null,
    converted_at: null,
    assigned_user: null,
    product_interest: { id: 'prod-4', name: 'Corporate Tax' },
  },
  {
    id: 'dummy-2',
    reference_number: 1002,
    name: 'John Smith',
    email: 'john@ukstartup.co.uk',
    mobile: '+447891234567',
    company: 'UK Tech Ventures',
    source: 'Website',
    score: 'hot',
    status: 'new',
    estimated_value: 75000,
    notes: 'Urgent inquiry - relocating to Dubai',
    next_follow_up: new Date(Date.now() + 86400000).toISOString(),
    last_contacted_at: null,
    created_at: new Date(Date.now() - 43200000).toISOString(),
    updated_at: new Date().toISOString(),
    assigned_to: null,
    product_interest_id: 'prod-1',
    converted_customer_id: null,
    converted_at: null,
    assigned_user: null,
    product_interest: { id: 'prod-1', name: 'Company Formation' },
  },
  // QUALIFY STAGE (status: 'contacted')
  {
    id: 'dummy-3',
    reference_number: 1003,
    name: 'James Wilson',
    email: 'james@techstartup.io',
    mobile: '+971509876543',
    company: 'TechStart Innovation',
    source: 'LinkedIn',
    score: 'warm',
    status: 'contacted',
    estimated_value: 45000,
    notes: 'Exploring options for UAE expansion',
    next_follow_up: new Date(Date.now() + 259200000).toISOString(),
    last_contacted_at: new Date(Date.now() - 432000000).toISOString(),
    created_at: new Date(Date.now() - 604800000).toISOString(),
    updated_at: new Date().toISOString(),
    assigned_to: 'user-1',
    product_interest_id: 'prod-3',
    converted_customer_id: null,
    converted_at: null,
    assigned_user: { id: 'user-1', name: 'Sarah Johnson', email: 'sarah@company.com' },
    product_interest: { id: 'prod-3', name: 'Home Finance' },
  },
  {
    id: 'dummy-4',
    reference_number: 1004,
    name: 'Chen Wei',
    email: 'chen@importexport.cn',
    mobile: '+971508765432',
    company: 'Dragon Trade FZE',
    source: 'Website',
    score: 'cold',
    status: 'contacted',
    estimated_value: 12000,
    notes: 'Initial inquiry, not responsive to follow-ups',
    next_follow_up: new Date(Date.now() + 604800000).toISOString(),
    last_contacted_at: new Date(Date.now() - 1209600000).toISOString(),
    created_at: new Date(Date.now() - 2592000000).toISOString(),
    updated_at: new Date().toISOString(),
    assigned_to: 'user-2',
    product_interest_id: 'prod-1',
    converted_customer_id: null,
    converted_at: null,
    assigned_user: { id: 'user-2', name: 'Omar Hassan', email: 'omar@company.com' },
    product_interest: { id: 'prod-1', name: 'Company Formation' },
  },
  // NURTURE STAGE (status: 'qualified')
  {
    id: 'dummy-5',
    reference_number: 1005,
    name: 'Ahmed Al Maktoum',
    email: 'ahmed@realestate-dubai.ae',
    mobile: '+971501234567',
    company: 'Dubai Properties LLC',
    source: 'Website',
    score: 'hot',
    status: 'qualified',
    estimated_value: 150000,
    notes: 'Interested in company formation + bank account opening',
    next_follow_up: new Date(Date.now() + 86400000).toISOString(),
    last_contacted_at: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date().toISOString(),
    assigned_to: 'user-1',
    product_interest_id: 'prod-1',
    converted_customer_id: null,
    converted_at: null,
    assigned_user: { id: 'user-1', name: 'Sarah Johnson', email: 'sarah@company.com' },
    product_interest: { id: 'prod-1', name: 'Company Formation' },
  },
  {
    id: 'dummy-6',
    reference_number: 1006,
    name: 'Lisa Thompson',
    email: 'lisa@financecorp.uk',
    mobile: '+447912345678',
    company: 'Finance Corp UK',
    source: 'Referral',
    score: 'warm',
    status: 'qualified',
    estimated_value: 55000,
    notes: 'Referred by Ahmed - looking for bank account',
    next_follow_up: new Date(Date.now() + 172800000).toISOString(),
    last_contacted_at: new Date(Date.now() - 259200000).toISOString(),
    created_at: new Date(Date.now() - 518400000).toISOString(),
    updated_at: new Date().toISOString(),
    assigned_to: 'user-2',
    product_interest_id: 'prod-2',
    converted_customer_id: null,
    converted_at: null,
    assigned_user: { id: 'user-2', name: 'Omar Hassan', email: 'omar@company.com' },
    product_interest: { id: 'prod-2', name: 'Bank Account Opening' },
  },
  // PROPOSE STAGE (status: 'proposal' or 'negotiation')
  {
    id: 'dummy-7',
    reference_number: 1007,
    name: 'Maria Santos',
    email: 'maria@goldtrading.com',
    mobile: '+971507654321',
    company: 'Santos Gold Trading',
    source: 'Referral',
    score: 'hot',
    status: 'proposal',
    estimated_value: 85000,
    notes: 'Urgent - needs bank account for gold trading license',
    next_follow_up: new Date(Date.now() + 3600000).toISOString(),
    last_contacted_at: new Date(Date.now() - 7200000).toISOString(),
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date().toISOString(),
    assigned_to: 'user-2',
    product_interest_id: 'prod-2',
    converted_customer_id: null,
    converted_at: null,
    assigned_user: { id: 'user-2', name: 'Omar Hassan', email: 'omar@company.com' },
    product_interest: { id: 'prod-2', name: 'Bank Account Opening' },
  },
  {
    id: 'dummy-8',
    reference_number: 1008,
    name: 'Mohammed Al Farsi',
    email: 'mohammed@realestate.om',
    mobile: '+96891234567',
    company: 'Al Farsi Properties',
    source: 'LinkedIn',
    score: 'hot',
    status: 'negotiation',
    estimated_value: 120000,
    notes: 'Negotiating bundle deal - Company + Bank + Tax',
    next_follow_up: new Date(Date.now() + 43200000).toISOString(),
    last_contacted_at: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 432000000).toISOString(),
    updated_at: new Date().toISOString(),
    assigned_to: 'user-1',
    product_interest_id: 'prod-1',
    converted_customer_id: null,
    converted_at: null,
    assigned_user: { id: 'user-1', name: 'Sarah Johnson', email: 'sarah@company.com' },
    product_interest: { id: 'prod-1', name: 'Company Formation' },
  },
  // CONVERT STAGE (status: 'converted' or 'lost')
  {
    id: 'dummy-9',
    reference_number: 1009,
    name: 'Emma Rodriguez',
    email: 'emma@luxurygoods.es',
    mobile: '+34612345678',
    company: 'Luxury Imports Spain',
    source: 'Exhibition',
    score: 'hot',
    status: 'converted',
    estimated_value: 95000,
    notes: 'Successfully converted - Company formation completed',
    next_follow_up: null,
    last_contacted_at: new Date(Date.now() - 172800000).toISOString(),
    created_at: new Date(Date.now() - 1209600000).toISOString(),
    updated_at: new Date().toISOString(),
    assigned_to: 'user-1',
    product_interest_id: 'prod-1',
    converted_customer_id: 'cust-1',
    converted_at: new Date(Date.now() - 172800000).toISOString(),
    assigned_user: { id: 'user-1', name: 'Sarah Johnson', email: 'sarah@company.com' },
    product_interest: { id: 'prod-1', name: 'Company Formation' },
  },
  {
    id: 'dummy-10',
    reference_number: 1010,
    name: 'Priya Sharma',
    email: 'priya@healthcare.in',
    mobile: '+971506543210',
    company: 'MedCare Solutions',
    source: 'Referral',
    score: 'cold',
    status: 'lost',
    estimated_value: 8000,
    notes: 'Decided to go with competitor',
    next_follow_up: null,
    last_contacted_at: null,
    created_at: new Date(Date.now() - 5184000000).toISOString(),
    updated_at: new Date().toISOString(),
    assigned_to: 'user-1',
    product_interest_id: null,
    converted_customer_id: null,
    converted_at: null,
    assigned_user: { id: 'user-1', name: 'Sarah Johnson', email: 'sarah@company.com' },
    product_interest: null,
  },
];

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDummyData, setShowDummyData] = useState(() => {
    return localStorage.getItem('leads_show_dummy') === 'true';
  });
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
      
      const realLeads = (data || []) as unknown as Lead[];
      return realLeads;
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch leads',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const toggleDummyData = useCallback((enabled: boolean) => {
    setShowDummyData(enabled);
    localStorage.setItem('leads_show_dummy', String(enabled));
  }, []);

  // Effect to fetch leads and combine with dummy data
  useEffect(() => {
    const loadLeads = async () => {
      const realLeads = await fetchLeads();
      if (showDummyData) {
        setLeads([...dummyLeads, ...realLeads]);
      } else {
        setLeads(realLeads);
      }
    };
    loadLeads();
  }, [fetchLeads, showDummyData]);

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

  const convertToCustomer = async (lead: Lead, options?: {
    grantPortalAccess?: boolean;
    portalAccessMethod?: 'send_invitation' | 'auto_create' | 'manual_flag';
    sendDocumentChecklist?: boolean;
    documentChecklistNotes?: string;
    scheduleOnboardingCall?: boolean;
    onboardingCallDate?: Date;
    onboardingCallNotes?: string;
    servicesPurchased?: string[];
    conversionNotes?: string;
  }) => {
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
          customer_notes: lead.notes 
            ? `Converted from Lead #${lead.reference_number}. Original notes: ${lead.notes}${options?.conversionNotes ? `\n\nConversion notes: ${options.conversionNotes}` : ''}`
            : `Converted from Lead #${lead.reference_number}${options?.conversionNotes ? `\n\nConversion notes: ${options.conversionNotes}` : ''}`,
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
          description: `Lead converted to Customer. Customer ID: ${customer.id}, Reference: ${customer.reference_number}${options?.servicesPurchased?.length ? `. Services: ${options.servicesPurchased.join(', ')}` : ''}`,
          created_by: lead.assigned_to,
        }]);

      // 4. Build onboarding checklist based on options
      const checklistItems: string[] = [];
      
      if (options?.grantPortalAccess) {
        const accessMethod = options.portalAccessMethod === 'send_invitation' 
          ? 'Send invitation email' 
          : options.portalAccessMethod === 'auto_create' 
            ? 'Auto-create account & send credentials'
            : 'Manual flag (no email)';
        checklistItems.push(`☐ Grant portal access (${accessMethod})`);
      }
      
      if (options?.sendDocumentChecklist) {
        checklistItems.push(`☐ Send document checklist${options.documentChecklistNotes ? ` - ${options.documentChecklistNotes}` : ''}`);
      }
      
      if (options?.scheduleOnboardingCall) {
        const callDate = options.onboardingCallDate 
          ? ` - Scheduled: ${options.onboardingCallDate.toLocaleDateString()}`
          : '';
        checklistItems.push(`☐ Schedule onboarding call${callDate}${options.onboardingCallNotes ? ` (${options.onboardingCallNotes})` : ''}`);
      }

      if (options?.servicesPurchased?.length) {
        checklistItems.push(`\n📦 Services Purchased:\n${options.servicesPurchased.map(s => `  • ${s}`).join('\n')}`);
      }

      // 5. Create onboarding workflow notifications for sales assistant
      if (lead.assigned_to) {
        // Notify sales assistant of successful conversion
        await supabase
          .from('notifications')
          .insert([{
            user_id: lead.assigned_to,
            type: 'success',
            title: '🎉 Lead Converted Successfully',
            message: `${lead.name} (${lead.company || 'No Company'}) has been converted to a customer.${options?.servicesPurchased?.length ? ` Services: ${options.servicesPurchased.join(', ')}` : ''}`,
            customer_id: customer.id,
            action_url: `/customers/${customer.id}`,
          }]);

        // Create specific task notifications based on options
        if (options?.grantPortalAccess) {
          await supabase
            .from('notifications')
            .insert([{
              user_id: lead.assigned_to,
              type: 'info',
              title: '🔐 Portal Access Required',
              message: `Grant portal access for ${lead.name} (${options.portalAccessMethod === 'send_invitation' ? 'Send invitation email' : options.portalAccessMethod === 'auto_create' ? 'Auto-create account' : 'Manual setup'})`,
              customer_id: customer.id,
              action_url: `/customers/${customer.id}`,
            }]);
        }

        if (options?.sendDocumentChecklist) {
          await supabase
            .from('notifications')
            .insert([{
              user_id: lead.assigned_to,
              type: 'info',
              title: '📄 Send Document Checklist',
              message: `Send document checklist to ${lead.name}${options.documentChecklistNotes ? `: ${options.documentChecklistNotes}` : ''}`,
              customer_id: customer.id,
              action_url: `/customers/${customer.id}`,
            }]);
        }

        if (options?.scheduleOnboardingCall) {
          await supabase
            .from('notifications')
            .insert([{
              user_id: lead.assigned_to,
              type: 'info',
              title: '📞 Schedule Onboarding Call',
              message: `Schedule onboarding call with ${lead.name}${options.onboardingCallDate ? ` for ${options.onboardingCallDate.toLocaleDateString()}` : ''}${options.onboardingCallNotes ? ` - ${options.onboardingCallNotes}` : ''}`,
              customer_id: customer.id,
              action_url: `/customers/${customer.id}`,
            }]);
        }
      }

      // 6. Add initial comment on customer for onboarding tracking
      if (lead.assigned_to && checklistItems.length > 0) {
        await supabase
          .from('comments')
          .insert([{
            customer_id: customer.id,
            comment: `📌 ONBOARDING CHECKLIST:\n${checklistItems.join('\n')}\n\nConverted from Lead #${lead.reference_number}`,
            created_by: lead.assigned_to,
          }]);
      }

      toast({
        title: 'Lead Converted Successfully! 🎉',
        description: 'Customer created. Onboarding notifications sent.',
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
    showDummyData,
    toggleDummyData,
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

  // Activity types that trigger auto-move to Propose stage
  const PROPOSE_TRIGGER_ACTIVITIES = ['replied', 'interested', 'asked_pricing'];

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
      
      // Update last_contacted_at on lead (except for notes)
      if (activityData.activity_type !== 'note') {
        await supabase
          .from('leads')
          .update({ last_contacted_at: new Date().toISOString() })
          .eq('id', leadId);
      }

      // Auto-move to Propose stage if trigger activity logged
      if (PROPOSE_TRIGGER_ACTIVITIES.includes(activityData.activity_type)) {
        await supabase
          .from('leads')
          .update({ status: 'proposal' })
          .eq('id', leadId);
        
        toast({
          title: 'Lead Moved to Propose',
          description: `Lead automatically moved to Propose stage based on "${activityData.activity_type}" activity`,
        });
      } else {
        toast({
          title: 'Success',
          description: 'Activity logged successfully',
        });
      }
      
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
