import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { arrTargetService } from "@/services/arrTargetService";
import { useToast } from "@/hooks/use-toast";
import { ARRProgress } from "@/types/arr";

export const useARRTargets = (userId: string | undefined, month: number, year: number) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const targetQuery = useQuery({
    queryKey: ['arr-target', userId, month, year],
    queryFn: async () => {
      if (!userId) return null;
      return arrTargetService.getMonthlyARRTarget(userId, month, year);
    },
    enabled: !!userId,
  });

  const performanceQuery = useQuery({
    queryKey: ['arr-performance', userId, month, year],
    queryFn: async () => {
      if (!userId) return null;
      return arrTargetService.getARRPerformance(userId, month, year);
    },
    enabled: !!userId,
  });

  const setTargetMutation = useMutation({
    mutationFn: (targets: {
      target_new_arr: number;
      target_upsell_arr: number;
      target_total_arr: number;
      target_new_clients: number;
      target_upsell_deals: number;
      target_meetings?: number;
      target_checkins?: number;
      target_proposals?: number;
      target_closes?: number;
    }) => {
      if (!userId) throw new Error('User ID is required');
      return arrTargetService.setMonthlyARRTarget(userId, month, year, targets);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arr-target', userId, month, year] });
      queryClient.invalidateQueries({ queryKey: ['arr-performance', userId, month, year] });
      
      toast({
        title: "ARR Target Updated",
        description: "Monthly ARR targets have been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update ARR targets: ${error.message}`,
      });
    },
  });

  const calculateProgress = (): ARRProgress => {
    const target = targetQuery.data;
    const performance = performanceQuery.data;

    if (!target || !performance) {
      return {
        newARRProgress: 0,
        upsellARRProgress: 0,
        totalARRProgress: 0,
        newARRStatus: 'gray',
        upsellARRStatus: 'gray',
        totalARRStatus: 'gray',
      };
    }

    const calcProgress = (actual: number, targetValue: number) => 
      targetValue > 0 ? Math.min((actual / targetValue) * 100, 100) : 0;

    const getStatus = (progress: number): 'green' | 'yellow' | 'red' | 'gray' => {
      if (progress >= 80) return 'green';
      if (progress >= 50) return 'yellow';
      return 'red';
    };

    const newARRProgress = calcProgress(performance.actual_new_arr, target.target_new_arr);
    const upsellARRProgress = calcProgress(performance.actual_upsell_arr, target.target_upsell_arr);
    const totalARRProgress = calcProgress(performance.actual_total_arr, target.target_total_arr);

    return {
      newARRProgress,
      upsellARRProgress,
      totalARRProgress,
      newARRStatus: getStatus(newARRProgress),
      upsellARRStatus: getStatus(upsellARRProgress),
      totalARRStatus: getStatus(totalARRProgress),
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
