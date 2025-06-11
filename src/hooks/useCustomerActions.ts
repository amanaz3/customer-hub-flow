
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
      
      // Update the customer status locally first for immediate UI feedback
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

        // Add status change to history
        const statusChange: StatusChange = {
          id: crypto.randomUUID(),
          customer_id: customerId,
          previous_status: previousStatus,
          new_status: status,
          changed_by: changedBy,
          changed_by_role: role,
          comment: comment || undefined,
          created_at: new Date().toISOString()
        };

        // Update customer with new status history
        setCustomers(prev => 
          prev.map(customer => 
            customer.id === customerId 
              ? { 
                  ...customer, 
                  statusHistory: [statusChange, ...(customer.statusHistory || [])]
                }
              : customer
          )
        );

        console.log('Customer status updated successfully');
      }
    } catch (error) {
      console.error('Error updating customer status:', error);
      throw error;
    }
  };

  const markPaymentReceived = async (customerId: string, changedBy: string) => {
    try {
      console.log('Marking payment received:', { customerId, changedBy });
      
      // Update customer payment status
      setCustomers(
        customers.map(customer => 
          customer.id === customerId 
            ? { 
                ...customer, 
                status: 'Paid',
                payment_received: true,
                payment_date: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            : customer
        )
      );

      // Add status change to history
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        const statusChange: StatusChange = {
          id: crypto.randomUUID(),
          customer_id: customerId,
          previous_status: customer.status,
          new_status: 'Paid',
          changed_by: changedBy,
          changed_by_role: 'admin',
          comment: 'Payment received and confirmed',
          created_at: new Date().toISOString()
        };

        setCustomers(prev => 
          prev.map(customer => 
            customer.id === customerId 
              ? { 
                  ...customer, 
                  statusHistory: [statusChange, ...(customer.statusHistory || [])]
                }
              : customer
          )
        );
      }

      console.log('Payment marked as received successfully');
    } catch (error) {
      console.error('Error marking payment received:', error);
      throw error;
    }
  };

  const submitToAdmin = async (customerId: string, userId: string, userName: string) => {
    try {
      console.log('Submitting to admin:', { customerId, userId, userName });
      
      // Update customer status to Submitted
      setCustomers(
        customers.map(customer => 
          customer.id === customerId 
            ? { ...customer, status: 'Submitted', updated_at: new Date().toISOString() }
            : customer
        )
      );

      // Add status change to history
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        const statusChange: StatusChange = {
          id: crypto.randomUUID(),
          customer_id: customerId,
          previous_status: customer.status,
          new_status: 'Submitted',
          changed_by: userName,
          changed_by_role: 'user',
          comment: 'Application submitted to admin for review',
          created_at: new Date().toISOString()
        };

        setCustomers(prev => 
          prev.map(customer => 
            customer.id === customerId 
              ? { 
                  ...customer, 
                  statusHistory: [statusChange, ...(customer.statusHistory || [])]
                }
              : customer
          )
        );
      }

      console.log('Application submitted to admin successfully');
    } catch (error) {
      console.error('Error submitting to admin:', error);
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
    markPaymentReceived,
    submitToAdmin
  };
};
