
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
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const fetchCustomers = async () => {
    if (!isAuthenticated || !user) {
      console.log('User not authenticated, skipping fetch');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Fetching customers for authenticated user:', user.id);
      const customersData = await CustomerService.fetchCustomers();
      console.log('Fetched customers:', customersData);
      setCustomers(customersData);
      
      // Extract all documents from customers
      const allDocuments = customersData.flatMap(customer => customer.documents || []);
      setDocuments(allDocuments);
      
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch customers. Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    console.log('Refreshing customer data...');
    await fetchCustomers();
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('Auth state changed, fetching customers...');
      fetchCustomers();
    } else {
      console.log('User not authenticated, clearing data');
      setCustomers([]);
      setDocuments([]);
      setStatusChanges([]);
    }
  }, [isAuthenticated, user?.id]); // Added user.id to dependency array

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
