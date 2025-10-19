import { supabase } from "@/integrations/supabase/client";

export interface MonthlyTarget {
  id: string;
  user_id: string;
  month: number;
  year: number;
  target_applications: number;
  target_completed: number;
  target_revenue: number;
  created_at: string;
  updated_at: string;
}

export interface MonthlyPerformance {
  actual_applications: number;
  actual_completed: number;
  actual_revenue: number;
  completion_rate: number;
}

export const targetService = {
  async getMonthlyTarget(userId: string, month: number, year: number) {
    const { data, error } = await supabase
      .from('monthly_targets')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle();

    if (error) throw error;
    return data as MonthlyTarget | null;
  },

  async getAllUserTargets(userId: string, year: number) {
    const { data, error } = await supabase
      .from('monthly_targets')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)
      .order('month', { ascending: true });

    if (error) throw error;
    return data as MonthlyTarget[];
  },

  async setMonthlyTarget(
    userId: string,
    month: number,
    year: number,
    targets: {
      target_applications: number;
      target_revenue: number;
      target_completed?: number;
    }
  ) {
    const { data, error } = await supabase
      .from('monthly_targets')
      .upsert(
        {
          user_id: userId,
          month,
          year,
          target_applications: targets.target_applications,
          target_revenue: targets.target_revenue,
          // Set target_completed equal to target_applications by default
          // This ensures database integrity while UI calculates completion rate differently
          target_completed: targets.target_applications,
        },
        { onConflict: 'user_id,month,year' }
      )
      .select()
      .single();

    if (error) throw error;
    return data as MonthlyTarget;
  },

  async calculateMonthlyPerformance(userId: string, month: number, year: number) {
    const { data, error } = await supabase.rpc('calculate_monthly_performance', {
      p_user_id: userId,
      p_month: month,
      p_year: year,
    });

    if (error) throw error;
    return data[0] as MonthlyPerformance;
  },

  async getAllUsersTargets(month: number, year: number) {
    const { data, error } = await supabase
      .from('monthly_targets')
      .select('*, profiles(name, email)')
      .eq('month', month)
      .eq('year', year);

    if (error) throw error;
    return data;
  },

  async getAggregatedTargets(month: number, year: number) {
    const { data, error } = await supabase
      .from('monthly_targets')
      .select('target_applications, target_revenue, target_completed')
      .eq('month', month)
      .eq('year', year);

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        target_applications: 0,
        target_revenue: 0,
        target_completed: 0,
      };
    }

    // Aggregate all users' targets
    const aggregated = data.reduce(
      (acc, target) => ({
        target_applications: acc.target_applications + (target.target_applications || 0),
        target_revenue: acc.target_revenue + (target.target_revenue || 0),
        target_completed: acc.target_completed + (target.target_completed || 0),
      }),
      { target_applications: 0, target_revenue: 0, target_completed: 0 }
    );

    return aggregated;
  },

  async getAggregatedPerformance(month: number, year: number) {
    // Get performance for all users by passing NULL as user_id
    const { data, error } = await supabase.rpc('calculate_monthly_performance', {
      p_user_id: null,
      p_month: month,
      p_year: year,
    });

    if (error) throw error;
    return data[0] as MonthlyPerformance;
  },
};
