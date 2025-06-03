
import React, { useState } from 'react';
import { Document } from '@/contexts/CustomerContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { validateFile, uploadFile, SUPPORTED_FILE_TYPES, MAX_FILE_SIZE } from '@/utils/fileUpload';
import { Upload, CheckCircle, Eye, AlertCircle } from 'lucide-react';

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
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const handleFileChange = (documentId: string) => async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log(`Starting upload for document ${documentId}:`, file.name);

    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      toast({
        title: "Upload Failed",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    if (!customerFolderId) {
      toast({
        title: "Upload Failed",
        description: "Customer folder not found. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    setUploading(documentId);
    setUploadProgress({ ...uploadProgress, [documentId]: 0 });

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[documentId] || 0;
          if (currentProgress < 90) {
            return { ...prev, [documentId]: currentProgress + 10 };
          }
          return prev;
        });
      }, 200);

      const filePath = await uploadFile(file, customerId, documentId, customerFolderId);
      
      clearInterval(progressInterval);
      setUploadProgress({ ...uploadProgress, [documentId]: 100 });
      
      onUpload(documentId, filePath);
      setUploading(null);
      
      toast({
        title: "Document uploaded successfully",
        description: `${file.name} has been uploaded and saved.`,
      });

      console.log(`Upload completed for document ${documentId}`);
      
    } catch (error) {
      console.error(`Upload failed for document ${documentId}:`, error);
      setUploading(null);
      setUploadProgress({ ...uploadProgress, [documentId]: 0 });
      
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred during upload.",
        variant: "destructive",
      });
    }

    // Reset file input
    event.target.value = '';
  };

  const formatFileSize = (bytes: number) => {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const getSupportedTypesText = () => {
    return Object.values(SUPPORTED_FILE_TYPES).join(', ');
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
              className="p-4 border rounded-md flex flex-col space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">{doc.name}</h3>
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
                    onClick={() => window.open(`https://drive.google.com${doc.filePath}`, '_blank')}
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    View
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {uploading === doc.id && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Uploading...</span>
                        <span>{uploadProgress[doc.id] || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress[doc.id] || 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      id={`file-${doc.id}`}
                      className="hidden"
                      accept={Object.keys(SUPPORTED_FILE_TYPES).join(',')}
                      onChange={handleFileChange(doc.id)}
                      disabled={uploading === doc.id}
                    />
                    <label
                      htmlFor={`file-${doc.id}`}
                      className="w-full"
                    >
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full flex items-center gap-2" 
                        disabled={uploading === doc.id}
                        asChild
                      >
                        <span>
                          {uploading === doc.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-3 h-3" />
                              Upload
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-blue-800 text-sm">
              <p className="font-medium">Upload Guidelines:</p>
              <ul className="mt-1 space-y-1 text-xs">
                <li>• Ensure documents are clear and readable</li>
                <li>• All mandatory documents must be uploaded</li>
                <li>• Files will be automatically validated for type and size</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;
