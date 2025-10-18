import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, User } from 'lucide-react';
import { Customer } from '@/types/customer';
import { formatDate } from '@/lib/utils';

interface PendingStatusRequestsProps {
  customer: Customer;
}

const PendingStatusRequests: React.FC<PendingStatusRequestsProps> = ({ customer }) => {
  // Filter comments to find pending status requests
  const pendingRequests = (customer.comments || [])
    .filter(comment => 
      comment.is_status_request && 
      comment.requested_status && 
      comment.requested_status !== customer.status
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (pendingRequests.length === 0) {
    return null;
  }

  return (
    <Card className="border-warning bg-warning/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertCircle className="w-5 h-5 text-warning" />
          Pending Status Requests
          <Badge variant="secondary" className="ml-auto">
            {pendingRequests.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingRequests.map((request) => (
          <div
            key={request.id}
            className="p-3 bg-background rounded-lg border border-warning/20 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                  {request.requested_status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  requested
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatDate(new Date(request.timestamp))}
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-medium">{request.author}</span>
            </div>
            
            {/* Extract and display the reason from the comment */}
            {request.content.includes(']') && (
              <p className="text-sm text-muted-foreground pl-5">
                {request.content.split(']')[1]?.trim() || ''}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PendingStatusRequests;
