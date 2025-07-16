
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useCustomer } from '@/contexts/CustomerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import CustomerNewHeader from '@/components/Customer/CustomerNewHeader';
import ComprehensiveCustomerForm from '@/components/Customer/ComprehensiveCustomerForm';

const CustomerNew = () => {
  const { user } = useAuth();
  const { addCustomer } = useCustomer();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSuccess = () => {
    toast({
      title: "Success",
      description: "Customer created successfully",
    });
    navigate('/customers');
  };

  return (
    <div className="space-y-6">
        <CustomerNewHeader 
          title="Add New Customer" 
          description="Create a new customer application" 
        />
        
        <ComprehensiveCustomerForm onSuccess={handleSuccess} />
      </div>
    );
};

export default CustomerNew;
