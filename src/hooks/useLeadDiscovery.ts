import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Industry {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DiscoverySession {
  id: string;
  industry_id: string;
  product_id: string | null;
  session_name: string;
  uploaded_file_name: string | null;
  uploaded_file_path: string | null;
  original_data: any;
  final_result: any;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  created_by: string | null;
  created_at: string;
  updated_at: string;
  industry?: Industry;
  product?: { id: string; name: string };
}

export interface SavedPrompt {
  id: string;
  name: string;
  prompt_text: string;
  prompt_type: 'filter' | 'curate' | 'transform' | 'apply' | 'custom';
  description: string | null;
  is_template: boolean;
  created_by: string | null;
  created_at: string;
}

export interface PromptResult {
  id: string;
  session_id: string;
  prompt_id: string | null;
  step_order: number;
  prompt_text: string;
  input_data: any;
  output_data: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error_message: string | null;
  execution_time_ms: number | null;
  created_at: string;
}

export const useLeadDiscovery = () => {
  const queryClient = useQueryClient();

  // Fetch industries
  const { data: industries = [], isLoading: industriesLoading } = useQuery({
    queryKey: ['lead-discovery-industries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_discovery_industries')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Industry[];
    }
  });

  // Fetch sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['lead-discovery-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_discovery_sessions')
        .select(`
          *,
          industry:lead_discovery_industries(id, name),
          product:products(id, name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DiscoverySession[];
    }
  });

  // Fetch saved prompts
  const { data: savedPrompts = [], isLoading: promptsLoading } = useQuery({
    queryKey: ['lead-discovery-prompts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_discovery_prompts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SavedPrompt[];
    }
  });

  // Fetch products for selection
  const { data: products = [] } = useQuery({
    queryKey: ['products-for-discovery'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Create industry
  const createIndustry = useMutation({
    mutationFn: async (industry: { name: string; description?: string }) => {
      const { data, error } = await supabase
        .from('lead_discovery_industries')
        .insert(industry)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-discovery-industries'] });
      toast.success('Industry created');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create industry');
    }
  });

  // Create session
  const createSession = useMutation({
    mutationFn: async (session: {
      industry_id: string;
      session_name: string;
      product_id?: string;
      original_data?: any;
      uploaded_file_name?: string;
      uploaded_file_path?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('lead_discovery_sessions')
        .insert({
          ...session,
          created_by: userData.user?.id
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-discovery-sessions'] });
      toast.success('Session created');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create session');
    }
  });

  // Update session
  const updateSession = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DiscoverySession> & { id: string }) => {
      const { data, error } = await supabase
        .from('lead_discovery_sessions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-discovery-sessions'] });
    }
  });

  // Delete session (and all related prompt results)
  const deleteSession = useMutation({
    mutationFn: async (sessionId: string) => {
      // First delete all prompt results for this session
      const { error: resultsError } = await supabase
        .from('lead_discovery_prompt_results')
        .delete()
        .eq('session_id', sessionId);
      if (resultsError) throw resultsError;

      // Then delete the session
      const { error } = await supabase
        .from('lead_discovery_sessions')
        .delete()
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-discovery-sessions'] });
      toast.success('Session deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete session');
    }
  });

  // Save prompt
  const savePrompt = useMutation({
    mutationFn: async (prompt: {
      name: string;
      prompt_text: string;
      prompt_type: 'filter' | 'curate' | 'transform' | 'apply' | 'custom';
      description?: string;
      is_template?: boolean;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('lead_discovery_prompts')
        .insert({
          ...prompt,
          created_by: userData.user?.id
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-discovery-prompts'] });
      toast.success('Prompt saved');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save prompt');
    }
  });

  // Fetch prompt results for a session
  const fetchSessionResults = async (sessionId: string): Promise<PromptResult[]> => {
    const { data, error } = await supabase
      .from('lead_discovery_prompt_results')
      .select('*')
      .eq('session_id', sessionId)
      .order('step_order');
    if (error) throw error;
    return data as PromptResult[];
  };

  // Add prompt result
  const addPromptResult = useMutation({
    mutationFn: async (result: {
      session_id: string;
      prompt_id?: string;
      step_order: number;
      prompt_text: string;
      input_data: any;
      output_data?: any;
      status?: 'pending' | 'running' | 'completed' | 'failed';
    }) => {
      const { data, error } = await supabase
        .from('lead_discovery_prompt_results')
        .insert(result)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  });

  // Update prompt result
  const updatePromptResult = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PromptResult> & { id: string }) => {
      const { data, error } = await supabase
        .from('lead_discovery_prompt_results')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  });

  return {
    industries,
    sessions,
    savedPrompts,
    products,
    industriesLoading,
    sessionsLoading,
    promptsLoading,
    createIndustry,
    createSession,
    updateSession,
    deleteSession,
    savePrompt,
    fetchSessionResults,
    addPromptResult,
    updatePromptResult
  };
};
