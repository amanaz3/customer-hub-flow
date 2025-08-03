import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  UserPlus, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  Calendar,
  TrendingUp,
  User,
  Plus,
  Eye
} from 'lucide-react';
import { useOptimizedCustomerData } from '@/hooks/useOptimizedCustomerData';
import { useAuth } from '@/contexts/SecureAuthContext';
import DashboardStats from '@/components/Dashboard/DashboardStats';
import EnhancedCustomerTable from '@/components/Customer/EnhancedCustomerTable';
import { LazyLoadingBoundary } from '@/components/Performance/LazyLoadingBoundary';
import { cn } from '@/lib/utils';

const UserDashboard = () => {
  const { user } = useAuth();
  const { 
    customers, 
    dashboardStats, 
    refreshData, 
    isLoading 
  } = useOptimizedCustomerData(50);
  
  const [activeView, setActiveView] = useState<'overview' | 'applications' | 'progress'>('overview');

  // Calculate user-specific metrics
  const userMetrics = React.useMemo(() => {
    const inProgress = customers.filter(c => 
      ['Submitted', 'Returned', 'Need More Info', 'Sent to Bank'].includes(c.status)
    );
    
    const completed = customers.filter(c => 
      ['Complete', 'Paid'].includes(c.status)
    );
    
    const rejected = customers.filter(c => c.status === 'Rejected');
    
    const drafts = customers.filter(c => c.status === 'Draft');
    
    const completionRate = customers.length > 0 ? 
      Math.round((completed.length / customers.length) * 100) : 0;
    
    return {
      inProgress: inProgress.length,
      completed: completed.length,
      rejected: rejected.length,
      drafts: drafts.length,
      completionRate,
      totalValue: customers.reduce((sum, c) => sum + (c.amount || 0), 0)
    };
  }, [customers]);

  const quickActions = [
    {
      title: "New Application",
      description: "Start a new application process",
      icon: Plus,
      action: () => window.location.href = '/customers/new',
      color: "bg-blue-500"
    },
    {
      title: "View Applications",
      description: `${customers.length} total applications`,
      icon: Eye,
      action: () => setActiveView('applications'),
      color: "bg-green-500"
    },
    {
      title: "Documents",
      description: "Manage your documents",
      icon: FileText,
      action: () => window.location.href = '/user/documents',
      color: "bg-orange-500"
    },
    {
      title: "Schedule Meeting",
      description: "Book a consultation",
      icon: Calendar,
      action: () => window.location.href = '/user/calendar',
      color: "bg-purple-500"
    }
  ];

  const recentActivity = [
    {
      type: "status_update",
      message: "Application #1234 status updated to 'Sent to Bank'",
      time: "2 hours ago",
      icon: Clock
    },
    {
      type: "document_upload",
      message: "Passport copy uploaded successfully",
      time: "1 day ago",
      icon: FileText
    },
    {
      type: "application_created",
      message: "New application created",
      time: "3 days ago",
      icon: UserPlus
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <User className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">My Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Welcome back, {user?.profile?.name}. Track your applications and progress.
          </p>
        </div>
        <Badge variant="outline">
          <User className="h-3 w-3 mr-1" />
          User Account
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
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">
              {userMetrics.drafts} in draft
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{userMetrics.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              Being processed
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{userMetrics.completed}</div>
            <p className="text-xs text-muted-foreground">
              {userMetrics.completionRate}% success rate
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${userMetrics.totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Application value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Application Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Completion Rate</span>
              <span>{userMetrics.completionRate}%</span>
            </div>
            <Progress value={userMetrics.completionRate} className="h-2" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">{userMetrics.drafts}</div>
                <div className="text-muted-foreground">Draft</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-orange-600">{userMetrics.inProgress}</div>
                <div className="text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{userMetrics.completed}</div>
                <div className="text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600">{userMetrics.rejected}</div>
                <div className="text-muted-foreground">Rejected</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
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
          <TabsTrigger value="progress">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Recent Applications */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Applications</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setActiveView('applications')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <LazyLoadingBoundary>
                <EnhancedCustomerTable 
                  customers={customers.slice(0, 5)} 
                  onDataChange={refreshData}
                />
              </LazyLoadingBoundary>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Applications</CardTitle>
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

        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="p-2 rounded-full bg-primary/10">
                      <activity.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserDashboard;