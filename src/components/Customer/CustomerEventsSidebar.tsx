import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, User, Building2, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface CustomerEventsSidebarProps {
  customerId: string;
}

export const CustomerEventsSidebar: React.FC<CustomerEventsSidebarProps> = ({ customerId }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(true);

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Fetch customer details
  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });

  // Fetch customer applications with manual product lookup
  const { data: applications, isLoading: applicationsLoading } = useQuery({
    queryKey: ['customer-applications', customerId],
    queryFn: async () => {
      const { data: apps, error: appsError } = await (supabase as any)
        .from('applications')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (appsError) throw appsError;
      
      // Fetch products separately
      if (apps && apps.length > 0) {
        const productIds = [...new Set(apps.map((app: any) => app.product_id).filter(Boolean))];
        if (productIds.length > 0) {
          const { data: products } = await (supabase as any)
            .from('products')
            .select('id, name')
            .in('id', productIds);
          
          // Merge product data
          return apps.map((app: any) => ({
            ...app,
            product_name: products?.find((p: any) => p.id === app.product_id)?.name,
          }));
        }
      }
      
      return apps || [];
    },
    enabled: !!customerId,
  });

  // Fetch status history
  const { data: statusHistory } = useQuery({
    queryKey: ['customer-status-history', customerId],
    queryFn: async () => {
      if (!applications || applications.length === 0) return [];
      
      const appIds = (applications as any[]).map((app: any) => app.id);
      const { data, error } = await (supabase as any)
        .from('status_history')
        .select('*')
        .in('application_id', appIds)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      // Add application reference numbers
      return data?.map((history: any) => ({
        ...history,
        reference_number: (applications as any[]).find((a: any) => a.id === history.application_id)?.reference_number,
      })) || [];
    },
    enabled: !!applications && applications.length > 0,
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Draft': 'bg-muted text-muted-foreground',
      'Submitted': 'bg-primary/10 text-primary',
      'In Progress': 'bg-primary/10 text-primary',
      'Returned': 'bg-destructive/10 text-destructive',
      'Approved': 'bg-accent/10 text-accent',
      'Rejected': 'bg-destructive/10 text-destructive',
      'Complete': 'bg-accent/10 text-accent',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  if (customerLoading) {
    return (
      <div className={cn(
        "fixed right-0 h-[calc(100vh-4rem)] bg-card border-l shadow-lg transition-all duration-300 z-[110]",
        isCollapsed ? "w-12" : "w-80"
      )} style={{ top: 'var(--unified-header-h, 64px)' }}>
        <div className="space-y-4 p-4">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-32 bg-muted animate-pulse rounded" />
          <div className="h-48 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className={cn(
      "fixed right-0 h-[calc(100vh-4rem)] bg-card border-l shadow-lg transition-all duration-300 z-[110] overflow-y-auto",
      isCollapsed ? "w-12" : "w-80"
    )} style={{ top: 'var(--unified-header-h, 64px)' }}>
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute -left-8 top-4 h-16 w-8 rounded-r-none border-l-0 bg-card border shadow-md"
        onClick={toggleCollapsed}
      >
        {isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

      {/* Collapsed State */}
      {isCollapsed && (
        <div className="flex flex-col items-center py-4 gap-4">
          <User className="h-6 w-6 text-muted-foreground" />
          <Badge className="writing-mode-vertical">Events</Badge>
        </div>
      )}

      {/* Expanded State */}
      {!isCollapsed && (
      <div className="p-4 space-y-4">
        {/* Customer Info Card */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <Building2 className="w-3 h-3 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium text-foreground">{customer.company}</div>
                <div className="text-muted-foreground">{customer.name}</div>
              </div>
            </div>
            <div className="text-muted-foreground">{customer.email}</div>
            <div className="text-muted-foreground">{customer.mobile}</div>
            <div className="pt-2 border-t border-border">
              <Badge variant="outline" className="text-xs">
                {customer.license_type || 'N/A'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Recent Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {applicationsLoading ? (
              <div className="space-y-2">
                <div className="h-16 bg-muted animate-pulse rounded" />
                <div className="h-16 bg-muted animate-pulse rounded" />
              </div>
            ) : applications && applications.length > 0 ? (
              (applications as any[]).map((app: any) => (
                <div
                  key={app.id}
                  className="p-2 rounded-md border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="text-xs font-medium text-foreground truncate">
                      {app.product_name || 'Unknown Service'}
                    </div>
                    <Badge className={`text-xs ${getStatusColor(app.status)}`}>
                      {app.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {app.reference_number}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    AED {app.amount?.toLocaleString() || '0'}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4">
                No applications yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {statusHistory && statusHistory.length > 0 ? (
              (statusHistory as any[]).slice(0, 8).map((history: any, index: number) => (
                <div
                  key={history.id || index}
                  className="flex items-start gap-2 pb-2 border-b border-border last:border-0"
                >
                  <Calendar className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-foreground">
                      Status changed to{' '}
                      <span className="font-medium">{history.new_status}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {history.reference_number}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(history.created_at), 'MMM dd, HH:mm')}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4">
                No recent activity
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="text-center p-2 bg-muted/30 rounded">
              <div className="text-lg font-semibold text-foreground">
                {applications?.length || 0}
              </div>
              <div className="text-xs text-muted-foreground">Applications</div>
            </div>
            <div className="text-center p-2 bg-muted/30 rounded">
              <div className="text-lg font-semibold text-foreground">
                {(applications as any[])?.filter((a: any) => a.status === 'Complete').length || 0}
              </div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  );
};
