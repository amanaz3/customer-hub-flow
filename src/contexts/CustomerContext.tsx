
import React, { createContext, useContext, useState } from 'react';

export type Status = 'Pending' | 'Returned' | 'Submitted to Bank' | 'Completed';
export type LeadSource = 'Website' | 'Referral' | 'Social Media' | 'Other';

export interface Document {
  id: string;
  name: string;
  filePath: string | null;
  isMandatory: boolean;
  isUploaded: boolean;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  company: string;
  email: string;
  leadSource: LeadSource;
  status: Status;
  amount: number;
  documents: Document[];
  userId: string;
  comments: string[];
  createdAt: Date;
}

interface CustomerContextType {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (id: string, updates: Partial<Omit<Customer, 'id'>>) => void;
  getCustomerById: (id: string) => Customer | undefined;
  getCustomersByUserId: (userId: string) => Customer[];
  getCustomersByStatus: (status: Status) => Customer[];
  updateCustomerStatus: (id: string, status: Status, comment?: string) => void;
  uploadDocument: (customerId: string, documentId: string, filePath: string) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

// Default document types
const defaultDocuments: Document[] = [
  { id: 'd1', name: 'ID Proof', filePath: null, isMandatory: true, isUploaded: false },
  { id: 'd2', name: 'Address Proof', filePath: null, isMandatory: true, isUploaded: false },
  { id: 'd3', name: 'Income Proof', filePath: null, isMandatory: true, isUploaded: false },
  { id: 'd4', name: 'Bank Statements', filePath: null, isMandatory: true, isUploaded: false },
  { id: 'd5', name: 'Property Documents', filePath: null, isMandatory: true, isUploaded: false },
  { id: 'd6', name: 'Tax Returns', filePath: null, isMandatory: false, isUploaded: false },
  { id: 'd7', name: 'Employment Verification', filePath: null, isMandatory: false, isUploaded: false },
  { id: 'd8', name: 'Credit Report', filePath: null, isMandatory: false, isUploaded: false },
  { id: 'd9', name: 'Application Form', filePath: null, isMandatory: true, isUploaded: false },
  { id: 'd10', name: 'Other Documents', filePath: null, isMandatory: false, isUploaded: false },
];

// Mock initial data
const mockCustomers: Customer[] = [
  {
    id: 'c1',
    name: 'John Doe',
    mobile: '+1 234 567 8901',
    company: 'ABC Corp',
    email: 'john@example.com',
    leadSource: 'Website',
    status: 'Pending',
    amount: 25000,
    documents: [...defaultDocuments],
    userId: '2',
    comments: [],
    createdAt: new Date('2023-01-15')
  },
  {
    id: 'c2',
    name: 'Jane Smith',
    mobile: '+1 987 654 3210',
    company: 'XYZ Inc',
    email: 'jane@example.com',
    leadSource: 'Referral',
    status: 'Submitted to Bank',
    amount: 50000,
    documents: [...defaultDocuments],
    userId: '2',
    comments: ['All documents verified'],
    createdAt: new Date('2023-02-20')
  },
  {
    id: 'c3',
    name: 'Alice Johnson',
    mobile: '+1 555 123 4567',
    company: 'Johnson LLC',
    email: 'alice@example.com',
    leadSource: 'Social Media',
    status: 'Completed',
    amount: 75000,
    documents: [...defaultDocuments],
    userId: '2',
    comments: ['Approved by bank', 'Payment processed'],
    createdAt: new Date('2023-03-05')
  }
];

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);

  const addCustomer = (customer: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: `c${customers.length + 1}`,
      createdAt: new Date(),
      documents: [...defaultDocuments]
    };
    setCustomers([...customers, newCustomer]);
  };

  const updateCustomer = (id: string, updates: Partial<Omit<Customer, 'id'>>) => {
    setCustomers(customers.map(customer => 
      customer.id === id ? { ...customer, ...updates } : customer
    ));
  };

  const getCustomerById = (id: string) => {
    return customers.find(customer => customer.id === id);
  };

  const getCustomersByUserId = (userId: string) => {
    return customers.filter(customer => customer.userId === userId);
  };

  const getCustomersByStatus = (status: Status) => {
    return customers.filter(customer => customer.status === status);
  };

  const updateCustomerStatus = (id: string, status: Status, comment?: string) => {
    setCustomers(customers.map(customer => {
      if (customer.id === id) {
        const updatedCustomer = { ...customer, status };
        if (comment) {
          updatedCustomer.comments = [...customer.comments, comment];
        }
        return updatedCustomer;
      }
      return customer;
    }));
  };

  const uploadDocument = (customerId: string, documentId: string, filePath: string) => {
    setCustomers(customers.map(customer => {
      if (customer.id === customerId) {
        const updatedDocuments = customer.documents.map(doc => 
          doc.id === documentId 
            ? { ...doc, filePath, isUploaded: true } 
            : doc
        );
        return { ...customer, documents: updatedDocuments };
      }
      return customer;
    }));
  };

  const value = {
    customers,
    addCustomer,
    updateCustomer,
    getCustomerById,
    getCustomersByUserId,
    getCustomersByStatus,
    updateCustomerStatus,
    uploadDocument,
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
