
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

    const newCustomer = {
      name: data.name,
      mobile: data.mobile,
      company: data.company,
      email: data.email,
      leadSource: data.leadSource,
      licenseType: data.licenseType,
      amount: parseFloat(data.amount),
      status: 'Draft' as const,
      userId: user.id,
      documents: [],
      comments: []
    };
    
    try {
      await addCustomer(newCustomer);
      
      toast({
        title: "Success",
        description: "Customer application created with Google Drive folder",
      });
      
      navigate('/customers');
    } catch (error) {
      console.error('Error creating customer:', error);
      
      toast({
        title: "Warning",
        description: "Customer created but Google Drive folder creation failed. Documents can still be uploaded locally.",
        variant: "destructive",
      });
      
      navigate('/customers');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <CustomerNewHeader 
          title="Add New Customer" 
          description="Create a new customer application with Google Drive integration" 
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
