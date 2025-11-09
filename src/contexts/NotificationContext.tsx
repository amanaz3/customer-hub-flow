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

  // Helper function to extract status type from notification
  const getStatusTypeFromNotification = (notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>): string | undefined => {
    const title = notification.title.toLowerCase();
    const message = notification.message.toLowerCase();
    
    // Extract status from common patterns
    if (title.includes('draft')) return 'draft';
    if (title.includes('submitted')) return 'submitted';
    if (title.includes('under review') || title.includes('review')) return 'under_review';
    if (title.includes('approved')) return 'approved';
    if (title.includes('rejected')) return 'rejected';
    if (title.includes('complete')) return 'complete';
    if (title.includes('pending')) return 'pending';
    
    // Check message for status keywords
    if (message.includes('draft')) return 'draft';
    if (message.includes('submitted')) return 'submitted';
    if (message.includes('under review') || message.includes('review')) return 'under_review';
    if (message.includes('approved')) return 'approved';
    if (message.includes('rejected')) return 'rejected';
    if (message.includes('complete')) return 'complete';
    if (message.includes('pending')) return 'pending';
    
    return undefined;
  };

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

        console.log('[Email Notification] Checking if email should be sent for type:', notificationType);
        const shouldSendEmail = await shouldSendEmailForNotificationType(user.id, notificationType);
        console.log('[Email Notification] Should send email:', shouldSendEmail);
        
        if (shouldSendEmail) {
          // Get user profile for email
          console.log('[Email Notification] Fetching user profile for email...');
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('email, name')
            .eq('id', user.id)
            .single();

          if (profileError) {
            console.error('[Email Notification] Error fetching profile:', profileError);
          }

          console.log('[Email Notification] Profile data:', { 
            hasProfile: !!profile, 
            hasEmail: !!profile?.email,
            name: profile?.name 
          });

          // Use profile email or fallback to user.email from auth
          const recipientEmail = profile?.email || user.email;
          const recipientName = profile?.name || user.email?.split('@')[0] || 'User';

          if (recipientEmail) {
            console.log('[Email Notification] Sending email to:', recipientEmail);
            const statusType = getStatusTypeFromNotification(notification);
            console.log('[Email Notification] Extracted status type:', statusType);
            
            const emailResult = await sendNotificationEmail({
              recipientEmail,
              recipientName,
              title: notification.title,
              message: notification.message,
              type: notificationType,
              actionUrl: notification.actionUrl ? `${window.location.origin}${notification.actionUrl}` : undefined,
              customerName: notification.customerName,
              userId: user.id,
              statusType: statusType,
            });
            console.log('[Email Notification] Email send result:', emailResult);
          } else {
            console.warn('[Email Notification] No email address found for user:', user.id);
          }
        } else {
          console.log('[Email Notification] Email sending skipped due to user preferences');
        }
      } catch (error) {
        console.error('[Email Notification] Error in email notification flow:', error);
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

    // Status changes subscription - now monitoring account_applications
    const applicationStatusSubscription = supabase
      .channel('application_status_notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'account_applications'
        },
        async (payload) => {
          console.log('Application status change detected:', payload);
          
          const oldStatus = payload.old?.status;
          const newStatus = payload.new.status;
          
          // Only notify if status actually changed
          if (oldStatus === newStatus) return;
          
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
            addNotification({
              title: `Application Status Updated: ${customer.name}`,
              message: `${customer.company} application status changed from ${oldStatus} to ${newStatus}`,
              type: newStatus === 'completed' ? 'success' : 
                    newStatus === 'rejected' ? 'error' : 'info',
              customerName: customer.name,
              customerId: payload.new.customer_id,
              actionUrl: `/applications/${payload.new.id}`,
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
      supabase.removeChannel(applicationStatusSubscription);
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