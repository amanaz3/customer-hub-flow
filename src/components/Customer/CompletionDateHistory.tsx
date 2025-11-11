import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, Calendar } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CompletionDateHistoryEntry {
  id: string;
  previous_date: string | null;
  new_date: string;
  changed_by: string;
  changed_by_role: string;
  comment: string | null;
  created_at: string;
}

interface CompletionDateHistoryWithProfile extends CompletionDateHistoryEntry {
  changed_by_profile?: {
    name: string;
    email: string;
  };
}

interface CompletionDateHistoryProps {
  applicationId: string;
}

export const CompletionDateHistory = ({ applicationId }: CompletionDateHistoryProps) => {
  const [history, setHistory] = useState<CompletionDateHistoryWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        
        // Fetch completion date history
        const { data: historyData, error: historyError } = await supabase
          .from('completion_date_history')
          .select('*')
          .eq('application_id', applicationId)
          .order('created_at', { ascending: false });

        if (historyError) throw historyError;

        // Fetch profile information for each changed_by user
        const userIds = [...new Set(historyData?.map(h => h.changed_by) || [])];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        }

        // Merge the data
        const enrichedHistory = historyData?.map(entry => ({
          ...entry,
          changed_by_profile: profilesData?.find(p => p.id === entry.changed_by)
        })) || [];

        setHistory(enrichedHistory);
      } catch (error) {
        console.error('Error fetching completion date history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [applicationId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Completion Date History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading history...</p>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Completion Date History
          </CardTitle>
          <CardDescription>
            No completion date edits have been made
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Completion Date History
        </CardTitle>
        <CardDescription>
          {history.length} edit{history.length !== 1 ? 's' : ''} made to the completion date
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {history.map((entry, index) => (
              <div
                key={entry.id}
                className="relative pl-6 pb-4 border-l-2 border-muted last:pb-0"
              >
                <div className="absolute left-[-9px] top-0 h-4 w-4 rounded-full bg-primary border-2 border-background" />
                
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono text-xs">
                          Edit #{history.length - index}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.created_at).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {entry.changed_by_profile?.name || 'Unknown User'}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {entry.changed_by_role}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mt-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground font-medium">Previous Date</p>
                        </div>
                        <p className="text-sm font-mono">
                          {entry.previous_date 
                            ? new Date(entry.previous_date).toLocaleString()
                            : 'Not set'}
                        </p>
                      </div>

                      <div className="p-3 bg-primary/5 rounded-md border border-primary/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-3 w-3 text-primary" />
                          <p className="text-xs text-primary font-medium">New Date</p>
                        </div>
                        <p className="text-sm font-mono text-primary">
                          {new Date(entry.new_date).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {entry.comment && (
                      <div className="p-2 bg-muted/30 rounded text-xs text-muted-foreground italic">
                        {entry.comment}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
