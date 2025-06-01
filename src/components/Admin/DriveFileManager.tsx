
import React, { useState, useEffect } from 'react';
import { googleDriveService } from '@/services/googleDriveService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Trash2, Folder, File, RefreshCw, Settings } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  size?: string;
  webViewLink: string;
}

interface CustomerFolder {
  id: string;
  name: string;
  createdTime: string;
}

const DriveFileManager: React.FC = () => {
  const { toast } = useToast();
  const [customerFolders, setCustomerFolders] = useState<CustomerFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [folderFiles, setFolderFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [authStatus, setAuthStatus] = useState<boolean>(false);

  useEffect(() => {
    checkAuthAndLoadFolders();
  }, []);

  const checkAuthAndLoadFolders = async () => {
    try {
      const isAuth = googleDriveService.isAuthenticated();
      setAuthStatus(isAuth);
      
      if (isAuth) {
        await loadCustomerFolders();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthStatus(false);
    }
  };

  const handleAuthenticate = async () => {
    setLoading(true);
    try {
      await googleDriveService.initializeAuth();
      setAuthStatus(true);
      await loadCustomerFolders();
      toast({
        title: "Success",
        description: "Google Drive authenticated successfully",
      });
    } catch (error) {
      console.error('Authentication failed:', error);
      setAuthStatus(false);
      toast({
        title: "Authentication Failed",
        description: error instanceof Error ? error.message : "Failed to authenticate with Google Drive",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerFolders = async () => {
    setLoading(true);
    try {
      const folders = await googleDriveService.getAllCustomerFolders();
      setCustomerFolders(folders);
      console.log('Loaded customer folders:', folders.length);
    } catch (error) {
      console.error('Failed to load customer folders:', error);
      toast({
        title: "Error",
        description: "Failed to load customer folders from Google Drive",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFolderFiles = async (customerId: string) => {
    setLoading(true);
    try {
      const files = await googleDriveService.listCustomerFiles(customerId);
      setFolderFiles(files);
      setSelectedFolder(customerId);
      console.log('Loaded files for customer:', customerId, files.length);
    } catch (error) {
      console.error('Failed to load folder files:', error);
      toast({
        title: "Error",
        description: "Failed to load files from customer folder",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const blob = await googleDriveService.downloadFile(fileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: `${fileName} downloaded successfully`,
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      await googleDriveService.deleteFile(fileId);
      
      // Refresh the file list
      if (selectedFolder) {
        const customerId = selectedFolder.replace('Customer_', '');
        await loadFolderFiles(customerId);
      }
      
      toast({
        title: "Success",
        description: `${fileName} deleted successfully`,
      });
    } catch (error) {
      console.error('Delete failed:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkAuthAndLoadFolders();
    if (selectedFolder) {
      const customerId = selectedFolder.replace('Customer_', '');
      await loadFolderFiles(customerId);
    }
    setRefreshing(false);
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return 'Unknown size';
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('document')) return '📝';
    return '📎';
  };

  if (!authStatus) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <Settings className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Google Drive Authentication Required</h3>
          <p className="text-gray-600 mb-6">
            You need to authenticate with Google Drive to access file management features.
          </p>
          <Button onClick={handleAuthenticate} disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Authenticating...
              </>
            ) : (
              <>
                <Settings className="w-4 h-4 mr-2" />
                Authenticate Google Drive
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Google Drive File Manager</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-green-600 border-green-600">
              Authenticated
            </Badge>
            <span className="text-sm text-gray-500">Connected to Google Drive</span>
          </div>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Folders */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="w-5 h-5" />
              Customer Folders ({customerFolders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !selectedFolder ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current mx-auto mb-2" />
                Loading folders...
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {customerFolders.map((folder) => {
                  const customerId = folder.name.replace('Customer_', '');
                  return (
                    <div
                      key={folder.id}
                      className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedFolder === customerId ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => loadFolderFiles(customerId)}
                    >
                      <div className="font-medium">{folder.name}</div>
                      <div className="text-xs text-gray-500">
                        Created: {formatDate(folder.createdTime)}
                      </div>
                    </div>
                  );
                })}
                {customerFolders.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No customer folders found
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Files in Selected Folder */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <File className="w-5 h-5" />
              Files {selectedFolder && `in Customer_${selectedFolder} (${folderFiles.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedFolder ? (
              <div className="text-center py-8 text-gray-500">
                <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
                Select a customer folder to view files
              </div>
            ) : loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current mx-auto mb-2" />
                Loading files...
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {folderFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-4 border rounded-md flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl flex-shrink-0">{getFileIcon(file.mimeType)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{file.name}</div>
                        <div className="text-xs text-gray-500 flex gap-4">
                          <span>Size: {formatFileSize(file.size)}</span>
                          <span>Created: {formatDate(file.createdTime)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(file.webViewLink, '_blank')}
                        title="View in Google Drive"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file.id, file.name)}
                        title="Download file"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(file.id, file.name)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete file"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {folderFiles.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    No files found in this folder
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriveFileManager;
