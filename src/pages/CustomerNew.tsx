
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
    <div className="w-full bg-gradient-subtle">
      <div className="px-4 pb-4">
        {/* Multi-Step Form */}
        <ComprehensiveCustomerForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
};

export default CustomerNew;
