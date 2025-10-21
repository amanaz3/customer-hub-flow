import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { activityTrackingService } from "@/services/activityTrackingService";
import { useToast } from "@/hooks/use-toast";
import { WeeklyActivity } from "@/types/arr";

export const useActivityTracking = (userId: string | undefined, month?: number, year?: number) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const weekStartDate = activityTrackingService.getWeekStartDate();

  const weeklyActivitiesQuery = useQuery({
    queryKey: ['weekly-activities', userId, weekStartDate],
    queryFn: async () => {
      if (!userId) return [];
      return activityTrackingService.getWeeklyActivities(userId, weekStartDate);
    },
    enabled: !!userId,
  });

  const monthlySummaryQuery = useQuery({
    queryKey: ['monthly-activity-summary', userId, month, year],
    queryFn: async () => {
      if (!userId || !month || !year) return null;
      return activityTrackingService.getMonthlyActivitySummary(userId, month, year);
    },
    enabled: !!userId && !!month && !!year,
  });

  const logActivityMutation = useMutation({
    mutationFn: ({
      activityType,
      data,
    }: {
      activityType: WeeklyActivity['activity_type'];
      data: {
        customer_id?: string;
        deal_id?: string;
        notes?: string;
      };
    }) => {
      if (!userId) throw new Error('User ID is required');
      return activityTrackingService.logActivity(userId, activityType, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-activities', userId] });
      queryClient.invalidateQueries({ queryKey: ['monthly-activity-summary', userId] });
      
      toast({
        title: "Activity Logged",
        description: "Activity has been recorded successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to log activity: ${error.message}`,
      });
    },
  });

  const getWeeklyProgress = (target: any) => {
    const activities = weeklyActivitiesQuery.data || [];
    
    const counts = {
      meetings: activities.filter(a => a.activity_type === 'meeting').length,
      checkins: activities.filter(a => a.activity_type === 'checkin').length,
      proposals: activities.filter(a => a.activity_type === 'proposal').length,
      closes: activities.filter(a => a.activity_type === 'close').length,
    };

    return {
      meetings: { current: counts.meetings, target: target?.target_meetings || 2 },
      checkins: { current: counts.checkins, target: target?.target_checkins || 5 },
      proposals: { current: counts.proposals, target: target?.target_proposals || 3 },
      closes: { current: counts.closes, target: target?.target_closes || 2 },
    };
  };

  return {
    weeklyActivities: weeklyActivitiesQuery.data || [],
    monthlySummary: monthlySummaryQuery.data,
    isLoading: weeklyActivitiesQuery.isLoading,
    logActivity: logActivityMutation.mutate,
    isLogging: logActivityMutation.isPending,
    getWeeklyProgress,
    refetch: () => {
      weeklyActivitiesQuery.refetch();
      monthlySummaryQuery.refetch();
    },
  };
};
