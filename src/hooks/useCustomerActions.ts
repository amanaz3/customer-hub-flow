import { Customer, StatusChange, Document } from '@/types/customer';
import { CustomerService } from '@/services/customerService';
import { useAuth } from '@/contexts/SecureAuthContext';

export const useCustomerActions = (
  customers: Customer[],
  setCustomers: (customers: Customer[]) => void,
  setDocuments: (documents: Document[] | ((prev: Document[]) => Document[])) => void,
  refreshData: () => Promise<void>
) => {
  // Use a try-catch to handle auth context not being available
  let authData;
  try {
    authData = useAuth();
  } catch (error) {
    // Auth context not available yet, set default values
    authData = { user: null };
  }
  
  const { user } = authData;

  const addCustomer = async (customer: Customer): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('Creating customer via service:', customer);
      await CustomerService.createCustomer(customer, user.id);
      console.log('Customer created, refreshing data...');
      await refreshData();
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    console.log('Updating customer locally:', id, updates);
    setCustomers(
      customers.map(customer => 
        customer.id === id ? { ...customer, ...updates } : customer
      )
    );
  };

  const deleteCustomer = (id: string) => {
    console.log('Deleting customer locally:', id);
    setCustomers(customers.filter(customer => customer.id !== id));
  };

  const getCustomerById = (id: string) => {
    const customer = customers.find(customer => customer.id === id);
    console.log('Getting customer by ID:', id, customer);
    return customer;
  };

  const getCustomersByUserId = (userId: string) => {
    const userCustomers = customers.filter(customer => customer.user_id === userId);
    console.log('Getting customers by user ID:', userId, userCustomers);
    return userCustomers;
  };

  const uploadDocument = async (customerId: string, documentId: string, filePath: string) => {
    try {
      console.log('Uploading document:', { customerId, documentId, filePath });
      const fileInfo = await CustomerService.uploadDocument(customerId, documentId, filePath);

      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, is_uploaded: true, file_path: filePath }
            : doc
        )
      );

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

      // Refresh data to get updated status history from database
      await refreshData();

      console.log('Document upload completed successfully');
      return fileInfo;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  };

  const updateCustomerStatus = async (customerId: string, status: string, comment: string, changedBy: string, role: string) => {
    try {
      console.log('Updating customer status:', { customerId, status, comment, changedBy, role });
      
      // Update status in database first to ensure persistence
      await CustomerService.updateCustomerStatus(customerId, status, comment, changedBy, role);

      // Update customer status locally for immediate UI feedback
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        const previousStatus = customer.status;
        
        // Update customer status
        setCustomers(
          customers.map(customer => 
            customer.id === customerId 
              ? { ...customer, status, updated_at: new Date().toISOString() }
              : customer
          )
        );
      }

      // Refresh data to get the complete updated state from database including status history
      await refreshData();

      console.log('Customer status updated successfully and persisted to database');
    } catch (error) {
      console.error('Error updating customer status:', error);
      throw error;
    }
  };

  // markPaymentReceived function removed - payment tracking out of scope

  const submitToAdmin = async (customerId: string, userId: string, userName: string) => {
    try {
      console.log('Submitting application to admin:', { customerId, userId, userName });
      
      // Get the current customer to access previous status
      const customer = customers.find(c => c.id === customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      const previousStatus = customer.status;
      
      // Update customer status to Submitted immediately for UI feedback
      setCustomers(
        customers.map(customer => 
          customer.id === customerId 
            ? { ...customer, status: 'Submitted', updated_at: new Date().toISOString() }
            : customer
        )
      );

      // Persist status change to database
      await CustomerService.updateCustomerStatus(customerId, 'Submitted', 'Application submitted to admin for review', userName, 'user');

      // Refresh data to ensure consistency across all users and get updated status history
      await refreshData();

      console.log('Application submitted to admin successfully, status changed to Submitted and persisted to database');
    } catch (error) {
      console.error('Error submitting to admin:', error);
      
      // Revert local status change if database update fails
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        setCustomers(
          customers.map(customer => 
            customer.id === customerId 
              ? { ...customer, status: customer.status }
              : customer
          )
        );
      }
      
      throw error;
    }
  };

  return {
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
    getCustomersByUserId,
    uploadDocument,
    updateCustomerStatus,
    // markPaymentReceived removed
    submitToAdmin
  };
};
