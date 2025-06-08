
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useCustomer } from '@/contexts/CustomerContext';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  userId?: string;
  customerName?: string;
  actionUrl?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user, isAdmin } = useAuth();
  const { customers } = useCustomer();
  const { toast } = useToast();

  // Generate notifications based on customer status changes
  useEffect(() => {
    if (!user || customers.length === 0) return;

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Check for recently updated customers
    customers.forEach(customer => {
      const updatedAt = new Date(customer.updated_at || customer.created_at || now);
      
      if (updatedAt > oneHourAgo) {
        const existingNotification = notifications.find(n => 
          n.customerName === customer.name && n.message.includes(customer.status)
        );

        if (!existingNotification) {
          addNotification({
            title: 'Customer Status Update',
            message: `${customer.name} status changed to ${customer.status}`,
            type: customer.status === 'Complete' ? 'success' : 
                  customer.status === 'Rejected' ? 'error' : 'info',
            customerName: customer.name,
            actionUrl: `/customers/${customer.id}`,
            userId: isAdmin ? undefined : user.id
          });
        }
      }
    });
  }, [customers, user, isAdmin]);

  // Add system notifications for admins
  useEffect(() => {
    if (!isAdmin || !user) return;

    const pendingCustomers = customers.filter(c => 
      !['Complete', 'Rejected'].includes(c.status)
    ).length;

    if (pendingCustomers > 5) {
      const existingNotification = notifications.find(n => 
        n.title === 'High Pending Cases' && n.read === false
      );

      if (!existingNotification) {
        addNotification({
          title: 'High Pending Cases',
          message: `You have ${pendingCustomers} cases awaiting processing`,
          type: 'warning',
          actionUrl: '/customers'
        });
      }
    }
  }, [customers, isAdmin, user]);

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep max 50 notifications

    // Show toast for new notifications
    toast({
      title: newNotification.title,
      description: newNotification.message,
      variant: newNotification.type === 'error' ? 'destructive' : 'default'
    });
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications
    }}>
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
