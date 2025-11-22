import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AssessmentHistoryProps {
  applicationId: string;
}

interface HistoryEntry {
  id: string;
  previous_assessment: any;
  new_assessment: any;
  change_type: 'created' | 'updated' | 'deleted';
  changed_by: string;
  changed_by_role: string;
  comment: string | null;
  created_at: string;
  changed_by_profile?: {
    name: string;
    email: string;
  };
}

export const AssessmentHistory = ({ applicationId }: AssessmentHistoryProps) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [applicationId]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('application_assessment_history')
        .select(`
          *,
          changed_by_profile:profiles!application_assessment_history_changed_by_fkey(name, email)
        `)
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory((data || []) as HistoryEntry[]);
    } catch (error) {
      console.error('Error fetching assessment history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading history...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        No assessment history available
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Assessment Change History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((entry) => (
            <div key={entry.id} className="border-l-2 border-muted pl-4 pb-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      entry.change_type === 'created' ? 'default' :
                      entry.change_type === 'updated' ? 'secondary' :
                      'destructive'
                    }
                  >
                    {entry.change_type.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    by {entry.changed_by_profile?.name || 'Unknown'} ({entry.changed_by_role})
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                </span>
              </div>

              {entry.comment && (
                <p className="text-sm text-muted-foreground mb-2">{entry.comment}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {entry.previous_assessment && (
                  <div>
                    <p className="font-semibold mb-1">Previous Assessment:</p>
                    <div className="bg-muted/30 rounded-md p-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Level: {entry.previous_assessment?.riskAssessment?.level || 'N/A'}</span>
                      </div>
                      <div>Score: {entry.previous_assessment?.riskAssessment?.score || 'N/A'}</div>
                      <div>Method: {entry.previous_assessment?.riskAssessment?.method || 'N/A'}</div>
                    </div>
                  </div>
                )}

                {entry.new_assessment && (
                  <div>
                    <p className="font-semibold mb-1">New Assessment:</p>
                    <div className="bg-primary/10 rounded-md p-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Level: {entry.new_assessment?.riskAssessment?.level || 'N/A'}</span>
                      </div>
                      <div>Score: {entry.new_assessment?.riskAssessment?.score || 'N/A'}</div>
                      <div>Method: {entry.new_assessment?.riskAssessment?.method || 'N/A'}</div>
                    </div>
                  </div>
                )}

                {entry.change_type === 'deleted' && !entry.new_assessment && (
                  <div>
                    <p className="font-semibold mb-1 text-destructive">Assessment Deleted</p>
                    <p className="text-xs text-muted-foreground">The risk assessment was removed from the application</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};