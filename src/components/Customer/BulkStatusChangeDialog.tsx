import React, { useState, useEffect, useMemo } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { ApplicationStatus } from '@/types/application';

interface Application {
  id: string;
  status: ApplicationStatus;
  customer?: {
    name: string;
    company: string;
  };
}

interface BulkStatusChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedApplications: Application[];
  newStatus: ApplicationStatus;
  onConfirm: (applicationIds: string[], newStatus: ApplicationStatus, comment: string) => Promise<void>;
}

export const BulkStatusChangeDialog: React.FC<BulkStatusChangeDialogProps> = ({
  isOpen,
  onClose,
  selectedApplications,
  newStatus,
  onConfirm,
}) => {
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setComment('');
      setIsLoading(false);
    }
  }, [isOpen]);

  const statusColors: Record<ApplicationStatus, string> = {
    predraft: 'bg-gray-500',
    draft: 'bg-yellow-500',
    submitted: 'bg-blue-500',
    returned: 'bg-orange-500',
    'need more info': 'bg-amber-500',
    paid: 'bg-green-600',
    completed: 'bg-purple-500',
    rejected: 'bg-red-500',
    under_review: 'bg-orange-500',
    approved: 'bg-green-500',
  };

  const statusLabels: Record<ApplicationStatus, string> = {
    predraft: 'Pre-Draft',
    draft: 'Draft',
    submitted: 'Submitted',
    returned: 'Returned',
    'need more info': 'Need More Info',
    paid: 'Paid',
    completed: 'Completed',
    rejected: 'Rejected',
    under_review: 'Under Review',
    approved: 'Approved',
  };

  const eligibleApplications = useMemo(() => {
    // All applications are eligible - validation will happen on backend
    return selectedApplications;
  }, [selectedApplications]);

  const handleConfirm = async () => {
    if (!comment.trim() && (newStatus === 'rejected' || newStatus === 'returned')) {
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(
        eligibleApplications.map(app => app.id),
        newStatus,
        comment
      );
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isCommentRequired = newStatus === 'rejected' || newStatus === 'returned';
  const isValid = !isCommentRequired || comment.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Bulk Status Change to{' '}
            <Badge className={`${statusColors[newStatus]} text-white`}>
              {statusLabels[newStatus]}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Update the status of {eligibleApplications.length} selected application(s)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Selected Applications</h4>
            <div className="max-h-[200px] overflow-y-auto border rounded-md p-3 space-y-2 bg-muted/30">
              {eligibleApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between py-2 px-3 bg-background rounded-md"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {app.customer?.company || 'Unknown Company'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {app.customer?.name || 'Unknown'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {statusLabels[app.status]}
                    </Badge>
                    <span className="text-muted-foreground text-xs">→</span>
                    <Badge className={`${statusColors[newStatus]} text-white text-xs`}>
                      {statusLabels[newStatus]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comment/Reason */}
          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">
              {isCommentRequired ? 'Reason (Required)' : 'Comment (Optional)'}
            </label>
            <Textarea
              id="comment"
              placeholder={
                newStatus === 'rejected'
                  ? 'Provide a reason for rejection...'
                  : newStatus === 'returned'
                  ? 'Explain what needs to be corrected...'
                  : 'Add a comment about this status change...'
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
            {isCommentRequired && (
              <p className="text-xs text-muted-foreground">
                A reason is required for {statusLabels[newStatus].toLowerCase()} status
              </p>
            )}
          </div>

          {/* Warning for irreversible actions */}
          {(newStatus === 'rejected' || newStatus === 'completed') && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Warning:</strong> This action will update {eligibleApplications.length} application(s) 
                and send notifications to all affected customers. This cannot be easily undone.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || isLoading || eligibleApplications.length === 0}
            className={
              newStatus === 'rejected'
                ? 'bg-red-600 hover:bg-red-700'
                : newStatus === 'completed' || newStatus === 'paid' || newStatus === 'approved'
                ? 'bg-green-600 hover:bg-green-700'
                : ''
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Updating...
              </>
            ) : (
              <>
                Update {eligibleApplications.length} Application(s)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
