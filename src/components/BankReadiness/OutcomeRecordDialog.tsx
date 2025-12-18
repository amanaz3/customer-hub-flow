import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, XCircle, Clock, LogOut } from 'lucide-react';
import { BankReadinessCaseRecord } from '@/hooks/useBankReadinessCases';

interface OutcomeRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseData: BankReadinessCaseRecord | null;
  onSubmit: (
    caseId: string,
    bankAppliedTo: string,
    outcome: 'approved' | 'rejected' | 'pending' | 'withdrawn',
    outcomeDate?: string,
    outcomeNotes?: string,
    rejectionReason?: string
  ) => Promise<boolean>;
}

const OutcomeRecordDialog: React.FC<OutcomeRecordDialogProps> = ({
  open,
  onOpenChange,
  caseData,
  onSubmit,
}) => {
  const [bankAppliedTo, setBankAppliedTo] = useState('');
  const [outcome, setOutcome] = useState<'approved' | 'rejected' | 'pending' | 'withdrawn'>('pending');
  const [outcomeDate, setOutcomeDate] = useState(new Date().toISOString().split('T')[0]);
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!caseData) return null;

  // Get bank options from recommended and avoided lists
  const recommendedBanks = (caseData.recommended_banks || []) as { bank_name: string }[];
  const avoidedBanks = (caseData.banks_to_avoid || []) as { bank_name: string }[];
  const allBanks = [
    ...recommendedBanks.map(b => ({ name: b.bank_name, type: 'recommended' })),
    ...avoidedBanks.map(b => ({ name: b.bank_name, type: 'avoided' })),
    { name: 'Other', type: 'other' }
  ];

  const handleSubmit = async () => {
    if (!bankAppliedTo) return;
    
    setIsSubmitting(true);
    const success = await onSubmit(
      caseData.id,
      bankAppliedTo,
      outcome,
      outcomeDate,
      outcomeNotes,
      rejectionReason
    );
    setIsSubmitting(false);
    
    if (success) {
      onOpenChange(false);
      // Reset form
      setBankAppliedTo('');
      setOutcome('pending');
      setOutcomeNotes('');
      setRejectionReason('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Bank Application Outcome</DialogTitle>
          <DialogDescription>
            Track what happened when the customer applied to a bank. This helps validate and improve the rule engine.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Case Summary */}
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <p><strong>Activity:</strong> {caseData.license_activity}</p>
            <p><strong>Risk:</strong> {caseData.risk_category} ({caseData.risk_score} points)</p>
            <p><strong>Recommended:</strong> {recommendedBanks.slice(0, 2).map(b => b.bank_name).join(', ')}</p>
          </div>

          {/* Bank Applied To */}
          <div className="space-y-2">
            <Label htmlFor="bank">Bank Applied To *</Label>
            <Select value={bankAppliedTo} onValueChange={setBankAppliedTo}>
              <SelectTrigger>
                <SelectValue placeholder="Select bank" />
              </SelectTrigger>
              <SelectContent>
                {allBanks.map((bank, idx) => (
                  <SelectItem key={idx} value={bank.name}>
                    {bank.name}
                    {bank.type === 'recommended' && ' ✓'}
                    {bank.type === 'avoided' && ' ⚠'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Outcome */}
          <div className="space-y-2">
            <Label>Outcome *</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={outcome === 'approved' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => setOutcome('approved')}
              >
                <CheckCircle className="h-4 w-4 text-green-500" />
                Approved
              </Button>
              <Button
                type="button"
                variant={outcome === 'rejected' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => setOutcome('rejected')}
              >
                <XCircle className="h-4 w-4 text-red-500" />
                Rejected
              </Button>
              <Button
                type="button"
                variant={outcome === 'pending' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => setOutcome('pending')}
              >
                <Clock className="h-4 w-4 text-yellow-500" />
                Pending
              </Button>
              <Button
                type="button"
                variant={outcome === 'withdrawn' ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => setOutcome('withdrawn')}
              >
                <LogOut className="h-4 w-4 text-gray-500" />
                Withdrawn
              </Button>
            </div>
          </div>

          {/* Outcome Date */}
          <div className="space-y-2">
            <Label htmlFor="outcomeDate">Outcome Date</Label>
            <Input
              id="outcomeDate"
              type="date"
              value={outcomeDate}
              onChange={(e) => setOutcomeDate(e.target.value)}
            />
          </div>

          {/* Rejection Reason (if rejected) */}
          {outcome === 'rejected' && (
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason</Label>
              <Select value={rejectionReason} onValueChange={setRejectionReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high_risk_activity">High Risk Activity</SelectItem>
                  <SelectItem value="nationality_restrictions">Nationality Restrictions</SelectItem>
                  <SelectItem value="insufficient_documents">Insufficient Documents</SelectItem>
                  <SelectItem value="source_of_funds">Source of Funds Concerns</SelectItem>
                  <SelectItem value="previous_rejection">Previous Rejection History</SelectItem>
                  <SelectItem value="turnover_too_low">Turnover Too Low</SelectItem>
                  <SelectItem value="compliance_concerns">Compliance Concerns</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={outcomeNotes}
              onChange={(e) => setOutcomeNotes(e.target.value)}
              placeholder="Any additional details about the outcome..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!bankAppliedTo || isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Record Outcome'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OutcomeRecordDialog;
