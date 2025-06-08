
import { Customer, StatusChange, Document } from '@/types/customer';
import { CustomerService } from '@/services/customerService';
import { useAuth } from '@/contexts/SecureAuthContext';

export const useCustomerActions = (
  customers: Customer[],
  setCustomers: (customers: Customer[]) => void,
  setDocuments: (documents: Document[] | ((prev: Document[]) => Document[])) => void,
  refreshData: () => Promise<void>
) => {
  const { user } = useAuth();

  const addCustomer = async (customer: Customer): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      await CustomerService.createCustomer(customer, user.id);
      await refreshData(); // Refresh to show the new customer
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error; // Re-throw to handle in the calling component
    }
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(
      customers.map(customer => 
        customer.id === id ? { ...customer, ...updates } : customer
      )
    );
  };

  const deleteCustomer = (id: string) => {
    setCustomers(customers.filter(customer => customer.id !== id));
  };

  const getCustomerById = (id: string) => {
    return customers.find(customer => customer.id === id);
  };

  const getCustomersByUserId = (userId: string) => {
    return customers.filter(customer => customer.user_id === userId);
  };

  const uploadDocument = async (customerId: string, documentId: string, filePath: string) => {
    const fileInfo = await CustomerService.uploadDocument(customerId, documentId, filePath);

    // Update local state
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, is_uploaded: true, file_path: filePath }
          : doc
      )
    );

    // Update customer's documents
    setCustomers(
      customers.map(customer => 
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

    return fileInfo;
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

  return {
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
    getCustomersByUserId,
    uploadDocument,
    updateCustomerStatus,
    markPaymentReceived,
    submitToAdmin
  };
};
