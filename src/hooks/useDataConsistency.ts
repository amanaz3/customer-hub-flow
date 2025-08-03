import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { OptimizedCustomerService } from '@/services/optimizedCustomerService';
import { useToast } from '@/hooks/use-toast';

interface DataConsistencyHookProps {
  onDataChange?: () => void;
  userId?: string;
  isAdmin?: boolean;
}

export const useDataConsistency = ({ 
  onDataChange, 
  userId, 
  isAdmin 
}: DataConsistencyHookProps) => {
  const { toast } = useToast();
  const subscriptionsRef = useRef<any[]>([]);
  const lastUpdateRef = useRef<number>(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced data refresh to prevent excessive updates
  const debouncedRefresh = useCallback(() => {
    const now = Date.now();
    
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce to prevent rapid-fire updates
    debounceTimeoutRef.current = setTimeout(() => {
      // Only refresh if enough time has passed since last update
      if (now - lastUpdateRef.current > 1000) {
        lastUpdateRef.current = now;
        OptimizedCustomerService.clearCache();
        onDataChange?.();
      }
    }, 500);
  }, [onDataChange]);

  // Handle real-time updates with conflict resolution
  const handleRealtimeUpdate = useCallback((payload: any) => {
    console.log('Real-time update received:', payload);
    
    // Clear relevant cache based on the change
    if (payload.table === 'customers') {
      OptimizedCustomerService.clearCache(`customer_${payload.new?.id || payload.old?.id}`);
      OptimizedCustomerService.clearCache(); // Clear pagination cache
    }
    
    // Show notification for critical updates
    if (payload.eventType === 'UPDATE' && payload.table === 'customers') {
      const oldStatus = payload.old?.status;
      const newStatus = payload.new?.status;
      
      if (oldStatus !== newStatus && newStatus) {
        toast({
          title: "Application Status Updated",
          description: `Application status changed from ${oldStatus} to ${newStatus}`,
          variant: "default",
        });
      }
    }
    
    debouncedRefresh();
  }, [debouncedRefresh, toast]);

  // Setup real-time subscriptions for data consistency
  useEffect(() => {
    // Clean up existing subscriptions
    subscriptionsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    subscriptionsRef.current = [];

    if (!userId) return;

    // Create subscriptions for relevant tables
    const tablesToWatch = ['customers', 'documents', 'status_changes', 'comments'];
    
    tablesToWatch.forEach(table => {
      const channelName = `data-consistency-${table}-${Math.random().toString(36).substring(7)}`;
      const channel = supabase.channel(channelName);
      
      // Subscribe to all changes on the table
      channel
        .on(
          'postgres_changes' as any,
          {
            event: '*',
            schema: 'public',
            table
          },
          (payload) => {
            // Filter updates based on user permissions
            if (isAdmin) {
              // Admin sees all updates
              handleRealtimeUpdate({ ...payload, table });
            } else {
              // Regular user only sees their own data updates
              const newRecord = payload.new as any;
              const oldRecord = payload.old as any;
              const recordUserId = newRecord?.user_id || oldRecord?.user_id;
              if (recordUserId === userId || table !== 'customers') {
                handleRealtimeUpdate({ ...payload, table });
              }
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to ${table} changes for data consistency`);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Error subscribing to ${table} changes`);
          }
        });

      subscriptionsRef.current.push(channel);
    });

    return () => {
      subscriptionsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      subscriptionsRef.current = [];
      
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [userId, isAdmin, handleRealtimeUpdate]);

  // Optimistic update helper
  const optimisticUpdate = useCallback(async <T>(
    updateFn: () => Promise<T>,
    rollbackFn?: () => void,
    optimisticChangeFn?: () => void
  ): Promise<T> => {
    try {
      // Apply optimistic change immediately
      optimisticChangeFn?.();
      
      // Perform actual update
      const result = await updateFn();
      
      // Clear cache to ensure fresh data
      OptimizedCustomerService.clearCache();
      
      return result;
    } catch (error) {
      // Rollback optimistic change on error
      rollbackFn?.();
      
      console.error('Optimistic update failed:', error);
      toast({
        title: "Update Failed",
        description: "The change could not be saved. Please try again.",
        variant: "destructive",
      });
      
      throw error;
    }
  }, [toast]);

  // Data validation helper
  const validateDataConsistency = useCallback(async (customerId: string) => {
    try {
      const customer = await OptimizedCustomerService.fetchCustomerById(customerId);
      
      // Check for common consistency issues
      const issues: string[] = [];
      
      // Check if mandatory documents are missing for non-draft status
      if (customer.status !== 'Draft') {
        const mandatoryDocs = customer.documents?.filter(doc => doc.is_mandatory) || [];
        const missingDocs = mandatoryDocs.filter(doc => !doc.is_uploaded);
        
        if (missingDocs.length > 0) {
          issues.push(`Missing mandatory documents: ${missingDocs.map(d => d.name).join(', ')}`);
        }
      }
      
      // Check for status transition validity
      if (customer.statusHistory && customer.statusHistory.length > 0) {
        const latestStatus = customer.statusHistory[0]?.new_status;
        if (latestStatus && latestStatus !== customer.status) {
          issues.push('Status history does not match current status');
        }
      }
      
      // Return validation results
      return {
        isValid: issues.length === 0,
        issues
      };
    } catch (error) {
      console.error('Data validation failed:', error);
      return {
        isValid: false,
        issues: ['Failed to validate data consistency']
      };
    }
  }, []);

  return {
    optimisticUpdate,
    validateDataConsistency,
    refreshData: debouncedRefresh
  };
};