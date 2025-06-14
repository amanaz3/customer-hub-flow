
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusChange } from '@/contexts/CustomerContext';
import { formatDate } from '@/lib/utils';
import { Clock, User, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SecureAuthContext';

interface StatusHistoryCardProps {
  statusHistory: StatusChange[];
}

interface StatusHistoryWithUserInfo extends StatusChange {
  user_name?: string;
}

const StatusHistoryCard: React.FC<StatusHistoryCardProps> = ({
  statusHistory,
}) => {
  const [enrichedHistory, setEnrichedHistory] = useState<StatusHistoryWithUserInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin, user } = useAuth();

  useEffect(() => {
    const enrichHistoryWithUserNames = async () => {
      setIsLoading(true);
      try {
        const enrichedData = await Promise.all(
          statusHistory.map(async (change) => {
            // If changed_by is a UUID, fetch the user profile
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(change.changed_by);
            
            if (isUUID) {
              try {
                const { data: profile, error } = await supabase
                  .from('profiles')
                  .select('name, email')
                  .eq('id', change.changed_by)
                  .single();
                
                if (!error && profile) {
                  return {
                    ...change,
                    user_name: profile.name || profile.email
                  };
                }
              } catch (error) {
                console.error('Error fetching user profile:', error);
              }
            }
            
            // If not a UUID or profile fetch failed, use the original changed_by value
            return {
              ...change,
              user_name: change.changed_by
            };
          })
        );
        
        // Sort by creation date, newest first
        const sortedData = enrichedData.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        setEnrichedHistory(sortedData);
      } catch (error) {
        console.error('Error enriching status history:', error);
        setEnrichedHistory(statusHistory.map(change => ({ ...change, user_name: change.changed_by })));
      } finally {
        setIsLoading(false);
      }
    };

    if (statusHistory.length > 0) {
      enrichHistoryWithUserNames();
    } else {
      setEnrichedHistory([]);
      setIsLoading(false);
    }
  }, [statusHistory]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Submitted': return 'bg-blue-500';
      case 'Returned': return 'bg-orange-500';
      case 'Sent to Bank': return 'bg-purple-500';
      case 'Complete': return 'bg-green-500';
      case 'Rejected': return 'bg-red-500';
      case 'Need More Info': return 'bg-yellow-500';
      case 'Paid': return 'bg-emerald-500';
      case 'Draft': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Status History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-muted-foreground">Loading history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Status History
          {enrichedHistory.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {enrichedHistory.length} change{enrichedHistory.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {enrichedHistory.length > 0 ? (
            enrichedHistory.map((change, index) => (
              <div key={change.id} className="border-l-2 border-gray-200 pl-4 pb-4 last:pb-0 relative">
                {/* Timeline dot */}
                <div className="absolute -left-2 top-2 w-4 h-4 bg-white border-2 border-gray-300 rounded-full"></div>
                
                <div className="space-y-3">
                  {/* Status and timestamp header */}
                  <div className="flex items-center justify-between">
                    <Badge className={`${getStatusColor(change.new_status)} text-white font-medium`}>
                      {change.new_status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(change.created_at)}
                    </span>
                  </div>
                  
                  {/* User and role information */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-muted-foreground">Changed by:</span>
                    <span className="font-medium">
                      {change.user_name || change.changed_by}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`${getRoleColor(change.changed_by_role)} flex items-center gap-1`}
                    >
                      {getRoleIcon(change.changed_by_role)}
                      {change.changed_by_role}
                    </Badge>
                  </div>
                  
                  {/* Previous status indicator */}
                  {change.previous_status && change.previous_status !== change.new_status && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">From:</span> {change.previous_status}
                    </div>
                  )}
                  
                  {/* Comment */}
                  {change.comment && (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                      <div className="text-xs font-medium text-muted-foreground mb-1">Comment:</div>
                      <div className="text-sm text-gray-700">{change.comment}</div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No status changes recorded yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Status changes will appear here as the application progresses
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusHistoryCard;
