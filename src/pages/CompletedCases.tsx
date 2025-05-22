
import React, { useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import CustomerTable from '@/components/Customer/CustomerTable';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomers } from '@/contexts/CustomerContext';
import { Input } from '@/components/ui/input';

const CompletedCases = () => {
  const { user, isAdmin } = useAuth();
  const { customers, getCustomersByUserId } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  
  // For regular users, show only their completed customers
  // For admins, show all completed customers
  const completedCustomers = isAdmin 
    ? customers.filter(c => c.status === 'Completed')
    : getCustomersByUserId(user?.id || '').filter(c => c.status === 'Completed');
  
  // Apply search filter
  const filteredCustomers = completedCustomers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Completed Cases</h1>
          <p className="text-muted-foreground">
            View all finalized customer submissions
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <Input
            placeholder="Search by name, company, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:max-w-xs"
          />
        </div>
        
        <CustomerTable customers={filteredCustomers} />
      </div>
    </MainLayout>
  );
};

export default CompletedCases;
