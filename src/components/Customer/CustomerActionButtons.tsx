import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Status } from '@/types/customer';
import { useAuth } from '@/contexts/SecureAuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CustomerActionButtonsProps {
  status: Status;
  isAdmin: boolean;
  isUserOwner: boolean;
  mandatoryDocumentsUploaded: boolean;
  onStatusChange: (status: Status, comment: string) => void;
  onPaymentReceived?: () => void;
}

const CustomerActionButtons: React.FC<CustomerActionButtonsProps> = ({
  status,
  isAdmin,
  isUserOwner,
  mandatoryDocumentsUploaded,
  onStatusChange,
  onPaymentReceived,
}) => {
  const [comment, setComment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<Status | ''>('');
  const { user } = useAuth();

  const getAvailableStatuses = (): Status[] => {
    if (!isAdmin) {
      // Users can only resubmit when returned
      if (status === 'Returned') return ['Submitted'];
      return [];
    }

    // Admin available statuses based on current status
    switch (status) {
      case 'Submitted':
        return ['Returned', 'Sent to Bank'];
      case 'Returned':
        return ['Sent to Bank'];
      case 'Sent to Bank':
        return ['Complete', 'Rejected', 'Need More Info'];
      case 'Need More Info':
        return ['Sent to Bank', 'Returned'];
      case 'Complete':
        return ['Paid'];
      case 'Rejected':
        return ['Sent to Bank']; // Allow re-submission
      case 'Paid':
        return []; // Final status
      default:
        return [];
    }
  };

  const getStatusButtonText = (targetStatus: Status): string => {
    switch (targetStatus) {
      case 'Returned': return 'Return to User';
      case 'Sent to Bank': return 'Send to Bank';
      case 'Complete': return 'Mark as Complete';
      case 'Rejected': return 'Mark as Rejected';
      case 'Need More Info': return 'Request More Info';
      case 'Submitted': return 'Resubmit';
      case 'Paid': return 'Mark as Paid';
      default: return `Update to ${targetStatus}`;
    }
  };

  const getStatusButtonVariant = (targetStatus: Status) => {
    switch (targetStatus) {
      case 'Returned':
      case 'Rejected':
        return 'destructive' as const;
      case 'Complete':
      case 'Paid':
        return 'default' as const;
      default:
        return 'outline' as const;
    }
  };

  const isActionDisabled = (targetStatus: Status): boolean => {
    if (targetStatus === 'Sent to Bank' && !mandatoryDocumentsUploaded) {
      return true;
    }
    if (!isAdmin && targetStatus === 'Submitted' && !mandatoryDocumentsUploaded) {
      return true;
    }
    return false;
  };

  const requiresComment = (targetStatus: Status): boolean => {
    return ['Returned', 'Rejected', 'Need More Info'].includes(targetStatus);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value as Status);
  };

  const availableStatuses = getAvailableStatuses();

  return (
    <div className="flex flex-wrap gap-2">
      {/* Quick action buttons for common transitions */}
      {availableStatuses.map((targetStatus) => (
        <AlertDialog key={targetStatus}>
          <AlertDialogTrigger asChild>
            <Button 
              variant={getStatusButtonVariant(targetStatus)}
              disabled={isActionDisabled(targetStatus)}
              size="sm"
            >
              {getStatusButtonText(targetStatus)}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{getStatusButtonText(targetStatus)}</AlertDialogTitle>
              <AlertDialogDescription>
                {targetStatus === 'Returned' && 'Please provide feedback on what needs to be corrected.'}
                {targetStatus === 'Sent to Bank' && 'Are you sure you want to send this application to the bank?'}
                {targetStatus === 'Complete' && 'Mark this application as approved and complete.'}
                {targetStatus === 'Rejected' && 'Please provide a reason for rejection.'}
                {targetStatus === 'Need More Info' && 'Specify what additional information is required.'}
                {targetStatus === 'Submitted' && 'Are you sure you want to resubmit this application?'}
                {targetStatus === 'Paid' && 'Confirm that payment has been received for this application.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                requiresComment(targetStatus) 
                  ? "Comment is required..." 
                  : "Optional comments..."
              }
              className="my-4"
            />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setComment('')}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  if (targetStatus === 'Paid' && onPaymentReceived) {
                    onPaymentReceived();
                  } else {
                    onStatusChange(targetStatus, comment);
                  }
                  setComment('');
                }}
                disabled={requiresComment(targetStatus) && !comment.trim()}
              >
                {getStatusButtonText(targetStatus)}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ))}

      {/* Admin manual status override */}
      {isAdmin && availableStatuses.length > 2 && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm">
              Manual Override
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Manual Status Override</AlertDialogTitle>
              <AlertDialogDescription>
                Manually change the application status. This action will be logged.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="my-2">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Reason for manual override (required)..."
              className="my-4"
            />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setComment('');
                setSelectedStatus('');
              }}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  if (selectedStatus) {
                    if (selectedStatus === 'Paid' && onPaymentReceived) {
                      onPaymentReceived();
                    } else {
                      onStatusChange(selectedStatus as Status, comment || `Manual override by ${user?.profile?.name}`);
                    }
                    setComment('');
                    setSelectedStatus('');
                  }
                }}
                disabled={!selectedStatus || !comment.trim()}
              >
                Update Status
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default CustomerActionButtons;
