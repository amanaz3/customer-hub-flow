
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import NotificationSettings from '@/components/Settings/NotificationSettings';
import { Settings as SettingsIcon, Wrench } from 'lucide-react';
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
                  <Wrench className="w-5 h-5" />
                  Developer Tools
                </CardTitle>
                <CardDescription>
                  Admin-only testing and debugging features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate('/dev-tools')}
                  className="w-full"
                >
                  Open Developer Tools
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  };

export default Settings;
