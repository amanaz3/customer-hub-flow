import { supabase } from "@/integrations/supabase/client";
import { MonthlyTarget, MonthlyPerformance } from "./targetService";

export interface QuarterlyTarget {
  target_applications: number;
  target_completed: number;
  target_revenue: number;
}

export interface AnnualTarget {
  target_applications: number;
  target_completed: number;
  target_revenue: number;
}

export interface UserTargetSummary {
  user_id: string;
  user_name: string;
  user_email: string;
  target_applications: number;
  target_completed: number;
  target_revenue: number;
  actual_applications: number;
  actual_completed: number;
  actual_revenue: number;
  completion_rate: number;
  progress_percentage: number;
}

export const targetManagementService = {
  // Quarterly targets (aggregates 3 months)
  async getQuarterlyTargets(userId: string, quarter: number, year: number): Promise<QuarterlyTarget> {
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = quarter * 3;

    const { data, error } = await supabase
      .from('monthly_targets')
      .select('target_applications, target_completed, target_revenue')
      .eq('user_id', userId)
      .eq('year', year)
      .gte('month', startMonth)
      .lte('month', endMonth);

    if (error) throw error;

    if (!data || data.length === 0) {
      return { target_applications: 0, target_completed: 0, target_revenue: 0 };
    }

    const aggregated = data.reduce(
      (acc, target) => ({
        target_applications: acc.target_applications + (Number(target.target_applications) || 0),
        target_completed: acc.target_completed + (Number(target.target_completed) || 0),
        target_revenue: acc.target_revenue + (Number(target.target_revenue) || 0),
      }),
      { target_applications: 0, target_completed: 0, target_revenue: 0 }
    );

    return aggregated;
  },

  async getQuarterlyPerformance(userId: string | null, quarter: number, year: number): Promise<MonthlyPerformance> {
    const { data, error } = await supabase.rpc('calculate_quarterly_performance', {
      p_user_id: userId,
      p_quarter: quarter,
      p_year: year,
    });

    if (error) throw error;
    return data[0] as MonthlyPerformance;
  },

  // Annual targets (aggregates all 12 months)
  async getAnnualTargets(userId: string, year: number): Promise<AnnualTarget> {
    const { data, error } = await supabase
      .from('monthly_targets')
      .select('target_applications, target_completed, target_revenue')
      .eq('user_id', userId)
      .eq('year', year);

    if (error) throw error;

    if (!data || data.length === 0) {
      return { target_applications: 0, target_completed: 0, target_revenue: 0 };
    }

    const aggregated = data.reduce(
      (acc, target) => ({
        target_applications: acc.target_applications + (Number(target.target_applications) || 0),
        target_completed: acc.target_completed + (Number(target.target_completed) || 0),
        target_revenue: acc.target_revenue + (Number(target.target_revenue) || 0),
      }),
      { target_applications: 0, target_completed: 0, target_revenue: 0 }
    );

    return aggregated;
  },

  async getAnnualPerformance(userId: string | null, year: number): Promise<MonthlyPerformance> {
    const { data, error } = await supabase.rpc('calculate_annual_performance', {
      p_user_id: userId,
      p_year: year,
    });

    if (error) throw error;
    return data[0] as MonthlyPerformance;
  },

  // Half-yearly targets (first or second half)
  async getHalfYearlyTargets(userId: string, half: number, year: number): Promise<QuarterlyTarget> {
    const startMonth = half === 1 ? 1 : 7;
    const endMonth = half === 1 ? 6 : 12;

    const { data, error } = await supabase
      .from('monthly_targets')
      .select('target_applications, target_completed, target_revenue')
      .eq('user_id', userId)
      .eq('year', year)
      .gte('month', startMonth)
      .lte('month', endMonth);

    if (error) throw error;

    if (!data || data.length === 0) {
      return { target_applications: 0, target_completed: 0, target_revenue: 0 };
    }

    const aggregated = data.reduce(
      (acc, target) => ({
        target_applications: acc.target_applications + (Number(target.target_applications) || 0),
        target_completed: acc.target_completed + (Number(target.target_completed) || 0),
        target_revenue: acc.target_revenue + (Number(target.target_revenue) || 0),
      }),
      { target_applications: 0, target_completed: 0, target_revenue: 0 }
    );

    return aggregated;
  },

  async getHalfYearlyPerformance(userId: string | null, half: number, year: number): Promise<MonthlyPerformance> {
    // Use quarterly function twice and combine
    const q1 = half === 1 ? 1 : 3;
    const q2 = half === 1 ? 2 : 4;

    const [perf1, perf2] = await Promise.all([
      this.getQuarterlyPerformance(userId, q1, year),
      this.getQuarterlyPerformance(userId, q2, year),
    ]);

    return {
      actual_applications: Number(perf1.actual_applications) + Number(perf2.actual_applications),
      actual_completed: Number(perf1.actual_completed) + Number(perf2.actual_completed),
      actual_revenue: Number(perf1.actual_revenue) + Number(perf2.actual_revenue),
      completion_rate: Number(perf1.actual_applications) + Number(perf2.actual_applications) > 0
        ? ((Number(perf1.actual_completed) + Number(perf2.actual_completed)) / 
           (Number(perf1.actual_applications) + Number(perf2.actual_applications))) * 100
        : 0,
    };
  },

  // Get all users' target summary for admin view
  async getAllUsersTargetSummary(
    period: 'monthly' | 'quarterly' | 'half-yearly' | 'annual',
    periodValue: number,
    year: number
  ): Promise<UserTargetSummary[]> {
    // Get all active users
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('is_active', true)
      .order('name');

    if (usersError) throw usersError;
    if (!users) return [];

    // Get targets and performance for each user
    const summaries = await Promise.all(
      users.map(async (user) => {
        let targets, performance;

        switch (period) {
          case 'monthly':
            const { data: monthlyTarget } = await supabase
              .from('monthly_targets')
              .select('target_applications, target_completed, target_revenue')
              .eq('user_id', user.id)
              .eq('month', periodValue)
              .eq('year', year)
              .maybeSingle();

            targets = monthlyTarget || { target_applications: 0, target_completed: 0, target_revenue: 0 };

            const { data: monthlyPerf } = await supabase.rpc('calculate_monthly_performance', {
              p_user_id: user.id,
              p_month: periodValue,
              p_year: year,
            });
            performance = monthlyPerf?.[0] || { actual_applications: 0, actual_completed: 0, actual_revenue: 0, completion_rate: 0 };
            break;

          case 'quarterly':
            targets = await this.getQuarterlyTargets(user.id, periodValue, year);
            performance = await this.getQuarterlyPerformance(user.id, periodValue, year);
            break;

          case 'half-yearly':
            targets = await this.getHalfYearlyTargets(user.id, periodValue, year);
            performance = await this.getHalfYearlyPerformance(user.id, periodValue, year);
            break;

          case 'annual':
            targets = await this.getAnnualTargets(user.id, year);
            performance = await this.getAnnualPerformance(user.id, year);
            break;
        }

        const progressPercentage = targets.target_applications > 0
          ? (Number(performance.actual_applications) / targets.target_applications) * 100
          : 0;

        return {
          user_id: user.id,
          user_name: user.name,
          user_email: user.email,
          target_applications: targets.target_applications,
          target_completed: targets.target_completed,
          target_revenue: targets.target_revenue,
          actual_applications: Number(performance.actual_applications),
          actual_completed: Number(performance.actual_completed),
          actual_revenue: Number(performance.actual_revenue),
          completion_rate: Number(performance.completion_rate),
          progress_percentage: progressPercentage,
        };
      })
    );

    return summaries;
  },

  // Bulk set targets for multiple users
  async bulkSetTargets(
    userIds: string[],
    month: number,
    year: number,
    targets: {
      target_applications: number;
      target_completed: number;
      target_revenue: number;
    }
  ) {
    const upserts = userIds.map((userId) => ({
      user_id: userId,
      month,
      year,
      ...targets,
    }));

    const { error } = await supabase
      .from('monthly_targets')
      .upsert(upserts, { onConflict: 'user_id,month,year' });

    if (error) throw error;
  },
};
