import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useApplication } from '@/contexts/ApplicationContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Zap } from 'lucide-react';
import type { ApplicationType, ApplicationStatus } from '@/types/application';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface QuickAddApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
}

const detectApplicationType = (text: string): ApplicationType => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('bank') || lowerText.includes('account')) return 'bank_account';
  if (lowerText.includes('license') || lowerText.includes('trade')) return 'license';
  if (lowerText.includes('visa') || lowerText.includes('residence')) return 'visa';
  return 'other';
};

const extractAmount = (text: string): number => {
  const amountMatch = text.match(/(?:aed|usd|\$|amount:?\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
  if (amountMatch) {
    return parseFloat(amountMatch[1].replace(/,/g, ''));
  }
  return 0;
};

export const QuickAddApplicationDialog = ({
  open,
  onOpenChange,
  customerId,
}: QuickAddApplicationDialogProps) => {
  const [pastedText, setPastedText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overrideType, setOverrideType] = useState<ApplicationType | 'auto'>('auto');
  const { toast } = useToast();
  const { addApplication } = useApplication();

  const parseApplications = (text: string) => {
    const entries = text
      .split(/\n\s*\n|---/)
      .map(entry => entry.trim())
      .filter(entry => entry.length > 0);

    return entries.map(entry => {
      const detectedType = overrideType === 'auto' ? detectApplicationType(entry) : overrideType;
      const amount = extractAmount(entry);

      return {
        customer_id: customerId,
        application_type: detectedType,
        submission_source: 'admin' as const,
        status: 'draft' as ApplicationStatus,
        application_data: {
          amount,
          customer_notes: entry,
        },
      };
    });
  };

  const handleSubmit = async () => {
    if (!pastedText.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter application details',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const applications = parseApplications(pastedText);

      let successCount = 0;
      for (const appData of applications) {
        try {
          await addApplication(appData);
          successCount++;
        } catch (error) {
          console.error('Failed to create application:', error);
        }
      }

      toast({
        title: 'Success',
        description: `Created ${successCount} of ${applications.length} application(s)`,
      });

      setPastedText('');
      setOverrideType('auto');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to create applications',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Add Applications
          </DialogTitle>
          <DialogDescription>
            Paste application details from WhatsApp or any text. Separate multiple applications with "---" or blank lines.
            Type is auto-detected from keywords (bank, license, visa).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="application-type">Application Type Override</Label>
            <Select value={overrideType} onValueChange={(value) => setOverrideType(value as ApplicationType | 'auto')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detect</SelectItem>
                <SelectItem value="bank_account">Bank Account</SelectItem>
                <SelectItem value="license">License</SelectItem>
                <SelectItem value="visa">Visa</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="applications">Application Details</Label>
            <Textarea
              id="applications"
              placeholder={`Bank account opening for ABC Trading - AED 5000

---

Trade license renewal - AED 3000

---

Visa application for 2 employees - AED 8000`}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !pastedText.trim()}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create {pastedText.trim().split(/\n\s*\n|---/).filter(e => e.trim()).length > 1 
              ? `${pastedText.trim().split(/\n\s*\n|---/).filter(e => e.trim()).length} Applications`
              : 'Application'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
