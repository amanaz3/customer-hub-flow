
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Status } from '@/types/customer';
import type { Status as StatusType } from '@/utils/statusTransitionRules';
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
import { Badge } from '@/components/ui/badge';
import { getAvailableStatusTransitions } from '@/utils/statusTransitionRules';

interface CustomerActionButtonsProps {
  status: Status;
  isAdmin: boolean;
  isUserOwner: boolean;
  mandatoryDocumentsUploaded: boolean;
  onStatusChange: (status: Status, comment: string) => void;
  // onPaymentReceived removed - payment tracking out of scope
}

const CustomerActionButtons: React.FC<CustomerActionButtonsProps> = ({
  status,
  isAdmin,
  isUserOwner,
  mandatoryDocumentsUploaded,
  onStatusChange,
  // onPaymentReceived prop removed
}) => {
  const [comment, setComment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<Status | ''>('');
  const { user } = useAuth();

  const getAvailableStatuses = (): Status[] => {
    return getAvailableStatusTransitions(status as StatusType, isAdmin, mandatoryDocumentsUploaded) as Status[];
  };

  const getStatusButtonText = (targetStatus: Status): string => {
    switch (targetStatus) {
      case 'Returned': return 'Return to User';
      case 'Sent to Bank': return 'Send to Bank';
      case 'Complete': return 'Mark as Complete';
      case 'Rejected': return 'Mark as Rejected';
      case 'Need More Info': return 'Request More Info';
      case 'Submitted': return isAdmin ? 'Mark as Submitted' : 'Resubmit';
      // 'Paid' case removed
      default: return `Update to ${targetStatus}`;
    }
  };

  const getStatusButtonVariant = (targetStatus: Status) => {
    switch (targetStatus) {
      case 'Returned':
      case 'Rejected':
        return 'destructive' as const;
      case 'Complete':
        return 'default' as const;
      case 'Sent to Bank':
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

  const getActionDescription = (targetStatus: Status): string => {
    switch (targetStatus) {
      case 'Returned': return 'Please provide feedback on what needs to be corrected.';
      case 'Sent to Bank': return 'Are you sure you want to send this application to the bank? Ensure all mandatory documents are uploaded.';
      case 'Complete': return 'Mark this application as approved and complete.';
      case 'Rejected': return 'Please provide a reason for rejection.';
      case 'Need More Info': return 'Specify what additional information is required.';
      case 'Submitted': return isAdmin ? 'Mark this application as submitted on behalf of the user.' : 'Are you sure you want to resubmit this application?';
      // 'Paid' case removed - payment tracking out of scope
      default: return `Update status to ${targetStatus}`;
    }
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value as Status);
  };

  const availableStatuses = getAvailableStatuses();

  if (availableStatuses.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {status === 'Complete' ? 'Final Status' : 'No Actions Available'}
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Quick action buttons for common transitions */}
      {availableStatuses.slice(0, 2).map((targetStatus) => (
        <AlertDialog key={targetStatus}>
          <AlertDialogTrigger asChild>
            <Button 
              variant={getStatusButtonVariant(targetStatus)}
              disabled={isActionDisabled(targetStatus)}
              size="sm"
            >
              {getStatusButtonText(targetStatus)}
              {targetStatus === 'Sent to Bank' && !mandatoryDocumentsUploaded && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  Docs Required
                </Badge>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{getStatusButtonText(targetStatus)}</AlertDialogTitle>
              <AlertDialogDescription>
                {getActionDescription(targetStatus)}
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
                  onStatusChange(targetStatus, comment);
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

      {/* Additional actions menu for admins */}
      {isAdmin && availableStatuses.length > 2 && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm">
              More Actions ({availableStatuses.length - 2})
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Additional Status Actions</AlertDialogTitle>
              <AlertDialogDescription>
                Select a status to update this application. This action will be logged.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="my-2">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.slice(2).map((status) => (
                  <SelectItem key={status} value={status}>
                    {getStatusButtonText(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                selectedStatus && requiresComment(selectedStatus as Status)
                  ? "Comment is required..."
                  : "Optional comment..."
              }
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
                    onStatusChange(selectedStatus as Status, comment || `Status updated by ${user?.profile?.name || 'Admin'}`);
                    setComment('');
                    setSelectedStatus('');
                  }
                }}
                disabled={!selectedStatus || (selectedStatus && requiresComment(selectedStatus as Status) && !comment.trim())}
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
