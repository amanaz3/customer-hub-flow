
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Status } from '@/contexts/CustomerContext';
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

interface CustomerActionButtonsProps {
  status: Status;
  isAdmin: boolean;
  isUserOwner: boolean;
  mandatoryDocumentsUploaded: boolean;
  onStatusChange: (status: Status, comment: string) => void;
}

const CustomerActionButtons: React.FC<CustomerActionButtonsProps> = ({
  status,
  isAdmin,
  isUserOwner,
  mandatoryDocumentsUploaded,
  onStatusChange,
}) => {
  const [comment, setComment] = useState('');

  return (
    <div className="space-x-2">
      {isAdmin && status !== 'Completed' && (
        <>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Return to User</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Return Case to User</AlertDialogTitle>
                <AlertDialogDescription>
                  Please provide a comment explaining what needs to be corrected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter your comments..."
                className="my-4"
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onStatusChange('Returned', comment)}
                  disabled={!comment.trim()}
                >
                  Return to User
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="default" 
                disabled={!mandatoryDocumentsUploaded}
              >
                Submit to Bank
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Submit Case to Bank</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to submit this case to the bank?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Optional comments..."
                className="my-4"
              />
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onStatusChange('Submitted to Bank', comment)}>
                  Submit to Bank
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
      
      {isAdmin && status === 'Submitted to Bank' && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="default">Mark as Completed</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mark Case as Completed</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to mark this case as completed? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Optional comments..."
              className="my-4"
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onStatusChange('Completed', comment)}>
                Mark as Completed
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      {!isAdmin && status === 'Returned' && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="default" 
              disabled={!mandatoryDocumentsUploaded}
            >
              Resubmit
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Resubmit Case</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to resubmit this case? Make sure you've addressed all the feedback.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onStatusChange('Pending', '')}>
                Resubmit Case
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default CustomerActionButtons;
