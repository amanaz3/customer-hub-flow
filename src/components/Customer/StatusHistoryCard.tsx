
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusChange } from '@/contexts/CustomerContext';
import { formatDate } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface StatusHistoryCardProps {
  statusHistory: StatusChange[];
}

const StatusHistoryCard: React.FC<StatusHistoryCardProps> = ({
  statusHistory,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Submitted': return 'bg-blue-500';
      case 'Returned': return 'bg-orange-500';
      case 'Sent to Bank': return 'bg-purple-500';
      case 'Complete': return 'bg-green-500';
      case 'Rejected': return 'bg-red-500';
      case 'Need More Info': return 'bg-yellow-500';
      case 'Paid': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Status History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statusHistory.length > 0 ? (
            statusHistory.map((change, index) => (
              <div key={change.id} className="border-l-2 border-gray-200 pl-4 pb-4 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={`${getStatusColor(change.newStatus)} text-white`}>
                    {change.newStatus}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(change.timestamp)}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Changed by:</span>
                    <span className="text-sm">{change.changedBy}</span>
                    <Badge variant="outline" className={getRoleColor(change.changedByRole)}>
                      {change.changedByRole}
                    </Badge>
                  </div>
                  
                  {change.comment && (
                    <div className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                      {change.comment}
                    </div>
                  )}
                  
                  {index < statusHistory.length - 1 && change.previousStatus !== change.newStatus && (
                    <div className="text-xs text-muted-foreground">
                      Previous: {change.previousStatus}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No status changes recorded</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusHistoryCard;
