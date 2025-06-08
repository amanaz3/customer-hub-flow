
import React, { memo, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCustomers } from '@/contexts/CustomerContext';
import { useAuth } from '@/contexts/SecureAuthContext';
import { formatCurrency } from '@/lib/utils';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import LazyWrapper from '@/components/Performance/LazyWrapper';
import {
  Users,
  DollarSign,
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Memoized stat card component
const StatCard = memo(({ title, value, description, icon: Icon, trend }: {
  title: string;
  value: string | number;
  description: string;
  icon: any;
  trend?: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
      {trend && (
        <p className="text-xs text-green-600 flex items-center mt-1">
          <TrendingUp className="h-3 w-3 mr-1" />
          {trend}
        </p>
      )}
    </CardContent>
  </Card>
));

StatCard.displayName = 'StatCard';

// Memoized recent activities component
const RecentActivities = memo(() => {
  const { customers } = useCustomers();
  
  const recentCustomers = useMemo(() => 
    customers
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 5),
    [customers]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
        <CardDescription>Latest customer updates and activities</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentCustomers.map((customer) => (
          <div key={customer.id} className="flex items-center space-x-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{customer.name}</p>
              <p className="text-sm text-muted-foreground truncate">{customer.company}</p>
            </div>
            <Badge variant={customer.status === 'Complete' ? 'default' : 'secondary'}>
              {customer.status}
            </Badge>
          </div>
        ))}
        {recentCustomers.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activities
          </p>
        )}
      </CardContent>
    </Card>
  );
});

RecentActivities.displayName = 'RecentActivities';

const OptimizedDashboard: React.FC = () => {
  usePerformanceMonitor('OptimizedDashboard');
  
  const { customers, isLoading } = useCustomers();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Memoized calculations for better performance
  const dashboardStats = useMemo(() => {
    const totalCustomers = customers.length;
    const completedCases = customers.filter(c => c.status === 'Complete').length;
    const pendingCases = customers.filter(c => !['Complete', 'Rejected'].includes(c.status)).length;
    const totalRevenue = customers
      .filter(c => c.status === 'Complete' && c.payment_received)
      .reduce((sum, c) => sum + Number(c.amount), 0);

    return {
      totalCustomers,
      completedCases,
      pendingCases,
      totalRevenue,
      completionRate: totalCustomers > 0 ? Math.round((completedCases / totalCustomers) * 100) : 0
    };
  }, [customers]);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-customer':
        navigate('/customers/new');
        break;
      case 'view-customers':
        navigate('/customers');
        break;
      case 'view-completed':
        navigate('/completed');
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <LazyWrapper className="min-h-[400px]" />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.name}! Here's an overview of your workflow.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button onClick={() => handleQuickAction('add-customer')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Customers"
            value={dashboardStats.totalCustomers}
            description="All customers in system"
            icon={Users}
            trend="+12% from last month"
          />
          <StatCard
            title="Completed Cases"
            value={dashboardStats.completedCases}
            description="Successfully completed"
            icon={CheckCircle}
          />
          <StatCard
            title="Pending Cases"
            value={dashboardStats.pendingCases}
            description="Awaiting processing"
            icon={Clock}
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(dashboardStats.totalRevenue)}
            description="From completed cases"
            icon={DollarSign}
            trend="+8% from last month"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleQuickAction('add-customer')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Customer
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleQuickAction('view-customers')}
              >
                <Users className="h-4 w-4 mr-2" />
                View All Customers
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => handleQuickAction('view-completed')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Completed Cases
              </Button>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/users')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  User Management
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <div className="lg:col-span-2">
            <LazyWrapper>
              <RecentActivities />
            </LazyWrapper>
          </div>
        </div>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>Key metrics and completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {dashboardStats.completionRate}%
                </div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((dashboardStats.completedCases / Math.max(dashboardStats.totalCustomers, 1)) * 100)}%
                </div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {dashboardStats.pendingCases}
                </div>
                <p className="text-sm text-muted-foreground">Active Cases</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default memo(OptimizedDashboard);
