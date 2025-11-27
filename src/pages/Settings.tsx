
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NotificationSettings from '@/components/Settings/NotificationSettings';
import { FeatureFlagsSettings } from '@/components/Settings/FeatureFlagsSettings';
import { Settings as SettingsIcon, Flag } from 'lucide-react';

const Settings = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('notifications');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'features') {
      setActiveTab('features');
    }
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <SettingsIcon className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="features">Feature Flags</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage your notification settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationSettings />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Application Workflow Features
              </CardTitle>
              <CardDescription>
                Enable or disable advanced workflow features. Disable any feature if you encounter issues.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FeatureFlagsSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
