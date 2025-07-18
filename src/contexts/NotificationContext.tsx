import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  customerName?: string;
  customerId?: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  // Generate unique notification ID
  const generateNotificationId = () => `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: generateNotificationId(),
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep max 50 notifications
    
    // Show toast for real-time notifications
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === 'error' ? 'destructive' : 'default',
    });
  }, [toast]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Set up real-time subscriptions for status changes and comments
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscriptions for notifications...');

    // Status changes subscription
    const statusChangesSubscription = supabase
      .channel('status_changes_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'status_changes'
        },
        async (payload) => {
          console.log('Status change detected:', payload);
          
          // Get customer info for notification
          const { data: customer } = await supabase
            .from('customers')
            .select('name, company, user_id')
            .eq('id', payload.new.customer_id)
            .single();

          if (!customer) return;

          // Show notification if it's relevant to current user
          const isRelevant = isAdmin || customer.user_id === user.id;
          
          if (isRelevant) {
            const statusChange = payload.new;
            addNotification({
              title: `Status Updated: ${customer.name}`,
              message: `${customer.company} status changed from ${statusChange.previous_status} to ${statusChange.new_status}`,
              type: statusChange.new_status === 'Complete' ? 'success' : 
                    statusChange.new_status === 'Rejected' ? 'error' : 'info',
              customerName: customer.name,
              customerId: payload.new.customer_id,
              actionUrl: `/customers/${payload.new.customer_id}`,
            });
          }
        }
      )
      .subscribe();

    // Comments subscription
    const commentsSubscription = supabase
      .channel('comments_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments'
        },
        async (payload) => {
          console.log('Comment detected:', payload);
          
          // Get customer info for notification
          const { data: customer } = await supabase
            .from('customers')
            .select('name, company, user_id')
            .eq('id', payload.new.customer_id)
            .single();

          if (!customer) return;

          // Show notification if it's relevant to current user and not their own comment
          const isRelevant = (isAdmin || customer.user_id === user.id) && payload.new.created_by !== user.id;
          
          if (isRelevant) {
            addNotification({
              title: `New Comment: ${customer.name}`,
              message: `A comment was added to ${customer.company}`,
              type: 'info',
              customerName: customer.name,
              customerId: payload.new.customer_id,
              actionUrl: `/customers/${payload.new.customer_id}`,
            });
          }
        }
      )
      .subscribe();

    // Customer document updates subscription  
    const documentsSubscription = supabase
      .channel('documents_notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'documents'
        },
        async (payload) => {
          // Only notify if document was uploaded (is_uploaded changed to true)
          if (payload.new.is_uploaded && !payload.old.is_uploaded) {
            console.log('Document upload detected:', payload);
            
            // Get customer info for notification
            const { data: customer } = await supabase
              .from('customers')
              .select('name, company, user_id')
              .eq('id', payload.new.customer_id)
              .single();

            if (!customer) return;

            // Show notification to admins when users upload documents
            if (isAdmin && customer.user_id !== user.id) {
              addNotification({
                title: `Document Uploaded: ${customer.name}`,
                message: `${payload.new.name} uploaded for ${customer.company}`,
                type: 'info',
                customerName: customer.name,
                customerId: payload.new.customer_id,
                actionUrl: `/customers/${payload.new.customer_id}`,
              });
            }
          }
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      console.log('Cleaning up notification subscriptions...');
      supabase.removeChannel(statusChangesSubscription);
      supabase.removeChannel(commentsSubscription);
      supabase.removeChannel(documentsSubscription);
    };
  }, [user, isAdmin, addNotification]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const contextValue = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};