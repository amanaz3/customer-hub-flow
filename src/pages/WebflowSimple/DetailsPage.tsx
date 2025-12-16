import React from 'react';
import { useWebflow } from '@/contexts/WebflowContext';
import { SimpleStepLayout } from '@/components/WebflowSimple/SimpleStepLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Upload, Check, Clock, Info, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const visaStatuses = [
  { id: 'none', name: 'No UAE Visa' },
  { id: 'visit', name: 'Visit Visa' },
  { id: 'residence', name: 'Residence Visa' },
  { id: 'golden', name: 'Golden Visa' },
];

const requiredDocuments = [
  { id: 'passport', name: 'Passport Copy', description: 'Clear copy of passport bio page', emoji: '🛂' },
  { id: 'photo', name: 'Passport Photo', description: 'White background, recent', emoji: '📸' },
  { id: 'emirates_id', name: 'Emirates ID', description: 'If applicable', emoji: '🪪' },
  { id: 'address_proof', name: 'Address Proof', description: 'Utility bill or bank statement', emoji: '📄' },
];

export const DetailsPage: React.FC = () => {
  const { state, updateState } = useWebflow();

  const handleDocumentUpload = (docId: string) => {
    if (!state.documentsUploaded.includes(docId)) {
      updateState({
        documentsUploaded: [...state.documentsUploaded, docId],
        pendingDocuments: state.pendingDocuments.filter(id => id !== docId),
      });
    }
  };

  const handleUploadLater = (docId: string) => {
    if (!state.pendingDocuments.includes(docId) && !state.documentsUploaded.includes(docId)) {
      updateState({
        pendingDocuments: [...state.pendingDocuments, docId],
      });
    }
  };

  return (
    <SimpleStepLayout
      step={7}
      title="Your Details"
      subtitle="We need your information for company registration"
      nextPath="/webflow-simple/bookkeeping"
      prevPath="/webflow-simple/payment"
      backgroundVariant="secondary"
    >
      <div className="space-y-6">
        <Alert className="bg-primary/5 border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription>
            This information is required by UAE authorities and is securely stored.
          </AlertDescription>
        </Alert>

        {/* Personal Info */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Full Name (as per passport) *
            </Label>
            <Input
              value={state.founderName}
              onChange={(e) => updateState({ founderName: e.target.value })}
              placeholder="John Smith"
              className="h-12 border-2"
            />
          </div>

          <div className="space-y-2">
            <Label>Phone Number *</Label>
            <Input
              value={state.founderPhone}
              onChange={(e) => updateState({ founderPhone: e.target.value })}
              placeholder="+971 50 123 4567"
              className="h-12 border-2"
            />
          </div>

          <div className="space-y-2">
            <Label>Email Address *</Label>
            <Input
              type="email"
              value={state.founderEmail}
              onChange={(e) => updateState({ founderEmail: e.target.value })}
              placeholder="john@example.com"
              className="h-12 border-2"
            />
          </div>

          <div className="space-y-2">
            <Label>Passport Number *</Label>
            <Input
              value={state.passportNumber}
              onChange={(e) => updateState({ passportNumber: e.target.value })}
              placeholder="AB1234567"
              className="h-12 border-2"
            />
          </div>

          <div className="space-y-2">
            <Label>Visa Status</Label>
            <Select value={state.visaStatus} onValueChange={(v) => updateState({ visaStatus: v })}>
              <SelectTrigger className="h-12 border-2">
                <SelectValue placeholder="Select visa status" />
              </SelectTrigger>
              <SelectContent>
                {visaStatuses.map(status => (
                  <SelectItem key={status.id} value={status.id}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Residential Address</Label>
          <Textarea
            value={state.address}
            onChange={(e) => updateState({ address: e.target.value })}
            placeholder="Enter your full residential address"
            rows={2}
            className="border-2"
          />
        </div>

        {/* Documents */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Required Documents
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const notUploadedDocs = requiredDocuments
                  .filter(doc => !state.documentsUploaded.includes(doc.id))
                  .map(doc => doc.id);
                updateState({
                  pendingDocuments: [...new Set([...state.pendingDocuments, ...notUploadedDocs])],
                });
              }}
              className="text-muted-foreground text-xs"
            >
              <Clock className="w-3 h-3 mr-1" />
              Skip All
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {requiredDocuments.map(doc => {
              const isUploaded = state.documentsUploaded.includes(doc.id);
              const isPending = state.pendingDocuments.includes(doc.id);
              
              return (
                <div
                  key={doc.id}
                  className={cn(
                    "p-4 border-2 rounded-xl transition-all",
                    isUploaded && "border-green-200 bg-green-50",
                    isPending && "border-amber-200 bg-amber-50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{doc.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{doc.name}</span>
                        {isUploaded && <Check className="w-4 h-4 text-green-600" />}
                        {isPending && <Clock className="w-4 h-4 text-amber-500" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{doc.description}</p>
                      
                      {!isUploaded && !isPending && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDocumentUpload(doc.id)}
                            className="h-8 text-xs"
                          >
                            <Upload className="w-3 h-3 mr-1" />
                            Upload
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUploadLater(doc.id)}
                            className="h-8 text-xs text-muted-foreground"
                          >
                            Later
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SimpleStepLayout>
  );
};
