import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useToast } from '@/hooks/use-toast';
import { ApplicationService } from '@/services/applicationService';
import type { Application } from '@/types/application';

export const useApplicationData = (customerId?: string) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const fetchApplications = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.log('User not authenticated, skipping fetch');
      return;
    }

    if (!customerId) {
      console.log('No customer ID provided');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Fetching applications for customer:', customerId);
      const data = await ApplicationService.fetchApplicationsByCustomerId(customerId);
      console.log('Fetched applications:', data);
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch applications. Please try refreshing the page.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [customerId, isAuthenticated, user, toast]);

  const refreshData = async () => {
    console.log('Refreshing application data...');
    await fetchApplications();
  };

  useEffect(() => {
    if (isAuthenticated && user && customerId) {
      console.log('Auth state changed, fetching applications...');
      fetchApplications();
    } else {
      console.log('Clearing application data');
      setApplications([]);
    }
  }, [isAuthenticated, user?.id, customerId, fetchApplications]);

  return {
    applications,
    setApplications,
    isLoading,
    refreshData,
  };
};
