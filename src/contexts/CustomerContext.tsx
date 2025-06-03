import React, { createContext, useContext, useState, useEffect } from 'react';
import { googleDriveService } from '@/services/googleDriveService';

export type CustomerStatus = 'Draft' | 'Review' | 'Approved' | 'Rejected' | 'Completed';
export type LeadSource = 'Website' | 'Referral' | 'Social Media' | 'Other';
export type LicenseType = 'Mainland' | 'Freezone' | 'Offshore';

export interface Document {
  id: string;
  name: string;
  category: 'mandatory' | 'freezone' | 'supporting' | 'signatory';
  isMandatory: boolean;
  isUploaded: boolean;
  filePath?: string;
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  timestamp: Date;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  company: string;
  email: string;
  leadSource: LeadSource;
  licenseType: LicenseType;
  amount: number;
  status: CustomerStatus;
  userId: string;
  documents: Document[];
  comments: Comment[];
  createdAt?: Date;
  updatedAt?: Date;
  driveFolderId?: string;
}

interface CustomerContextType {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  getCustomerById: (id: string) => Customer | undefined;
  updateDocument: (customerId: string, documentId: string, filePath: string) => void;
  addComment: (customerId: string, comment: Omit<Comment, 'id'>) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

// Default documents based on category
const DEFAULT_DOCUMENTS: Document[] = [
  // Mandatory documents for all applications
  {
    id: 'passport',
    name: 'Passport Copy',
    category: 'mandatory',
    isMandatory: true,
    isUploaded: false,
  },
  {
    id: 'emirates-id',
    name: 'Emirates ID Copy',
    category: 'mandatory',
    isMandatory: true,
    isUploaded: false,
  },
  {
    id: 'salary-certificate',
    name: 'Salary Certificate',
    category: 'mandatory',
    isMandatory: true,
    isUploaded: false,
  },
  {
    id: 'bank-statement',
    name: 'Bank Statement (3 months)',
    category: 'mandatory',
    isMandatory: true,
    isUploaded: false,
  },
  
  // Freezone specific documents
  {
    id: 'trade-license',
    name: 'Trade License Copy',
    category: 'freezone',
    isMandatory: true,
    isUploaded: false,
  },
  {
    id: 'establishment-card',
    name: 'Establishment Card',
    category: 'freezone',
    isMandatory: true,
    isUploaded: false,
  },
  
  // Supporting documents (optional but recommended)
  {
    id: 'property-card',
    name: 'Property Card',
    category: 'supporting',
    isMandatory: false,
    isUploaded: false,
  },
  {
    id: 'utility-bill',
    name: 'Utility Bill (DEWA/FEWA)',
    category: 'supporting',
    isMandatory: false,
    isUploaded: false,
  },
  {
    id: 'noc-letter',
    name: 'NOC Letter from Employer',
    category: 'supporting',
    isMandatory: false,
    isUploaded: false,
  },
  
  // Signatory documents (for authorized signatory)
  {
    id: 'signatory-passport',
    name: 'Authorized Signatory Passport',
    category: 'signatory',
    isMandatory: false,
    isUploaded: false,
  },
  {
    id: 'signatory-emirates-id',
    name: 'Authorized Signatory Emirates ID',
    category: 'signatory',
    isMandatory: false,
    isUploaded: false,
  },
];

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Load customers from localStorage on mount
  useEffect(() => {
    const savedCustomers = localStorage.getItem('customers');
    if (savedCustomers) {
      const parsedCustomers = JSON.parse(savedCustomers).map((customer: any) => ({
        ...customer,
        createdAt: customer.createdAt ? new Date(customer.createdAt) : new Date(),
        updatedAt: customer.updatedAt ? new Date(customer.updatedAt) : new Date(),
        comments: customer.comments?.map((comment: any) => ({
          ...comment,
          timestamp: new Date(comment.timestamp),
        })) || [],
      }));
      setCustomers(parsedCustomers);
    }
  }, []);

  // Save customers to localStorage whenever customers change
  useEffect(() => {
    localStorage.setItem('customers', JSON.stringify(customers));
  }, [customers]);

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: crypto.randomUUID(),
      documents: DEFAULT_DOCUMENTS.map(doc => ({ ...doc })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      // Create Google Drive folder for the customer using just the customer name
      console.log(`Creating Drive folder for customer: ${customerData.name}`);
      const driveFolderId = await googleDriveService.createCustomerFolder(customerData.name);
      newCustomer.driveFolderId = driveFolderId;
      console.log(`Drive folder created with ID: ${driveFolderId}`);
    } catch (error) {
      console.error('Failed to create Drive folder:', error);
      // Continue without Drive folder - customer can still be created
    }

    setCustomers(prev => [...prev, newCustomer]);
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev =>
      prev.map(customer =>
        customer.id === id
          ? { ...customer, ...updates, updatedAt: new Date() }
          : customer
      )
    );
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(customer => customer.id !== id));
  };

  const getCustomerById = (id: string): Customer | undefined => {
    return customers.find(customer => customer.id === id);
  };

  const updateDocument = (customerId: string, documentId: string, filePath: string) => {
    setCustomers(prev =>
      prev.map(customer =>
        customer.id === customerId
          ? {
              ...customer,
              documents: customer.documents.map(doc =>
                doc.id === documentId
                  ? { ...doc, isUploaded: true, filePath }
                  : doc
              ),
              updatedAt: new Date(),
            }
          : customer
      )
    );
  };

  const addComment = (customerId: string, comment: Omit<Comment, 'id'>) => {
    const newComment: Comment = {
      ...comment,
      id: crypto.randomUUID(),
    };

    setCustomers(prev =>
      prev.map(customer =>
        customer.id === customerId
          ? {
              ...customer,
              comments: [...customer.comments, newComment],
              updatedAt: new Date(),
            }
          : customer
      )
    );
  };

  return (
    <CustomerContext.Provider
      value={{
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        getCustomerById,
        updateDocument,
        addComment,
      }}
    >
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
