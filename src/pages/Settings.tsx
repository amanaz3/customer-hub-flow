
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import NotificationSettings from '@/components/Settings/NotificationSettings';
import { Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
          <SettingsIcon className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and system settings</p>
        </div>
      </div>

      <div className="grid gap-8">
        <Card className="enhanced-card border-0 shadow-lg">
          <CardHeader className="border-b border-border/50 pb-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <SettingsIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Notification Preferences</CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-1">
                  Customize how and when you receive notifications
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <NotificationSettings />
          </CardContent>
        </Card>
      </div>
    </div>
  );
  };

export default Settings;
