import React, { useState, useMemo, memo } from 'react';
import OptimizedCustomerTable from '@/components/Customer/OptimizedCustomerTable';
import LazyWrapper from '@/components/Performance/LazyWrapper';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useCustomers } from '@/contexts/CustomerContext';
import { Input } from '@/components/ui/input';

const RejectedCases = () => {
  const { user, isAdmin } = useAuth();
  const { customers, getCustomersByUserId } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { filteredCustomers, rejectedCount } = useMemo(() => {
    // For regular users, show only their rejected applications
    // For admins, show all rejected applications
    const rejectedApplications = isAdmin 
      ? customers.filter(c => c.status === 'Rejected')
      : getCustomersByUserId(user?.id || '').filter(c => c.status === 'Rejected');
    
    // Apply search filter
    const searchFiltered = rejectedApplications.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return {
      filteredCustomers: searchFiltered,
      rejectedCount: rejectedApplications.length,
    };
  }, [customers, isAdmin, user?.id, getCustomersByUserId, searchTerm]);

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Rejected Cases</h1>
          <p className="text-muted-foreground">
            View rejected applications {!isAdmin && 'you submitted'}
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
              <div className="text-sm text-muted-foreground px-3 py-2 bg-muted rounded-md">
                Rejected: {rejectedCount}
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

export default memo(RejectedCases);