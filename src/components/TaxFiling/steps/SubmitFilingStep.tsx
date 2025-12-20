import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Send, 
  CheckCircle2, 
  Clock,
  FileText,
  Download,
  Loader2,
  PartyPopper
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaxFiling } from '../EnhancedTaxWorkflow';
import { useToast } from '@/hooks/use-toast';

interface SubmitFilingStepProps {
  filing: TaxFiling | null;
  onBack: () => void;
}

export function SubmitFilingStep({ filing, onBack }: SubmitFilingStepProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ftaReference, setFtaReference] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setSubmitting(true);
    
    // Simulate FTA submission
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate mock FTA reference
    const ref = `FTA-CT-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    setFtaReference(ref);
    setSubmitted(true);
    setSubmitting(false);
    
    toast({
      title: "Filing Submitted Successfully",
      description: `FTA Reference: ${ref}`,
    });
  };

  if (submitted) {
    return (
      <div className="space-y-6">
        {/* Success State */}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
            <PartyPopper className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-green-600">Filing Submitted Successfully!</h3>
          <p className="text-muted-foreground mt-2">
            Your UAE Corporate Tax Return has been submitted to the FTA.
          </p>
        </div>

        {/* Submission Details */}
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">FTA Reference</p>
                <p className="font-mono font-bold text-lg">{ftaReference}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submission Date</p>
                <p className="font-medium">{new Date().toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className="bg-green-500">Submitted</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tax Year</p>
                <p className="font-medium">2024</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <strong>What happens next?</strong>
            <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
              <li>FTA will process your return within 20 business days</li>
              <li>You will receive a notification once processed</li>
              <li>Payment (if any) is due within 9 months from tax period end</li>
              <li>Keep all supporting documents for 7 years</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Download Confirmation */}
        <div className="flex justify-center gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Confirmation
          </Button>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            View Audit Trail
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pre-submission Summary */}
      <Card>
        <CardContent className="py-6 text-center">
          <Send className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Ready to Submit</h3>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Your UAE Corporate Tax Return is ready for submission to the 
            Federal Tax Authority (FTA). This action cannot be undone.
          </p>
        </CardContent>
      </Card>

      {/* Final Checklist */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm text-muted-foreground">Final Checklist</h4>
        <div className="grid gap-2">
          {[
            'All income classified correctly',
            'All deductions verified',
            'Tax computation reviewed',
            'Declarations accepted',
            'Supporting documents attached'
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Submission Warning */}
      <Alert className="border-amber-500/50 bg-amber-500/10">
        <Clock className="h-4 w-4 text-amber-500" />
        <AlertDescription className="text-amber-700 dark:text-amber-300">
          <strong>Important:</strong> Once submitted, you cannot modify this filing. 
          Any amendments will require a separate submission process.
        </AlertDescription>
      </Alert>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={submitting} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Review
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={submitting}
          className="gap-2 min-w-[160px]"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Submit to FTA
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
