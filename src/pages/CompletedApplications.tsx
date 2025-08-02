
import React, { useState, useMemo, memo } from 'react';
import OptimizedCustomerTable from '@/components/Customer/OptimizedCustomerTable';
import LazyWrapper from '@/components/Performance/LazyWrapper';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useCustomers } from '@/contexts/CustomerContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const CompletedApplications = () => {
  const { user, isAdmin } = useAuth();
  const { customers, getCustomersByUserId } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Complete' | 'Paid'>('all');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  
  // Generate available months from the data
  const availableMonths = useMemo(() => {
    const completedApplications = isAdmin 
      ? customers.filter(c => c.status === 'Complete' || c.status === 'Paid')
      : getCustomersByUserId(user?.id || '').filter(c => c.status === 'Complete' || c.status === 'Paid');
    
    const months = new Set<string>();
    completedApplications.forEach(customer => {
      if (customer.created_at) {
        const date = new Date(customer.created_at);
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
  }, [customers, isAdmin, user?.id, getCustomersByUserId]);

  const { filteredCustomers, completeCount, paidCount, totalRevenue } = useMemo(() => {
    // For regular users, show only their completed applications
    // For admins, show all completed applications
    const completedApplications = isAdmin 
      ? customers.filter(c => c.status === 'Complete' || c.status === 'Paid')
      : getCustomersByUserId(user?.id || '').filter(c => c.status === 'Complete' || c.status === 'Paid');
    
    // Apply status filter
    const statusFiltered = statusFilter === 'all' 
      ? completedApplications 
      : completedApplications.filter(c => c.status === statusFilter);
    
    // Apply month filter
    const monthFiltered = selectedMonths.length > 0
      ? statusFiltered.filter(customer => {
          if (!customer.created_at) return false;
          const customerDate = new Date(customer.created_at);
          const monthKey = `${customerDate.getFullYear()}-${customerDate.getMonth()}`;
          return selectedMonths.includes(monthKey);
        })
      : statusFiltered;
    
    // Apply search filter
    const searchFiltered = monthFiltered.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const complete = completedApplications.filter(c => c.status === 'Complete').length;
    const paid = completedApplications.filter(c => c.status === 'Paid').length;
    
    // Calculate revenue from filtered results
    const revenue = searchFiltered.reduce((sum, c) => sum + c.amount, 0);

    return {
      filteredCustomers: searchFiltered,
      completeCount: complete,
      paidCount: paid,
      totalCompleted: completedApplications.length,
      totalRevenue: revenue
    };
  }, [customers, isAdmin, user?.id, getCustomersByUserId, searchTerm, statusFilter, selectedMonths]);

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
            View completed applications {!isAdmin && 'you submitted'} (Revenue: {new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(totalRevenue)})
          </p>
        </div>
        
        <LazyWrapper className="min-h-[100px]">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <Input
              placeholder="Search by name, company, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:max-w-xs"
            />
            
            <Select value={statusFilter} onValueChange={(value: 'all' | 'Complete' | 'Paid') => setStatusFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Complete">Complete</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
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
              <PopoverContent className="w-auto p-4" align="start">
                <div className="space-y-3">
                  <div className="text-sm font-medium">Select months:</div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {availableMonths.map((month) => (
                      <div key={month.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={month.key}
                          checked={selectedMonths.includes(month.key)}
                          onCheckedChange={() => toggleMonth(month.key)}
                        />
                        <label
                          htmlFor={month.key}
                          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {month.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  {selectedMonths.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMonths([])}
                      className="w-full"
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
            
            <div className="flex gap-2">
              <div className="text-sm text-muted-foreground px-3 py-2 bg-muted rounded-md">
                Complete: {completeCount} | Paid: {paidCount}
              </div>
            </div>
          </div>
        </LazyWrapper>
        
        <LazyWrapper>
          <OptimizedCustomerTable customers={filteredCustomers} />
        </LazyWrapper>
      </div>
    );
  };

export default memo(CompletedApplications);
