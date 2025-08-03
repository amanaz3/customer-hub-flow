
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import DashboardStats from '@/components/Dashboard/DashboardStats';
import DashboardFilters from '@/components/Dashboard/DashboardFilters';
import EmptyDashboardState from '@/components/Dashboard/EmptyDashboardState';
import DashboardHeader from '@/components/Dashboard/DashboardHeader';
import { useOptimizedCustomerData } from '@/hooks/useOptimizedCustomerData';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { useAuth } from '@/contexts/SecureAuthContext';
import { supabase } from '@/lib/supabase';
import { BarChart3, Users, Calendar, ChevronDown, X, CheckCircle, Clock, DollarSign, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { LazyLoadingBoundary } from '@/components/Performance/LazyLoadingBoundary';

// Lazy load heavy components
const ResponsiveCustomerTable = React.lazy(() => import('@/components/Customer/ResponsiveCustomerTable'));
const EnhancedCustomerTable = React.lazy(() => import('@/components/Customer/EnhancedCustomerTable'));
const UserAnalytics = React.lazy(() => import('@/components/Analytics/UserAnalytics'));

const OptimizedDashboard = () => {
  const { 
    customers, 
    dashboardStats, 
    refreshData, 
    isLoading,
    pagination,
    loadNextPage,
    loadPreviousPage,
    hasNextPage,
    hasPreviousPage
  } = useOptimizedCustomerData(50);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Widget selection state - default to applications
  const [activeWidget, setActiveWidget] = useState<'applications' | 'completed' | 'pending' | 'revenue'>('applications');
  
  // Revenue filter state - simple month selection like Completed Applications
  const [revenueSelectedMonths, setRevenueSelectedMonths] = useState<string[]>([]);
  
  // Initialize dashboard filters
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedMonths,
    availableMonths,
    filteredCustomers,
    toggleMonth,
    clearAllMonths,
    clearAllFilters,
    hasActiveFilters
  } = useDashboardFilters(customers, activeWidget, revenueSelectedMonths);
  
  const handleWidgetChange = (widget: 'applications' | 'completed' | 'pending' | 'revenue') => {
    setActiveWidget(widget);
    clearAllFilters(); // Clear all filters when widget changes
    setRevenueSelectedMonths([]); // Clear revenue filter when widget changes
  };
  
  // Generate available months from revenue customers (Complete/Paid status)
  const availableRevenueMonths = useMemo(() => {
    const revenueCustomers = customers.filter(c => c.status === 'Complete' || c.status === 'Paid');
    const months = new Set<string>();
    
    revenueCustomers.forEach(customer => {
      const dateField = customer.updated_at || customer.created_at;
      if (dateField) {
        const date = new Date(dateField);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        months.add(monthKey);
      }
    });
    
    return Array.from(months).sort().map(monthKey => {
      const [year, month] = monthKey.split('-').map(Number);
      const date = new Date(year, month);
      return {
        key: monthKey,
        label: format(date, "MMMM yyyy")
      };
    });
  }, [customers]);
  
  const toggleRevenueMonth = (monthKey: string) => {
    setRevenueSelectedMonths(prev => 
      prev.includes(monthKey) 
        ? prev.filter(m => m !== monthKey)
        : [...prev, monthKey]
    );
  };

  // Optimized real-time subscription - only listen to customer changes
  useEffect(() => {
    const channel = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'customers' },
        () => {
          console.log('Customer data changed, refreshing...');
          refreshData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshData]);

  // Use filtered customers from the hook
  // Remove the local filteredCustomers calculation as it's now handled by useDashboardFilters

  // Use pre-calculated dashboard stats for better performance
  const stats = dashboardStats;


  // Get dynamic content based on active widget
  const getWidgetContent = () => {
    switch (activeWidget) {
      case 'applications':
        return {
          title: isAdmin ? 'All Applications' : 'My Applications',
          description: `Showing ${filteredCustomers.length} ${isAdmin ? 'total applications' : 'applications'} of all statuses`,
          icon: Users
        };
      case 'completed':
        return {
          title: 'Completed Applications',
          description: `Showing ${filteredCustomers.length} completed/paid applications from current month`,
          icon: CheckCircle
        };
      case 'pending':
        return {
          title: 'Submitted Applications',
          description: `Showing ${filteredCustomers.length} submitted applications in progress`,
          icon: Clock
        };
      case 'revenue':
        const revenueDesc = isAdmin && revenueSelectedMonths.length > 0 
          ? `Showing ${filteredCustomers.length} revenue applications from ${revenueSelectedMonths.length} selected month(s)` 
          : `Showing ${filteredCustomers.length} revenue-generating applications with advanced filtering available`;
        return {
          title: isAdmin ? 'Total Revenue (Advanced)' : 'My Revenue',
          description: revenueDesc,
          icon: DollarSign
        };
      default:
        return {
          title: 'Applications',
          description: 'Select a widget to view details',
          icon: Users
        };
    }
  };

  const widgetContent = getWidgetContent();

  const handleDataRefresh = () => {
    refreshData();
  };

  const handleCreateCustomer = () => {
    navigate('/customers/new');
  };

  // Simplified loading state
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
    </div>
  );

  return (
    <div className={cn(
      "space-y-4 xs:space-y-5 sm:space-y-6 lg:space-y-8",
      "pb-4 xs:pb-6 sm:pb-8",
      "max-w-full overflow-hidden"
    )}>
        {/* Enhanced Header */}
        <DashboardHeader
          userName={user?.profile?.name}
          userEmail={user?.email}
          onCreateCustomer={handleCreateCustomer}
        />

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
              {/* Statistics Cards inside Customers tab */}
              <DashboardStats 
                stats={stats} 
                selectedMonths={[]} // Remove legacy support
                revenueYear={new Date().getFullYear()}
                onWidgetClick={handleWidgetChange}
                activeWidget={activeWidget}
              />

              {/* Revenue Filter - Only show when revenue widget is active */}
              {activeWidget === 'revenue' && (
                <Card className="shadow-sm border-0 bg-gradient-to-br from-card to-card/50">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Revenue Filter</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Filter revenue by selecting months with completed/paid applications
                          </p>
                        </div>
                      </div>
                      {revenueSelectedMonths.length > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setRevenueSelectedMonths([])}
                          className="flex items-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Clear
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {availableRevenueMonths.length > 0 ? (
                      <div className="space-y-3">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start",
                                revenueSelectedMonths.length === 0 && "text-muted-foreground"
                              )}
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              {revenueSelectedMonths.length > 0 
                                ? `${revenueSelectedMonths.length} month${revenueSelectedMonths.length > 1 ? 's' : ''} selected`
                                : "Filter by months"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-4" align="start">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">Select months:</div>
                                {revenueSelectedMonths.length > 0 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setRevenueSelectedMonths([])}
                                  >
                                    Clear all
                                  </Button>
                                )}
                              </div>
                              <div className="max-h-48 overflow-y-auto space-y-2">
                                {availableRevenueMonths.map((month) => (
                                  <div key={month.key} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={month.key}
                                      checked={revenueSelectedMonths.includes(month.key)}
                                      onCheckedChange={() => toggleRevenueMonth(month.key)}
                                    />
                                    <label
                                      htmlFor={month.key}
                                      className="text-sm font-normal leading-none cursor-pointer flex-1"
                                    >
                                      {month.label}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        
                        {/* Selected months display */}
                        {revenueSelectedMonths.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {revenueSelectedMonths.map(monthKey => {
                              const month = availableRevenueMonths.find(m => m.key === monthKey);
                              return month ? (
                                <Badge 
                                  key={monthKey} 
                                  variant="secondary" 
                                  className="flex items-center gap-1 px-3 py-1"
                                >
                                  {month.label}
                                  <button
                                    onClick={() => toggleRevenueMonth(monthKey)}
                                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No completed or paid applications found</p>
                        <p className="text-xs">Complete some applications to see revenue filtering options</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {customers.length === 0 ? (
                <EmptyDashboardState onCreateCustomer={handleCreateCustomer} />
              ) : (
                <div className="space-y-6">
          <DashboardFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            selectedMonths={selectedMonths}
            availableMonths={availableMonths}
            onMonthToggle={toggleMonth}
            onClearAllMonths={clearAllMonths}
            onClearAllFilters={clearAllFilters}
            onRefresh={handleDataRefresh}
            isLoading={isLoading}
            activeWidget={activeWidget}
          />
                  
                  <Card className="shadow-sm border-0 bg-gradient-to-br from-card to-card/50">
                    <CardHeader className="pb-4 border-b border-border/50">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <widgetContent.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <span className="text-xl font-semibold">{widgetContent.title}</span>
                          <p className="text-sm text-muted-foreground font-normal mt-1">
                            {widgetContent.description}
                          </p>
                        </div>
                      </CardTitle>
                    </CardHeader>
                     <CardContent className="p-0">
                       <LazyLoadingBoundary>
                         <EnhancedCustomerTable 
                           customers={filteredCustomers} 
                           onDataChange={handleDataRefresh}
                         />
                       </LazyLoadingBoundary>
                     </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

             <TabsContent value="analytics" className="space-y-6">
               <LazyLoadingBoundary>
                 <UserAnalytics />
               </LazyLoadingBoundary>
             </TabsContent>
          </Tabs>
        ) : (
          /* Regular User Dashboard with Tabs */
          <Tabs defaultValue="customers" className="space-y-8">
            <TabsList className="grid w-full grid-cols-1 max-w-md h-12 bg-muted/50">
              <TabsTrigger value="customers" className="flex items-center gap-2 h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Users className="h-4 w-4" />
                <span className="font-medium">Customers</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="customers" className="space-y-6">
              {/* Statistics Cards inside Customers tab */}
              <DashboardStats 
                stats={stats} 
                onWidgetClick={handleWidgetChange}
                activeWidget={activeWidget}
              />

              {customers.length === 0 ? (
                <EmptyDashboardState onCreateCustomer={handleCreateCustomer} />
              ) : (
                <div className="space-y-6">
                   <DashboardFilters
                     searchTerm={searchTerm}
                     setSearchTerm={setSearchTerm}
                     statusFilter={statusFilter}
                     setStatusFilter={setStatusFilter}
                     selectedMonths={selectedMonths}
                     availableMonths={availableMonths}
                     onMonthToggle={toggleMonth}
                     onClearAllMonths={clearAllMonths}
                     onClearAllFilters={clearAllFilters}
                     onRefresh={handleDataRefresh}
                     isLoading={isLoading}
                     activeWidget={activeWidget}
                   />
                  
                  <Card className="shadow-sm border-0 bg-gradient-to-br from-card to-card/50">
                    <CardHeader className="pb-4 border-b border-border/50">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <widgetContent.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <span className="text-xl font-semibold">{widgetContent.title}</span>
                          <p className="text-sm text-muted-foreground font-normal mt-1">
                            {widgetContent.description}
                          </p>
                        </div>
                      </CardTitle>
                    </CardHeader>
                     <CardContent className="p-0">
                       <LazyLoadingBoundary>
                         <EnhancedCustomerTable 
                           customers={filteredCustomers} 
                           onDataChange={handleDataRefresh}
                         />
                       </LazyLoadingBoundary>
                     </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    );
  };

export default OptimizedDashboard;
