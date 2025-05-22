
import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import CustomerTable from '@/components/Customer/CustomerTable';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomers } from '@/contexts/CustomerContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const { customers, getCustomersByUserId } = useCustomers();
  
  // For regular users, show only their customers
  // For admins, show all customers that are not completed
  const displayCustomers = isAdmin 
    ? customers.filter(c => c.status !== 'Completed')
    : getCustomersByUserId(user?.id || '').filter(c => c.status !== 'Completed');

  // Get counts for different statuses
  const pendingCount = displayCustomers.filter(c => c.status === 'Pending').length;
  const returnedCount = displayCustomers.filter(c => c.status === 'Returned').length;
  const submittedCount = displayCustomers.filter(c => c.status === 'Submitted to Bank').length;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? 'Overview of all customer submissions' 
              : 'Overview of your customer submissions'}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Returned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{returnedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Submitted to Bank</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{submittedCount}</div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Active Cases</h2>
          <CustomerTable customers={displayCustomers} />
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
