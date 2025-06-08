
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CustomerStatus, Comment } from '@/types/customer';
import { formatCurrency, formatDate } from '@/lib/utils';

interface CustomerStatusCardProps {
  status: CustomerStatus;
  amount: number;
  comments: Comment[];
  paymentReceived?: boolean;
  paymentDate?: string;
}

const CustomerStatusCard: React.FC<CustomerStatusCardProps> = ({
  status,
  amount,
  comments,
  paymentReceived,
  paymentDate,
}) => {
  const getStatusColor = (status: CustomerStatus) => {
    switch (status) {
      case 'Draft': return 'bg-gray-500 text-white';
      case 'Submitted': return 'bg-blue-500 text-white';
      case 'Returned': return 'bg-orange-500 text-white';
      case 'Sent to Bank': return 'bg-purple-500 text-white';
      case 'Complete': return 'bg-green-500 text-white';
      case 'Rejected': return 'bg-red-500 text-white';
      case 'Need More Info': return 'bg-yellow-500 text-white';
      case 'Paid': return 'bg-emerald-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>Current Status</Label>
            <div className="mt-1">
              <Badge className={getStatusColor(status)}>
                {status}
              </Badge>
            </div>
          </div>
          
          <div>
            <Label>Amount</Label>
            <div className="text-lg font-semibold mt-1">
              {formatCurrency(amount)}
            </div>
          </div>
          
          {paymentReceived && paymentDate && (
            <div>
              <Label>Payment Status</Label>
              <div className="mt-1 space-y-1">
                <Badge className="bg-emerald-500 text-white">
                  Payment Received
                </Badge>
                <div className="text-sm text-muted-foreground">
                  Paid on {formatDate(paymentDate)}
                </div>
              </div>
            </div>
          )}
          
          {comments.length > 0 && (
            <div>
              <Label>Recent Comments</Label>
              <ul className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                {comments.slice(-3).map((comment, index) => (
                  <li key={comment.id} className="p-2 bg-gray-50 rounded-md text-sm">
                    <div className="text-xs text-muted-foreground mb-1">
                      {comment.author} - {formatDate(comment.timestamp)}
                    </div>
                    {comment.content}
                  </li>
                ))}
              </ul>
              {comments.length > 3 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Showing last 3 comments
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerStatusCard;
