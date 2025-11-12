
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import NotificationSettings from '@/components/Settings/NotificationSettings';
import { Settings as SettingsIcon, Bell, TestTube } from 'lucide-react';
import { useAuth } from '@/contexts/SecureAuthContext';

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.profile?.role === 'admin';

  return (
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="w-5 h-5" />
                  Developer Tools
                </CardTitle>
                <CardDescription>
                  Admin-only testing and debugging features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      <h3 className="font-medium">Notification Testing</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Test in-app and email notifications without affecting production data
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate('/notification-testing')}
                    variant="outline"
                  >
                    Open
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  };

export default Settings;
