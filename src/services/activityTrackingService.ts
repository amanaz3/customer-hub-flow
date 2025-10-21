import { supabase } from "@/integrations/supabase/client";
import { WeeklyActivity } from "@/types/arr";

export const activityTrackingService = {
  async logActivity(
    userId: string,
    activityType: WeeklyActivity['activity_type'],
    data: {
      customer_id?: string;
      deal_id?: string;
      notes?: string;
    }
  ): Promise<WeeklyActivity> {
    // Get the start of the current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);

    const { data: activity, error } = await supabase
      .from('weekly_activities')
      .insert({
        user_id: userId,
        week_start_date: weekStart.toISOString().split('T')[0],
        activity_type: activityType,
        ...data,
      })
      .select()
      .single();

    if (error) throw error;
    return activity as WeeklyActivity;
  },

  async getWeeklyActivities(userId: string, weekStartDate: string): Promise<WeeklyActivity[]> {
    const { data, error } = await supabase
      .from('weekly_activities')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start_date', weekStartDate)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as WeeklyActivity[];
  },

  async getMonthlyActivitySummary(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const { data, error } = await supabase
      .from('weekly_activities')
      .select('activity_type')
      .eq('user_id', userId)
      .gte('week_start_date', startDate.toISOString().split('T')[0])
      .lte('week_start_date', endDate.toISOString().split('T')[0]);

    if (error) throw error;

    const summary = {
      meetings: 0,
      checkins: 0,
      proposals: 0,
      closes: 0,
    };

    data?.forEach(activity => {
      if (activity.activity_type === 'meeting') summary.meetings++;
      if (activity.activity_type === 'checkin') summary.checkins++;
      if (activity.activity_type === 'proposal') summary.proposals++;
      if (activity.activity_type === 'close') summary.closes++;
    });

    return summary;
  },

  getWeekStartDate(date: Date = new Date()): string {
    const dayOfWeek = date.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart.toISOString().split('T')[0];
  },
};
