import { useState, useCallback } from 'react';
import { OptimizedCustomerService } from '@/services/optimizedCustomerService';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useToast } from '@/hooks/use-toast';

export const useBulkReassignment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const reassignCustomers = useCallback(async (
    customerIds: string[],
    newUserId: string,
    reason: string
  ) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    
    try {
      const result = await OptimizedCustomerService.reassignCustomers(
        customerIds,
        newUserId,
        reason,
        user.id
      );

      toast({
        title: "Bulk Reassignment Successful",
        description: `Successfully reassigned ${result.count} application(s).`,
      });

      return result;
    } catch (error) {
      console.error('Error in bulk reassignment:', error);
      toast({
        title: "Reassignment Failed",
        description: "Failed to reassign applications. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast]);

  return {
    reassignCustomers,
    isLoading
  };
};