import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Send } from 'lucide-react';
import { Status } from '@/types/customer';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StatusRequestCommentDialogProps {
  currentStatus: Status;
  onSubmit: (status: Status, reason: string) => Promise<void>;
  trigger?: React.ReactNode;
}

const ALL_STATUSES: Status[] = [
  'Draft',
  'Submitted',
  'Returned',
  'Sent to Bank',
  'Complete',
  'Rejected',
  'Need More Info',
  'Paid'
];

const StatusRequestCommentDialog: React.FC<StatusRequestCommentDialogProps> = ({
  currentStatus,
  onSubmit,
  trigger
}) => {
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Status | ''>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableStatuses = ALL_STATUSES.filter(status => status !== currentStatus);

  const handleSubmit = async () => {
    if (!selectedStatus || !reason.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(selectedStatus as Status, reason);
      setOpen(false);
      setSelectedStatus('');
      setReason('');
    } catch (error) {
      console.error('Error submitting status request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewComment = selectedStatus && reason.trim() 
    ? `[STATUS REQUEST: ${selectedStatus}] ${reason}`
    : '';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <AlertCircle className="w-4 h-4 mr-2" />
            Request Status Change
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Status Change</DialogTitle>
          <DialogDescription>
            Send a request to the admin to change this application's status. Please provide a clear reason for your request.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Status</label>
            <div className="px-3 py-2 bg-muted rounded-md text-sm">
              {currentStatus}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Requested Status *</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select the status you want" />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for Request *</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you need this status change..."
              className="min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/500 characters
            </p>
          </div>

          {previewComment && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="text-xs">
                  <strong>Preview:</strong>
                  <div className="mt-1 text-muted-foreground">{previewComment}</div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedStatus || !reason.trim() || reason.trim().length < 10 || isSubmitting}
          >
            {isSubmitting ? (
              'Sending...'
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StatusRequestCommentDialog;
