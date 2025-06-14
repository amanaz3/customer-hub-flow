
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusChange } from '@/contexts/CustomerContext';
import { formatDate } from '@/lib/utils';
import { Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

  useEffect(() => {
    const enrichHistoryWithUserNames = async () => {
      const enrichedData = await Promise.all(
        statusHistory.map(async (change) => {
          // If changed_by is a UUID, fetch the user profile
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(change.changed_by);
          
          if (isUUID) {
            try {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', change.changed_by)
                .single();
              
              if (!error && profile) {
                return {
                  ...change,
                  user_name: profile.name
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
      
      setEnrichedHistory(enrichedData);
    };

    if (statusHistory.length > 0) {
      enrichHistoryWithUserNames();
    } else {
      setEnrichedHistory([]);
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
          {enrichedHistory.length > 0 ? (
            enrichedHistory.map((change, index) => (
              <div key={change.id} className="border-l-2 border-gray-200 pl-4 pb-4 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={`${getStatusColor(change.new_status)} text-white`}>
                    {change.new_status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(change.created_at)}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Changed by:</span>
                    <span className="text-sm">{change.user_name || change.changed_by}</span>
                    <Badge variant="outline" className={getRoleColor(change.changed_by_role)}>
                      {change.changed_by_role}
                    </Badge>
                  </div>
                  
                  {change.comment && (
                    <div className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                      {change.comment}
                    </div>
                  )}
                  
                  {index < enrichedHistory.length - 1 && change.previous_status !== change.new_status && (
                    <div className="text-xs text-muted-foreground">
                      Previous: {change.previous_status}
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
