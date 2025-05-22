
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
  const [uploading, setUploading] = useState<string | null>(null);

  const handleFileChange = (documentId: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(documentId);
    
    // Simulate upload process
    setTimeout(() => {
      // In a real app, this would be an API call to upload the file
      const filePath = `/uploads/${customerId}/${documentId}/${file.name}`;
      onUpload(documentId, filePath);
      setUploading(null);
      
      toast({
        title: "Document uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Required Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div 
              key={doc.id} 
              className="p-4 border rounded-md flex flex-col space-y-2"
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
                  <span className="text-xs text-green-600">✓ Uploaded</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`https://drive.google.com${doc.filePath}`, '_blank')}
                  >
                    View
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="file"
                    id={`file-${doc.id}`}
                    className="hidden"
                    onChange={handleFileChange(doc.id)}
                  />
                  <label
                    htmlFor={`file-${doc.id}`}
                    className="w-full"
                  >
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full" 
                      disabled={uploading === doc.id}
                    >
                      {uploading === doc.id ? "Uploading..." : "Upload"}
                    </Button>
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;
