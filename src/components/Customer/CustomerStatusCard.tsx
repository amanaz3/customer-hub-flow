
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Status, Comment } from '@/types/customer';
import { useAuth } from '@/contexts/SecureAuthContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { MessageSquare, DollarSign, Calendar, Settings } from 'lucide-react';
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

interface CustomerStatusCardProps {
  status: Status;
  amount: number;
  comments?: Comment[];
  // Payment fields removed - no longer in scope
  onStatusChange?: (status: Status, comment: string) => void;
}

const getStatusColor = (status: Status) => {
  switch (status) {
    case 'Draft': return 'bg-gray-100 text-gray-800';
    case 'Submitted': return 'bg-blue-100 text-blue-800';
    case 'Returned': return 'bg-yellow-100 text-yellow-800';
    case 'Sent to Bank': return 'bg-purple-100 text-purple-800';
    case 'Complete': return 'bg-green-100 text-green-800';
    case 'Rejected': return 'bg-red-100 text-red-800';
    case 'Need More Info': return 'bg-orange-100 text-orange-800';
    case 'Paid': return 'bg-emerald-100 text-emerald-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getAvailableStatuses = (currentStatus: Status): Status[] => {
  // Admin can change to any status except "Sent to Bank"
  const allStatuses: Status[] = ['Draft', 'Submitted', 'Returned', 'Complete', 'Rejected', 'Need More Info', 'Paid'];
  return allStatuses.filter(status => status !== 'Sent to Bank' && status !== currentStatus);
};

const CustomerStatusCard: React.FC<CustomerStatusCardProps> = ({
  status,
  amount,
  comments = [],
  // Payment props removed
  onStatusChange
}) => {
  const { isAdmin } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<Status | ''>('');
  const [comment, setComment] = useState('');

  const availableStatuses = getAvailableStatuses(status);

  const handleStatusChange = () => {
    if (selectedStatus && onStatusChange) {
      onStatusChange(selectedStatus as Status, comment);
      setSelectedStatus('');
      setComment('');
    }
  };

  const requiresComment = (targetStatus: Status): boolean => {
    return ['Returned', 'Rejected', 'Need More Info'].includes(targetStatus);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Application Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Status</p>
              <Badge className={`${getStatusColor(status)} mt-1`}>
                {status}
              </Badge>
            </div>
            {isAdmin && availableStatuses.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Change Status
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Change Application Status</AlertDialogTitle>
                    <AlertDialogDescription>
                      Select a new status for this application. This action will be logged in the status history.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-4">
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStatuses.map((statusOption) => (
                          <SelectItem key={statusOption} value={statusOption}>
                            {statusOption}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={
                        selectedStatus && requiresComment(selectedStatus as Status)
                          ? "Comment is required for this status..."
                          : "Optional comment..."
                      }
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => {
                      setSelectedStatus('');
                      setComment('');
                    }}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleStatusChange}
                      disabled={
                        !selectedStatus || 
                        (selectedStatus && requiresComment(selectedStatus as Status) && !comment.trim())
                      }
                    >
                      Update Status
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="text-xl font-semibold">{formatCurrency(amount)}</p>
          </div>

          {/* Payment tracking removed - no longer in scope */}
        </CardContent>
      </Card>

      {comments && comments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Comments ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {comments.slice(0, 3).map((comment, index) => (
                <div key={comment.id || `comment-${comment.timestamp}-${index}`} className="border-l-2 border-blue-200 pl-3">
                  <p className="text-sm">{comment.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {comment.author} • {formatDate(comment.timestamp)}
                  </p>
                </div>
              ))}
              {comments.length > 3 && (
                <p className="text-sm text-muted-foreground">
                  And {comments.length - 3} more comments...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerStatusCard;
