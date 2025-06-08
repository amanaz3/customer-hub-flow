import React, { useState, useEffect } from 'react';
import { Document } from '@/types/customer';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useAuth } from '@/contexts/SecureAuthContext';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  validateFile, 
  uploadFile, 
  SUPPORTED_FILE_TYPES, 
  MAX_FILE_SIZE, 
  formatFileSize, 
  getFileIcon,
  verifyFileAccess,
  getFileViewLink,
  getFileDownloadLink,
  getFileName
} from '@/utils/fileUpload';
import type { UploadProgress } from '@/utils/fileUpload';
import { Upload, CheckCircle, Eye, AlertCircle, X, Download, RefreshCw } from 'lucide-react';

interface DocumentUploadProps {
  documents: Document[];
  customerId: string;
  onUpload: (documentId: string, filePath: string) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  documents,
  customerId,
  onUpload,
}) => {
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const { user } = useAuth();
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [verifyingFiles, setVerifyingFiles] = useState<Set<string>>(new Set());
  const [fileAccessStatus, setFileAccessStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const verifyAllFiles = async () => {
      const uploadedDocs = documents.filter(doc => doc.is_uploaded && doc.file_path);
      
      for (const doc of uploadedDocs) {
        if (doc.file_path) {
          setVerifyingFiles(prev => new Set(prev).add(doc.id));
          try {
            const isAccessible = await verifyFileAccess(doc.file_path);
            setFileAccessStatus(prev => ({ ...prev, [doc.id]: isAccessible }));
            console.log(`File access check for ${doc.id}:`, isAccessible);
          } catch (error) {
            console.error(`Error verifying file access for ${doc.id}:`, error);
            setFileAccessStatus(prev => ({ ...prev, [doc.id]: false }));
          } finally {
            setVerifyingFiles(prev => {
              const newSet = new Set(prev);
              newSet.delete(doc.id);
              return newSet;
            });
          }
        }
      }
    };

    verifyAllFiles();
    const interval = setInterval(verifyAllFiles, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [documents]);

  const handleFileChange = (documentId: string) => async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    console.log(`Starting upload for document ${documentId}:`, file.name);

    const validation = validateFile(file);
    if (!validation.isValid) {
      handleError(new Error(validation.error || 'File validation failed'), 'File Upload');
      return;
    }

    setUploading(documentId);
    setUploadProgress(prev => ({ ...prev, [documentId]: 0 }));

    try {
      const filePath = await uploadFile(
        file, 
        customerId, 
        documentId, 
        user.id,
        (progress: UploadProgress) => {
          setUploadProgress(prev => ({ ...prev, [documentId]: progress.percentage }));
        }
      );
      
      onUpload(documentId, filePath);
      setUploading(null);
      setUploadProgress(prev => ({ ...prev, [documentId]: 100 }));
      setFileAccessStatus(prev => ({ ...prev, [documentId]: true }));
      
      toast({
        title: "Document uploaded successfully",
        description: `${getFileIcon(file.name)} ${file.name} has been uploaded to Supabase Storage.`,
      });

      console.log(`Upload completed for document ${documentId}`);
      
    } catch (error) {
      setUploading(null);
      setUploadProgress(prev => ({ ...prev, [documentId]: 0 }));
      handleError(error, 'File Upload');
    }

    event.target.value = '';
  };

  const cancelUpload = (documentId: string) => {
    setUploading(null);
    setUploadProgress(prev => ({ ...prev, [documentId]: 0 }));
    
    toast({
      title: "Upload cancelled",
      description: "File upload has been cancelled.",
    });
  };

  const handleManualVerify = async (doc: Document) => {
    if (!doc.file_path) return;
    
    setVerifyingFiles(prev => new Set(prev).add(doc.id));
    
    try {
      const isAccessible = await verifyFileAccess(doc.file_path);
      setFileAccessStatus(prev => ({ ...prev, [doc.id]: isAccessible }));
      
      toast({
        title: isAccessible ? "File is accessible" : "File access issue",
        description: isAccessible 
          ? "File is accessible and can be viewed." 
          : "File may have been moved or deleted.",
        variant: isAccessible ? "default" : "destructive",
      });
    } catch (error) {
      handleError(error, 'File Verification');
    } finally {
      setVerifyingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(doc.id);
        return newSet;
      });
    }
  };

  const handleViewFile = (doc: Document) => {
    if (!doc.file_path) return;
    
    console.log('Attempting to view file:', doc.file_path);
    const viewLink = getFileViewLink(doc.file_path);
    console.log('Generated view link:', viewLink);
    
    if (viewLink) {
      window.open(viewLink, '_blank');
    } else {
      toast({
        title: "Unable to view file",
        description: "Could not generate a valid link to view this file.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadFile = (doc: Document) => {
    if (!doc.file_path) return;
    
    console.log('Attempting to download file:', doc.file_path);
    const downloadLink = getFileDownloadLink(doc.file_path);
    console.log('Generated download link:', downloadLink);
    
    if (downloadLink) {
      window.open(downloadLink, '_blank');
    } else {
      toast({
        title: "Unable to download file",
        description: "Could not generate a valid link to download this file.",
        variant: "destructive",
      });
    }
  };

  const getSupportedTypesText = () => {
    return Object.keys(SUPPORTED_FILE_TYPES).join(', ');
  };

  const renderUploadButton = (doc: Document) => {
    const isCurrentlyUploading = uploading === doc.id;
    const progress = uploadProgress[doc.id] || 0;

    if (isCurrentlyUploading) {
      return (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Uploading...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={progress} className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => cancelUpload(doc.id)}
              className="px-2"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <input
          type="file"
          id={`file-${doc.id}`}
          className="hidden"
          accept={Object.keys(SUPPORTED_FILE_TYPES).join(',')}
          onChange={handleFileChange(doc.id)}
          disabled={!!uploading}
        />
        <label htmlFor={`file-${doc.id}`} className="w-full cursor-pointer">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full flex items-center gap-2" 
            disabled={!!uploading}
            asChild
          >
            <span>
              <Upload className="w-3 h-3" />
              Upload File
            </span>
          </Button>
        </label>
      </div>
    );
  };

  const renderFileActions = (doc: Document) => {
    if (!doc.file_path) return null;

    const isVerifying = verifyingFiles.has(doc.id);
    const isAccessible = fileAccessStatus[doc.id];
    const fileName = getFileName(doc.file_path);

    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isAccessible === false ? (
            <div className="flex items-center gap-1 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs">Access Issue</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs">{fileName}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleManualVerify(doc)}
            disabled={isVerifying}
            className="px-2"
            title="Verify file access"
          >
            <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleViewFile(doc)}
            className="px-2"
            title="View file"
          >
            <Eye className="w-3 h-3" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleDownloadFile(doc)}
            className="px-2"
            title="Download file"
          >
            <Download className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  };

  if (!documents || documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Required Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No documents configured for this customer.</p>
            <p className="text-sm">Documents will be automatically created when the customer application is saved.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Required Documents
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          <p>Supported formats: {getSupportedTypesText()}</p>
          <p>Maximum file size: {formatFileSize(MAX_FILE_SIZE)}</p>
          <p>Files are stored securely in Supabase Storage</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div 
              key={doc.id} 
              className="p-4 border rounded-md flex flex-col space-y-3 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  {doc.is_uploaded && getFileIcon(doc.file_path ? getFileName(doc.file_path) : doc.name)}
                  {doc.name}
                </h3>
                {doc.is_mandatory ? (
                  <Badge variant="destructive">Required</Badge>
                ) : (
                  <Badge variant="outline">Optional</Badge>
                )}
              </div>
              
              {doc.is_uploaded ? renderFileActions(doc) : renderUploadButton(doc)}
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-blue-800 text-sm">
              <p className="font-medium">Upload Guidelines:</p>
              <ul className="mt-1 space-y-1 text-xs">
                <li>• Ensure documents are clear and readable</li>
                <li>• All mandatory documents must be uploaded</li>
                <li>• Files are automatically validated for type and size</li>
                <li>• Uploaded files are securely stored in Supabase Storage</li>
                <li>• Admin team has automatic access to all documents</li>
                <li>• File accessibility is verified automatically</li>
                <li>• Use the refresh button to manually verify file access</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;
