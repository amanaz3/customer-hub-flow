
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

export interface Customer {
  id: string;
  name: string;
  email: string;
  mobile: string;
  company: string;
  leadSource: string;
  licenseType: string;
  status: string;
  amount: number;
  user_id?: string;
  payment_received?: boolean;
  payment_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StatusChange {
  id: string;
  customer_id: string;
  previous_status: string;
  new_status: string;
  changed_by: string;
  changed_by_role: string;
  comment?: string;
  created_at: string;
}

export interface Document {
  id: string;
  customer_id: string;
  name: string;
  is_mandatory: boolean;
  is_uploaded: boolean;
  category: string;
  requires_license_type?: string;
  file_path?: string;
  created_at?: string;
  updated_at?: string;
}

interface CustomerContextType {
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  getCustomerById: (id: string) => Customer | undefined;
  statusChanges: StatusChange[];
  setStatusChanges: (changes: StatusChange[]) => void;
  documents: Document[];
  setDocuments: (documents: Document[]) => void;
  refreshData: () => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [statusChanges, setStatusChanges] = useState<StatusChange[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);

  const refreshData = () => {
    // This function can be called to manually refresh data
    // Individual components should implement their own data fetching
    console.log('Data refresh requested');
  };

  // Set up real-time subscriptions for all tables
  useRealtimeSubscription({
    table: 'customers',
    onUpdate: refreshData
  });

  useRealtimeSubscription({
    table: 'status_changes',
    onUpdate: refreshData
  });

  useRealtimeSubscription({
    table: 'documents',
    onUpdate: refreshData
  });

  useRealtimeSubscription({
    table: 'comments',
    onUpdate: refreshData
  });

  const addCustomer = (customer: Customer) => {
    setCustomers(prev => [...prev, customer]);
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => 
      prev.map(customer => 
        customer.id === id ? { ...customer, ...updates } : customer
      )
    );
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(customer => customer.id !== id));
  };

  const getCustomerById = (id: string) => {
    return customers.find(customer => customer.id === id);
  };

  return (
    <CustomerContext.Provider value={{
      customers,
      setCustomers,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      getCustomerById,
      statusChanges,
      setStatusChanges,
      documents,
      setDocuments,
      refreshData
    }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};
