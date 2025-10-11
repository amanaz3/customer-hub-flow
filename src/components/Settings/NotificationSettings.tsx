
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getUserNotificationPreferences, saveNotificationPreferences } from '@/services/emailNotificationService';

const NotificationSettings: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [statusUpdates, setStatusUpdates] = useState(true);
  const [commentNotifications, setCommentNotifications] = useState(true);
  const [documentNotifications, setDocumentNotifications] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const preferences = await getUserNotificationPreferences(user.id);
      
      if (preferences) {
        setEmailNotifications(preferences.email_notifications_enabled);
        setStatusUpdates(preferences.notify_status_updates);
        setCommentNotifications(preferences.notify_new_comments);
        setDocumentNotifications(preferences.notify_document_uploads);
        setSystemAlerts(preferences.notify_system_alerts);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to save preferences",
          variant: "destructive",
        });
        return;
      }

      const success = await saveNotificationPreferences(user.id, {
        email_notifications_enabled: emailNotifications,
        notify_status_updates: statusUpdates,
        notify_new_comments: commentNotifications,
        notify_document_uploads: documentNotifications,
        notify_system_alerts: systemAlerts,
      });

      if (success) {
        toast({
          title: "Settings Saved",
          description: "Your notification preferences have been updated",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save notification preferences",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "An error occurred while saving preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Configure how you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">Loading preferences...</div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Status Updates</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when customer status changes
                </p>
              </div>
              <Switch
                checked={statusUpdates}
                onCheckedChange={setStatusUpdates}
                disabled={!emailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Comment Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Get notified about new comments
                </p>
              </div>
              <Switch
                checked={commentNotifications}
                onCheckedChange={setCommentNotifications}
                disabled={!emailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Document Uploads</p>
                <p className="text-sm text-muted-foreground">
                  Get notified about document updates
                </p>
              </div>
              <Switch
                checked={documentNotifications}
                onCheckedChange={setDocumentNotifications}
                disabled={!emailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">System Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Receive important system notifications
                </p>
              </div>
              <Switch
                checked={systemAlerts}
                onCheckedChange={setSystemAlerts}
                disabled={!emailNotifications}
              />
            </div>
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSaveNotificationSettings}
          disabled={loading || saving}
        >
          {saving ? "Saving..." : "Save Notification Settings"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NotificationSettings;
