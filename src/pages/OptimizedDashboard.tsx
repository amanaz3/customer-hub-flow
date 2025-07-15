
import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import OptimizedCustomerTable from '@/components/Customer/OptimizedCustomerTable';
import UserAnalytics from '@/components/Analytics/UserAnalytics';
import DashboardStats from '@/components/Dashboard/DashboardStats';
import DashboardFilters from '@/components/Dashboard/DashboardFilters';
import EmptyDashboardState from '@/components/Dashboard/EmptyDashboardState';
import DashboardHeader from '@/components/Dashboard/DashboardHeader';
import { Customer, useCustomer } from '@/contexts/CustomerContext';
import { useAuth } from '@/contexts/SecureAuthContext';
import { BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

const OptimizedDashboard = () => {
  const { customers, refreshData, isLoading } = useCustomer();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // Set up real-time subscriptions for dashboard data
  useRealtimeSubscription({
    table: 'customers',
    onUpdate: () => {
      setRefreshKey(prev => prev + 1);
      refreshData();
    }
  });

  useRealtimeSubscription({
    table: 'documents',
    onUpdate: () => {
      setRefreshKey(prev => prev + 1);
    }
  });

  useRealtimeSubscription({
    table: 'status_changes',
    onUpdate: () => {
      setRefreshKey(prev => prev + 1);
    }
  });

  // Filter customers based on search and status
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          customer.company.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, statusFilter, refreshKey]);

  // Calculate statistics from real data
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const completedCases = customers.filter(c => c.status === 'Complete' || c.status === 'Paid').length;
    const pendingCases = customers.filter(c => !['Complete', 'Paid', 'Rejected'].includes(c.status)).length;
    const totalRevenue = customers
      .filter(c => c.status === 'Complete' || c.status === 'Paid')
      .reduce((sum, c) => sum + c.amount, 0);

    return {
      totalCustomers,
      completedCases,
      pendingCases,
      totalRevenue
    };
  }, [customers, refreshKey]);

  const handleDataRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refreshData();
  };

  const handleCreateCustomer = () => {
    navigate('/customers/new');
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">Loading Dashboard</h3>
                <p className="text-muted-foreground">Please wait while we fetch your data...</p>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Enhanced Header */}
        <DashboardHeader
          userName={user?.profile?.name}
          userEmail={user?.email}
          onCreateCustomer={handleCreateCustomer}
        />

        {/* Statistics Cards */}
        <DashboardStats stats={stats} />

        {/* Admin Dashboard with Tabs */}
        {isAdmin ? (
          <Tabs defaultValue="customers" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="customers" className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Customers
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="customers" className="space-y-6">
              {customers.length === 0 ? (
                <EmptyDashboardState onCreateCustomer={handleCreateCustomer} />
              ) : (
                <Card className="shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Recent Customers
                      <span className="text-sm font-normal text-muted-foreground">
                        ({filteredCustomers.length} of {customers.length})
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DashboardFilters
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                      statusFilter={statusFilter}
                      setStatusFilter={setStatusFilter}
                      onRefresh={handleDataRefresh}
                      isLoading={isLoading}
                    />
                    <OptimizedCustomerTable 
                      customers={filteredCustomers} 
                      onDataChange={handleDataRefresh}
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="analytics">
              <UserAnalytics />
            </TabsContent>
          </Tabs>
        ) : (
          /* Regular User Dashboard */
          customers.length === 0 ? (
            <EmptyDashboardState onCreateCustomer={handleCreateCustomer} />
          ) : (
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  My Customers
                  <span className="text-sm font-normal text-muted-foreground">
                    ({filteredCustomers.length} of {customers.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DashboardFilters
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  onRefresh={handleDataRefresh}
                  isLoading={isLoading}
                />
                <OptimizedCustomerTable 
                  customers={filteredCustomers} 
                  onDataChange={handleDataRefresh}
                />
              </CardContent>
            </Card>
          )
        )}
      </div>
    </MainLayout>
  );
};

export default OptimizedDashboard;
