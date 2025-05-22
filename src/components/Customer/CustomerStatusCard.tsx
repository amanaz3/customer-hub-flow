
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Status } from '@/contexts/CustomerContext';
import { formatCurrency } from '@/lib/utils';

interface CustomerStatusCardProps {
  status: Status;
  amount: number;
  comments: string[];
}

const CustomerStatusCard: React.FC<CustomerStatusCardProps> = ({
  status,
  amount,
  comments,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Case Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>Current Status</Label>
            <div className={`text-lg font-semibold mt-1 ${
              status === 'Pending' ? 'text-status-pending' :
              status === 'Returned' ? 'text-status-returned' :
              status === 'Submitted to Bank' ? 'text-status-submitted' :
              'text-status-completed'
            }`}>
              {status}
            </div>
          </div>
          
          <div>
            <Label>Amount</Label>
            <div className="text-lg font-semibold mt-1">
              {formatCurrency(amount)}
            </div>
          </div>
          
          {comments.length > 0 && (
            <div>
              <Label>Comments</Label>
              <ul className="mt-2 space-y-2">
                {comments.map((comment, index) => (
                  <li key={index} className="p-2 bg-gray-50 rounded-md text-sm">
                    {comment}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerStatusCard;
