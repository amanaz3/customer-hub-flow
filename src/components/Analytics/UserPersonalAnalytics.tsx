import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartConfig } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LineChart, Line } from 'recharts';
import { useCustomer } from '@/contexts/CustomerContext';
import { useAuth } from '@/contexts/SecureAuthContext';
import { BarChart3, TrendingUp, Clock, CheckCircle, XCircle, Filter, Search } from 'lucide-react';

const UserPersonalAnalytics: React.FC = () => {
  const { customers } = useCustomer();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('6months');

  // Filter user's own customers
  const userCustomers = useMemo(() => {
    return customers.filter(customer => customer.user_id === user?.id);
  }, [customers, user?.id]);

  // Apply search and status filters
  const filteredCustomers = useMemo(() => {
    return userCustomers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.company.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [userCustomers, searchTerm, statusFilter]);

  // Calculate time range for filtering
  const getTimeRangeDate = () => {
    const now = new Date();
    switch (timeRange) {
      case '3months':
        return new Date(now.getFullYear(), now.getMonth() - 3, 1);
      case '6months':
        return new Date(now.getFullYear(), now.getMonth() - 6, 1);
      case '12months':
        return new Date(now.getFullYear(), now.getMonth() - 12, 1);
      case 'ytd':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getFullYear(), now.getMonth() - 6, 1);
    }
  };

  // Prepare monthly data for charts
  const monthlyData = useMemo(() => {
    const timeRangeStart = getTimeRangeDate();
    const months: { [key: string]: { total: number; completed: number; rejected: number; pending: number } } = {};
    
    filteredCustomers.forEach(customer => {
      const createdDate = new Date(customer.created_at || '');
      if (createdDate >= timeRangeStart) {
        const monthKey = createdDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        if (!months[monthKey]) {
          months[monthKey] = { total: 0, completed: 0, rejected: 0, pending: 0 };
        }
        
        months[monthKey].total++;
        
        if (customer.status === 'Complete' || customer.status === 'Paid') {
          months[monthKey].completed++;
        } else if (customer.status === 'Rejected') {
          months[monthKey].rejected++;
        } else {
          months[monthKey].pending++;
        }
      }
    });

    return Object.entries(months).map(([month, data]) => ({
      month,
      ...data
    })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [filteredCustomers, timeRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredCustomers.length;
    const completed = filteredCustomers.filter(c => c.status === 'Complete' || c.status === 'Paid').length;
    const rejected = filteredCustomers.filter(c => c.status === 'Rejected').length;
    const pending = filteredCustomers.filter(c => !['Complete', 'Paid', 'Rejected'].includes(c.status)).length;
    
    return {
      total,
      completed,
      rejected,
      pending,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [filteredCustomers]);

  const chartConfig: ChartConfig = {
    total: {
      label: "Total Applications",
      color: "hsl(var(--primary))",
    },
    completed: {
      label: "Completed",
      color: "hsl(var(--chart-2))",
    },
    rejected: {
      label: "Rejected",
      color: "hsl(var(--destructive))",
    },
    pending: {
      label: "Pending",
      color: "hsl(var(--chart-4))",
    },
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Analytics Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Applications</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status Filter</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Need More Info">Need More Info</SelectItem>
                  <SelectItem value="Returned">Returned</SelectItem>
                  <SelectItem value="Sent to Bank">Sent to Bank</SelectItem>
                  <SelectItem value="Complete">Complete</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Range</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="12months">Last 12 Months</SelectItem>
                  <SelectItem value="ytd">Year to Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Applications</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{stats.completionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Applications Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Monthly Applications Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="var(--color-total)" name="Total" />
                <Bar dataKey="completed" fill="var(--color-completed)" name="Completed" />
                <Bar dataKey="pending" fill="var(--color-pending)" name="Pending" />
                <Bar dataKey="rejected" fill="var(--color-rejected)" name="Rejected" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Monthly Trend Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Application Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="var(--color-total)" strokeWidth={3} name="Total Applications" />
                <Line type="monotone" dataKey="completed" stroke="var(--color-completed)" strokeWidth={2} name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Application Results Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Total Applications</span>
              <Badge variant="secondary">{stats.total}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Completed Applications</span>
              <Badge className="bg-green-100 text-green-800">{stats.completed}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Pending Applications</span>
              <Badge className="bg-yellow-100 text-yellow-800">{stats.pending}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Rejected Applications</span>
              <Badge className="bg-red-100 text-red-800">{stats.rejected}</Badge>
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <span className="font-medium">Success Rate</span>
              <Badge variant="default">{stats.completionRate}%</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserPersonalAnalytics;