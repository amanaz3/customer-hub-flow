import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusChange } from '@/types/customer';
import { Clock, User, MessageSquare, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EnhancedStatusHistoryProps {
  statusChanges: StatusChange[];
  isLoading?: boolean;
}

const EnhancedStatusHistory: React.FC<EnhancedStatusHistoryProps> = ({ 
  statusChanges, 
  isLoading = false 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-500';
      case 'Submitted': return 'bg-blue-500';
      case 'Returned': return 'bg-yellow-500';
      case 'Complete': return 'bg-green-500';
      case 'Paid': return 'bg-emerald-500';
      case 'Rejected': return 'bg-red-500';
      case 'Need More Info': return 'bg-orange-500';
      case 'Sent to Bank': return 'bg-purple-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "text-xs font-medium px-2 py-1 rounded-full";
    switch (status) {
      case 'Draft': return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'Submitted': return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'Returned': return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'Complete': return `${baseClasses} bg-green-100 text-green-800`;
      case 'Paid': return `${baseClasses} bg-emerald-100 text-emerald-800`;
      case 'Rejected': return `${baseClasses} bg-red-100 text-red-800`;
      case 'Need More Info': return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'Sent to Bank': return `${baseClasses} bg-purple-100 text-purple-800`;
      default: return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Status History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!statusChanges || statusChanges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Status History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No status changes recorded yet.</p>
            <p className="text-sm">Status history will appear here as the application progresses.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort status changes by created_at (newest first)
  const sortedChanges = [...statusChanges].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Status History
          <Badge variant="outline" className="ml-2">
            {statusChanges.length} {statusChanges.length === 1 ? 'change' : 'changes'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sortedChanges.map((change, index) => (
            <div key={change.id} className="relative">
              {/* Timeline line */}
              {index < sortedChanges.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-16 bg-border"></div>
              )}
              
              <div className="flex items-start space-x-4">
                {/* Status indicator */}
                <div className={`w-3 h-3 rounded-full ${getStatusColor(change.new_status)} mt-2 ring-4 ring-background shadow-sm`}></div>
                
                {/* Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={getStatusBadge(change.previous_status)}>
                        {change.previous_status}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className={getStatusBadge(change.new_status)}>
                        {change.new_status}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(change.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Changed by <span className="font-medium">{change.changed_by}</span>
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {change.changed_by_role}
                    </Badge>
                  </div>
                  
                  {change.comment && (
                    <div className="flex items-start space-x-2 mt-2 p-3 bg-muted/50 rounded-md">
                      <MessageSquare className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground italic">
                        "{change.comment}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedStatusHistory;