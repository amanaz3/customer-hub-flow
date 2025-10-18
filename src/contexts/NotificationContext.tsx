import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useToast } from '@/hooks/use-toast';
import { shouldSendEmailForNotificationType, sendNotificationEmail } from '@/services/emailNotificationService';

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

  const addNotification = useCallback(async (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
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

    // Send email notification if enabled
    if (user) {
      try {
        // Determine notification type for preference check
        let notificationType = 'info';
        if (notification.title.includes('Status Updated')) {
          notificationType = 'status_change';
        } else if (notification.title.includes('Comment')) {
          notificationType = 'comment';
        } else if (notification.title.includes('Document')) {
          notificationType = 'document';
        } else if (notification.type === 'error' || notification.type === 'warning') {
          notificationType = 'system';
        }

        const shouldSendEmail = await shouldSendEmailForNotificationType(user.id, notificationType);
        
        if (shouldSendEmail) {
          // Get user profile for email
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, name')
            .eq('id', user.id)
            .single();

          if (profile?.email) {
            await sendNotificationEmail({
              recipientEmail: profile.email,
              recipientName: profile.name || 'User',
              title: notification.title,
              message: notification.message,
              type: notificationType,
              actionUrl: notification.actionUrl ? `${window.location.origin}${notification.actionUrl}` : undefined,
              customerName: notification.customerName,
            });
          }
        }
      } catch (error) {
        console.error('Error sending email notification:', error);
        // Don't throw - email failures shouldn't block in-app notifications
      }
    }
  }, [toast, user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    // Update local state immediately
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
    
    // Persist to database
    if (user) {
      await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);
    }
  }, [user]);

  const markAllAsRead = useCallback(async () => {
    // Update local state immediately
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    
    // Persist to database
    if (user) {
      await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);
    }
  }, [user]);

  const clearNotifications = useCallback(async () => {
    // Clear local state immediately
    setNotifications([]);
    
    // Delete from database
    if (user) {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);
    }
  }, [user]);

  // Load notifications from database on mount
  useEffect(() => {
    const loadNotificationsFromDB = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }
      
      if (data) {
        const mappedNotifications: Notification[] = data.map(notif => ({
          id: notif.id,
          title: notif.title,
          message: notif.message,
          type: notif.type as 'info' | 'warning' | 'success' | 'error',
          isRead: notif.is_read,
          createdAt: notif.created_at,
          customerId: notif.customer_id || undefined,
          actionUrl: notif.action_url || undefined,
        }));
        
        setNotifications(mappedNotifications);
      }
    };
    
    loadNotificationsFromDB();
  }, [user]);

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

          // Check if this is a status change request
          const commentText = payload.new.comment || '';
          const isStatusRequest = commentText.startsWith('[STATUS REQUEST:');
          const statusMatch = commentText.match(/\[STATUS REQUEST: (.+?)\]/);
          const requestedStatus = statusMatch ? statusMatch[1] : null;

          // Show notification if it's relevant to current user and not their own comment
          const isRelevant = (isAdmin || customer.user_id === user.id) && payload.new.created_by !== user.id;
          
          if (isRelevant) {
            // Special notification for status requests to admins
            if (isStatusRequest && isAdmin) {
              addNotification({
                title: `Status Change Request: ${customer.name}`,
                message: `User requests status change to "${requestedStatus}" for ${customer.company}`,
                type: 'warning',
                customerName: customer.name,
                customerId: payload.new.customer_id,
                actionUrl: `/customers/${payload.new.customer_id}`,
              });
            } else {
              // Regular comment notification
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

    // Notifications table subscription (for database-created notifications)
    const notificationsSubscription = supabase
      .channel('notifications_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('New notification from database:', payload);
          
          const dbNotif = payload.new;
          const newNotification: Notification = {
            id: dbNotif.id,
            title: dbNotif.title,
            message: dbNotif.message,
            type: dbNotif.type as 'info' | 'warning' | 'success' | 'error',
            isRead: dbNotif.is_read,
            createdAt: dbNotif.created_at,
            customerId: dbNotif.customer_id || undefined,
            actionUrl: dbNotif.action_url || undefined,
          };
          
          setNotifications(prev => [newNotification, ...prev].slice(0, 50));
          
          // Show toast for the notification
          toast({
            title: dbNotif.title,
            description: dbNotif.message,
            variant: dbNotif.type === 'error' ? 'destructive' : 'default',
          });
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      console.log('Cleaning up notification subscriptions...');
      supabase.removeChannel(statusChangesSubscription);
      supabase.removeChannel(commentsSubscription);
      supabase.removeChannel(documentsSubscription);
      supabase.removeChannel(notificationsSubscription);
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