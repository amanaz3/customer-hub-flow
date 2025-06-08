
import { useState, useEffect } from 'react';
import { Customer, StatusChange, Document } from '@/types/customer';
import { CustomerService } from '@/services/customerService';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useToast } from '@/hooks/use-toast';

export const useCustomerData = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [statusChanges, setStatusChanges] = useState<StatusChange[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCustomers = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const customersData = await CustomerService.fetchCustomers();
      setCustomers(customersData);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchCustomers();
  };

  useEffect(() => {
    fetchCustomers();
  }, [user]);

  return {
    customers,
    setCustomers,
    statusChanges,
    setStatusChanges,
    documents,
    setDocuments,
    isLoading,
    refreshData
  };
};
