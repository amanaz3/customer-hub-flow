import React, { useState, useMemo, memo, useEffect } from 'react';
import LazyWrapper from '@/components/Performance/LazyWrapper';
import { useAuth } from '@/contexts/SecureAuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Application } from '@/types/application';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { formatApplicationReferenceWithPrefix } from '@/utils/referenceNumberFormatter';

type ApplicationWithCustomer = Application & {
  paid_date?: string;
};

const CompletedApplications = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'completed_actual' | 'paid'>('all');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [applications, setApplications] = useState<ApplicationWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxReferenceNumber, setMaxReferenceNumber] = useState<number>(0);
  
  // Fetch applications with database-level filtering
  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Determine which statuses to fetch based on statusFilter
        const statusesToFetch = statusFilter === 'all' 
          ? ['completed', 'paid'] as const
          : statusFilter === 'completed' || statusFilter === 'completed_actual'
          ? ['completed'] as const
          : ['paid'] as const;

        // Build base query with status filter
        let query = supabase
          .from('account_applications')
          .select(`
            *,
            customer:customers!inner(id, name, email, mobile, company, license_type, user_id)
          `)
          .in('status', statusesToFetch);
        
        // Non-admins only see their own applications
        if (!isAdmin) {
          query = query.eq('customer.user_id', user.id);
        }

        // Add database-level month filtering for completed applications
        if (selectedMonths.length > 0) {
          if (statusFilter === 'completed' || statusFilter === 'all') {
            // Filter completed applications by completed_at
            query = query.not('completed_at', 'is', null);
            
            if (selectedMonths.length === 1) {
              const [year, monthNum] = selectedMonths[0].split('-').map(Number);
              const startDate = new Date(year, monthNum, 1).toISOString();
              const endDate = new Date(year, monthNum + 1, 0, 23, 59, 59, 999).toISOString();
              query = query.gte('completed_at', startDate).lte('completed_at', endDate);
            } else {
              // Multiple months: build OR conditions
              const orConditions = selectedMonths.map(monthKey => {
                const [year, monthNum] = monthKey.split('-').map(Number);
                const startDate = new Date(year, monthNum, 1).toISOString();
                const endDate = new Date(year, monthNum + 1, 0, 23, 59, 59, 999).toISOString();
                return `completed_at.gte.${startDate},completed_at.lte.${endDate}`;
              }).join(',');
              
              query = query.or(orConditions);
            }
          } else if (statusFilter === 'completed_actual') {
            // Filter completed applications by completed_actual
            query = query.not('completed_actual', 'is', null);
            
            if (selectedMonths.length === 1) {
              const [year, monthNum] = selectedMonths[0].split('-').map(Number);
              const startDate = new Date(year, monthNum, 1).toISOString();
              const endDate = new Date(year, monthNum + 1, 0, 23, 59, 59, 999).toISOString();
              query = query.gte('completed_actual', startDate).lte('completed_actual', endDate);
            } else {
              // Multiple months: build OR conditions
              const orConditions = selectedMonths.map(monthKey => {
                const [year, monthNum] = monthKey.split('-').map(Number);
                const startDate = new Date(year, monthNum, 1).toISOString();
                const endDate = new Date(year, monthNum + 1, 0, 23, 59, 59, 999).toISOString();
                return `completed_actual.gte.${startDate},completed_actual.lte.${endDate}`;
              }).join(',');
              
              query = query.or(orConditions);
            }
          }
        }
        
        const { data: baseApps, error: baseError } = await query;
        
        if (baseError) throw baseError;
        
        let finalApplications: ApplicationWithCustomer[] = [];

        // Handle paid applications with month filtering at DB level
        if (statusFilter === 'paid' || statusFilter === 'all') {
          const paidApps = (baseApps || []).filter((app: any) => app.status === 'paid');
          
          if (selectedMonths.length > 0 && statusFilter === 'paid') {
            // When month filtering is active for paid apps, join with status changes
            const { data: paidWithDates, error: paidError } = await supabase
              .from('account_applications')
              .select(`
                *,
                customer:customers!inner(id, name, email, mobile, company, license_type, user_id),
                application_status_changes!inner(created_at)
              `)
              .eq('status', 'paid')
              .eq('application_status_changes.new_status', 'paid')
              .then(async (result) => {
                if (result.error) throw result.error;
                
                // Filter by month ranges in JS since complex OR conditions on joined tables are tricky
                const filtered = (result.data || []).filter((app: any) => {
                  const statusChanges = app.application_status_changes;
                  if (!Array.isArray(statusChanges) || statusChanges.length === 0) return false;
                  
                  const paidDate = statusChanges[0]?.created_at;
                  if (!paidDate) return false;
                  
                  const appDate = new Date(paidDate);
                  const monthKey = `${appDate.getFullYear()}-${appDate.getMonth()}`;
                  return selectedMonths.includes(monthKey);
                });
                
                // Add paid_date to each app
                return {
                  data: filtered.map((app: any) => ({
                    ...app,
                    paid_date: app.application_status_changes?.[0]?.created_at || null
                  })),
                  error: null
                };
              });
            
            if (paidError) throw paidError;
            finalApplications = [...finalApplications, ...(paidWithDates || [])];
          } else {
            // No month filtering or statusFilter is 'all', fetch paid_date separately
            const paidWithDates = await Promise.all(
              paidApps.map(async (app: any) => {
                const { data: statusChange } = await supabase
                  .from('application_status_changes')
                  .select('created_at')
                  .eq('application_id', app.id)
                  .eq('new_status', 'paid')
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .maybeSingle();
                
                return {
                  ...app,
                  paid_date: statusChange?.created_at || null
                };
              })
            );
            finalApplications = [...finalApplications, ...paidWithDates];
          }
        }

        // Handle completed applications (already filtered at DB level if months selected)
        if (statusFilter === 'completed' || statusFilter === 'completed_actual' || statusFilter === 'all') {
          const completedApps = (baseApps || []).filter((app: any) => app.status === 'completed');
          const completedWithoutPaidDate = completedApps.map((app: any) => ({
            ...app,
            paid_date: null
          }));
          finalApplications = [...finalApplications, ...completedWithoutPaidDate];
        }
        
        setApplications(finalApplications);
        
        // Fetch max reference number for formatting
        const { data: maxRefData } = await supabase
          .from('account_applications')
          .select('reference_number')
          .order('reference_number', { ascending: false })
          .limit(1)
          .single();
        
        if (maxRefData?.reference_number) {
          setMaxReferenceNumber(maxRefData.reference_number);
        }
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchApplications();
  }, [user, isAdmin, statusFilter, selectedMonths]);
  
  // Generate available months from the data (always show all months regardless of status filter)
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    
    applications.forEach(app => {
      let dateToUse: string | undefined;
      
      // Use the appropriate date based on application status and filter
      if (app.status === 'completed') {
        if (statusFilter === 'completed_actual') {
          dateToUse = app.completed_actual || app.completed_at || app.updated_at || app.created_at;
        } else {
          dateToUse = app.completed_at || app.completed_actual || app.updated_at || app.created_at;
        }
      } else if (app.status === 'paid') {
        dateToUse = app.paid_date || app.updated_at || app.created_at;
      }
      
      if (dateToUse) {
        const date = new Date(dateToUse);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        months.add(monthKey);
      }
    });
    
    return Array.from(months).sort().reverse().map(monthKey => {
      const [year, month] = monthKey.split('-').map(Number);
      const date = new Date(year, month);
      return {
        key: monthKey,
        label: format(date, "MMMM yyyy")
      };
    });
  }, [applications]);

  const { filteredApplications, completeCount, paidCount, totalRevenue } = useMemo(() => {
    // Apply status filter
    let statusFiltered = applications;
    if (statusFilter === 'completed' || statusFilter === 'completed_actual') {
      statusFiltered = applications.filter(a => a.status === 'completed');
    } else if (statusFilter === 'paid') {
      statusFiltered = applications.filter(a => a.status === 'paid');
    }
    // 'all' shows both completed and paid (no additional filtering needed)
    
    // Month filtering is now done at database level, no need for JS filtering
    
    // Apply search filter
    const searchFiltered = statusFiltered.filter(app => 
      app.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.customer?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.reference_number?.toString().includes(searchTerm)
    );

    const complete = applications.filter(a => a.status === 'completed').length;
    const paid = applications.filter(a => a.status === 'paid').length;
    
    // Calculate revenue from filtered results
    const revenue = searchFiltered.reduce((sum, app) => sum + (app.application_data?.amount || 0), 0);

    return {
      filteredApplications: searchFiltered,
      completeCount: complete,
      paidCount: paid,
      totalRevenue: revenue
    };
  }, [applications, searchTerm, statusFilter]);

  const toggleMonth = (monthKey: string) => {
    setSelectedMonths(prev => 
      prev.includes(monthKey) 
        ? prev.filter(m => m !== monthKey)
        : [...prev, monthKey]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Completed Applications</h1>
        <p className="text-muted-foreground">
          View completed applications {!isAdmin && 'you submitted'} (Revenue: {new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(totalRevenue)})
        </p>
      </div>
      
      <LazyWrapper className="min-h-[100px]">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <Input
            placeholder="Search by name, company, email, or ref#..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:max-w-xs"
          />
          
          <Select value={statusFilter} onValueChange={(value: 'all' | 'completed' | 'completed_actual' | 'paid') => setStatusFilter(value)}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All (Completed & Paid)</SelectItem>
              <SelectItem value="completed">Completed (Business)</SelectItem>
              <SelectItem value="completed_actual">Completed (Actual)</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  selectedMonths.length === 0 && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedMonths.length > 0 
                  ? `${selectedMonths.length} month${selectedMonths.length > 1 ? 's' : ''} selected`
                  : "Filter by months"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4 bg-background z-[60] pointer-events-auto border shadow-md" align="start">
              <div className="space-y-3">
                <div className="text-sm font-medium">Select months:</div>
                {availableMonths.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2">
                    No months available. Applications data may still be loading.
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {availableMonths.map((month) => (
                      <div key={month.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={month.key}
                          checked={selectedMonths.includes(month.key)}
                          onCheckedChange={() => toggleMonth(month.key)}
                        />
                        <label
                          htmlFor={month.key}
                          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {month.label}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                {selectedMonths.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMonths([])}
                    className="w-full"
                  >
                    Clear all
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          {selectedMonths.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedMonths([])}
              className="h-8 px-2 lg:px-3"
            >
              Clear months
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
          
          <div className="flex gap-2">
            <div className="text-sm text-muted-foreground px-3 py-2 bg-muted rounded-md">
              Complete: {completeCount} | Paid: {paidCount}
            </div>
          </div>
        </div>
      </LazyWrapper>
      
      <LazyWrapper>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref#</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Application Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading applications...
                  </TableCell>
                </TableRow>
              ) : filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No applications found
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((app) => (
                  <TableRow 
                    key={app.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/applications/${app.id}`)}
                  >
                    <TableCell className="font-mono font-bold text-sm text-primary">
                      {formatApplicationReferenceWithPrefix(app.reference_number, maxReferenceNumber, app.created_at)}
                    </TableCell>
                    <TableCell>{app.customer?.name}</TableCell>
                    <TableCell>{app.customer?.company}</TableCell>
                    <TableCell className="capitalize">{app.application_type?.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <Badge variant={app.status === 'completed' ? 'default' : 'secondary'}>
                        {app.status === 'completed' ? 'Completed' : 'Paid'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {app.status === 'completed' && statusFilter === 'completed_actual' && app.completed_actual
                        ? format(new Date(app.completed_actual), 'dd MMM yyyy')
                        : app.status === 'completed' && app.completed_at
                        ? format(new Date(app.completed_at), 'dd MMM yyyy')
                        : app.status === 'paid' && app.paid_date
                        ? format(new Date(app.paid_date), 'dd MMM yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('en-AE', { 
                        style: 'currency', 
                        currency: 'AED' 
                      }).format(app.application_data?.amount || 0)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </LazyWrapper>
    </div>
  );
};

export default memo(CompletedApplications);
