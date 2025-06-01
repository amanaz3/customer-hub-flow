
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { Database } from '@/integrations/supabase/types';

export type Status = Database['public']['Enums']['customer_status'];
export type LeadSource = Database['public']['Enums']['lead_source'];
export type LicenseType = Database['public']['Enums']['license_type'];
export type DocumentCategory = Database['public']['Enums']['document_category'];

export interface Document {
  id: string;
  name: string;
  file_path: string | null;
  is_mandatory: boolean;
  is_uploaded: boolean;
  category: DocumentCategory;
  requires_license_type?: LicenseType;
}

export interface StatusChange {
  id: string;
  previous_status: Status;
  new_status: Status;
  comment: string | null;
  changed_by: string;
  changed_by_role: 'admin' | 'user';
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  company: string;
  email: string;
  lead_source: LeadSource;
  license_type: LicenseType;
  status: Status;
  amount: number;
  documents: Document[];
  user_id: string;
  comments: string[];
  status_history: StatusChange[];
  created_at: string;
  payment_received?: boolean;
  payment_date?: string;
}

interface CustomerContextType {
  customers: Customer[];
  loading: boolean;
  addCustomer: (customer: Omit<Customer, 'id' | 'created_at' | 'status_history' | 'documents' | 'comments'>) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Omit<Customer, 'id'>>) => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
  getCustomersByUserId: (userId: string) => Customer[];
  getCustomersByStatus: (status: Status) => Customer[];
  updateCustomerStatus: (id: string, status: Status, comment: string, changedBy: string, changedByRole: 'admin' | 'user') => Promise<void>;
  uploadDocument: (customerId: string, documentId: string, filePath: string) => Promise<void>;
  markPaymentReceived: (id: string, changedBy: string) => Promise<void>;
  submitToAdmin: (id: string, userId: string, userName: string) => Promise<void>;
  refreshCustomers: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  const fetchCustomers = async () => {
    if (!isAuthenticated || !user) {
      setCustomers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch customers with documents
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select(`
          *,
          documents (*)
        `);

      if (customersError) {
        console.error('Error fetching customers:', customersError);
        return;
      }

      // Fetch status changes and comments for each customer
      const customersWithHistory = await Promise.all(
        (customersData || []).map(async (customer) => {
          // Fetch status changes
          const { data: statusData } = await supabase
            .from('status_changes')
            .select('*')
            .eq('customer_id', customer.id)
            .order('created_at', { ascending: true });

          // Fetch comments
          const { data: commentsData } = await supabase
            .from('comments')
            .select('*')
            .eq('customer_id', customer.id)
            .order('created_at', { ascending: true });

          return {
            ...customer,
            documents: customer.documents || [],
            status_history: statusData || [],
            comments: (commentsData || []).map(c => c.comment)
          };
        })
      );

      setCustomers(customersWithHistory);
    } catch (error) {
      console.error('Error in fetchCustomers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [isAuthenticated, user]);

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'created_at' | 'status_history' | 'documents' | 'comments'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('customers')
      .insert([{
        name: customerData.name,
        mobile: customerData.mobile,
        company: customerData.company,
        email: customerData.email,
        lead_source: customerData.lead_source,
        license_type: customerData.license_type,
        amount: customerData.amount,
        user_id: user.id,
        status: 'Draft' as Status
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding customer:', error);
      throw error;
    }

    await fetchCustomers();
  };

  const updateCustomer = async (id: string, updates: Partial<Omit<Customer, 'id'>>) => {
    const { error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating customer:', error);
      throw error;
    }

    await fetchCustomers();
  };

  const updateCustomerStatus = async (id: string, status: Status, comment: string, changedBy: string, changedByRole: 'admin' | 'user') => {
    const customer = customers.find(c => c.id === id);
    if (!customer || !user) return;

    // Update customer status
    const { error: updateError } = await supabase
      .from('customers')
      .update({ status })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating status:', updateError);
      throw updateError;
    }

    // Add status change record
    const { error: statusError } = await supabase
      .from('status_changes')
      .insert([{
        customer_id: id,
        previous_status: customer.status,
        new_status: status,
        comment,
        changed_by: user.id,
        changed_by_role: changedByRole
      }]);

    if (statusError) {
      console.error('Error adding status change:', statusError);
      throw statusError;
    }

    // Add comment if provided
    if (comment) {
      const { error: commentError } = await supabase
        .from('comments')
        .insert([{
          customer_id: id,
          comment,
          created_by: user.id
        }]);

      if (commentError) {
        console.error('Error adding comment:', commentError);
        throw commentError;
      }
    }

    await fetchCustomers();
  };

  const markPaymentReceived = async (id: string, changedBy: string) => {
    await updateCustomerStatus(id, 'Paid', 'Payment received', changedBy, 'admin');
    
    await supabase
      .from('customers')
      .update({ 
        payment_received: true, 
        payment_date: new Date().toISOString() 
      })
      .eq('id', id);
  };

  const uploadDocument = async (customerId: string, documentId: string, filePath: string) => {
    const { error } = await supabase
      .from('documents')
      .update({ 
        file_path: filePath, 
        is_uploaded: true 
      })
      .eq('id', documentId);

    if (error) {
      console.error('Error uploading document:', error);
      throw error;
    }

    await fetchCustomers();
  };

  const submitToAdmin = async (id: string, userId: string, userName: string) => {
    await updateCustomerStatus(id, 'Submitted', 'Submitted to admin for review', userName, 'user');
  };

  const getCustomerById = (id: string) => {
    return customers.find(customer => customer.id === id);
  };

  const getCustomersByUserId = (userId: string) => {
    return customers.filter(customer => customer.user_id === userId);
  };

  const getCustomersByStatus = (status: Status) => {
    return customers.filter(customer => customer.status === status);
  };

  const refreshCustomers = async () => {
    await fetchCustomers();
  };

  const value = {
    customers,
    loading,
    addCustomer,
    updateCustomer,
    getCustomerById,
    getCustomersByUserId,
    getCustomersByStatus,
    updateCustomerStatus,
    uploadDocument,
    markPaymentReceived,
    submitToAdmin,
    refreshCustomers
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomers = () => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
};
