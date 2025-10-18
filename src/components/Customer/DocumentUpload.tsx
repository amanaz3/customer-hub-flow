
import React, { useState, useEffect } from 'react';
import { Document } from '@/types/customer';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useCustomer } from '@/contexts/CustomerContext';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  getFileName,
  getFileSize
} from '@/utils/fileUpload';
import type { UploadProgress } from '@/utils/fileUpload';
import { Upload, CheckCircle, Eye, AlertCircle, X, Download, RefreshCw, ExternalLink, Trash2, Replace } from 'lucide-react';

interface DocumentUploadProps {
  documents: Document[];
  customerId: string;
  onUpload: (documentId: string, filePath: string) => void;
  customerStatus?: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  documents,
  customerId,
  onUpload,
  customerStatus,
}) => {
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const { user } = useAuth();
  const { deleteDocument, replaceDocument } = useCustomer();
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [verifyingFiles, setVerifyingFiles] = useState<Set<string>>(new Set());
  const [fileAccessStatus, setFileAccessStatus] = useState<Record<string, boolean>>({});
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [documentToReplace, setDocumentToReplace] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);

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
      
      // Get document name for toast
      const document = documents.find(doc => doc.id === documentId);
      
      toast({
        title: "Document uploaded successfully",
        description: `${getFileIcon(file.name)} ${document?.name || file.name} has been uploaded to Supabase Storage.`,
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
          ? "File is accessible and can be viewed from Supabase Storage." 
          : "File may have been moved or deleted from storage.",
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
      // Open in new tab for better viewing experience
      window.open(viewLink, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "Unable to view file",
        description: "Could not generate a valid link to view this file from Supabase Storage.",
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
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = downloadLink;
      link.download = getFileName(doc.file_path);
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast({
        title: "Unable to download file",
        description: "Could not generate a valid link to download this file from Supabase Storage.",
        variant: "destructive",
      });
    }
  };

  const canModifyDocument = () => {
    return customerStatus === 'Draft';
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete || !documentToDelete.file_path) return;

    setIsDeleting(true);
    try {
      await deleteDocument(customerId, documentToDelete.id, documentToDelete.file_path);
      
      toast({
        title: "Document deleted",
        description: `${documentToDelete.name} has been deleted successfully.`,
      });
      
      setDocumentToDelete(null);
    } catch (error) {
      handleError(error, 'Document Delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReplaceFileSelect = async (doc: Document, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !doc.file_path) return;

    const validation = validateFile(file);
    if (!validation.isValid) {
      handleError(new Error(validation.error || 'File validation failed'), 'File Validation');
      event.target.value = '';
      return;
    }

    setDocumentToReplace(doc);
    setIsReplacing(true);

    try {
      await replaceDocument(customerId, doc.id, doc.file_path, file);
      
      toast({
        title: "Document replaced",
        description: `${doc.name} has been replaced successfully.`,
      });
      
      setDocumentToReplace(null);
    } catch (error) {
      handleError(error, 'Document Replace');
    } finally {
      setIsReplacing(false);
      event.target.value = '';
    }
  };

  const getSupportedTypesText = () => {
    return Object.keys(SUPPORTED_FILE_TYPES).join(', ');
  };

  const renderUploadButton = (doc: Document) => {
    const isCurrentlyUploading = uploading === doc.id;
    const progress = uploadProgress[doc.id] || 0;
    const isCompleted = customerStatus === 'Complete' || customerStatus === 'Paid';
    const isUploadDisabled = !!uploading || isCompleted;

    if (isCurrentlyUploading) {
      return (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Uploading to Supabase Storage...</span>
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

    if (isCompleted) {
      return (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
          <div className="flex items-center gap-2 text-gray-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Application Completed</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Document uploads are locked for completed applications
          </p>
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
          disabled={isUploadDisabled}
        />
        <label htmlFor={`file-${doc.id}`} className={`w-full ${isUploadDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full flex items-center gap-2" 
            disabled={isUploadDisabled}
            asChild
          >
            <span>
              <Upload className="w-3 h-3" />
              Upload to Storage
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
    const fileSize = getFileSize(doc.file_path);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isAccessible === false ? (
              <div className="flex items-center gap-1 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs">Storage Access Issue</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <div className="text-xs">
                  <div className="font-medium">{fileName}</div>
                  {fileSize > 0 && (
                    <div className="text-gray-500">{formatFileSize(fileSize)}</div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleManualVerify(doc)}
              disabled={isVerifying}
              className="px-2 h-8 w-8 flex items-center justify-center"
              title="Verify file access in Supabase Storage"
            >
              <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleViewFile(doc)}
              className="px-3 h-8 flex items-center gap-1"
              title="View & Download from Supabase Storage"
            >
              <Eye className="w-3 h-3" />
              <span className="text-xs">View</span>
            </Button>

            {canModifyDocument() && (
              <>
                <input
                  type="file"
                  id={`replace-${doc.id}`}
                  className="hidden"
                  accept={Object.keys(SUPPORTED_FILE_TYPES).join(',')}
                  onChange={(e) => handleReplaceFileSelect(doc, e)}
                  disabled={isReplacing}
                />
                <label htmlFor={`replace-${doc.id}`}>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="px-2 h-8"
                    title="Replace file"
                    disabled={isReplacing}
                    asChild
                  >
                    <span>
                      <Replace className={`w-3 h-3 ${isReplacing && documentToReplace?.id === doc.id ? 'animate-spin' : ''}`} />
                    </span>
                  </Button>
                </label>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setDocumentToDelete(doc)}
                  className="px-2 h-8"
                  title="Delete document"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <ExternalLink className="w-3 h-3" />
          Stored in Supabase Storage • Click View to access file
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
    <>
      <AlertDialog open={!!documentToDelete} onOpenChange={(open) => !open && setDocumentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.name}"? This action cannot be undone and the file will be permanently removed from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDocument} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Required Documents
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          <p>Supported formats: {getSupportedTypesText()}</p>
          <p>Maximum file size: {formatFileSize(MAX_FILE_SIZE)}</p>
          <p className="text-green-600 font-medium">✓ Files are stored securely in Supabase Storage</p>
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
              <p className="font-medium">Supabase Storage Guidelines:</p>
              <ul className="mt-1 space-y-1 text-xs">
                <li>• All files are securely stored in Supabase Storage</li>
                <li>• Files are publicly accessible via secure URLs</li>
                <li>• All mandatory documents must be uploaded before submission</li>
                <li>• Files are automatically validated for type and size</li>
                <li>• Admin team has automatic access to all documents</li>
                <li>• File accessibility is verified automatically every 5 minutes</li>
                <li>• Use the refresh button to manually verify file access</li>
                <li>• Click view/download to access files directly from storage</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
      </Card>
    </>
  );
};

export default DocumentUpload;
