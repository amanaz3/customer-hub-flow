import React, { createContext, useContext, useState } from 'react';

export type Status = 'Draft' | 'Submitted' | 'Returned' | 'Sent to Bank' | 'Complete' | 'Rejected' | 'Need More Info' | 'Paid';
export type LeadSource = 'Website' | 'Referral' | 'Social Media' | 'Other';

export interface Document {
  id: string;
  name: string;
  filePath: string | null;
  isMandatory: boolean;
  isUploaded: boolean;
}

export interface StatusChange {
  id: string;
  previousStatus: Status;
  newStatus: Status;
  comment: string;
  changedBy: string;
  changedByRole: 'admin' | 'user';
  timestamp: Date;
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
  statusHistory: StatusChange[];
  createdAt: Date;
  paymentReceived?: boolean;
  paymentDate?: Date;
}

interface CustomerContextType {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'statusHistory'>) => void;
  updateCustomer: (id: string, updates: Partial<Omit<Customer, 'id'>>) => void;
  getCustomerById: (id: string) => Customer | undefined;
  getCustomersByUserId: (userId: string) => Customer[];
  getCustomersByStatus: (status: Status) => Customer[];
  updateCustomerStatus: (id: string, status: Status, comment: string, changedBy: string, changedByRole: 'admin' | 'user') => void;
  uploadDocument: (customerId: string, documentId: string, filePath: string) => void;
  markPaymentReceived: (id: string, changedBy: string) => void;
  submitToAdmin: (id: string, userId: string, userName: string) => void;
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
    status: 'Submitted',
    amount: 25000,
    documents: [...defaultDocuments],
    userId: '2',
    comments: [],
    statusHistory: [
      {
        id: 'sh1',
        previousStatus: 'Draft',
        newStatus: 'Submitted',
        comment: 'Initial submission',
        changedBy: 'Regular User',
        changedByRole: 'user',
        timestamp: new Date('2023-01-15')
      }
    ],
    createdAt: new Date('2023-01-15'),
    paymentReceived: false
  },
  {
    id: 'c2',
    name: 'Jane Smith',
    mobile: '+1 987 654 3210',
    company: 'XYZ Inc',
    email: 'jane@example.com',
    leadSource: 'Referral',
    status: 'Sent to Bank',
    amount: 50000,
    documents: [...defaultDocuments],
    userId: '2',
    comments: ['All documents verified'],
    statusHistory: [
      {
        id: 'sh2',
        previousStatus: 'Submitted',
        newStatus: 'Sent to Bank',
        comment: 'All documents verified',
        changedBy: 'Admin User',
        changedByRole: 'admin',
        timestamp: new Date('2023-02-20')
      }
    ],
    createdAt: new Date('2023-02-20'),
    paymentReceived: false
  },
  {
    id: 'c3',
    name: 'Alice Johnson',
    mobile: '+1 555 123 4567',
    company: 'Johnson LLC',
    email: 'alice@example.com',
    leadSource: 'Social Media',
    status: 'Paid',
    amount: 75000,
    documents: [...defaultDocuments],
    userId: '2',
    comments: ['Approved by bank', 'Payment processed'],
    statusHistory: [
      {
        id: 'sh3a',
        previousStatus: 'Sent to Bank',
        newStatus: 'Complete',
        comment: 'Approved by bank',
        changedBy: 'Admin User',
        changedByRole: 'admin',
        timestamp: new Date('2023-03-05')
      },
      {
        id: 'sh3b',
        previousStatus: 'Complete',
        newStatus: 'Paid',
        comment: 'Payment processed',
        changedBy: 'Admin User',
        changedByRole: 'admin',
        timestamp: new Date('2023-03-10')
      }
    ],
    createdAt: new Date('2023-03-05'),
    paymentReceived: true,
    paymentDate: new Date('2023-03-10')
  }
];

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);

  const addCustomer = (customer: Omit<Customer, 'id' | 'createdAt' | 'statusHistory'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: `c${customers.length + 1}`,
      createdAt: new Date(),
      documents: [...defaultDocuments],
      status: 'Draft', // Start with Draft status
      statusHistory: [
        {
          id: `sh${Date.now()}`,
          previousStatus: 'Draft',
          newStatus: 'Draft',
          comment: 'Application created',
          changedBy: customer.userId === '1' ? 'Admin User' : 'Regular User',
          changedByRole: customer.userId === '1' ? 'admin' : 'user',
          timestamp: new Date()
        }
      ],
      paymentReceived: false
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

  const updateCustomerStatus = (id: string, status: Status, comment: string, changedBy: string, changedByRole: 'admin' | 'user') => {
    setCustomers(customers.map(customer => {
      if (customer.id === id) {
        const statusChange: StatusChange = {
          id: `sh${Date.now()}`,
          previousStatus: customer.status,
          newStatus: status,
          comment,
          changedBy,
          changedByRole,
          timestamp: new Date()
        };

        const updatedCustomer = { 
          ...customer, 
          status,
          statusHistory: [...customer.statusHistory, statusChange]
        };

        if (comment) {
          updatedCustomer.comments = [...customer.comments, comment];
        }

        return updatedCustomer;
      }
      return customer;
    }));
  };

  const markPaymentReceived = (id: string, changedBy: string) => {
    setCustomers(customers.map(customer => {
      if (customer.id === id) {
        const statusChange: StatusChange = {
          id: `sh${Date.now()}`,
          previousStatus: customer.status,
          newStatus: 'Paid',
          comment: 'Payment received',
          changedBy,
          changedByRole: 'admin',
          timestamp: new Date()
        };

        return {
          ...customer,
          status: 'Paid' as Status,
          paymentReceived: true,
          paymentDate: new Date(),
          statusHistory: [...customer.statusHistory, statusChange],
          comments: [...customer.comments, 'Payment received']
        };
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

  const submitToAdmin = (id: string, userId: string, userName: string) => {
    setCustomers(customers.map(customer => {
      if (customer.id === id && (customer.status === 'Draft' || customer.status === 'Returned')) {
        const statusChange: StatusChange = {
          id: `sh${Date.now()}`,
          previousStatus: customer.status,
          newStatus: 'Submitted',
          comment: 'Submitted to admin for review',
          changedBy: userName,
          changedByRole: 'user',
          timestamp: new Date()
        };

        return {
          ...customer,
          status: 'Submitted' as Status,
          statusHistory: [...customer.statusHistory, statusChange],
          comments: [...customer.comments, 'Submitted to admin for review']
        };
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
    markPaymentReceived,
    submitToAdmin,
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
