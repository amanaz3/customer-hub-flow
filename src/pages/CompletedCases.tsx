
import React, { useState, useMemo, memo } from 'react';
import OptimizedCustomerTable from '@/components/Customer/OptimizedCustomerTable';
import LazyWrapper from '@/components/Performance/LazyWrapper';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useCustomers } from '@/contexts/CustomerContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const CompletedCases = () => {
  const { user, isAdmin } = useAuth();
  const { customers, getCustomersByUserId } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Complete'>('all');
  
  const { filteredCustomers, completeCount } = useMemo(() => {
    // For regular users, show only their completed customers
    // For admins, show all completed customers
    const completedCustomers = isAdmin 
      ? customers.filter(c => c.status === 'Complete')
      : getCustomersByUserId(user?.id || '').filter(c => c.status === 'Complete');
    
    // Apply status filter (only 'all' and 'Complete' now)
    const statusFiltered = statusFilter === 'all' 
      ? completedCustomers 
      : completedCustomers.filter(c => c.status === statusFilter);
    
    // Apply search filter
    const searchFiltered = statusFiltered.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const complete = completedCustomers.length;

    return {
      filteredCustomers: searchFiltered,
      completeCount: complete,
      totalCompleted: completedCustomers.length
    };
  }, [customers, isAdmin, user?.id, getCustomersByUserId, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Completed Cases</h1>
          <p className="text-muted-foreground">
            View all completed applications
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
            
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All ({completeCount})
              </Button>
              <Button
                variant={statusFilter === 'Complete' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('Complete')}
              >
                Complete ({completeCount})
              </Button>
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
