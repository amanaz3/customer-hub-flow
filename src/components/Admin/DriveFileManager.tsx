
import React, { useState, useEffect } from 'react';
import { googleDriveService } from '@/services/googleDriveService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Trash2, Folder, File, RefreshCw } from 'lucide-react';
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

  useEffect(() => {
    loadCustomerFolders();
  }, []);

  const loadCustomerFolders = async () => {
    setLoading(true);
    try {
      if (!googleDriveService.isAuthenticated()) {
        await googleDriveService.initializeAuth();
      }
      const folders = await googleDriveService.getAllCustomerFolders();
      setCustomerFolders(folders);
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
    await loadCustomerFolders();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Google Drive File Manager</h2>
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
              Customer Folders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !selectedFolder ? (
              <div className="text-center py-4">Loading folders...</div>
            ) : (
              <div className="space-y-2">
                {customerFolders.map((folder) => {
                  const customerId = folder.name.replace('Customer_', '');
                  return (
                    <div
                      key={folder.id}
                      className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${
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
              Files {selectedFolder && `in Customer_${selectedFolder}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedFolder ? (
              <div className="text-center py-8 text-gray-500">
                Select a customer folder to view files
              </div>
            ) : loading ? (
              <div className="text-center py-8">Loading files...</div>
            ) : (
              <div className="space-y-3">
                {folderFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-4 border rounded-md flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{file.name}</div>
                        <div className="text-xs text-gray-500 flex gap-4">
                          <span>Size: {formatFileSize(file.size)}</span>
                          <span>Created: {formatDate(file.createdTime)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(file.webViewLink, '_blank')}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file.id, file.name)}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(file.id, file.name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {folderFiles.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
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
