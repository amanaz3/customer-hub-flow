import { useQuery } from "@tanstack/react-query";
import { targetManagementService, UserTargetSummary } from "@/services/targetManagementService";

export const useTargetManagement = (
  period: 'monthly' | 'quarterly' | 'half-yearly' | 'annual',
  periodValue: number,
  year: number
) => {
  const { data, isLoading, error, refetch } = useQuery<UserTargetSummary[]>({
    queryKey: ['target-management', period, periodValue, year],
    queryFn: () => targetManagementService.getAllUsersTargetSummary(period, periodValue, year),
    staleTime: 30000, // 30 seconds
  });

  return {
    data: data || [],
    isLoading,
    error,
    refetch,
  };
};
