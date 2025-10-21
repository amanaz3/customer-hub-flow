import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dealManagementService } from "@/services/dealManagementService";
import { useToast } from "@/hooks/use-toast";
import { Deal } from "@/types/arr";

export const usePipelineManagement = (userId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const dealsQuery = useQuery({
    queryKey: ['deals', userId],
    queryFn: async () => {
      if (!userId) return [];
      return dealManagementService.getDealsForUser(userId);
    },
    enabled: !!userId,
  });

  const pipelineValueQuery = useQuery({
    queryKey: ['pipeline-value', userId],
    queryFn: async () => {
      if (!userId) return 0;
      return dealManagementService.getPipelineValue(userId);
    },
    enabled: !!userId,
  });

  const dealsByStageQuery = useQuery({
    queryKey: ['deals-by-stage', userId],
    queryFn: async () => {
      if (!userId) return {};
      return dealManagementService.getDealsByStage(userId);
    },
    enabled: !!userId,
  });

  const createDealMutation = useMutation({
    mutationFn: dealManagementService.createDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals', userId] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-value', userId] });
      queryClient.invalidateQueries({ queryKey: ['deals-by-stage', userId] });
      
      toast({
        title: "Deal Created",
        description: "New deal has been added to the pipeline.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create deal: ${error.message}`,
      });
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ dealId, newStage }: { dealId: string; newStage: Deal['deal_stage'] }) =>
      dealManagementService.updateDealStage(dealId, newStage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals', userId] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-value', userId] });
      queryClient.invalidateQueries({ queryKey: ['deals-by-stage', userId] });
      
      toast({
        title: "Deal Updated",
        description: "Deal stage has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update deal: ${error.message}`,
      });
    },
  });

  const closeDealMutation = useMutation({
    mutationFn: ({ dealId, won, notes }: { dealId: string; won: boolean; notes?: string }) =>
      dealManagementService.closeDeal(dealId, won, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals', userId] });
      queryClient.invalidateQueries({ queryKey: ['pipeline-value', userId] });
      queryClient.invalidateQueries({ queryKey: ['deals-by-stage', userId] });
      queryClient.invalidateQueries({ queryKey: ['arr-performance', userId] });
    },
  });

  return {
    deals: dealsQuery.data || [],
    dealsByStage: dealsByStageQuery.data || {},
    pipelineValue: pipelineValueQuery.data || 0,
    isLoading: dealsQuery.isLoading,
    createDeal: createDealMutation.mutate,
    updateStage: updateStageMutation.mutate,
    closeDeal: closeDealMutation.mutate,
    refetch: () => {
      dealsQuery.refetch();
      pipelineValueQuery.refetch();
      dealsByStageQuery.refetch();
    },
  };
};
