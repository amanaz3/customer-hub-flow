
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import OptimizedCustomerTable from '@/components/Customer/OptimizedCustomerTable';
import UserAnalytics from '@/components/Analytics/UserAnalytics';
import DashboardStats from '@/components/Dashboard/DashboardStats';
import DashboardFilters from '@/components/Dashboard/DashboardFilters';
import EmptyDashboardState from '@/components/Dashboard/EmptyDashboardState';
import DashboardHeader from '@/components/Dashboard/DashboardHeader';
import { Customer, useCustomer } from '@/contexts/CustomerContext';
import { useAuth } from '@/contexts/SecureAuthContext';
import { BarChart3, Users, Calendar } from 'lucide-react';
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
  
  // Date filtering for admin revenue (default to current month)
  const currentDate = new Date();
  const [revenueMonth, setRevenueMonth] = useState(currentDate.getMonth() + 1); // 1-based month
  const [revenueYear, setRevenueYear] = useState(currentDate.getFullYear());

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

  // Filter customers to show only recent and priority applications
  const filteredCustomers = useMemo(() => {
    // First filter by role-based access
    const roleBasedCustomers = isAdmin ? customers : customers.filter(c => c.user_id === user?.id);
    
    // Show only applications that need attention (excluding completed/paid/rejected)
    const priorityStatuses = ['Draft', 'Submitted', 'Need More Info', 'Returned', 'Sent to Bank'];
    const recentAndPriorityCustomers = roleBasedCustomers.filter(customer => {
      const isPriority = priorityStatuses.includes(customer.status);
      const isRecent = new Date(customer.created_at || '').getTime() > Date.now() - (30 * 24 * 60 * 60 * 1000); // Last 30 days
      return isPriority || isRecent;
    });
    
    return recentAndPriorityCustomers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.company.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [customers, searchTerm, statusFilter, refreshKey, isAdmin, user?.id]);

  // Calculate statistics from real data with role-based filtering
  const stats = useMemo(() => {
    // For non-admin users, only show their own data
    const relevantCustomers = isAdmin ? customers : customers.filter(c => c.user_id === user?.id);
    
    const totalCustomers = relevantCustomers.length;
    const completedCases = relevantCustomers.filter(c => c.status === 'Complete' || c.status === 'Paid').length;
    const pendingCases = relevantCustomers.filter(c => !['Complete', 'Paid', 'Rejected'].includes(c.status)).length;
    
    // Revenue calculation with date filtering for admins
    let totalRevenue = 0;
    if (isAdmin) {
      // Filter by selected month/year for admin
      totalRevenue = relevantCustomers
        .filter(c => {
          if (c.status !== 'Complete' && c.status !== 'Paid') return false;
          
          // Parse the created_at or updated_at date to check if it's in the selected month/year
          const customerDate = new Date(c.updated_at || c.created_at || '');
          const customerMonth = customerDate.getMonth() + 1; // 1-based month
          const customerYear = customerDate.getFullYear();
          
          return customerMonth === revenueMonth && customerYear === revenueYear;
        })
        .reduce((sum, c) => sum + c.amount, 0);
    } else {
      // For non-admin users, include all their submitted cases (no date filtering)
      totalRevenue = relevantCustomers
        .filter(c => c.status === 'Complete' || c.status === 'Paid')
        .reduce((sum, c) => sum + c.amount, 0);
    }

    return {
      totalCustomers,
      completedCases,
      pendingCases,
      totalRevenue
    };
  }, [customers, refreshKey, isAdmin, user?.id, revenueMonth, revenueYear]);

  const handleDataRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refreshData();
  };

  const handleCreateCustomer = () => {
    navigate('/customers/new');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30 border-t-primary mx-auto"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary/20 animate-ping"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">Loading Dashboard</h3>
            <p className="text-muted-foreground">Fetching your latest data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
        {/* Enhanced Header */}
        <DashboardHeader
          userName={user?.profile?.name}
          userEmail={user?.email}
          onCreateCustomer={handleCreateCustomer}
        />

        {/* Statistics Cards */}
        <DashboardStats stats={stats} revenueMonth={isAdmin ? revenueMonth : undefined} revenueYear={isAdmin ? revenueYear : undefined} />

        {/* Admin Revenue Date Filter */}
        {isAdmin && (
          <Card className="shadow-sm border-0 bg-gradient-to-br from-card to-card/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Revenue Filter</CardTitle>
                    <p className="text-sm text-muted-foreground">Filter total revenue by month and year</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Month:</label>
                    <Select value={revenueMonth.toString()} onValueChange={(value) => setRevenueMonth(parseInt(value))}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Year:</label>
                    <Select value={revenueYear.toString()} onValueChange={(value) => setRevenueYear(parseInt(value))}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = currentDate.getFullYear() - 5 + i;
                          return (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Admin Dashboard with Tabs */}
        {isAdmin ? (
          <Tabs defaultValue="customers" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 max-w-md h-12 bg-muted/50">
              <TabsTrigger value="customers" className="flex items-center gap-2 h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Users className="h-4 w-4" />
                <span className="font-medium">Customers</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2 h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <BarChart3 className="h-4 w-4" />
                <span className="font-medium">Analytics</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="customers" className="space-y-6">
              {customers.length === 0 ? (
                <EmptyDashboardState onCreateCustomer={handleCreateCustomer} />
              ) : (
                <div className="space-y-6">
                  <DashboardFilters
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    onRefresh={handleDataRefresh}
                    isLoading={isLoading}
                  />
                  
                  <Card className="shadow-sm border-0 bg-gradient-to-br from-card to-card/50">
                    <CardHeader className="pb-4 border-b border-border/50">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <span className="text-xl font-semibold">Application Management</span>
                          <p className="text-sm text-muted-foreground font-normal mt-1">
                            Showing {filteredCustomers.length} priority applications requiring attention
                          </p>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <OptimizedCustomerTable 
                        customers={filteredCustomers} 
                        onDataChange={handleDataRefresh}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <UserAnalytics />
            </TabsContent>
          </Tabs>
        ) : (
          /* Regular User Dashboard */
          customers.length === 0 ? (
            <EmptyDashboardState onCreateCustomer={handleCreateCustomer} />
          ) : (
            <div className="space-y-6">
              <DashboardFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                onRefresh={handleDataRefresh}
                isLoading={isLoading}
              />
              
              <Card className="shadow-sm border-0 bg-gradient-to-br from-card to-card/50">
                <CardHeader className="pb-4 border-b border-border/50">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xl font-semibold">My Applications</span>
                      <p className="text-sm text-muted-foreground font-normal mt-1">
                        Showing {filteredCustomers.length} applications requiring your attention
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <OptimizedCustomerTable 
                    customers={filteredCustomers} 
                    onDataChange={handleDataRefresh}
                  />
                </CardContent>
              </Card>
            </div>
          )
        )}
      </div>
    );
  };

export default OptimizedDashboard;
