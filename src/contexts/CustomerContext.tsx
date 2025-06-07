
import React, { createContext, useContext, useState, useEffect } from 'react';
import { googleDriveService } from '@/services/googleDriveService';

export type CustomerStatus = 'Draft' | 'Submitted' | 'Returned' | 'Sent to Bank' | 'Complete' | 'Rejected' | 'Need More Info' | 'Paid';
export type Status = CustomerStatus;
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

export interface StatusChange {
  id: string;
  previousStatus: CustomerStatus;
  newStatus: CustomerStatus;
  comment?: string;
  changedBy: string;
  changedByRole: string;
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
  statusHistory: StatusChange[];
  createdAt?: Date;
  updatedAt?: Date;
  driveFolderId?: string;
  paymentReceived?: boolean;
  paymentDate?: Date;
}

interface CustomerContextType {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  getCustomerById: (id: string) => Customer | undefined;
  getCustomersByUserId: (userId: string) => Customer[];
  updateDocument: (customerId: string, documentId: string, filePath: string) => void;
  uploadDocument: (customerId: string, documentId: string, filePath: string) => void;
  addComment: (customerId: string, comment: Omit<Comment, 'id'>) => void;
  updateCustomerStatus: (customerId: string, status: CustomerStatus, comment: string, changedBy: string, changedByRole: string) => void;
  markPaymentReceived: (customerId: string, changedBy: string) => void;
  submitToAdmin: (customerId: string, userId: string, userName: string) => void;
  isLoading: boolean;
  error: string | null;
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load customers from localStorage on mount
  useEffect(() => {
    const loadCustomers = () => {
      try {
        setIsLoading(true);
        setError(null);
        
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
            statusHistory: customer.statusHistory?.map((change: any) => ({
              ...change,
              timestamp: new Date(change.timestamp),
            })) || [],
            paymentReceived: customer.paymentReceived || false,
            paymentDate: customer.paymentDate ? new Date(customer.paymentDate) : undefined,
          }));
          setCustomers(parsedCustomers);
        }
      } catch (err) {
        console.error('Error loading customers:', err);
        setError('Failed to load customers from storage');
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomers();
  }, []);

  // Save customers to localStorage whenever customers change
  useEffect(() => {
    try {
      localStorage.setItem('customers', JSON.stringify(customers));
      setError(null);
    } catch (err) {
      console.error('Error saving customers:', err);
      setError('Failed to save customers to storage');
    }
  }, [customers]);

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate required fields
      if (!customerData.name || !customerData.email || !customerData.mobile) {
        throw new Error('Name, email, and mobile are required fields');
      }

      const newCustomer: Customer = {
        ...customerData,
        id: crypto.randomUUID(),
        documents: DEFAULT_DOCUMENTS.map(doc => ({ ...doc })),
        statusHistory: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        paymentReceived: false,
      };

      try {
        // Create Google Drive folder for the customer
        console.log(`Creating Drive folder for customer: ${customerData.name}`);
        const driveFolderId = await googleDriveService.createCustomerFolder(customerData.name);
        newCustomer.driveFolderId = driveFolderId;
        console.log(`Drive folder created with ID: ${driveFolderId}`);
      } catch (driveError) {
        console.error('Failed to create Drive folder:', driveError);
        // Continue without Drive folder - customer can still be created
        // Don't throw here, just log the error
      }

      setCustomers(prev => [...prev, newCustomer]);
    } catch (err) {
      console.error('Error adding customer:', err);
      setError(err instanceof Error ? err.message : 'Failed to add customer');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    try {
      setError(null);
      setCustomers(prev =>
        prev.map(customer =>
          customer.id === id
            ? { ...customer, ...updates, updatedAt: new Date() }
            : customer
        )
      );
    } catch (err) {
      console.error('Error updating customer:', err);
      setError('Failed to update customer');
    }
  };

  const deleteCustomer = (id: string) => {
    try {
      setError(null);
      setCustomers(prev => prev.filter(customer => customer.id !== id));
    } catch (err) {
      console.error('Error deleting customer:', err);
      setError('Failed to delete customer');
    }
  };

  const getCustomerById = (id: string): Customer | undefined => {
    return customers.find(customer => customer.id === id);
  };

  const getCustomersByUserId = (userId: string): Customer[] => {
    return customers.filter(customer => customer.userId === userId);
  };

  const updateDocument = (customerId: string, documentId: string, filePath: string) => {
    updateCustomer(customerId, {
      documents: customers.find(c => c.id === customerId)?.documents.map(doc =>
        doc.id === documentId
          ? { ...doc, isUploaded: true, filePath }
          : doc
      ) || []
    });
  };

  const uploadDocument = (customerId: string, documentId: string, filePath: string) => {
    updateDocument(customerId, documentId, filePath);
  };

  const addComment = (customerId: string, comment: Omit<Comment, 'id'>) => {
    try {
      setError(null);
      const newComment: Comment = {
        ...comment,
        id: crypto.randomUUID(),
      };

      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        updateCustomer(customerId, {
          comments: [...customer.comments, newComment]
        });
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment');
    }
  };

  const updateCustomerStatus = (customerId: string, status: CustomerStatus, comment: string, changedBy: string, changedByRole: string) => {
    try {
      setError(null);
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        const statusChange: StatusChange = {
          id: crypto.randomUUID(),
          previousStatus: customer.status,
          newStatus: status,
          comment,
          changedBy,
          changedByRole,
          timestamp: new Date(),
        };

        updateCustomer(customerId, {
          status,
          statusHistory: [...customer.statusHistory, statusChange]
        });
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update customer status');
    }
  };

  const markPaymentReceived = (customerId: string, changedBy: string) => {
    try {
      setError(null);
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        const statusChange: StatusChange = {
          id: crypto.randomUUID(),
          previousStatus: customer.status,
          newStatus: 'Paid',
          comment: 'Payment received',
          changedBy,
          changedByRole: 'admin',
          timestamp: new Date(),
        };

        updateCustomer(customerId, {
          status: 'Paid' as CustomerStatus,
          paymentReceived: true,
          paymentDate: new Date(),
          statusHistory: [...customer.statusHistory, statusChange]
        });
      }
    } catch (err) {
      console.error('Error marking payment received:', err);
      setError('Failed to mark payment as received');
    }
  };

  const submitToAdmin = (customerId: string, userId: string, userName: string) => {
    try {
      setError(null);
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        const statusChange: StatusChange = {
          id: crypto.randomUUID(),
          previousStatus: customer.status,
          newStatus: 'Submitted',
          comment: 'Application submitted to admin for review',
          changedBy: userName,
          changedByRole: 'user',
          timestamp: new Date(),
        };

        updateCustomer(customerId, {
          status: 'Submitted' as CustomerStatus,
          statusHistory: [...customer.statusHistory, statusChange]
        });
      }
    } catch (err) {
      console.error('Error submitting to admin:', err);
      setError('Failed to submit application to admin');
    }
  };

  return (
    <CustomerContext.Provider
      value={{
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        getCustomerById,
        getCustomersByUserId,
        updateDocument,
        uploadDocument,
        addComment,
        updateCustomerStatus,
        markPaymentReceived,
        submitToAdmin,
        isLoading,
        error,
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
