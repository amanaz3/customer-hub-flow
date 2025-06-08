
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
import { Upload, CheckCircle, Eye, AlertCircle, FileText, Building, Users, Shield } from 'lucide-react';

interface CategorizedDocumentUploadProps {
  documents: Document[];
  customerId: string;
  customerLicenseType: string;
  customerFolderId?: string;
  onUpload: (documentId: string, filePath: string) => void;
}

const CategorizedDocumentUpload: React.FC<CategorizedDocumentUploadProps> = ({
  documents,
  customerId,
  customerLicenseType,
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
        description: `${file.name} has been uploaded to Google Drive.`,
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

    event.target.value = '';
  };

  const formatFileSize = (bytes: number) => {
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const getSupportedTypesText = () => {
    return Object.values(SUPPORTED_FILE_TYPES).join(', ');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mandatory': return <Building className="w-5 h-5" />;
      case 'freezone': return <Shield className="w-5 h-5" />;
      case 'supporting': return <FileText className="w-5 h-5" />;
      case 'signatory': return <Users className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'mandatory': return 'Mandatory Documents (All Applications)';
      case 'freezone': return 'Required for Freezone Only';
      case 'supporting': return 'Supporting Documents (Optional but Recommended)';
      case 'signatory': return 'Signatory Documents (For Authorized Signatory Only)';
      default: return 'Documents';
    }
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'mandatory': return 'These documents are required for all applications';
      case 'freezone': return 'Additional documents required for Freezone license types';
      case 'supporting': return 'Optional documents that can help speed up your application';
      case 'signatory': return 'Documents for the authorized signatory of the company';
      default: return '';
    }
  };

  // Group documents by category
  const documentsByCategory = documents.reduce((acc, doc) => {
    // Filter out Freezone documents if customer doesn't have Freezone license
    if (doc.category === 'freezone' && customerLicenseType !== 'Freezone') {
      return acc;
    }
    
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  const categoryOrder = ['mandatory', 'freezone', 'supporting', 'signatory'];

  const renderDocumentItem = (doc: Document) => {
    const handleViewFile = () => {
      if (doc.file_path?.startsWith('/drive/')) {
        const driveFileId = doc.file_path.replace('/drive/', '');
        window.open(`https://drive.google.com/file/d/${driveFileId}/view`, '_blank');
      }
    };

    return (
      <div 
        key={doc.id} 
        className="p-4 border rounded-md flex flex-col space-y-3"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">
            {doc.name}
            {doc.is_mandatory && <span className="text-red-500 ml-1">*</span>}
          </h3>
          {doc.is_mandatory ? (
            <Badge variant="destructive">Required</Badge>
          ) : (
            <Badge variant="outline">Optional</Badge>
          )}
        </div>
        
        {doc.is_uploaded ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs">Uploaded to Drive</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleViewFile}
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
                  <span>Uploading to Drive...</span>
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
                        Upload to Drive
                      </>
                    )}
                  </span>
                </Button>
              </label>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        <p>Supported formats: {getSupportedTypesText()}</p>
        <p>Maximum file size: {formatFileSize(MAX_FILE_SIZE)}</p>
        <p className="text-red-600 font-medium">* Indicates mandatory documents</p>
        {customerFolderId ? (
          <p className="text-green-600 font-medium">✓ Connected to Google Drive</p>
        ) : (
          <p className="text-red-600 font-medium">⚠️ Google Drive folder not found</p>
        )}
      </div>

      {categoryOrder.map(category => {
        const categoryDocs = documentsByCategory[category];
        if (!categoryDocs || categoryDocs.length === 0) return null;

        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getCategoryIcon(category)}
                {getCategoryTitle(category)}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {getCategoryDescription(category)}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryDocs.map(renderDocumentItem)}
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-blue-800 text-sm">
            <p className="font-medium">Upload Guidelines:</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• Ensure documents are clear and readable</li>
              <li>• All mandatory documents (*) must be uploaded before submission</li>
              <li>• Files are uploaded securely to Google Drive</li>
              <li>• You can save your progress as draft and continue later</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategorizedDocumentUpload;
