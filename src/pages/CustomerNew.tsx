
import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomers } from '@/contexts/CustomerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import CustomerNewHeader from '@/components/Customer/CustomerNewHeader';
import CustomerForm, { CustomerFormValues } from '@/components/Customer/CustomerForm';

const CustomerNew = () => {
  const { user } = useAuth();
  const { addCustomer } = useCustomers();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (data: CustomerFormValues) => {
    if (!user) return;

    try {
      await addCustomer({
        name: data.name,
        mobile: data.mobile,
        company: data.company,
        email: data.email,
        lead_source: data.leadSource as any,
        license_type: data.licenseType as any,
        amount: parseFloat(data.amount),
        status: 'Draft' as const,
        user_id: user.id,
      });
      
      toast({
        title: "Success",
        description: "Customer application created as draft",
      });
      
      navigate('/customers');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create customer",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <CustomerNewHeader 
          title="Add New Customer" 
          description="Create a new customer application" 
        />
        
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerForm onSubmit={handleSubmit} />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default CustomerNew;
