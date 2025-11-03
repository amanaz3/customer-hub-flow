
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  XCircle
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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
}

const UserAnalytics = () => {
  const { customers } = useCustomer();
  const { getUsers } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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
        paymentRate
      };
    });

    return analytics.filter(user => 
      user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, customers, searchTerm]);

  const overallStats = useMemo(() => {
    const totalUsers = userAnalytics.length;
    const activeUsers = userAnalytics.filter(u => u.totalApplications > 0).length;
    
    // Separate customer count from application count
    const totalCustomers = userAnalytics.reduce((sum, u) => sum + u.totalApplications, 0);
    const totalApplications = userAnalytics.reduce((sum, u) => sum + u.totalApplications, 0);
    
    // Revenue calculation - sum individual user revenues (which are already role-filtered)
    const totalRevenue = userAnalytics.reduce((sum, u) => sum + u.totalRevenue, 0);
    const avgCompletionRate = totalUsers > 0 
      ? userAnalytics.reduce((sum, u) => sum + u.completionRate, 0) / totalUsers 
      : 0;

    return {
      totalUsers,
      activeUsers,
      totalCustomers,
      totalApplications,
      totalRevenue,
      avgCompletionRate
    };
  }, [userAnalytics]);

  const chartData = useMemo(() => {
    return userAnalytics
      .filter(u => u.totalApplications > 0)
      .slice(0, 10)
      .map(user => ({
        name: user.userName,
        applications: user.totalApplications,
        completed: user.completedApplications + user.paidApplications,
        pending: user.pendingApplications,
        revenue: user.totalRevenue
      }));
  }, [userAnalytics]);

  const statusDistribution = useMemo(() => {
    const total = userAnalytics.reduce((sum, u) => sum + u.totalApplications, 0);
    const completed = userAnalytics.reduce((sum, u) => sum + u.completedApplications + u.paidApplications, 0);
    const pending = userAnalytics.reduce((sum, u) => sum + u.pendingApplications, 0);
    const rejected = userAnalytics.reduce((sum, u) => sum + u.rejectedApplications, 0);

    return [
      { name: 'Completed', value: completed, color: '#22c55e' },
      { name: 'Pending', value: pending, color: '#f59e0b' },
      { name: 'Rejected', value: rejected, color: '#ef4444' }
    ];
  }, [userAnalytics]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">User Analytics</h2>
        <p className="text-muted-foreground">
          Performance insights for all users
        </p>
      </div>

      {/* Overall Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {overallStats.activeUsers} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Unique customer records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overallStats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From completed applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.avgCompletionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Across all users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Users by Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                applications: { label: "Total", color: "#3b82f6" },
                completed: { label: "Completed", color: "#22c55e" },
                pending: { label: "Pending", color: "#f59e0b" }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
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
                  <Bar dataKey="applications" fill="#3b82f6" name="Total" />
                  <Bar dataKey="completed" fill="#22c55e" name="Completed" />
                  <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                completed: { label: "Completed", color: "#22c55e" },
                pending: { label: "Pending", color: "#f59e0b" },
                rejected: { label: "Rejected", color: "#ef4444" }
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* User Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Performance Details</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
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

export default UserAnalytics;
