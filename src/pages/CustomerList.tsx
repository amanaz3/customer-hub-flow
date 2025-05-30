
import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomers } from '@/contexts/CustomerContext';
import CustomerTable from '@/components/Customer/CustomerTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';

const CustomerList = () => {
  const { user, isAdmin } = useAuth();
  const { customers, getCustomersByUserId } = useCustomers();
  const navigate = useNavigate();

  // For regular users, show only their customers
  // For admins, show all customers
  const userCustomers = isAdmin ? customers : getCustomersByUserId(user?.id || '');
  
  // Filter customers by status
  const activeCustomers = userCustomers.filter(customer => 
    !['Complete', 'Paid'].includes(customer.status)
  );
  const completedCustomers = userCustomers.filter(customer => 
    ['Complete', 'Paid'].includes(customer.status)
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {isAdmin ? 'All Applications' : 'My Applications'}
            </h1>
            <p className="text-muted-foreground">
              {isAdmin 
                ? 'Manage all customer applications' 
                : 'View and manage your applications'
              }
            </p>
          </div>
          <Button
            onClick={() => navigate('/customers/new')}
            className="mt-4 md:mt-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Application
          </Button>
        </div>

        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active Applications</TabsTrigger>
            <TabsTrigger value="completed">Completed Applications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Active Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomerTable customers={activeCustomers} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Completed Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <CustomerTable customers={completedCustomers} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default CustomerList;
