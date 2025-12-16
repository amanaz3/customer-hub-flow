import React from 'react';
import { useWebflow } from '@/contexts/WebflowContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { User, Upload, Info, Check, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const visaStatuses = [
  { id: 'none', name: 'No UAE Visa' },
  { id: 'visit', name: 'Visit Visa' },
  { id: 'residence', name: 'Residence Visa' },
  { id: 'golden', name: 'Golden Visa' },
];

const requiredDocuments = [
  { id: 'passport', name: 'Passport Copy', description: 'Clear copy of passport bio page' },
  { id: 'photo', name: 'Passport Photo', description: 'White background, recent' },
  { id: 'emirates_id', name: 'Emirates ID', description: 'If applicable' },
  { id: 'address_proof', name: 'Address Proof', description: 'Utility bill or bank statement' },
];

export const FounderDetailsStep: React.FC = () => {
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

  const handleSkipAllDocuments = () => {
    const notUploadedDocs = requiredDocuments
      .filter(doc => !state.documentsUploaded.includes(doc.id))
      .map(doc => doc.id);
    
    updateState({
      pendingDocuments: [...new Set([...state.pendingDocuments, ...notUploadedDocs])],
    });
  };

  const allDocumentsHandled = requiredDocuments.every(
    doc => state.documentsUploaded.includes(doc.id) || state.pendingDocuments.includes(doc.id)
  );

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <User className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Founder Details</CardTitle>
        <CardDescription className="text-base">
          We need your information to complete the company registration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This information is required by UAE authorities for company registration and is securely stored.
          </AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Full Name (as per passport) *</Label>
            <Input
              value={state.founderName}
              onChange={(e) => updateState({ founderName: e.target.value })}
              placeholder="John Smith"
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label>Phone Number *</Label>
            <Input
              value={state.founderPhone}
              onChange={(e) => updateState({ founderPhone: e.target.value })}
              placeholder="+971 50 123 4567"
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label>Email Address *</Label>
            <Input
              type="email"
              value={state.founderEmail}
              onChange={(e) => updateState({ founderEmail: e.target.value })}
              placeholder="john@example.com"
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label>Passport Number *</Label>
            <Input
              value={state.passportNumber}
              onChange={(e) => updateState({ passportNumber: e.target.value })}
              placeholder="AB1234567"
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label>Current Visa Status</Label>
            <Select value={state.visaStatus} onValueChange={(v) => updateState({ visaStatus: v })}>
              <SelectTrigger className="h-12">
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
            rows={3}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Required Documents</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipAllDocuments}
              className="text-muted-foreground text-xs"
            >
              <Clock className="w-3 h-3 mr-1" />
              Upload All Later
            </Button>
          </div>
          
          <Alert className="bg-amber-50 border-amber-200">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Don't have documents ready? Click "Upload Later" and complete them from your dashboard.
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-2 gap-4">
            {requiredDocuments.map(doc => {
              const isUploaded = state.documentsUploaded.includes(doc.id);
              const isPending = state.pendingDocuments.includes(doc.id);
              
              return (
                <div
                  key={doc.id}
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{doc.name}</span>
                    {isUploaded && <Check className="w-4 h-4 text-green-600" />}
                    {isPending && <Clock className="w-4 h-4 text-amber-500" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{doc.description}</p>
                  
                  {isUploaded ? (
                    <Button variant="secondary" size="sm" className="w-full" disabled>
                      <Check className="w-4 h-4 mr-2" />
                      Uploaded
                    </Button>
                  ) : isPending ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDocumentUpload(doc.id)}
                        className="flex-1"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Now
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDocumentUpload(doc.id)}
                        className="flex-1"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUploadLater(doc.id)}
                        className="text-muted-foreground"
                      >
                        <Clock className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!allDocumentsHandled && (
            <p className="text-sm text-muted-foreground text-center">
              Please upload or mark documents for later upload to continue
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
