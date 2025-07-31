import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { useCustomer } from '@/contexts/CustomerContext';
import { useAuth } from '@/contexts/SecureAuthContext';
import { 
  Search, 
  Users, 
  TrendingUp,
  CheckCircle,
  Clock,
  CreditCard,
  XCircle,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  DollarSign
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

interface UserStats {
  userId: string;
  userName: string;
  userEmail: string;
  totalApplications: number;
  completedApplications: number;
  pendingApplications: number;
  rejectedApplications: number;
  paidApplications: number;
  totalRevenue: number;
  completionRate: number;
  paymentRate: number;
  isActive: boolean;
}

const AdminDashboard = () => {
  const { customers, isLoading: customersLoading } = useCustomer();
  const { getUsers } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('totalRevenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await getUsers();
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [getUsers]);

  const userAnalytics = useMemo(() => {
    const analytics: UserStats[] = users.map(user => {
      const userCustomers = customers.filter(customer => customer.user_id === user.id);
      
      const totalApplications = userCustomers.length;
      const completedApplications = userCustomers.filter(c => c.status === 'Complete').length;
      const pendingApplications = userCustomers.filter(c => 
        !['Complete', 'Paid', 'Rejected'].includes(c.status)
      ).length;
      const rejectedApplications = userCustomers.filter(c => c.status === 'Rejected').length;
      const paidApplications = userCustomers.filter(c => c.status === 'Paid').length;
      
      const totalRevenue = userCustomers
        .filter(c => c.status === 'Complete' || c.status === 'Paid')
        .reduce((sum, c) => sum + c.amount, 0);
      
      const completionRate = totalApplications > 0 
        ? ((completedApplications + paidApplications) / totalApplications) * 100 
        : 0;
      
      const paymentRate = totalApplications > 0 
        ? (paidApplications / totalApplications) * 100 
        : 0;

      return {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        totalApplications,
        completedApplications,
        pendingApplications,
        rejectedApplications,
        paidApplications,
        totalRevenue,
        completionRate,
        paymentRate,
        isActive: user.is_active
      };
    });

    // Apply filters
    let filtered = analytics.filter(user => {
      const matchesSearch = user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && user.totalApplications > 0) ||
                           (statusFilter === 'inactive' && user.totalApplications === 0);
      
      return matchesSearch && matchesStatus;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortBy as keyof UserStats];
      const bValue = b[sortBy as keyof UserStats];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'desc' 
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue);
      }
      
      return 0;
    });

    return filtered;
  }, [users, customers, searchTerm, statusFilter, sortBy, sortOrder]);

  const overallStats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.is_active).length;
    const usersWithApplications = userAnalytics.filter(u => u.totalApplications > 0).length;
    
    const totalCustomers = userAnalytics.reduce((sum, u) => sum + u.totalApplications, 0);
    const completedCustomers = userAnalytics.reduce((sum, u) => sum + u.completedApplications + u.paidApplications, 0);
    const pendingCustomers = userAnalytics.reduce((sum, u) => sum + u.pendingApplications, 0);
    
    const totalRevenue = userAnalytics.reduce((sum, u) => sum + u.totalRevenue, 0);
    const avgCompletionRate = totalUsers > 0 
      ? userAnalytics.reduce((sum, u) => sum + u.completionRate, 0) / totalUsers 
      : 0;

    return {
      totalUsers,
      activeUsers,
      usersWithApplications,
      totalCustomers,
      completedCustomers,
      pendingCustomers,
      totalRevenue,
      avgCompletionRate
    };
  }, [userAnalytics, users]);

  const chartData = useMemo(() => {
    return userAnalytics
      .filter(u => u.totalApplications > 0)
      .slice(0, 10)
      .map(user => ({
        name: user.userName.split(' ')[0], // First name only for chart
        applications: user.totalApplications,
        completed: user.completedApplications + user.paidApplications,
        pending: user.pendingApplications,
        rejected: user.rejectedApplications,
        revenue: user.totalRevenue
      }));
  }, [userAnalytics]);

  const revenueChartData = useMemo(() => {
    return userAnalytics
      .filter(u => u.totalRevenue > 0)
      .slice(0, 8)
      .map(user => ({
        name: user.userName.split(' ')[0],
        revenue: user.totalRevenue,
        completedApps: user.completedApplications + user.paidApplications
      }));
  }, [userAnalytics]);

  const statusDistribution = useMemo(() => {
    const completed = userAnalytics.reduce((sum, u) => sum + u.completedApplications + u.paidApplications, 0);
    const pending = userAnalytics.reduce((sum, u) => sum + u.pendingApplications, 0);
    const rejected = userAnalytics.reduce((sum, u) => sum + u.rejectedApplications, 0);

    return [
      { name: 'Completed', value: completed, color: 'hsl(var(--chart-1))' },
      { name: 'Pending', value: pending, color: 'hsl(var(--chart-2))' },
      { name: 'Rejected', value: rejected, color: 'hsl(var(--chart-3))' }
    ];
  }, [userAnalytics]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const { data } = await getUsers();
      setUsers(data || []);
    } catch (error) {
      console.error('Error refreshing users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || customersLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive analytics and user management overview
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overall Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{overallStats.totalUsers}</div>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {overallStats.activeUsers} active • {overallStats.usersWithApplications} with apps
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{overallStats.totalCustomers}</div>
            <p className="text-xs text-green-600 dark:text-green-400">
              {overallStats.completedCustomers} completed • {overallStats.pendingCustomers} pending
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatCurrency(overallStats.totalRevenue)}</div>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              From completed applications
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{overallStats.avgCompletionRate.toFixed(1)}%</div>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              Across all users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Users</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Activity Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active Users</SelectItem>
                  <SelectItem value="inactive">Inactive Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="totalRevenue">Revenue</SelectItem>
                  <SelectItem value="totalApplications">Applications</SelectItem>
                  <SelectItem value="completionRate">Completion Rate</SelectItem>
                  <SelectItem value="userName">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Order</label>
              <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Highest First</SelectItem>
                  <SelectItem value="asc">Lowest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Users by Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                applications: { label: "Total", color: "hsl(var(--chart-1))" },
                completed: { label: "Completed", color: "hsl(var(--chart-2))" },
                pending: { label: "Pending", color: "hsl(var(--chart-3))" },
                rejected: { label: "Rejected", color: "hsl(var(--chart-4))" }
              }}
              className="h-[350px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="applications" fill="hsl(var(--chart-1))" name="Total" />
                  <Bar dataKey="completed" fill="hsl(var(--chart-2))" name="Completed" />
                  <Bar dataKey="pending" fill="hsl(var(--chart-3))" name="Pending" />
                  <Bar dataKey="rejected" fill="hsl(var(--chart-4))" name="Rejected" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                completed: { label: "Completed", color: "hsl(var(--chart-1))" },
                pending: { label: "Pending", color: "hsl(var(--chart-2))" },
                rejected: { label: "Rejected", color: "hsl(var(--chart-3))" }
              }}
              className="h-[350px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue by User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
                completedApps: { label: "Completed Apps", color: "hsl(var(--chart-2))" }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--chart-1))" 
                    fill="hsl(var(--chart-1))" 
                    fillOpacity={0.3}
                    name="Revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* User Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Performance Details</CardTitle>
          <p className="text-sm text-muted-foreground">
            Showing {userAnalytics.length} of {users.length} users
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Total Apps</TableHead>
                  <TableHead className="text-center">Completed</TableHead>
                  <TableHead className="text-center">Pending</TableHead>
                  <TableHead className="text-center">Paid</TableHead>
                  <TableHead className="text-center">Rejected</TableHead>
                  <TableHead className="text-center">Completion Rate</TableHead>
                  <TableHead className="text-center">Payment Rate</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userAnalytics.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.userName}</div>
                        <div className="text-sm text-muted-foreground">{user.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{user.totalApplications}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                        {user.completedApplications}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <Clock className="h-4 w-4 text-yellow-600 mr-1" />
                        {user.pendingApplications}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-blue-600 mr-1" />
                        {user.paidApplications}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <XCircle className="h-4 w-4 text-red-600 mr-1" />
                        {user.rejectedApplications}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={user.completionRate >= 80 ? "default" : user.completionRate >= 50 ? "secondary" : "destructive"}
                      >
                        {user.completionRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={user.paymentRate >= 80 ? "default" : user.paymentRate >= 50 ? "secondary" : "destructive"}
                      >
                        {user.paymentRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(user.totalRevenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {userAnalytics.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your search criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;