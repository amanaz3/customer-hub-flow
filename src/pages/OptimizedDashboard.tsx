import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import OptimizedCustomerTable from '@/components/Customer/OptimizedCustomerTable';
import { Customer, useCustomer } from '@/contexts/CustomerContext';
import { useAuth } from '@/contexts/SecureAuthContext';
import { 
  Search, 
  Users, 
  FileText, 
  CheckCircle, 
  Clock,
  Plus,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

// Mock data for development
const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Ahmed Al-Rashid',
    email: 'ahmed@example.com',
    mobile: '+971501234567',
    company: 'Al-Rashid Trading LLC',
    leadSource: 'Website',
    licenseType: 'Mainland',
    status: 'Submitted',
    amount: 15000,
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@techstart.ae',
    mobile: '+971502345678',
    company: 'TechStart Solutions',
    leadSource: 'Referral',
    licenseType: 'Freezone',
    status: 'Returned',
    amount: 25000,
    created_at: '2024-01-14T14:30:00Z'
  },
  {
    id: '3',
    name: 'Mohammed Hassan',
    email: 'mohammed@greentech.ae',
    mobile: '+971503456789',
    company: 'Green Tech Industries',
    leadSource: 'Social Media',
    licenseType: 'Offshore',
    status: 'Complete',
    amount: 35000,
    created_at: '2024-01-13T09:15:00Z'
  },
  {
    id: '4',
    name: 'Lisa Chen',
    email: 'lisa@innovate.ae',
    mobile: '+971504567890',
    company: 'Innovate Consulting',
    leadSource: 'Google Ads',
    licenseType: 'Mainland',
    status: 'Sent to Bank',
    amount: 18000,
    created_at: '2024-01-12T16:45:00Z'
  },
  {
    id: '5',
    name: 'Omar Abdullah',
    email: 'omar@logistics.ae',
    mobile: '+971505678901',
    company: 'Express Logistics',
    leadSource: 'Website',
    licenseType: 'Freezone',
    status: 'Need More Info',
    amount: 22000,
    created_at: '2024-01-11T11:20:00Z'
  }
];

const OptimizedDashboard = () => {
  const { customers, setCustomers, refreshData } = useCustomer();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);

  // Set up real-time subscriptions for dashboard data
  useRealtimeSubscription({
    table: 'customers',
    onUpdate: () => {
      console.log('Dashboard: Customer data updated');
      setRefreshKey(prev => prev + 1);
      refreshData();
    }
  });

  useRealtimeSubscription({
    table: 'documents',
    onUpdate: () => {
      console.log('Dashboard: Document data updated');
      setRefreshKey(prev => prev + 1);
    }
  });

  useRealtimeSubscription({
    table: 'status_changes',
    onUpdate: () => {
      console.log('Dashboard: Status changes updated');
      setRefreshKey(prev => prev + 1);
    }
  });

  // Load mock data for now (replace with real data loading later)
  useEffect(() => {
    if (customers.length === 0) {
      setCustomers(mockCustomers);
    }
  }, [customers.length, setCustomers]);

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

  // Calculate statistics
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
    console.log('Manual data refresh triggered');
    setRefreshKey(prev => prev + 1);
    refreshData();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.profile?.name || user?.email}
            </p>
          </div>
          <Button onClick={() => navigate('/customers/new')} className="mt-4 md:mt-0">
            <Plus className="mr-2 h-4 w-4" />
            New Customer
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                Active customer accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Cases</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedCases}</div>
              <p className="text-xs text-muted-foreground">
                Successfully processed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Cases</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingCases}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting processing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                From completed cases
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Submitted">Submitted</SelectItem>
                    <SelectItem value="Returned">Returned</SelectItem>
                    <SelectItem value="Sent to Bank">Sent to Bank</SelectItem>
                    <SelectItem value="Complete">Complete</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Need More Info">Need More Info</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <OptimizedCustomerTable 
              customers={filteredCustomers} 
              onDataChange={handleDataRefresh}
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default OptimizedDashboard;
