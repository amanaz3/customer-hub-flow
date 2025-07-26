
import React, { useState, useMemo, memo } from 'react';
import OptimizedCustomerTable from '@/components/Customer/OptimizedCustomerTable';
import LazyWrapper from '@/components/Performance/LazyWrapper';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useCustomers } from '@/contexts/CustomerContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CompletedCases = () => {
  const { user, isAdmin } = useAuth();
  const { customers, getCustomersByUserId } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Complete' | 'Paid'>('all');
  
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
    
    // Apply search filter
    const searchFiltered = statusFiltered.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const complete = completedApplications.filter(c => c.status === 'Complete').length;
    const paid = completedApplications.filter(c => c.status === 'Paid').length;
    
    // Calculate revenue from completed applications (role-based filtering already applied)
    const revenue = completedApplications.reduce((sum, c) => sum + c.amount, 0);

    return {
      filteredCustomers: searchFiltered,
      completeCount: complete,
      paidCount: paid,
      totalCompleted: completedApplications.length,
      totalRevenue: revenue
    };
  }, [customers, isAdmin, user?.id, getCustomersByUserId, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Completed Cases</h1>
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

export default memo(CompletedCases);
