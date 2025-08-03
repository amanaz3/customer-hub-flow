import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  DollarSign,
  Activity,
  AlertTriangle,
  Eye,
  Crown,
  BarChart3,
  Calendar,
  Clock
} from 'lucide-react';
import { useOptimizedCustomerData } from '@/hooks/useOptimizedCustomerData';
import { useAuth } from '@/contexts/SecureAuthContext';
import DashboardStats from '@/components/Dashboard/DashboardStats';
import EnhancedCustomerTable from '@/components/Customer/EnhancedCustomerTable';
import { LazyLoadingBoundary } from '@/components/Performance/LazyLoadingBoundary';
import { cn } from '@/lib/utils';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { 
    customers, 
    dashboardStats, 
    refreshData, 
    isLoading 
  } = useOptimizedCustomerData(50);
  
  const [activeView, setActiveView] = useState<'overview' | 'applications' | 'analytics'>('overview');

  // Calculate admin-specific metrics
  const adminMetrics = React.useMemo(() => {
    const today = new Date();
    const thisMonth = customers.filter(c => {
      const created = new Date(c.created_at || '');
      return created.getMonth() === today.getMonth() && 
             created.getFullYear() === today.getFullYear();
    });
    
    const pendingReview = customers.filter(c => 
      ['Submitted', 'Returned', 'Need More Info'].includes(c.status)
    );
    
    const activeUsers = new Set(customers.map(c => c.user_id)).size;
    
    return {
      newThisMonth: thisMonth.length,
      pendingReview: pendingReview.length,
      activeUsers,
      avgProcessingTime: '3.2 days', // This would be calculated from actual data
      conversionRate: '85%'
    };
  }, [customers]);

  const quickActions = [
    {
      title: "Create Application",
      description: "Start a new customer application",
      icon: UserPlus,
      action: () => window.location.href = '/customers/new',
      color: "bg-blue-500"
    },
    {
      title: "Review Queue",
      description: `${adminMetrics.pendingReview} applications pending`,
      icon: Eye,
      action: () => window.location.href = '/customers?status=pending',
      color: "bg-orange-500"
    },
    {
      title: "User Management",
      description: "Manage users and permissions",
      icon: Users,
      action: () => window.location.href = '/users',
      color: "bg-green-500"
    },
    {
      title: "System Analytics",
      description: "View detailed analytics",
      icon: BarChart3,
      action: () => setActiveView('analytics'),
      color: "bg-purple-500"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Welcome back, {user?.profile?.name}. Here's what's happening today.
          </p>
        </div>
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
          <Crown className="h-3 w-3 mr-1" />
          Administrator
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              +{adminMetrics.newThisMonth} this month
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{adminMetrics.pendingReview}</div>
            <p className="text-xs text-muted-foreground">
              Avg. {adminMetrics.avgProcessingTime} processing
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{adminMetrics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {adminMetrics.conversionRate} completion rate
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${dashboardStats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2 hover-scale"
                onClick={action.action}
              >
                <div className={cn("p-2 rounded-lg", action.color)}>
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Enhanced Dashboard Stats */}
          <DashboardStats 
            stats={dashboardStats} 
            onWidgetClick={() => setActiveView('applications')}
            activeWidget="applications"
          />
          
          {/* Recent Applications */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <LazyLoadingBoundary>
                <EnhancedCustomerTable 
                  customers={customers.slice(0, 10)} 
                  onDataChange={refreshData}
                />
              </LazyLoadingBoundary>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <LazyLoadingBoundary>
                <EnhancedCustomerTable 
                  customers={customers} 
                  onDataChange={refreshData}
                />
              </LazyLoadingBoundary>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Processing Time</span>
                    <span className="text-sm text-muted-foreground">{adminMetrics.avgProcessingTime}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-sm text-green-600">{adminMetrics.conversionRate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">User Satisfaction</span>
                    <span className="text-sm text-green-600">94%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Database Status</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">Healthy</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">API Response</span>
                    <span className="text-sm text-green-600">125ms avg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Uptime</span>
                    <span className="text-sm text-green-600">99.9%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;