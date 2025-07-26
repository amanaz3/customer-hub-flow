import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Document } from '@/types/customer';

interface DocumentCompleteCheckboxProps {
  isChecked: boolean;
  onCheckedChange: (checked: boolean) => void;
  documents: Document[];
  disabled?: boolean;
}

const DocumentCompleteCheckbox: React.FC<DocumentCompleteCheckboxProps> = ({
  isChecked,
  onCheckedChange,
  documents,
  disabled = false
}) => {
  const mandatoryDocuments = documents.filter(doc => doc.is_mandatory);
  const uploadedMandatory = mandatoryDocuments.filter(doc => doc.is_uploaded);
  const allMandatoryUploaded = mandatoryDocuments.length > 0 && uploadedMandatory.length === mandatoryDocuments.length;

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="documents-complete"
              checked={isChecked}
              onCheckedChange={onCheckedChange}
              disabled={disabled || !allMandatoryUploaded}
              className="mt-1"
            />
            <div className="space-y-2">
              <Label 
                htmlFor="documents-complete" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Document Checklist Complete
              </Label>
              <p className="text-xs text-muted-foreground">
                Confirm that all required documents have been reviewed and are acceptable for processing.
              </p>
            </div>
          </div>
          
          <div className="ml-6 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              {allMandatoryUploaded ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-orange-600" />
              )}
              <span className={allMandatoryUploaded ? "text-green-700" : "text-orange-700"}>
                Mandatory Documents: {uploadedMandatory.length}/{mandatoryDocuments.length} uploaded
              </span>
            </div>
            
            {!allMandatoryUploaded && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Missing:</span>
                <ul className="mt-1 space-y-1">
                  {mandatoryDocuments
                    .filter(doc => !doc.is_uploaded)
                    .map(doc => (
                      <li key={doc.id} className="ml-2">• {doc.name}</li>
                    ))}
                </ul>
              </div>
            )}
            
            {allMandatoryUploaded && !isChecked && (
              <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded">
                ✓ All mandatory documents uploaded. Check the box above to confirm document review is complete.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentCompleteCheckbox;