
import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import NotificationSettings from '@/components/Settings/NotificationSettings';
import WorkflowValidator from '@/components/Admin/WorkflowValidator';
import { useAuth } from '@/contexts/SecureAuthContext';
import { Settings as SettingsIcon, Shield } from 'lucide-react';

const Settings = () => {
  const { isAdmin } = useAuth();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <div className="grid gap-6">
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

          {isAdmin && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <Shield className="w-5 h-5" />
                <div>
                  <CardTitle>System Validation</CardTitle>
                  <CardDescription>
                    Run comprehensive checks on all workflow systems
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <WorkflowValidator />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
