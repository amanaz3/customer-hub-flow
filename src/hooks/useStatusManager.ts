
import { useState } from 'react';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useCustomer } from '@/contexts/CustomerContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useToast } from '@/hooks/use-toast';
import { Status } from '@/types/customer';
import { validateStatusTransition } from '@/utils/statusValidation';
import { CustomerService } from '@/services/customerService';

export const useStatusManager = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { user, isAdmin } = useAuth();
  const { updateCustomerStatus, markPaymentReceived, refreshData } = useCustomer();
  const { addNotification } = useNotifications();
  const { toast } = useToast();

  const updateStatus = async (
    customerId: string, 
    customerName: string,
    customerUserId: string,
    currentStatus: Status,
    newStatus: Status, 
    comment: string,
    hasRequiredDocuments: boolean = false,
    onSuccess?: () => void
  ) => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    // Validate the status transition
    const validation = validateStatusTransition(
      currentStatus,
      newStatus,
      isAdmin,
      customerUserId === user.id,
      hasRequiredDocuments,
      comment
    );

    if (!validation.isValid) {
      toast({
        title: "Invalid Status Change",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    
    try {
      console.log('Updating status:', { customerId, currentStatus, newStatus, comment });
      
      // Update status in database through CustomerService to ensure persistence
      await CustomerService.updateCustomerStatus(
        customerId,
        newStatus,
        comment,
        user.profile?.name || user.email || 'Unknown User',
        isAdmin ? 'admin' : 'user'
      );

      // Update local state through context
      await updateCustomerStatus(
        customerId,
        newStatus,
        comment,
        user.profile?.name || user.email || 'Unknown User',
        isAdmin ? 'admin' : 'user'
      );

      // Add notification for status change
      addNotification({
        title: 'Status Updated',
        message: `${customerName} status changed from ${currentStatus} to ${newStatus}`,
        type: newStatus === 'Complete' ? 'success' : 
              newStatus === 'Rejected' ? 'error' : 'info',
        customerName: customerName,
        actionUrl: `/customers/${customerId}`,
      });

      // Show success toast
      toast({
        title: "Status Updated",
        description: `Application status changed from ${currentStatus} to ${newStatus}`,
      });

      // Refresh data to ensure consistency
      await refreshData();

      // Call success callback if provided
      onSuccess?.();

      console.log('Status updated successfully and persisted to database');
      
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const markAsPaid = async (
    customerId: string,
    customerName: string,
    onSuccess?: () => void
  ) => {
    if (!user) {
      toast({
        title: "Error", 
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    
    try {
      console.log('Marking payment received for customer:', customerId);
      
      // Mark payment as received through context
      await markPaymentReceived(customerId, user.profile?.name || user.email || 'Unknown User');

      // Add notification
      addNotification({
        title: 'Payment Confirmed',
        message: `Payment received for ${customerName}`,
        type: 'success',
        customerName: customerName,
        actionUrl: `/customers/${customerId}`,
      });

      // Show success toast
      toast({
        title: "Payment Confirmed",
        description: "Application marked as paid",
      });

      // Refresh data
      await refreshData();

      // Call success callback
      onSuccess?.();

      console.log('Payment marked as received successfully');
      
    } catch (error) {
      console.error('Error marking payment:', error);
      toast({
        title: "Error",
        description: "Failed to mark payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateStatus,
    markAsPaid,
    isUpdating
  };
};
