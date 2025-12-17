import React, { useEffect, useState } from 'react';
import { useWebflow } from '@/contexts/WebflowContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { User, Upload, Info, Check, Clock, HelpCircle, ShieldAlert, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

const visaStatuses = [
  { id: 'none', name: 'No UAE Visa' },
  { id: 'visit', name: 'Visit Visa' },
  { id: 'residence', name: 'Residence Visa' },
  { id: 'golden', name: 'Golden Visa' },
];

interface DocumentRequirement {
  id: string;
  document_code: string;
  document_name: string;
  description: string | null;
  is_mandatory: boolean;
  is_edd: boolean; // Enhanced Due Diligence document
}

const baseDocuments: DocumentRequirement[] = [
  { id: 'passport', document_code: 'passport', document_name: 'Passport Copy', description: 'Clear copy of passport bio page', is_mandatory: true, is_edd: false },
  { id: 'photo', document_code: 'photo', document_name: 'Passport Photo', description: 'White background, recent', is_mandatory: true, is_edd: false },
  { id: 'emirates_id', document_code: 'emirates_id', document_name: 'Emirates ID', description: 'If applicable', is_mandatory: false, is_edd: false },
  { id: 'address_proof', document_code: 'address_proof', document_name: 'Address Proof', description: 'Utility bill or bank statement', is_mandatory: true, is_edd: false },
];

export const FounderDetailsStep: React.FC = () => {
  const { state, updateState } = useWebflow();
  const [documents, setDocuments] = useState<DocumentRequirement[]>(baseDocuments);
  const [loading, setLoading] = useState(true);

  // Fetch dynamic documents based on activity selection
  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      
      // Start with base documents
      let allDocs: DocumentRequirement[] = [...baseDocuments];
      
      // Fetch activity-specific documents
      if (state.activityCode) {
        const { data: activityDocs } = await supabase
          .from('webflow_documents')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        if (activityDocs) {
          const additionalDocs = activityDocs
            .filter(doc => {
              const appliesTo = doc.applies_to_activities as string[] | null;
              return appliesTo && appliesTo.includes(state.activityCode);
            })
            .map(doc => ({
              id: doc.id,
              document_code: doc.document_code,
              document_name: doc.document_name,
              description: doc.description,
              is_mandatory: doc.is_mandatory || false,
              is_edd: true, // Activity-specific docs are EDD
            }));
          
          allDocs = [...allDocs, ...additionalDocs];
        }
      }

      // Fetch jurisdiction-specific documents
      if (state.emirate && state.locationType) {
        const jurisdictionKey = `${state.emirate.toLowerCase().replace(/\s+/g, '_')}_${state.locationType}`;
        
        const { data: jurisdictionDocs } = await supabase
          .from('webflow_documents')
          .select('*')
          .eq('is_active', true);

        if (jurisdictionDocs) {
          const jurisdictionSpecific = jurisdictionDocs
            .filter(doc => {
              const appliesTo = doc.applies_to_jurisdictions as string[] | null;
              return appliesTo && appliesTo.includes(jurisdictionKey);
            })
            .filter(doc => !allDocs.some(d => d.document_code === doc.document_code))
            .map(doc => ({
              id: doc.id,
              document_code: doc.document_code,
              document_name: doc.document_name,
              description: doc.description,
              is_mandatory: doc.is_mandatory || false,
              is_edd: false,
            }));
          
          allDocs = [...allDocs, ...jurisdictionSpecific];
        }
      }

      setDocuments(allDocs);
      setLoading(false);
    };

    fetchDocuments();
  }, [state.activityCode, state.emirate, state.locationType]);

  const handleDocumentUpload = (docCode: string) => {
    if (!state.documentsUploaded.includes(docCode)) {
      updateState({
        documentsUploaded: [...state.documentsUploaded, docCode],
        pendingDocuments: state.pendingDocuments.filter(id => id !== docCode),
      });
    }
  };

  const handleUploadLater = (docCode: string) => {
    if (!state.pendingDocuments.includes(docCode) && !state.documentsUploaded.includes(docCode)) {
      updateState({
        pendingDocuments: [...state.pendingDocuments, docCode],
      });
    }
  };

  const handleSkipAllDocuments = () => {
    const notUploadedDocs = documents
      .filter(doc => !state.documentsUploaded.includes(doc.document_code))
      .map(doc => doc.document_code);
    
    updateState({
      pendingDocuments: [...new Set([...state.pendingDocuments, ...notUploadedDocs])],
    });
  };

  const mandatoryDocs = documents.filter(d => d.is_mandatory && !d.is_edd);
  const eddDocs = documents.filter(d => d.is_edd);
  const optionalDocs = documents.filter(d => !d.is_mandatory && !d.is_edd);

  const allMandatoryHandled = mandatoryDocs.every(
    doc => state.documentsUploaded.includes(doc.document_code) || state.pendingDocuments.includes(doc.document_code)
  );

  const allEddHandled = eddDocs.every(
    doc => state.documentsUploaded.includes(doc.document_code) || state.pendingDocuments.includes(doc.document_code)
  );

  const DocumentCard = ({ doc }: { doc: DocumentRequirement }) => {
    const isUploaded = state.documentsUploaded.includes(doc.document_code);
    const isPending = state.pendingDocuments.includes(doc.document_code);
    
    return (
      <div
        className={`p-4 border rounded-lg space-y-2 ${doc.is_edd ? 'border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800' : ''}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">{doc.document_name}</span>
            {doc.is_mandatory && !doc.is_edd && (
              <Badge variant="secondary" className="text-xs">Required</Badge>
            )}
            {doc.is_edd && (
              <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 dark:text-orange-300">
                EDD
              </Badge>
            )}
          </div>
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
              onClick={() => handleDocumentUpload(doc.document_code)}
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
              onClick={() => handleDocumentUpload(doc.document_code)}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleUploadLater(doc.document_code)}
              className="text-muted-foreground"
            >
              <Clock className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <User className="w-6 h-6 text-primary" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <CardTitle className="text-2xl">Founder Details</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>We need these documents to register your company and open a bank account.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Required Documents */}
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
              
              <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                <Clock className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  Don't have documents ready? Click "Upload Later" and complete them from your dashboard.
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-4">
                {mandatoryDocs.map(doc => (
                  <DocumentCard key={doc.document_code} doc={doc} />
                ))}
              </div>
            </div>

            {/* EDD Documents (if any) */}
            {eddDocs.length > 0 && (
              <div className="space-y-4">
                <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800">
                  <ShieldAlert className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800 dark:text-orange-200">
                    <strong>Enhanced Due Diligence Required</strong> - Your selected business activity requires additional compliance documentation.
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-4">
                  {eddDocs.map(doc => (
                    <DocumentCard key={doc.document_code} doc={doc} />
                  ))}
                </div>
              </div>
            )}

            {/* Optional Documents */}
            {optionalDocs.length > 0 && (
              <div className="space-y-4">
                <Label className="text-base font-semibold text-muted-foreground">Optional Documents</Label>
                <div className="grid md:grid-cols-2 gap-4">
                  {optionalDocs.map(doc => (
                    <DocumentCard key={doc.document_code} doc={doc} />
                  ))}
                </div>
              </div>
            )}

            {!allMandatoryHandled && (
              <p className="text-sm text-muted-foreground text-center">
                Please upload or mark required documents for later upload to continue
              </p>
            )}

            {eddDocs.length > 0 && !allEddHandled && (
              <p className="text-sm text-orange-600 dark:text-orange-400 text-center">
                Enhanced Due Diligence documents must also be handled to proceed
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
