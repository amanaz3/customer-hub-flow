
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

const NotificationSettings: React.FC = () => {
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [statusUpdates, setStatusUpdates] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);

  const handleSaveNotificationSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your notification preferences have been updated",
    });
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
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">App Notifications</p>
            <p className="text-sm text-muted-foreground">
              Receive notifications within the application
            </p>
          </div>
          <Switch
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
          />
        </div>
        
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
            disabled={!notificationsEnabled}
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
            disabled={!notificationsEnabled}
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
            disabled={!notificationsEnabled}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveNotificationSettings}>
          Save Notification Settings
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NotificationSettings;
