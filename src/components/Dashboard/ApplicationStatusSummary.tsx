import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SecureAuthContext';
import { 
  FileEdit, 
  Send, 
  RotateCcw, 
  ArrowRight,
  Calendar,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface StatusCounts {
  draft: number;
  submitted: number;
  returned: number;
}

const ApplicationStatusSummary = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState<StatusCounts>({ draft: 0, submitted: 0, returned: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatusCounts = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        // Calculate 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

        // Build query based on role
        let query = supabase
          .from('account_applications')
          .select('status', { count: 'exact', head: false })
          .gte('created_at', thirtyDaysAgoISO)
          .in('status', ['draft', 'submitted', 'returned']);

        // Non-admin users only see their own applications
        if (!isAdmin) {
          // Join through customers table
          const { data: customerIds } = await supabase
            .from('customers')
            .select('id')
            .eq('user_id', user.id);
          
          if (customerIds && customerIds.length > 0) {
            query = query.in('customer_id', customerIds.map(c => c.id));
          } else {
            setCounts({ draft: 0, submitted: 0, returned: 0 });
            setIsLoading(false);
            return;
          }
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching status counts:', error);
          setCounts({ draft: 0, submitted: 0, returned: 0 });
        } else if (data) {
          // Count by status
          const statusCounts: StatusCounts = { draft: 0, submitted: 0, returned: 0 };
          data.forEach((app: { status: string }) => {
            if (app.status === 'draft') statusCounts.draft++;
            else if (app.status === 'submitted') statusCounts.submitted++;
            else if (app.status === 'returned') statusCounts.returned++;
          });
          setCounts(statusCounts);
        }
      } catch (err) {
        console.error('Error in fetchStatusCounts:', err);
        setCounts({ draft: 0, submitted: 0, returned: 0 });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatusCounts();
  }, [user?.id, isAdmin]);

  const statusCards = [
    {
      key: 'draft',
      title: 'Drafts',
      count: counts.draft,
      icon: FileEdit,
      description: 'Saved but not submitted',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950/50',
      borderColor: 'border-amber-200 dark:border-amber-800',
    },
    {
      key: 'submitted',
      title: 'Submitted',
      count: counts.submitted,
      icon: Send,
      description: 'Awaiting review',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
      key: 'returned',
      title: 'Returned',
      count: counts.returned,
      icon: RotateCcw,
      description: 'Needs attention',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/50',
      borderColor: 'border-orange-200 dark:border-orange-800',
    },
  ];

  const totalActive = counts.draft + counts.submitted + counts.returned;

  return (
    <Card className="shadow-sm border-0 bg-gradient-to-br from-card to-card/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Application Pipeline</CardTitle>
              <p className="text-sm text-muted-foreground">
                Last 30 days • {totalActive} active application{totalActive !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/applications')}
            className="gap-2"
          >
            View All Applications
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {statusCards.map((card) => (
              <div
                key={card.key}
                className={cn(
                  "relative p-4 rounded-xl border transition-all duration-200 hover:shadow-md",
                  card.borderColor,
                  card.bgColor
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </p>
                    <p className={cn("text-3xl font-bold", card.color)}>
                      {card.count}
                    </p>
                    <p className="text-xs text-muted-foreground/80">
                      {card.description}
                    </p>
                  </div>
                  <div className={cn("p-2 rounded-lg", card.bgColor)}>
                    <card.icon className={cn("h-5 w-5", card.color)} />
                  </div>
                </div>
                {card.count > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="absolute top-2 right-2 text-xs px-2"
                  >
                    {card.count > 5 ? 'High' : card.count > 2 ? 'Medium' : 'Low'}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApplicationStatusSummary;
