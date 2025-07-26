
import React, { memo, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer } from '@/types/customer';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useCustomers } from '@/contexts/CustomerContext';
import AdminFilters from '@/components/Admin/AdminFilters';
import CustomerApplicationsList from '@/components/Customer/CustomerApplicationsList';
import ResponsiveCustomerTable from '@/components/Customer/ResponsiveCustomerTable';
import LazyWrapper from '@/components/Performance/LazyWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';

const CustomerList = () => {
  const { user, isAdmin } = useAuth();
  const { customers, getCustomersByUserId } = useCustomers();
  const navigate = useNavigate();
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  const { userCustomers, activeCustomers, completedCustomers } = useMemo(() => {
    // For regular users, show only their customers
    // For admins, show filtered customers or all customers
    const baseCustomers = isAdmin ? (filteredCustomers.length > 0 ? filteredCustomers : customers) : getCustomersByUserId(user?.id || '');
    
    // Filter customers by status
    const active = baseCustomers.filter(customer => 
      customer.status !== 'Complete'
    );
    const completed = baseCustomers.filter(customer => 
      customer.status === 'Complete'
    );

    return {
      userCustomers: baseCustomers,
      activeCustomers: active,
      completedCustomers: completed
    };
  }, [customers, filteredCustomers, isAdmin, user?.id, getCustomersByUserId]);

  const handleNewApplication = () => navigate('/customers/new');

  return (
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
            onClick={handleNewApplication}
            className="mt-4 md:mt-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Application
          </Button>
        </div>
        
        {/* Admin Filters */}
        {isAdmin && (
          <AdminFilters
            customers={customers}
            onFilteredCustomers={setFilteredCustomers}
          />
        )}

        <LazyWrapper>
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
            <div className="block lg:hidden">
              <CustomerApplicationsList customers={activeCustomers} />
            </div>
            <div className="hidden lg:block">
              <ResponsiveCustomerTable customers={activeCustomers} />
            </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="completed">
              <Card>
                <CardHeader>
                  <CardTitle>Completed Applications</CardTitle>
                </CardHeader>
                <CardContent>
            <div className="block lg:hidden">
              <CustomerApplicationsList customers={completedCustomers} />
            </div>
            <div className="hidden lg:block">
              <ResponsiveCustomerTable customers={completedCustomers} />
            </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </LazyWrapper>
      </div>
    );
};

export default memo(CustomerList);
