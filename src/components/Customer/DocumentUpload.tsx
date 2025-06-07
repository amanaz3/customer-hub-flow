
import React, { useState } from 'react';
import { Document } from '@/contexts/CustomerContext';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { validateFile, uploadFile, SUPPORTED_FILE_TYPES, MAX_FILE_SIZE, formatFileSize, getFileIcon } from '@/utils/fileUpload';
import type { UploadProgress } from '@/utils/fileUpload';
import { Upload, CheckCircle, Eye, AlertCircle, X } from 'lucide-react';

interface DocumentUploadProps {
  documents: Document[];
  customerId: string;
  customerFolderId?: string;
  onUpload: (documentId: string, filePath: string) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  documents,
  customerId,
  customerFolderId,
  onUpload,
}) => {
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const handleFileChange = (documentId: string) => async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log(`Starting upload for document ${documentId}:`, file.name);

    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      handleError(new Error(validation.error || 'File validation failed'), 'File Upload');
      return;
    }

    if (!customerFolderId) {
      handleError(new Error('Customer folder not found. Please contact support.'), 'File Upload');
      return;
    }

    setUploading(documentId);
    setUploadProgress(prev => ({ ...prev, [documentId]: 0 }));

    try {
      const filePath = await uploadFile(
        file, 
        customerId, 
        documentId, 
        customerFolderId,
        (progress: UploadProgress) => {
          setUploadProgress(prev => ({ ...prev, [documentId]: progress.percentage }));
        }
      );
      
      onUpload(documentId, filePath);
      setUploading(null);
      setUploadProgress(prev => ({ ...prev, [documentId]: 100 }));
      
      toast({
        title: "Document uploaded successfully",
        description: `${getFileIcon(file.name)} ${file.name} has been uploaded and saved.`,
      });

      console.log(`Upload completed for document ${documentId}`);
      
    } catch (error) {
      setUploading(null);
      setUploadProgress(prev => ({ ...prev, [documentId]: 0 }));
      handleError(error, 'File Upload');
    }

    // Reset file input
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
        <label htmlFor={`file-${doc.id}`} className="w-full">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full flex items-center gap-2" 
            disabled={!!uploading}
            asChild
          >
            <span>
              <Upload className="w-3 h-3" />
              Upload
            </span>
          </Button>
        </label>
      </div>
    );
  };

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
                  {doc.isUploaded && getFileIcon(doc.name)}
                  {doc.name}
                </h3>
                {doc.isMandatory ? (
                  <Badge variant="destructive">Required</Badge>
                ) : (
                  <Badge variant="outline">Optional</Badge>
                )}
              </div>
              
              {doc.isUploaded ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs">Uploaded</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (doc.filePath) {
                        window.open(`https://drive.google.com${doc.filePath}`, '_blank');
                      }
                    }}
                    className="flex items-center gap-1"
                    disabled={!doc.filePath}
                  >
                    <Eye className="w-3 h-3" />
                    View
                  </Button>
                </div>
              ) : (
                renderUploadButton(doc)
              )}
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
                <li>• Uploaded files are securely stored in Google Drive</li>
                <li>• Banking team has automatic access to all documents</li>
              </ul>
            </div>
          </div>
        </div>

        {!customerFolderId && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-yellow-800 text-sm">
                <p className="font-medium">Warning:</p>
                <p>Google Drive folder not available. Document upload is currently disabled.</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;
