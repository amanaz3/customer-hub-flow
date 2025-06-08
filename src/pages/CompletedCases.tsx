
import React, { useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import CustomerTable from '@/components/Customer/CustomerTable';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useCustomers } from '@/contexts/CustomerContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const CompletedCases = () => {
  const { user, isAdmin } = useAuth();
  const { customers, getCustomersByUserId } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Complete' | 'Paid'>('all');
  
  // For regular users, show only their completed customers
  // For admins, show all completed customers
  const completedCustomers = isAdmin 
    ? customers.filter(c => ['Complete', 'Paid'].includes(c.status))
    : getCustomersByUserId(user?.id || '').filter(c => ['Complete', 'Paid'].includes(c.status));
  
  // Apply status filter
  const statusFilteredCustomers = statusFilter === 'all' 
    ? completedCustomers 
    : completedCustomers.filter(c => c.status === statusFilter);
  
  // Apply search filter
  const filteredCustomers = statusFilteredCustomers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const completeCount = completedCustomers.filter(c => c.status === 'Complete').length;
  const paidCount = completedCustomers.filter(c => c.status === 'Paid').length;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Completed Cases</h1>
          <p className="text-muted-foreground">
            View all completed and paid applications
          </p>
        </div>
        
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
              All ({completedCustomers.length})
            </Button>
            <Button
              variant={statusFilter === 'Complete' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('Complete')}
            >
              Complete ({completeCount})
            </Button>
            <Button
              variant={statusFilter === 'Paid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('Paid')}
            >
              Paid ({paidCount})
            </Button>
          </div>
        </div>
        
        <CustomerTable customers={filteredCustomers} />
      </div>
    </MainLayout>
  );
};

export default CompletedCases;
