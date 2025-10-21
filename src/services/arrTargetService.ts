import { supabase } from "@/integrations/supabase/client";
import { ARRTarget, ARRPerformance } from "@/types/arr";

export const arrTargetService = {
  async getMonthlyARRTarget(userId: string, month: number, year: number): Promise<ARRTarget | null> {
    const { data, error } = await supabase
      .from('arr_targets')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async setMonthlyARRTarget(
    userId: string,
    month: number,
    year: number,
    targets: {
      target_new_arr: number;
      target_upsell_arr: number;
      target_total_arr: number;
      target_new_clients: number;
      target_upsell_deals: number;
      target_meetings?: number;
      target_checkins?: number;
      target_proposals?: number;
      target_closes?: number;
    }
  ): Promise<ARRTarget> {
    const { data, error } = await supabase
      .from('arr_targets')
      .upsert(
        {
          user_id: userId,
          month,
          year,
          ...targets,
        },
        { onConflict: 'user_id,month,year' }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getARRPerformance(userId: string, month: number, year: number): Promise<ARRPerformance> {
    const { data, error } = await supabase.rpc('calculate_arr_performance', {
      p_user_id: userId,
      p_month: month,
      p_year: year,
    });

    if (error) throw error;
    return data[0] as ARRPerformance;
  },

  async getAllUsersARRTargets(month: number, year: number) {
    const { data, error } = await supabase
      .from('arr_targets')
      .select('*, profiles(name, email)')
      .eq('month', month)
      .eq('year', year);

    if (error) throw error;
    return data;
  },

  async bulkSetARRTargets(
    userIds: string[],
    month: number,
    year: number,
    targets: {
      target_new_arr: number;
      target_upsell_arr: number;
      target_total_arr: number;
      target_new_clients: number;
      target_upsell_deals: number;
      target_meetings?: number;
      target_checkins?: number;
      target_proposals?: number;
      target_closes?: number;
    }
  ) {
    const records = userIds.map(userId => ({
      user_id: userId,
      month,
      year,
      ...targets,
    }));

    const { data, error } = await supabase
      .from('arr_targets')
      .upsert(records, { onConflict: 'user_id,month,year' })
      .select();

    if (error) throw error;
    return data;
  },

  async getQuarterlyARRSummary(userId: string, quarter: number, year: number) {
    const startMonth = (quarter - 1) * 3 + 1;
    const months = [startMonth, startMonth + 1, startMonth + 2];

    const targetPromises = months.map(month => 
      this.getMonthlyARRTarget(userId, month, year)
    );
    const performancePromises = months.map(month =>
      this.getARRPerformance(userId, month, year)
    );

    const [targets, performances] = await Promise.all([
      Promise.all(targetPromises),
      Promise.all(performancePromises),
    ]);

    return {
      targets: targets.filter(Boolean),
      performances,
      totalTarget: targets.reduce((sum, t) => sum + (t?.target_total_arr || 0), 0),
      totalActual: performances.reduce((sum, p) => sum + p.actual_total_arr, 0),
    };
  },
};
