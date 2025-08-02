import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SecureAuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  getFileName,
  getFileViewLink,
  getFileDownloadLink
} from '@/utils/fileUpload';
import type { UploadProgress } from '@/utils/fileUpload';
import { Upload, CheckCircle, Eye, Download, X, Plus, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CustomDocument {
  id: string;
  name: string;
  category: string;
  file_path?: string;
  is_uploaded: boolean;
  created_at: string;
}

interface CustomDocumentUploadProps {
  customerId: string;
  customerStatus?: string;
  onDocumentAdded?: () => void;
}

const CustomDocumentUpload: React.FC<CustomDocumentUploadProps> = ({
  customerId,
  customerStatus,
  onDocumentAdded,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [customDocuments, setCustomDocuments] = useState<CustomDocument[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('supporting');
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isCreating, setIsCreating] = useState(false);

  // Load custom documents on component mount
  React.useEffect(() => {
    loadCustomDocuments();
  }, [customerId]);

  const loadCustomDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('customer_id', customerId)
        .eq('category', 'supporting')
        .is('requires_license_type', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const customDocs = data?.filter(doc => 
        !['Passport Copy', 'Trade License', 'Emirates ID', 'Visa Copy', 'NOC Letter'].some(defaultName => 
          doc.name.includes(defaultName)
        )
      ) || [];

      setCustomDocuments(customDocs);
    } catch (error) {
      console.error('Error loading custom documents:', error);
    }
  };

  const handleCreateDocument = async () => {
    if (!newDocName.trim() || !user) return;

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .insert({
          customer_id: customerId,
          name: newDocName.trim(),
          category: newDocCategory as any,
          is_mandatory: false,
          is_uploaded: false,
          requires_license_type: null
        })
        .select()
        .single();

      if (error) throw error;

      setCustomDocuments(prev => [data, ...prev]);
      setNewDocName('');
      setShowAddForm(false);
      onDocumentAdded?.();

      toast({
        title: "Document created",
        description: `${newDocName} has been added to the documents list.`,
      });
    } catch (error) {
      console.error('Error creating document:', error);
      toast({
        title: "Error",
        description: "Failed to create document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleFileChange = (documentId: string) => async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

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

      // Update the document in Supabase
      const { error } = await supabase
        .from('documents')
        .update({
          file_path: filePath,
          is_uploaded: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (error) throw error;

      // Update local state
      setCustomDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, file_path: filePath, is_uploaded: true }
            : doc
        )
      );

      setUploading(null);
      setUploadProgress(prev => ({ ...prev, [documentId]: 100 }));
      onDocumentAdded?.();
      
      toast({
        title: "Document uploaded successfully",
        description: `${getFileIcon(file.name)} ${file.name} has been uploaded.`,
      });
      
    } catch (error) {
      setUploading(null);
      setUploadProgress(prev => ({ ...prev, [documentId]: 0 }));
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    }

    event.target.value = '';
  };

  const handleViewFile = (doc: CustomDocument) => {
    if (!doc.file_path) return;
    
    const viewLink = getFileViewLink(doc.file_path);
    if (viewLink) {
      window.open(viewLink, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "Unable to view file",
        description: "Could not generate a valid link to view this file.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadFile = (doc: CustomDocument) => {
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
    } else {
      toast({
        title: "Unable to download file",
        description: "Could not generate a valid link to download this file.",
        variant: "destructive",
      });
    }
  };

  const cancelUpload = (documentId: string) => {
    setUploading(null);
    setUploadProgress(prev => ({ ...prev, [documentId]: 0 }));
    
    toast({
      title: "Upload cancelled",
      description: "File upload has been cancelled.",
    });
  };

  const renderUploadButton = (doc: CustomDocument) => {
    const isCurrentlyUploading = uploading === doc.id;
    const progress = uploadProgress[doc.id] || 0;
    const isCompleted = customerStatus === 'Complete' || customerStatus === 'Paid';
    const isUploadDisabled = !!uploading || isCompleted;

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
          id={`custom-file-${doc.id}`}
          className="hidden"
          accept={Object.keys(SUPPORTED_FILE_TYPES).join(',')}
          onChange={handleFileChange(doc.id)}
          disabled={isUploadDisabled}
        />
        <label htmlFor={`custom-file-${doc.id}`} className={`w-full ${isUploadDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full flex items-center gap-2" 
            disabled={isUploadDisabled}
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

  const renderFileActions = (doc: CustomDocument) => {
    if (!doc.file_path) return null;

    const fileName = getFileName(doc.file_path);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <div className="text-xs">
              <div className="font-medium">{fileName}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
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
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Additional Documents
          </CardTitle>
          {!(customerStatus === 'Complete' || customerStatus === 'Paid') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Document
            </Button>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Upload additional documents with custom names
        </div>
      </CardHeader>
      <CardContent>
        {showAddForm && (
          <Card className="mb-4">
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="docName">Document Name</Label>
                    <Input
                      id="docName"
                      placeholder="e.g., Bank Statement, Contract..."
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="docCategory">Category</Label>
                    <Select value={newDocCategory} onValueChange={setNewDocCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="supporting">Supporting Document</SelectItem>
                        <SelectItem value="signatory">Signatory Document</SelectItem>
                        <SelectItem value="mandatory">Mandatory Document</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateDocument}
                    disabled={!newDocName.trim() || isCreating}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {isCreating ? 'Creating...' : 'Create Document'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewDocName('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {customDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customDocuments.map((doc) => (
              <div 
                key={doc.id} 
                className="p-4 border rounded-md flex flex-col space-y-3 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    {doc.is_uploaded && getFileIcon(doc.file_path ? getFileName(doc.file_path) : doc.name)}
                    {doc.name}
                  </h3>
                  <Badge variant="outline">
                    {doc.category.charAt(0).toUpperCase() + doc.category.slice(1)}
                  </Badge>
                </div>
                
                {doc.is_uploaded ? renderFileActions(doc) : renderUploadButton(doc)}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No additional documents added yet.</p>
            <p className="text-sm">Click "Add Document" to create custom documents.</p>
          </div>
        )}
        
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="text-blue-800 text-sm">
            <p className="font-medium">Additional Documents:</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• Upload any additional documents with custom names</li>
              <li>• Supported formats: {Object.keys(SUPPORTED_FILE_TYPES).join(', ')}</li>
              <li>• Maximum file size: {formatFileSize(MAX_FILE_SIZE)}</li>
              <li>• Files are stored securely in Supabase Storage</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomDocumentUpload;