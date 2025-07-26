
import { useState } from 'react';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useCustomer } from '@/contexts/CustomerContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useToast } from '@/hooks/use-toast';
import { Status } from '@/types/customer';
import { validateStatusTransition, type Status as StatusType } from '@/utils/statusTransitionRules';
import { CustomerService } from '@/services/customerService';

export const useStatusManager = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { user, isAdmin } = useAuth();
  const { updateCustomerStatus, refreshData } = useCustomer();
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
      currentStatus as StatusType,
      newStatus as StatusType,
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
      const changedByName = user.profile?.name || user.email || 'Unknown User';
      const changedByRole = isAdmin ? 'admin' : 'user';
      
      console.log('Updating status with full logging:', { 
        customerId, 
        currentStatus, 
        newStatus, 
        comment,
        changedByName,
        changedByRole,
        isAdmin
      });
      
      // Ensure comment is provided for admin actions if required
      const finalComment = comment || (isAdmin ? `Status updated by admin: ${changedByName}` : '');
      
      // Update status in database through CustomerService to ensure persistence
      await CustomerService.updateCustomerStatus(
        customerId,
        newStatus,
        finalComment,
        user.id, // Use user ID instead of name for RLS policies
        changedByRole
      );

      // Update local state through context
      await updateCustomerStatus(
        customerId,
        newStatus,
        finalComment,
        user.id,
        changedByRole
      );

      // Add notification for status change (this will trigger real-time notification)
      addNotification({
        title: 'Status Updated',
        message: `${customerName} status changed from ${currentStatus} to ${newStatus}${isAdmin ? ' by admin' : ''}`,
        type: newStatus === 'Complete' ? 'success' : 
              newStatus === 'Rejected' ? 'error' : 'info',
        customerName: customerName,
        customerId: customerId,
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

      console.log('Status updated successfully and logged:', {
        newStatus,
        changedBy: changedByName,
        role: changedByRole
      });
      
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

  // markAsPaid function removed - payment tracking out of scope

  return {
    updateStatus,
    // markAsPaid removed
    isUpdating
  };
};
