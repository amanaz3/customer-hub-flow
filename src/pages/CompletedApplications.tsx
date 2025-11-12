import React, { useState, useMemo, memo, useEffect } from 'react';
import LazyWrapper from '@/components/Performance/LazyWrapper';
import { useAuth } from '@/contexts/SecureAuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Application } from '@/types/application';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

type ApplicationWithCustomer = Application;

const CompletedApplications = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'paid'>('all');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [applications, setApplications] = useState<ApplicationWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch applications
  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Fetch completed and paid applications
        let query = supabase
          .from('account_applications')
          .select(`
            *,
            customer:customers(id, name, email, mobile, company, license_type, user_id)
          `)
          .in('status', ['completed', 'paid'])
          .order('completed_at', { ascending: false });
        
        // Non-admins only see their own applications
        if (!isAdmin) {
          query = query.eq('customer.user_id', user.id);
        }
        
        const { data: apps, error } = await query;
        
        if (error) throw error;
        
        setApplications(apps as ApplicationWithCustomer[] || []);
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchApplications();
  }, [user, isAdmin]);
  
  // Generate available months from completed_at dates
  // Generate available months from all applications
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    
    applications.forEach(app => {
      // Use completed_at for all applications (both completed and paid should have this)
      if (app.completed_at) {
        const date = new Date(app.completed_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthKey);
      }
    });
    
    return Array.from(months).sort().reverse().map(monthKey => {
      const [year, month] = monthKey.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return {
        key: monthKey,
        label: format(date, "MMMM yyyy")
      };
    });
  }, [applications]);

  const { filteredApplications, completeCount, paidCount, totalRevenue } = useMemo(() => {
    // Apply status filter from account_applications.status
    let statusFiltered = applications;
    if (statusFilter === 'completed') {
      // Filter by completed status in account_applications table
      statusFiltered = applications.filter(a => a.status === 'completed');
    } else if (statusFilter === 'paid') {
      statusFiltered = applications.filter(a => a.status === 'paid');
    }
    // 'all' shows both completed and paid (no additional filtering needed)
    
    // Apply month filter using account_applications.completed_at
    const monthFiltered = selectedMonths.length > 0
      ? statusFiltered.filter(app => {
          // Use completed_at from account_applications table for month filtering
          if (!app.completed_at) return false;
          
          const appDate = new Date(app.completed_at);
          const monthKey = `${appDate.getFullYear()}-${String(appDate.getMonth() + 1).padStart(2, '0')}`;
          return selectedMonths.includes(monthKey);
        })
      : statusFiltered;
    
    // Apply search filter
    const searchFiltered = monthFiltered.filter(app => 
      app.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.customer?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.reference_number?.toString().includes(searchTerm)
    );
    
    const complete = applications.filter(a => a.status === 'completed').length;
    const paid = applications.filter(a => a.status === 'paid').length;
    
    // Calculate revenue from filtered results
    const revenue = searchFiltered.reduce((sum, app) => sum + (app.application_data?.amount || 0), 0);

    return {
      filteredApplications: searchFiltered,
      completeCount: complete,
      paidCount: paid,
      totalRevenue: revenue
    };
  }, [applications, searchTerm, statusFilter, selectedMonths]);

  const toggleMonth = (monthKey: string) => {
    setSelectedMonths(prev => 
      prev.includes(monthKey) 
        ? prev.filter(m => m !== monthKey)
        : [...prev, monthKey]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Completed Applications</h1>
        <p className="text-muted-foreground">
          Completed: {completeCount} | Paid: {paidCount} | Revenue: {new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(totalRevenue)}
        </p>
      </div>
      
      <LazyWrapper className="min-h-[100px]">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <Input
            placeholder="Search by name, company, email, or ref#..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:max-w-xs"
          />
          
          <Select value={statusFilter} onValueChange={(value: 'all' | 'completed' | 'paid') => setStatusFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  selectedMonths.length === 0 && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedMonths.length > 0 
                  ? `${selectedMonths.length} month${selectedMonths.length > 1 ? 's' : ''} selected`
                  : "Filter by months"}
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-auto p-4 bg-popover z-[100] pointer-events-auto border shadow-lg" 
              align="start"
              sideOffset={5}
            >
              <div className="space-y-3 pointer-events-auto">
                <div className="text-sm font-medium text-popover-foreground">Select months:</div>
                {availableMonths.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2">
                    No months available. Applications data may still be loading.
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-2 pointer-events-auto">
                    {availableMonths.map((month) => (
                      <div key={month.key} className="flex items-center space-x-2 pointer-events-auto">
                        <Checkbox
                          id={month.key}
                          checked={selectedMonths.includes(month.key)}
                          onCheckedChange={() => toggleMonth(month.key)}
                          className="pointer-events-auto"
                        />
                        <label
                          htmlFor={month.key}
                          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none pointer-events-auto"
                          onClick={() => toggleMonth(month.key)}
                        >
                          {month.label}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                {selectedMonths.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMonths([])}
                    className="w-full pointer-events-auto"
                  >
                    Clear all
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          {selectedMonths.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedMonths([])}
              className="h-8 px-2 lg:px-3"
            >
              Clear months
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </LazyWrapper>
      
      <LazyWrapper>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref#</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Application Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading applications...
                  </TableCell>
                </TableRow>
              ) : filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No applications found
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((app) => (
                  <TableRow 
                    key={app.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/applications/${app.id}`)}
                  >
                    <TableCell className="font-medium">#{app.reference_number}</TableCell>
                    <TableCell>{app.customer?.name}</TableCell>
                    <TableCell>{app.customer?.company}</TableCell>
                    <TableCell className="capitalize">{app.application_type?.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <Badge variant={app.status === 'completed' ? 'default' : 'secondary'}>
                        {app.status === 'completed' ? 'Completed' : 'Paid'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('en-AE', { 
                        style: 'currency', 
                        currency: 'AED' 
                      }).format(app.application_data?.amount || 0)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </LazyWrapper>
    </div>
  );
};

export default memo(CompletedApplications);
