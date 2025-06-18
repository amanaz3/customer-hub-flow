
import React, { useState } from 'react';
import { Document } from '@/types/customer';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SecureAuthContext';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { validateFile, uploadFile, SUPPORTED_FILE_TYPES, MAX_FILE_SIZE, formatFileSize, getFileIcon, getFileName, getFileViewLink, getFileDownloadLink } from '@/utils/fileUpload';
import { Upload, CheckCircle, Eye, AlertCircle, FileText, Building, Users, Shield, ExternalLink, Download, DollarSign, Info } from 'lucide-react';

interface TabbedDocumentUploadProps {
  documents: Document[];
  customerId: string;
  customerLicenseType: string;
  onUpload: (documentId: string, filePath: string) => void;
}

const TabbedDocumentUpload: React.FC<TabbedDocumentUploadProps> = ({
  documents,
  customerId,
  customerLicenseType,
  onUpload,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const handleFileChange = (documentId: string) => async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

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

      const filePath = await uploadFile(file, customerId, documentId, user.id);
      
      clearInterval(progressInterval);
      setUploadProgress({ ...uploadProgress, [documentId]: 100 });
      
      onUpload(documentId, filePath);
      setUploading(null);
      
      const document = documents.find(doc => doc.id === documentId);
      
      toast({
        title: "Document uploaded successfully",
        description: `${getFileIcon(file.name)} ${document?.name || file.name} has been uploaded.`,
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

  const handleViewFile = (doc: Document) => {
    if (!doc.file_path) return;
    
    const viewLink = getFileViewLink(doc.file_path);
    if (viewLink) {
      window.open(viewLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownloadFile = (doc: Document) => {
    if (!doc.file_path) return;
    
    const downloadLink = getFileDownloadLink(doc.file_path);
    if (downloadLink) {
      const link = document.createElement('a');
      link.href = downloadLink;
      link.download = getFileName(doc.file_path);
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderDocumentItem = (doc: Document) => {
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <div className="text-xs">
                  <div className="font-medium">{getFileName(doc.file_path || '')}</div>
                  <div className="text-gray-500 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    Uploaded
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
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
                        Upload Document
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

  const getDocumentsByCategory = (category: string) => {
    return documents.filter(doc => doc.category === category);
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        <p>Supported formats: {Object.values(SUPPORTED_FILE_TYPES).join(', ')}</p>
        <p>Maximum file size: {formatFileSize(MAX_FILE_SIZE)}</p>
        <p className="text-red-600 font-medium">* Indicates required documents</p>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="shareholder" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Shareholder
          </TabsTrigger>
          <TabsTrigger value="funds" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Source of Funds
          </TabsTrigger>
          <TabsTrigger value="additional" className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            Additional Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Company Documents
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Required company registration and business documents
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getDocumentsByCategory('company').map(renderDocumentItem)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shareholder">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Shareholder Documents
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Personal identification and background documents
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getDocumentsByCategory('shareholder').map(renderDocumentItem)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funds">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Source of Funds
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Financial documents to verify source of funding
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getDocumentsByCategory('funds').map(renderDocumentItem)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="additional">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Additional Information
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Supporting business information and financial records
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getDocumentsByCategory('additional').map(renderDocumentItem)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-blue-800 text-sm">
            <p className="font-medium">Upload Guidelines:</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• Ensure documents are clear and readable</li>
              <li>• All required documents (*) must be uploaded before submission</li>
              <li>• You can save your progress as draft and continue later</li>
              <li>• Files can be viewed and downloaded after upload</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabbedDocumentUpload;
