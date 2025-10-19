import { useQuery } from "@tanstack/react-query";
import { comparisonService } from "@/services/comparisonService";

export const useMonthComparison = (userId: string | null, currentMonth: number, currentYear: number) => {
  const comparisonQuery = useQuery({
    queryKey: ['month-comparison', userId, currentMonth, currentYear],
    queryFn: () => comparisonService.getComparisonData(userId, currentMonth, currentYear),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const trendQuery = useQuery({
    queryKey: ['trend-data', userId, 6],
    queryFn: () => comparisonService.getTrendData(userId, 6),
    staleTime: 5 * 60 * 1000,
  });

  return {
    comparison: comparisonQuery.data,
    trend: trendQuery.data,
    isLoading: comparisonQuery.isLoading || trendQuery.isLoading,
    error: comparisonQuery.error || trendQuery.error,
    refetch: () => {
      comparisonQuery.refetch();
      trendQuery.refetch();
    },
  };
};
