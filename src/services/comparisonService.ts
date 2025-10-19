import { supabase } from "@/integrations/supabase/client";

export interface MonthData {
  month: number;
  year: number;
  applications: number;
  completed: number;
  revenue: number;
  completionRate: number;
}

export interface ComparisonData {
  current: MonthData;
  previous: MonthData;
  changes: {
    applications: number;
    applicationsPercent: number;
    completed: number;
    completedPercent: number;
    revenue: number;
    revenuePercent: number;
    completionRate: number;
    completionRatePercent: number;
  };
}

export const comparisonService = {
  async getMonthlyData(userId: string | null, month: number, year: number): Promise<MonthData> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    let query = supabase
      .from('customers')
      .select('id, status, amount')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const applications = data?.length || 0;
    const completed = data?.filter(c => c.status === 'Complete' || c.status === 'Paid').length || 0;
    const revenue = data
      ?.filter(c => c.status === 'Complete' || c.status === 'Paid')
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0) || 0;
    const completionRate = applications > 0 ? (completed / applications) * 100 : 0;

    return {
      month,
      year,
      applications,
      completed,
      revenue,
      completionRate,
    };
  },

  async getComparisonData(userId: string | null, currentMonth: number, currentYear: number): Promise<ComparisonData> {
    const current = await this.getMonthlyData(userId, currentMonth, currentYear);
    
    // Calculate previous month
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear--;
    }

    const previous = await this.getMonthlyData(userId, prevMonth, prevYear);

    const calculateChange = (current: number, previous: number) => {
      const change = current - previous;
      const percent = previous > 0 ? (change / previous) * 100 : current > 0 ? 100 : 0;
      return { change, percent };
    };

    const applicationsChange = calculateChange(current.applications, previous.applications);
    const completedChange = calculateChange(current.completed, previous.completed);
    const revenueChange = calculateChange(current.revenue, previous.revenue);
    const completionRateChange = calculateChange(current.completionRate, previous.completionRate);

    return {
      current,
      previous,
      changes: {
        applications: applicationsChange.change,
        applicationsPercent: applicationsChange.percent,
        completed: completedChange.change,
        completedPercent: completedChange.percent,
        revenue: revenueChange.change,
        revenuePercent: revenueChange.percent,
        completionRate: completionRateChange.change,
        completionRatePercent: completionRateChange.percent,
      },
    };
  },

  async getTrendData(userId: string | null, months: number = 6): Promise<MonthData[]> {
    const currentDate = new Date();
    const trendData: MonthData[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const data = await this.getMonthlyData(userId, month, year);
      trendData.push(data);
    }

    return trendData;
  },
};
