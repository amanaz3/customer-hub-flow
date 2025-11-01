
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '@/contexts/CustomerContext';
import { useToast } from '@/hooks/use-toast';
import ComprehensiveCustomerForm from '@/components/Customer/ComprehensiveCustomerForm';

const CustomerNew = () => {
  const { refreshData } = useCustomer();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSuccess = () => {
    refreshData();
    
    toast({
      title: "Success",
      description: "Customer created successfully",
    });
    navigate('/customers');
  };

  return (
    <div className="space-y-4 pb-6">
      <ComprehensiveCustomerForm onSuccess={handleSuccess} />
    </div>
  );
};

export default CustomerNew;
