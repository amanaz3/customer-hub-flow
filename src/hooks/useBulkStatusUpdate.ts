import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useToast } from '@/hooks/use-toast';
import type { ApplicationStatus } from '@/types/application';

interface BulkStatusUpdateResult {
  successCount: number;
  failureCount: number;
  errors: string[];
}

export const useBulkStatusUpdate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const updateApplicationsStatus = useCallback(async (
    applicationIds: string[],
    newStatus: ApplicationStatus,
    comment: string
  ): Promise<BulkStatusUpdateResult> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(
        `https://gddibkhyhcnejxthsyzu.supabase.co/functions/v1/bulk-update-application-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            applicationIds,
            newStatus,
            comment,
            changedBy: user.id,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update applications');
      }

      const result = await response.json();

      toast({
        title: "Bulk Status Update Successful",
        description: `Successfully updated ${result.successCount} application(s) to "${newStatus}".`,
      });

      return result;
    } catch (error) {
      console.error('Error in bulk status update:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update applications. Please try again.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast]);

  return {
    updateApplicationsStatus,
    isLoading
  };
};
