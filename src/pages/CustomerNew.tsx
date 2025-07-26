
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useCustomer } from '@/contexts/CustomerContext';
import { useToast } from '@/hooks/use-toast';
import CustomerNewHeader from '@/components/Customer/CustomerNewHeader';
import EnhancedCustomerForm from '@/components/Customer/EnhancedCustomerForm';

const CustomerNew = () => {
  const { user } = useAuth();
  const { addCustomer } = useCustomer();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSuccess = () => {
    // Refresh customer data in context
    refreshData();
    
    toast({
      title: "Success",
      description: "Customer created successfully",
    });
    navigate('/customers');
  };

  const { refreshData } = useCustomer();

  return (
    <div className="space-y-6">
        <CustomerNewHeader 
          title="New Application" 
          description="Create a new customer application" 
        />
        
        <EnhancedCustomerForm onSuccess={handleSuccess} />
      </div>
    );
};

export default CustomerNew;
