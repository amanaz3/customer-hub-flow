
import React, { createContext, useContext, ReactNode } from 'react';
import { Customer, StatusChange, Document } from '@/types/customer';
import { useCustomerData } from '@/hooks/useCustomerData';
import { useCustomerActions } from '@/hooks/useCustomerActions';

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
  updateApplicationStatus: (applicationId: string, status: string, comment: string, changedBy: string, role: string, completedAt?: string) => void;
  submitApplicationToAdmin: (applicationId: string, userId: string) => void;
  deleteDocument: (customerId: string, documentId: string, filePath: string) => Promise<void>;
  replaceDocument: (customerId: string, documentId: string, oldFilePath: string, newFile: File) => Promise<void>;
  isLoading: boolean;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    customers,
    setCustomers,
    statusChanges,
    setStatusChanges,
    documents,
    setDocuments,
    isLoading,
    refreshData
  } = useCustomerData();

  const {
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
    getCustomersByUserId,
    uploadDocument,
    updateApplicationStatus,
    submitApplicationToAdmin,
    deleteDocument,
    replaceDocument
  } = useCustomerActions(customers, setCustomers, setDocuments, refreshData);

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
      updateApplicationStatus,
      submitApplicationToAdmin,
      deleteDocument,
      replaceDocument,
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

// Re-export types for backward compatibility
export type { Customer, StatusChange, Document } from '@/types/customer';
