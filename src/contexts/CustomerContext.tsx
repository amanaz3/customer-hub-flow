
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useToast } from '@/hooks/use-toast';
import { googleDriveService } from '@/services/googleDriveService';

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
  // Additional properties for frontend compatibility
  documents?: Document[];
  comments?: Comment[];
  statusHistory?: StatusChange[];
  driveFolderId?: string;
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

// Type aliases for compatibility
export type Status = string;
export type CustomerStatus = string;
export type LeadSource = 'Website' | 'Referral' | 'Social Media' | 'Other';
export type LicenseType = 'Mainland' | 'Freezone' | 'Offshore';

export interface Comment {
  id: string;
  content: string;
  author: string;
  timestamp: string;
}

interface CustomerContextType {
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  addCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  getCustomerById: (id: string) => Customer | undefined;
  getCustomersByUserId: (userId: string) => Customer[];
  statusChanges: StatusChange[];
  setStatusChanges: (changes: StatusChange[]) => void;
  documents: Document[];
  setDocuments: (documents: Document[]) => void;
  refreshData: () => Promise<void>;
  uploadDocument: (customerId: string, documentId: string, filePath: string) => Promise<void>;
  updateCustomerStatus: (customerId: string, status: string, comment: string, changedBy: string, role: string) => void;
  markPaymentReceived: (customerId: string, changedBy: string) => void;
  submitToAdmin: (customerId: string, userId: string, userName: string) => void;
  isLoading: boolean;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [statusChanges, setStatusChanges] = useState<StatusChange[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCustomers = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customers:', error);
        toast({
          title: "Error",
          description: "Failed to fetch customers",
          variant: "destructive",
        });
        return;
      }

      // Fetch documents for each customer
      const customersWithDocuments = await Promise.all(
        (data || []).map(async (customer) => {
          const { data: docsData } = await supabase
            .from('documents')
            .select('*')
            .eq('customer_id', customer.id);

          return {
            ...customer,
            leadSource: customer.lead_source,
            licenseType: customer.license_type,
            documents: docsData || []
          };
        })
      );

      setCustomers(customersWithDocuments);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchCustomers();
  };

  useEffect(() => {
    fetchCustomers();
  }, [user]);

  const addCustomer = async (customer: Customer) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    try {
      // Create Google Drive folder first
      let driveFolderId: string | undefined;
      try {
        const folderName = `${customer.name} - ${customer.company}`;
        driveFolderId = await googleDriveService.createCustomerFolder(folderName);
        console.log('Google Drive folder created:', driveFolderId);
      } catch (driveError) {
        console.error('Google Drive folder creation failed:', driveError);
        // Continue without Drive folder - we'll handle this gracefully
      }

      // Insert customer into database with proper type casting
      const customerData = {
        name: customer.name,
        email: customer.email,
        mobile: customer.mobile,
        company: customer.company,
        lead_source: customer.leadSource as "Website" | "Referral" | "Social Media" | "Other",
        license_type: customer.licenseType as "Mainland" | "Freezone" | "Offshore",
        amount: customer.amount,
        status: customer.status as "Draft" | "Submitted" | "Returned" | "Sent to Bank" | "Complete" | "Rejected" | "Need More Info" | "Paid",
        user_id: user.id,
        drive_folder_id: driveFolderId
      };

      const { data, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        throw new Error('Failed to create customer in database');
      }

      console.log('Customer created in database:', data);
      
      // Refresh the customers list to show the new customer
      await fetchCustomers();
      
      if (!driveFolderId) {
        throw new Error('Google Drive folder creation failed');
      }
      
    } catch (error) {
      console.error('Add customer error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
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

  const getCustomersByUserId = (userId: string) => {
    return customers.filter(customer => customer.user_id === userId);
  };

  const uploadDocument = async (customerId: string, documentId: string, filePath: string) => {
    try {
      // Parse the Google Drive file info from filePath
      const fileInfo = JSON.parse(filePath);
      
      // Update document in database
      const { error } = await supabase
        .from('documents')
        .update({ 
          is_uploaded: true, 
          file_path: filePath,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (error) {
        console.error('Error updating document:', error);
        throw error;
      }

      // Update local state
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, is_uploaded: true, file_path: filePath }
            : doc
        )
      );

      // Update customer's documents
      setCustomers(prev => 
        prev.map(customer => 
          customer.id === customerId 
            ? {
                ...customer,
                documents: customer.documents?.map(doc => 
                  doc.id === documentId 
                    ? { ...doc, is_uploaded: true, file_path: filePath }
                    : doc
                ) || []
              }
            : customer
        )
      );

      console.log('Document uploaded successfully:', fileInfo);
    } catch (error) {
      console.error('Error in uploadDocument:', error);
      throw error;
    }
  };

  const updateCustomerStatus = (customerId: string, status: string, comment: string, changedBy: string, role: string) => {
    console.log('Update customer status:', { customerId, status, comment, changedBy, role });
    // Implementation would go here
  };

  const markPaymentReceived = (customerId: string, changedBy: string) => {
    console.log('Mark payment received:', { customerId, changedBy });
    // Implementation would go here
  };

  const submitToAdmin = (customerId: string, userId: string, userName: string) => {
    console.log('Submit to admin:', { customerId, userId, userName });
    // Implementation would go here
  };

  return (
    <CustomerContext.Provider value={{
      customers,
      setCustomers,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      getCustomerById,
      getCustomersByUserId,
      statusChanges,
      setStatusChanges,
      documents,
      setDocuments,
      refreshData,
      uploadDocument,
      updateCustomerStatus,
      markPaymentReceived,
      submitToAdmin,
      isLoading
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

// Export alias for backward compatibility
export const useCustomers = useCustomer;
