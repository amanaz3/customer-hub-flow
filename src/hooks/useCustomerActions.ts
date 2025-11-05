import { Customer, StatusChange, Document } from '@/types/customer';
import { CustomerService } from '@/services/customerService';
import { useAuth } from '@/contexts/SecureAuthContext';
import { supabase } from '@/lib/supabase';

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

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      console.log('Updating customer:', id, updates);
      
      // Update in database first
      await CustomerService.updateCustomer(id, updates);
      
      // Then update local state
      setCustomers(
        customers.map(customer => 
          customer.id === id ? { ...customer, ...updates } : customer
        )
      );
      
      console.log('Customer updated successfully');
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      console.log('Deleting customer:', id);
      
      // Delete from database first
      await CustomerService.deleteCustomer(id);
      
      // Then update local state
      setCustomers(customers.filter(customer => customer.id !== id));
      
      console.log('Customer deleted successfully');
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  };

  const getCustomerById = (id: string) => {
    const customer = customers.find(customer => customer.id === id);
    console.log('Getting customer by ID:', id, customer);
    
    // If customer doesn't have status history, trigger a refresh to fetch it
    if (customer && (!customer.statusHistory || customer.statusHistory.length === 0)) {
      console.log('Customer found but no status history, triggering refresh...');
      // Use setTimeout to debounce and prevent immediate duplicate calls
      setTimeout(() => refreshData(), 0);
    }
    
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

  const updateApplicationStatus = async (applicationId: string, status: string, comment: string, changedBy: string, role: string) => {
    try {
      console.log('Updating application status:', { applicationId, status, comment, changedBy, role });
      
      // Use the edge function to properly track status changes
      const { data, error } = await supabase.functions.invoke('update-application-status', {
        body: {
          applicationId,
          newStatus: status,
          comment,
          changedBy,
          changedByRole: role
        }
      });

      if (error) {
        console.error('Error from update-application-status function:', error);
        throw new Error(error.message || 'Failed to update application status');
      }

      console.log('Status update response:', data);

      // Refresh data to get latest status
      await refreshData();
      
      console.log('Application status updated successfully and persisted to database');
    } catch (error) {
      console.error('Error updating application status:', error);
      throw error;
    }
  };

  const submitApplicationToAdmin = async (applicationId: string, userId: string) => {
    try {
      console.log('Submitting application to admin:', { applicationId, userId });
      
      // Update application status to 'submitted'
      const { data, error } = await supabase.functions.invoke('update-application-status', {
        body: {
          applicationId,
          newStatus: 'submitted',
          comment: 'Application submitted to admin for review',
          changedBy: userId,
          changedByRole: 'user'
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to submit application');
      }

      // Refresh data to ensure consistency
      await refreshData();

      console.log('Application submitted to admin successfully, status changed to Submitted and persisted to database');
    } catch (error) {
      console.error('Error submitting to admin:', error);
      throw error;
    }
  };

  const deleteDocument = async (customerId: string, documentId: string, filePath: string): Promise<void> => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Only allow deletion in Draft status
    if (customer.status !== 'Draft') {
      throw new Error('Documents can only be deleted when application is in Draft status');
    }

    try {
      console.log('Deleting document:', { customerId, documentId, filePath });
      
      // First delete from storage
      const { deleteFile } = await import('@/utils/fileUpload');
      const storageDeleted = await deleteFile(filePath);
      
      if (!storageDeleted) {
        throw new Error('Failed to delete file from storage');
      }

      // Then delete from database
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) {
        console.error('Error deleting document from database:', error);
        throw new Error('Failed to delete document from database');
      }

      // Update local state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));

      console.log('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  };

  const replaceDocument = async (customerId: string, documentId: string, oldFilePath: string, newFile: File): Promise<void> => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Only allow replacement in Draft status
    if (customer.status !== 'Draft') {
      throw new Error('Documents can only be replaced when application is in Draft status');
    }

    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('Replacing document:', { customerId, documentId, oldFilePath });
      
      // Delete old file from storage
      const { deleteFile, uploadFile } = await import('@/utils/fileUpload');
      const storageDeleted = await deleteFile(oldFilePath);
      
      if (!storageDeleted) {
        console.warn('Failed to delete old file from storage, continuing with upload');
      }

      // Upload new file
      const newFilePath = await uploadFile(newFile, customerId, documentId, user.id);

      // Update document record with new file path
      const { error } = await supabase
        .from('documents')
        .update({
          file_path: newFilePath,
          is_uploaded: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (error) {
        console.error('Error updating document in database:', error);
        throw new Error('Failed to update document in database');
      }

      // Update local state
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, file_path: newFilePath, is_uploaded: true }
            : doc
        )
      );

      // Refresh data to get updated status history
      await refreshData();

      console.log('Document replaced successfully');
    } catch (error) {
      console.error('Error replacing document:', error);
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
    updateApplicationStatus,
    submitApplicationToAdmin,
    deleteDocument,
    replaceDocument
  };
};
