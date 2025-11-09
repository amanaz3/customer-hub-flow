import { supabase } from '@/integrations/supabase/client';

export interface EmailNotificationData {
  recipientEmail: string;
  recipientName: string;
  title: string;
  message: string;
  type: string;
  actionUrl?: string;
  customerName?: string;
  userId?: string;
  statusType?: string;
}

export interface NotificationPreferences {
  email_notifications_enabled: boolean;
  notify_status_updates: boolean;
  notify_new_comments: boolean;
  notify_document_uploads: boolean;
  notify_system_alerts: boolean;
}

const notificationTypeMap: Record<string, keyof NotificationPreferences> = {
  'status_change': 'notify_status_updates',
  'comment': 'notify_new_comments',
  'document': 'notify_document_uploads',
  'system': 'notify_system_alerts',
};

export const getUserNotificationPreferences = async (userId: string): Promise<NotificationPreferences | null> => {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserNotificationPreferences:', error);
    return null;
  }
};

export const shouldSendEmailForNotificationType = async (
  userId: string,
  notificationType: string
): Promise<boolean> => {
  const preferences = await getUserNotificationPreferences(userId);
  
  if (!preferences) {
    // Default to true if no preferences set
    return true;
  }

  // Check if email notifications are globally enabled
  if (!preferences.email_notifications_enabled) {
    return false;
  }

  // Check specific notification type preference
  const preferenceKey = notificationTypeMap[notificationType];
  if (preferenceKey && preferences[preferenceKey] !== undefined) {
    return preferences[preferenceKey];
  }

  // Default to true for unknown types
  return true;
};

export const sendNotificationEmail = async (emailData: EmailNotificationData): Promise<boolean> => {
  try {
    console.log('Invoking send-notification-email edge function:', emailData.title);

    const { data, error } = await supabase.functions.invoke('send-notification-email', {
      body: emailData,
    });

    if (error) {
      console.error('Error invoking email function:', error);
      return false;
    }

    console.log('Email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Error in sendNotificationEmail:', error);
    return false;
  }
};

export const saveNotificationPreferences = async (
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<boolean> => {
  try {
    // Check if preferences exist
    const { data: existing } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      // Update existing preferences
      const { error } = await supabase
        .from('notification_preferences')
        .update(preferences)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating notification preferences:', error);
        return false;
      }
    } else {
      // Create new preferences
      const { error } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: userId,
          ...preferences,
        });

      if (error) {
        console.error('Error creating notification preferences:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in saveNotificationPreferences:', error);
    return false;
  }
};
