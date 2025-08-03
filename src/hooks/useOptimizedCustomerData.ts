import { useState, useEffect, useCallback, useRef } from 'react';
import { Customer } from '@/types/customer';
import { OptimizedCustomerService } from '@/services/optimizedCustomerService';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useToast } from '@/hooks/use-toast';
import { useDataConsistency } from '@/hooks/useDataConsistency';

export interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export const useOptimizedCustomerData = (pageSize: number = 50) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize,
    totalCount: 0,
    totalPages: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalCustomers: 0,
    completedApplications: 0,
    submittedApplications: 0,
    totalRevenue: 0
  });
  
  // Use a try-catch to handle auth context not being available
  let authData;
  try {
    authData = useAuth();
  } catch (error) {
    authData = { user: null, isAuthenticated: false, isAdmin: false };
  }
  
  const { user, isAuthenticated, isAdmin } = authData;
  const { toast } = useToast();
  
  // Ref to track if we're currently fetching to prevent duplicate requests
  const fetchingRef = useRef(false);
  
  // Data consistency hook for real-time updates and validation
  const { optimisticUpdate, validateDataConsistency, refreshData: consistencyRefresh } = useDataConsistency({
    onDataChange: () => {
      fetchCustomers(pagination.page, false, true);
      fetchDashboardStats(true);
    },
    userId: user?.id,
    isAdmin
  });

  const fetchCustomers = useCallback(async (
    page: number = 1, 
    includeDetails: boolean = false,
    forceRefresh: boolean = false
  ) => {
    if (!isAuthenticated || !user || fetchingRef.current) {
      console.log('Skipping fetch - not authenticated or already fetching');
      return;
    }
    
    if (forceRefresh) {
      OptimizedCustomerService.clearCache();
    }
    
    fetchingRef.current = true;
    setIsLoading(true);
    
    try {
      console.log('Fetching customers with optimization:', { page, includeDetails, isAdmin });
      
      const userId = isAdmin ? undefined : user.id;
      const result = await OptimizedCustomerService.fetchCustomersPaginated(
        page,
        pageSize,
        userId,
        includeDetails
      );
      
      setCustomers(result.customers);
      setPagination({
        page: result.page,
        pageSize: result.pageSize,
        totalCount: result.totalCount,
        totalPages: result.totalPages
      });
      
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch customers. Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [isAuthenticated, user, isAdmin, pageSize, toast]);

  const fetchDashboardStats = useCallback(async (forceRefresh: boolean = false) => {
    if (!isAuthenticated || !user) {
      return;
    }
    
    if (forceRefresh) {
      OptimizedCustomerService.clearCache();
    }
    
    try {
      const userId = isAdmin ? undefined : user.id;
      const stats = await OptimizedCustomerService.fetchDashboardStats(userId);
      setDashboardStats(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard statistics.",
        variant: "destructive",
      });
    }
  }, [isAuthenticated, user, isAdmin, toast]);

  const refreshData = useCallback(async () => {
    console.log('Refreshing optimized customer data...');
    await Promise.all([
      fetchCustomers(pagination.page, false, true),
      fetchDashboardStats(true)
    ]);
  }, [fetchCustomers, fetchDashboardStats, pagination.page]);

  const loadPage = useCallback(async (page: number) => {
    await fetchCustomers(page, false);
  }, [fetchCustomers]);

  const loadNextPage = useCallback(async () => {
    if (pagination.page < pagination.totalPages) {
      await loadPage(pagination.page + 1);
    }
  }, [pagination.page, pagination.totalPages, loadPage]);

  const loadPreviousPage = useCallback(async () => {
    if (pagination.page > 1) {
      await loadPage(pagination.page - 1);
    }
  }, [pagination.page, loadPage]);

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('Auth state changed, fetching optimized data...');
      fetchCustomers(1, false);
      fetchDashboardStats();
    } else {
      console.log('User not authenticated, clearing data');
      setCustomers([]);
      setDashboardStats({
        totalCustomers: 0,
        completedApplications: 0,
        submittedApplications: 0,
        totalRevenue: 0
      });
    }
  }, [isAuthenticated, user?.id]); // Removed fetchCustomers and fetchDashboardStats from deps to prevent infinite loops

  return {
    customers,
    setCustomers,
    pagination,
    isLoading,
    dashboardStats,
    refreshData,
    loadPage,
    loadNextPage,
    loadPreviousPage,
    hasNextPage: pagination.page < pagination.totalPages,
    hasPreviousPage: pagination.page > 1,
    optimisticUpdate,
    validateDataConsistency,
    consistencyRefresh
  };
};