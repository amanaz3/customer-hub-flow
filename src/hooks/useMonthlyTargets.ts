import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { targetService } from "@/services/targetService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/SecureAuthContext";

export const useMonthlyTargets = (userId: string | undefined, month: number, year: number) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Check if current user is admin
  const isAdmin = user?.user_metadata?.role === 'admin';

  const targetQuery = useQuery({
    queryKey: ['monthly-target', userId, month, year, isAdmin],
    queryFn: async () => {
      if (!userId) return null;
      
      // If admin, get aggregated targets from all users
      if (isAdmin) {
        const aggregated = await targetService.getAggregatedTargets(month, year);
        return {
          id: 'aggregated',
          user_id: userId,
          month: month,
          year: year,
          target_applications: aggregated.target_applications,
          target_revenue: aggregated.target_revenue,
          target_completed: aggregated.target_completed,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      
      return targetService.getMonthlyTarget(userId, month, year);
    },
    enabled: !!userId,
  });

  const performanceQuery = useQuery({
    queryKey: ['monthly-performance', userId, month, year, isAdmin],
    queryFn: async () => {
      if (!userId) return null;
      
      // If admin, get aggregated performance from all users
      if (isAdmin) {
        return targetService.getAggregatedPerformance(month, year);
      }
      
      return targetService.calculateMonthlyPerformance(userId, month, year);
    },
    enabled: !!userId,
  });

  const setTargetMutation = useMutation({
    mutationFn: (targets: {
      target_applications: number;
      target_revenue: number;
    }) => {
      if (!userId) throw new Error('User ID is required');
      return targetService.setMonthlyTarget(userId, month, year, targets);
    },
    onSuccess: () => {
      // Invalidate current user's queries
      queryClient.invalidateQueries({ queryKey: ['monthly-target', userId, month, year, isAdmin] });
      queryClient.invalidateQueries({ queryKey: ['monthly-performance', userId, month, year, isAdmin] });
      
      // If admin, also invalidate aggregated queries since they affect all users
      if (isAdmin) {
        queryClient.invalidateQueries({ queryKey: ['monthly-target'] });
        queryClient.invalidateQueries({ queryKey: ['monthly-performance'] });
      }
      
      toast({
        title: "Target Updated",
        description: "Monthly targets have been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update targets: ${error.message}`,
      });
    },
  });

  const calculateProgress = () => {
    const target = targetQuery.data;
    const performance = performanceQuery.data;

    if (!target || !performance) {
      return {
        applicationsProgress: 0,
        completedProgress: 0,
        revenueProgress: 0,
        applicationsStatus: 'gray' as const,
        completedStatus: 'gray' as const,
        revenueStatus: 'gray' as const,
      };
    }

    const calcProgress = (actual: number, target: number) => 
      target > 0 ? Math.min((actual / target) * 100, 100) : 0;

    const getStatus = (progress: number) => {
      if (progress >= 80) return 'green' as const;
      if (progress >= 50) return 'yellow' as const;
      return 'red' as const;
    };

    const applicationsProgress = calcProgress(performance.actual_applications, target.target_applications);
    // Calculate completion progress as percentage of target applications that are completed
    const completedProgress = calcProgress(performance.actual_completed, target.target_applications);
    const revenueProgress = calcProgress(Number(performance.actual_revenue), target.target_revenue);

    return {
      applicationsProgress,
      completedProgress,
      revenueProgress,
      applicationsStatus: getStatus(applicationsProgress),
      completedStatus: getStatus(completedProgress),
      revenueStatus: getStatus(revenueProgress),
    };
  };

  return {
    target: targetQuery.data,
    performance: performanceQuery.data,
    isLoading: targetQuery.isLoading || performanceQuery.isLoading,
    error: targetQuery.error || performanceQuery.error,
    setTarget: setTargetMutation.mutate,
    isSettingTarget: setTargetMutation.isPending,
    progress: calculateProgress(),
    refetch: () => {
      targetQuery.refetch();
      performanceQuery.refetch();
    },
  };
};
