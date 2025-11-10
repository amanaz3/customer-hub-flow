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
import { Loader2, AlertTriangle, CheckCircle2, XCircle, ArrowRightLeft } from 'lucide-react';
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
    draft: 'bg-yellow-500',
    submitted: 'bg-blue-500',
    returned: 'bg-orange-500',
    paid: 'bg-green-600',
    completed: 'bg-purple-500',
    rejected: 'bg-red-500',
    'need more info': 'bg-amber-500',
    under_review: 'bg-orange-500',
    approved: 'bg-green-500',
  };

  const statusLabels: Record<ApplicationStatus, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    returned: 'Returned',
    paid: 'Paid',
    completed: 'Completed',
    rejected: 'Rejected',
    'need more info': 'Need More Info',
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
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto animate-scale-in">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10 animate-fade-in">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <span>Bulk Status Update</span>
              <div className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                <span>Changing to</span>
                <Badge className={`${statusColors[newStatus]} text-white animate-fade-in`}>
                  {statusLabels[newStatus]}
                </Badge>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="text-base">
            Update {eligibleApplications.length} selected application{eligibleApplications.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Status Flow Visualization */}
          <div className="bg-muted/30 border rounded-lg p-4 animate-fade-in">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-2">Current Status</div>
                <Badge variant="outline" className="text-sm py-1.5 px-3">
                  Multiple
                </Badge>
              </div>
              <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-2">New Status</div>
                <Badge className={`${statusColors[newStatus]} text-white text-sm py-1.5 px-3`}>
                  {statusLabels[newStatus]}
                </Badge>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Selected Applications ({eligibleApplications.length})
            </h4>
            <div className="max-h-[220px] overflow-y-auto border rounded-lg p-2 space-y-2 bg-muted/20 animate-fade-in">
              {eligibleApplications.map((app, index) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between py-2.5 px-3 bg-background rounded-lg border hover:border-primary/30 transition-colors"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {app.customer?.company || 'Unknown Company'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {app.customer?.name || 'Unknown'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Badge variant="outline" className="text-xs font-medium">
                      {statusLabels[app.status]}
                    </Badge>
                    <span className="text-muted-foreground text-sm">→</span>
                    <Badge className={`${statusColors[newStatus]} text-white text-xs font-medium`}>
                      {statusLabels[newStatus]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comment/Reason */}
          <div className="space-y-2.5 animate-fade-in">
            <label htmlFor="comment" className="text-sm font-semibold flex items-center gap-2">
              {isCommentRequired ? (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>Reason <span className="text-destructive">*</span></span>
                </>
              ) : (
                'Comment (Optional)'
              )}
            </label>
            <Textarea
              id="comment"
              placeholder={
                newStatus === 'rejected'
                  ? 'Provide a clear reason for rejection that will help the applicant...'
                  : newStatus === 'returned'
                  ? 'Explain what needs to be corrected or updated...'
                  : 'Add any notes about this status change (visible to the applicant)...'
              }
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none border-2 focus:border-primary transition-colors"
            />
            {isCommentRequired && !comment.trim() && (
              <p className="text-xs text-amber-600 dark:text-amber-500 flex items-center gap-1.5 animate-fade-in">
                <AlertTriangle className="h-3 w-3" />
                A reason is required for {statusLabels[newStatus].toLowerCase()} status
              </p>
            )}
          </div>

          {/* Warning for critical actions */}
          {(newStatus === 'rejected' || newStatus === 'completed') && (
            <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 animate-fade-in">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              <AlertDescription className="text-sm text-amber-900 dark:text-amber-200">
                <strong className="font-semibold">Important:</strong> This will update {eligibleApplications.length} application{eligibleApplications.length !== 1 ? 's' : ''} 
                and notify all affected customers. Consider reviewing each application carefully.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || isLoading || eligibleApplications.length === 0}
            className={`min-w-[200px] shadow-md hover:shadow-lg transition-all ${
              newStatus === 'rejected'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : newStatus === 'completed' || newStatus === 'paid' || newStatus === 'approved'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Updating {eligibleApplications.length} application{eligibleApplications.length !== 1 ? 's' : ''}...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirm & Update {eligibleApplications.length}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
