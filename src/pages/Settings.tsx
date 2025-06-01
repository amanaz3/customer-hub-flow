
import React from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import DriveFileManager from '@/components/Admin/DriveFileManager';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon, HardDrive, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Settings = () => {
  const { isAdmin } = useAuth();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General Settings</TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="drive">Drive Management</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <h3 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Google Drive Integration
                  </h3>
                  <p className="text-green-700 text-sm">
                    Google Drive is integrated and configured for document uploads.
                    All customer documents are automatically uploaded to Google Drive with organized folder structure.
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h3 className="font-medium text-blue-800 mb-2">File Upload Settings</h3>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Maximum file size: 10MB</li>
                    <li>• Supported formats: PDF, JPEG, PNG, DOC, DOCX</li>
                    <li>• Files are organized by customer ID in Google Drive</li>
                    <li>• Automatic folder creation for new customers</li>
                    <li>• Secure file sharing with view-only permissions</li>
                  </ul>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-md">
                  <h3 className="font-medium text-purple-800 mb-2">Google Drive Structure</h3>
                  <div className="text-purple-700 text-sm">
                    <p className="mb-2">Your documents are organized as follows:</p>
                    <div className="font-mono text-xs bg-white p-2 rounded border">
                      📁 Amana Finance Documents/<br />
                      &nbsp;&nbsp;📁 Customer_001/<br />
                      &nbsp;&nbsp;📁 Customer_002/<br />
                      &nbsp;&nbsp;📁 Customer_.../<br />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="drive" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5" />
                    Google Drive File Management
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    View, download, and manage all customer documents stored in Google Drive.
                  </p>
                </CardHeader>
                <CardContent>
                  <DriveFileManager />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Settings;
