
import React, { useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import CustomerTable from '@/components/Customer/CustomerTable';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomers } from '@/contexts/CustomerContext';
import { Input } from '@/components/ui/input';
import { Status } from '@/contexts/CustomerContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CustomerList = () => {
  const { user, isAdmin } = useAuth();
  const { customers, getCustomersByUserId } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // For regular users, show only their customers
  // For admins, show all customers
  const userCustomers = isAdmin 
    ? customers.filter(c => c.status !== 'Completed') 
    : getCustomersByUserId(user?.id || '').filter(c => c.status !== 'Completed');
  
  // Apply filters
  const filteredCustomers = userCustomers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? 'Manage all customer submissions' 
              : 'Manage your customer submissions'}
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <Input
            placeholder="Search by name, company, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:max-w-xs"
          />
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="md:max-w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Returned">Returned</SelectItem>
              <SelectItem value="Submitted to Bank">Submitted to Bank</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <CustomerTable customers={filteredCustomers} />
      </div>
    </MainLayout>
  );
};

export default CustomerList;
