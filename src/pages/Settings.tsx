
import React, { useState } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SecureAuthContext';

const Settings = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false);
  
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    if (password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, this would be an API call
    toast({
      title: "Success",
      description: "Password has been updated",
    });
    
    setPassword('');
    setConfirmPassword('');
  };
  
  const handleConnectGoogleDrive = () => {
    // In a real app, this would open OAuth flow
    setGoogleDriveConnected(true);
    toast({
      title: "Connected",
      description: "Google Drive has been connected successfully",
    });
  };
  
  const handleDisconnectGoogleDrive = () => {
    // In a real app, this would revoke access
    setGoogleDriveConnected(false);
    toast({
      title: "Disconnected",
      description: "Google Drive has been disconnected",
    });
  };
  
  const handleSaveNotificationSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your notification preferences have been updated",
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and application preferences
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Update your account information and password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  defaultValue={user?.profile?.name}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={user?.email}
                  className="mt-1"
                  disabled
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email cannot be changed. Contact administrator for assistance.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to secure your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button type="submit">Change Password</Button>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Google Drive Integration</CardTitle>
              <CardDescription>
                Connect your Google Drive for document storage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Google Drive</p>
                  <p className="text-sm text-muted-foreground">
                    {googleDriveConnected
                      ? "Your account is connected"
                      : "Connect your Google Drive account"}
                  </p>
                </div>
                {googleDriveConnected ? (
                  <Button 
                    variant="outline" 
                    onClick={handleDisconnectGoogleDrive}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button onClick={handleConnectGoogleDrive}>
                    Connect
                  </Button>
                )}
              </div>
              
              {googleDriveConnected && (
                <div>
                  <Label htmlFor="folder-path">Default Folder Path</Label>
                  <Input
                    id="folder-path"
                    defaultValue="/Workflow App Documents/"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Documents will be saved to this folder in your Google Drive
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
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
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveNotificationSettings}>
                Save Notification Settings
              </Button>
            </CardFooter>
          </Card>
          
          {isAdmin && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure global application settings (Admin only)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="app-name">Application Name</Label>
                  <Input
                    id="app-name"
                    defaultValue="Workflow App"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    defaultValue="Your Company"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="support-email">Support Email</Label>
                  <Input
                    id="support-email"
                    type="email"
                    defaultValue="support@example.com"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email-footer">Email Footer Text</Label>
                  <Textarea
                    id="email-footer"
                    defaultValue="This email was sent by Workflow App. © 2023 Your Company. All rights reserved."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save System Settings</Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
