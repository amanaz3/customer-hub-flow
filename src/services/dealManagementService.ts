import { supabase } from "@/integrations/supabase/client";
import { Deal } from "@/types/arr";

export const dealManagementService = {
  async createDeal(dealData: {
    customer_id: string;
    deal_type: 'new_client' | 'upsell';
    services: string[];
    arr_value: number;
    expected_close_date?: string;
    probability?: number;
    assigned_user_id: string;
    notes?: string;
  }): Promise<Deal> {
    const { data, error } = await supabase
      .from('deals')
      .insert({
        ...dealData,
        deal_stage: 'prospect',
      })
      .select()
      .single();

    if (error) throw error;
    return data as Deal;
  },

  async updateDealStage(dealId: string, newStage: Deal['deal_stage']): Promise<Deal> {
    const updateData: any = { deal_stage: newStage };
    
    // If won or lost, set actual close date
    if (newStage === 'won' || newStage === 'lost') {
      updateData.actual_close_date = new Date().toISOString().split('T')[0];
    }

    const { data, error } = await supabase
      .from('deals')
      .update(updateData)
      .eq('id', dealId)
      .select()
      .single();

    if (error) throw error;
    return data as Deal;
  },

  async updateDeal(dealId: string, updates: Partial<Deal>): Promise<Deal> {
    const { data, error } = await supabase
      .from('deals')
      .update(updates)
      .eq('id', dealId)
      .select()
      .single();

    if (error) throw error;
    return data as Deal;
  },

  async getDealsForUser(
    userId: string,
    filters?: {
      stage?: Deal['deal_stage'];
      type?: Deal['deal_type'];
    }
  ): Promise<Deal[]> {
    let query = supabase
      .from('deals')
      .select('*')
      .eq('assigned_user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.stage) {
      query = query.eq('deal_stage', filters.stage);
    }

    if (filters?.type) {
      query = query.eq('deal_type', filters.type);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as Deal[];
  },

  async getPipelineValue(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('deals')
      .select('arr_value, probability')
      .eq('assigned_user_id', userId)
      .not('deal_stage', 'in', '(won,lost)');

    if (error) throw error;

    return data.reduce((sum, deal) => {
      return sum + (Number(deal.arr_value) * deal.probability / 100);
    }, 0);
  },

  async closeDeal(dealId: string, won: boolean, notes?: string): Promise<Deal> {
    const stage = won ? 'won' : 'lost';
    
    const { data, error } = await supabase
      .from('deals')
      .update({
        deal_stage: stage,
        actual_close_date: new Date().toISOString().split('T')[0],
        notes: notes || undefined,
      })
      .eq('id', dealId)
      .select()
      .single();

    if (error) throw error;
    return data as Deal;
  },

  async getDealsByStage(userId: string): Promise<Record<string, Deal[]>> {
    const deals = await this.getDealsForUser(userId);
    
    return deals.reduce((acc, deal) => {
      if (!acc[deal.deal_stage]) {
        acc[deal.deal_stage] = [];
      }
      acc[deal.deal_stage].push(deal);
      return acc;
    }, {} as Record<string, Deal[]>);
  },
};
