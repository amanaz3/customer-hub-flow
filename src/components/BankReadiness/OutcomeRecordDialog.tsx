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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, XCircle, Clock, LogOut, ThumbsUp, ThumbsDown, Minus, Calendar, MessageSquare } from 'lucide-react';
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

type RecommendationFeedback = 'helpful' | 'not_helpful' | 'neutral';

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
  
  // Enhanced fields
  const [recommendationFeedback, setRecommendationFeedback] = useState<RecommendationFeedback>('neutral');
  const [processingDays, setProcessingDays] = useState<string>('');
  const [interviewRequired, setInterviewRequired] = useState<'yes' | 'no' | 'unknown'>('unknown');
  const [additionalDocsRequested, setAdditionalDocsRequested] = useState<string>('');

  if (!caseData) return null;

  // Get bank options from recommended and avoided lists
  const recommendedBanks = (caseData.recommended_banks || []) as { bank_name: string }[];
  const avoidedBanks = (caseData.banks_to_avoid || []) as { bank_name: string }[];
  const allBanks = [
    ...recommendedBanks.map(b => ({ name: b.bank_name, type: 'recommended' })),
    ...avoidedBanks.map(b => ({ name: b.bank_name, type: 'avoided' })),
    { name: 'Other', type: 'other' }
  ];

  // Check if selected bank was recommended or avoided
  const selectedBankType = allBanks.find(b => b.name === bankAppliedTo)?.type;
  const wasRecommended = selectedBankType === 'recommended';
  const wasAvoided = selectedBankType === 'avoided';

  const handleSubmit = async () => {
    if (!bankAppliedTo) return;
    
    // Build enhanced notes with all feedback
    const enhancedNotes = buildEnhancedNotes();
    
    setIsSubmitting(true);
    const success = await onSubmit(
      caseData.id,
      bankAppliedTo,
      outcome,
      outcomeDate,
      enhancedNotes,
      rejectionReason
    );
    setIsSubmitting(false);
    
    if (success) {
      onOpenChange(false);
      resetForm();
    }
  };

  const buildEnhancedNotes = (): string => {
    const parts: string[] = [];
    
    if (outcomeNotes) {
      parts.push(outcomeNotes);
    }
    
    if (recommendationFeedback !== 'neutral') {
      parts.push(`[Recommendation Feedback: ${recommendationFeedback === 'helpful' ? 'Helpful' : 'Not Helpful'}]`);
    }
    
    if (processingDays) {
      parts.push(`[Processing Time: ${processingDays} days]`);
    }
    
    if (interviewRequired !== 'unknown') {
      parts.push(`[Interview Required: ${interviewRequired === 'yes' ? 'Yes' : 'No'}]`);
    }
    
    if (additionalDocsRequested) {
      parts.push(`[Additional Docs Requested: ${additionalDocsRequested}]`);
    }
    
    return parts.join(' | ');
  };

  const resetForm = () => {
    setBankAppliedTo('');
    setOutcome('pending');
    setOutcomeNotes('');
    setRejectionReason('');
    setRecommendationFeedback('neutral');
    setProcessingDays('');
    setInterviewRequired('unknown');
    setAdditionalDocsRequested('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Bank Application Outcome</DialogTitle>
          <DialogDescription>
            Track what happened and provide feedback to improve future recommendations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Case Summary */}
          <div className="p-3 bg-muted/50 rounded-lg text-sm">
            <p><strong>Activity:</strong> {caseData.license_activity}</p>
            <p><strong>Risk:</strong> {caseData.risk_category} ({caseData.risk_score} points)</p>
            <p><strong>Recommended:</strong> {recommendedBanks.slice(0, 2).map(b => b.bank_name).join(', ') || 'None'}</p>
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
            {bankAppliedTo && (
              <div className="flex gap-2">
                {wasRecommended && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Was Recommended
                  </Badge>
                )}
                {wasAvoided && (
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    Was on Avoid List
                  </Badge>
                )}
              </div>
            )}
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

          {/* Outcome Date & Processing Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="outcomeDate" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Outcome Date
              </Label>
              <Input
                id="outcomeDate"
                type="date"
                value={outcomeDate}
                onChange={(e) => setOutcomeDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="processingDays">Processing Days</Label>
              <Input
                id="processingDays"
                type="number"
                min="0"
                placeholder="e.g., 14"
                value={processingDays}
                onChange={(e) => setProcessingDays(e.target.value)}
              />
            </div>
          </div>

          {/* Rejection Reason (if rejected) */}
          {outcome === 'rejected' && (
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason Category</Label>
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
                  <SelectItem value="business_model">Business Model Issues</SelectItem>
                  <SelectItem value="jurisdiction_issues">Jurisdiction Issues</SelectItem>
                  <SelectItem value="incomplete_application">Incomplete Application</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Interview Required */}
          <div className="space-y-2">
            <Label>Was Interview Required?</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={interviewRequired === 'yes' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInterviewRequired('yes')}
              >
                Yes
              </Button>
              <Button
                type="button"
                variant={interviewRequired === 'no' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInterviewRequired('no')}
              >
                No
              </Button>
              <Button
                type="button"
                variant={interviewRequired === 'unknown' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setInterviewRequired('unknown')}
              >
                Unknown
              </Button>
            </div>
          </div>

          {/* Additional Documents Requested */}
          <div className="space-y-2">
            <Label htmlFor="additionalDocs">Additional Documents Requested (if any)</Label>
            <Input
              id="additionalDocs"
              placeholder="e.g., Audited financials, supplier contracts..."
              value={additionalDocsRequested}
              onChange={(e) => setAdditionalDocsRequested(e.target.value)}
            />
          </div>

          {/* Recommendation Feedback */}
          <div className="space-y-2 p-3 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
            <Label className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Was our recommendation helpful?
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              This feedback helps us improve the rule engine
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={recommendationFeedback === 'helpful' ? 'default' : 'outline'}
                size="sm"
                className="gap-1"
                onClick={() => setRecommendationFeedback('helpful')}
              >
                <ThumbsUp className="h-4 w-4" />
                Helpful
              </Button>
              <Button
                type="button"
                variant={recommendationFeedback === 'not_helpful' ? 'default' : 'outline'}
                size="sm"
                className="gap-1"
                onClick={() => setRecommendationFeedback('not_helpful')}
              >
                <ThumbsDown className="h-4 w-4" />
                Not Helpful
              </Button>
              <Button
                type="button"
                variant={recommendationFeedback === 'neutral' ? 'secondary' : 'outline'}
                size="sm"
                className="gap-1"
                onClick={() => setRecommendationFeedback('neutral')}
              >
                <Minus className="h-4 w-4" />
                Neutral
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={outcomeNotes}
              onChange={(e) => setOutcomeNotes(e.target.value)}
              placeholder="Any additional details about the outcome, bank feedback, or suggestions..."
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
