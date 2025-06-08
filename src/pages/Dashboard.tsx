
import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import CustomerTable from '@/components/Customer/CustomerTable';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useCustomers } from '@/contexts/CustomerContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const { customers, getCustomersByUserId } = useCustomers();
  
  // For regular users, show only their customers
  // For admins, show all customers that are not paid
  const displayCustomers = isAdmin 
    ? customers.filter(c => c.status !== 'Paid')
    : getCustomersByUserId(user?.id || '').filter(c => c.status !== 'Paid');

  // Get counts for different statuses
  const submittedCount = displayCustomers.filter(c => c.status === 'Submitted').length;
  const returnedCount = displayCustomers.filter(c => c.status === 'Returned').length;
  const sentToBankCount = displayCustomers.filter(c => c.status === 'Sent to Bank').length;
  const completeCount = displayCustomers.filter(c => c.status === 'Complete').length;
  const rejectedCount = displayCustomers.filter(c => c.status === 'Rejected').length;
  const needMoreInfoCount = displayCustomers.filter(c => c.status === 'Need More Info').length;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? 'Overview of all customer applications' 
              : 'Overview of your applications'}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Submitted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{submittedCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Returned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{returnedCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sent to Bank</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{sentToBankCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Complete</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{completeCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{rejectedCount}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Need More Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{needMoreInfoCount}</div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Active Applications</h2>
          <CustomerTable customers={displayCustomers} />
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
