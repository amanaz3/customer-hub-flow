import React, { memo, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SecureAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Building2, BarChart3, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import ProductUsageAnalytics from '@/components/Analytics/ProductUsageAnalytics';
import { useTableSelection } from '@/hooks/useTableSelection';
import { useBulkStatusUpdate } from '@/hooks/useBulkStatusUpdate';
import { BulkActionsToolbar } from '@/components/Customer/BulkActionsToolbar';
import { BulkStatusChangeDialog } from '@/components/Customer/BulkStatusChangeDialog';
import type { ApplicationStatus } from '@/types/application';
import { formatApplicationReferenceWithPrefix } from '@/utils/referenceNumberFormatter';

interface ApplicationWithCustomer {
  id: string;
  reference_number: number;
  customer_id: string;
  status: ApplicationStatus;
  application_type: string;
  created_at: string;
  updated_at: string;
  application_data: {
    product_id?: string;
    amount?: number;
    [key: string]: any;
  };
  customer: {
    id: string;
    name: string;
    company: string;
    email: string;
    mobile: string;
  };
  product?: {
    id: string;
    name: string;
  };
}

const ApplicationsList = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [applications, setApplications] = useState<ApplicationWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('applications');
  
  // Calculate max reference number for auto-scaling formatter
  const maxReferenceNumber = useMemo(() => 
    Math.max(...applications.map(a => a.reference_number), 0),
    [applications]
  );
  
  // Separate bulk selections for each tab
  const activeSelection = useTableSelection(applications.filter(app => app.status !== 'rejected'));
  const rejectedSelection = useTableSelection(applications.filter(app => app.status === 'rejected'));
  
  // Use the selection based on active tab
  const currentSelection = activeTab === 'rejected' ? rejectedSelection : activeSelection;
  
  const { updateApplicationsStatus, isLoading: isUpdating } = useBulkStatusUpdate();
  const [bulkStatusDialog, setBulkStatusDialog] = useState<{
    isOpen: boolean;
    status: ApplicationStatus | null;
  }>({ isOpen: false, status: null });

  useEffect(() => {
    fetchApplications();
  }, [user?.id, isAdmin]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('account_applications')
        .select(`
          *,
          reference_number,
          customer:customers!customer_id (
            id,
            name,
            company,
            email,
            mobile
          )
        `)
        .order('created_at', { ascending: false });

      // For non-admin users, filter by their customers
      if (!isAdmin && user?.id) {
        query = query.eq('customers.user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch products separately for applications that have product_id in application_data
      if (data && data.length > 0) {
        const productIds = data
          .map(app => {
            const appData = app.application_data as any;
            // Check both root level and step2 for product_id
            return appData?.product_id || appData?.step2?.product_id;
          })
          .filter((id): id is string => !!id);

        if (productIds.length > 0) {
          const { data: products } = await supabase
            .from('products')
            .select('id, name')
            .in('id', productIds);

          // Map products to applications
          const applicationsWithProducts = data.map(app => {
            const appData = app.application_data as any;
            // Check both root level and step2 for product_id
            const productId = appData?.product_id || appData?.step2?.product_id;
            const product = products?.find(p => p.id === productId);
            return {
              ...app,
              product: product || null
            } as ApplicationWithCustomer;
          });

          setApplications(applicationsWithProducts);
        } else {
          setApplications(data as ApplicationWithCustomer[]);
        }
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load applications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Separate active and rejected applications
  const activeApplications = useMemo(() => {
    return applications.filter(app => app.status !== 'rejected');
  }, [applications]);

  const rejectedApplications = useMemo(() => {
    return applications.filter(app => app.status === 'rejected');
  }, [applications]);

  // Filter active applications with search and status
  const filteredActiveApplications = useMemo(() => {
    return activeApplications.filter(app => {
      let matchesSearch = searchTerm === '';
      
      if (!matchesSearch) {
        const searchLower = searchTerm.toLowerCase();
        const refNum = searchTerm.replace(/^#/, '').trim();
        const parsedRefNum = parseInt(refNum, 10);
        
        matchesSearch = 
          app.customer?.company?.toLowerCase().includes(searchLower) ||
          app.customer?.name?.toLowerCase().includes(searchLower) ||
          app.application_type?.toLowerCase().includes(searchLower) ||
          (!isNaN(parsedRefNum) && app.reference_number === parsedRefNum);
      }
      
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [activeApplications, searchTerm, statusFilter]);

  // Filter rejected applications with search only
  const filteredRejectedApplications = useMemo(() => {
    return rejectedApplications.filter(app => {
      if (searchTerm === '') return true;
      
      const searchLower = searchTerm.toLowerCase();
      const refNum = searchTerm.replace(/^#/, '').trim();
      const parsedRefNum = parseInt(refNum, 10);
      
      return app.customer?.company?.toLowerCase().includes(searchLower) ||
        app.customer?.name?.toLowerCase().includes(searchLower) ||
        app.application_type?.toLowerCase().includes(searchLower) ||
        (!isNaN(parsedRefNum) && app.reference_number === parsedRefNum);
    });
  }, [rejectedApplications, searchTerm]);

  const statusColors: Record<string, string> = {
    draft: 'bg-yellow-400',
    submitted: 'bg-blue-500',
    'under review': 'bg-orange-500',
    'under_review': 'bg-orange-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
    completed: 'bg-purple-500',
    paid: 'bg-green-600',
    returned: 'bg-orange-500',
    'need more info': 'bg-amber-500',
    'need_more_info': 'bg-amber-500',
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || '';
    return statusColors[normalizedStatus] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string): string => {
    const statusLabels: Record<string, string> = {
      draft: 'Draft',
      submitted: 'Submitted',
      returned: 'Returned',
      'need more info': 'Need More Info',
      paid: 'Paid',
      completed: 'Completed',
      rejected: 'Rejected',
      under_review: 'Under Review',
      approved: 'Approved',
    };
    
    const normalizedStatus = status?.toLowerCase() || '';
    return statusLabels[normalizedStatus] || status?.replace(/_/g, ' ') || 'Unknown';
  };

  const handleBulkStatusChange = async (
    applicationIds: string[],
    newStatus: ApplicationStatus,
    comment: string
  ) => {
    try {
      await updateApplicationsStatus(applicationIds, newStatus, comment);
      await fetchApplications();
      // Clear selection for the current tab
      currentSelection.clearSelection();
      setBulkStatusDialog({ isOpen: false, status: null });
    } catch (error) {
      console.error('Bulk status update failed:', error);
    }
  };

  const openBulkStatusDialog = (status: ApplicationStatus) => {
    setBulkStatusDialog({ isOpen: true, status });
  };

  if (loading) {
    return <div className="p-8 text-center">Loading applications...</div>;
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {isAdmin ? 'All Applications' : 'My Applications'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAdmin 
              ? 'Manage all customer applications and view analytics' 
              : 'View and manage your applications'
            }
          </p>
        </div>
        <Button
          onClick={() => navigate('/applications/new')}
          variant="default"
          size="sm"
          className="bg-green-700 hover:bg-green-800 !text-white shadow-md hover:shadow-lg transition-all h-9 px-4 font-medium whitespace-nowrap border-0 [&>*]:!text-white"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          New Application
        </Button>
      </div>

      {/* Tab-based Layout */}
      <Tabs defaultValue="applications" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger 
            value="applications" 
            className="flex items-center gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-b-2 data-[state=active]:border-b-green-500 dark:data-[state=active]:bg-green-950 dark:data-[state=active]:text-green-400"
          >
            <FileText className="h-4 w-4" />
            Applications
            <Badge variant="secondary" className="ml-1">
              {filteredActiveApplications.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="rejected" 
            className="flex items-center gap-2 data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:border-b-2 data-[state=active]:border-b-red-500 dark:data-[state=active]:bg-red-950 dark:data-[state=active]:text-red-400"
          >
            <XCircle className="h-4 w-4" />
            Rejected
            <Badge variant="secondary" className="ml-1">
              {filteredRejectedApplications.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="flex items-center gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-b-2 data-[state=active]:border-b-green-500 dark:data-[state=active]:bg-green-950 dark:data-[state=active]:text-green-400"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-3 mt-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 bg-card rounded-lg p-3 border">
            <Input
              placeholder="Search by ref #, company, contact, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Compact Applications Table with Scroll */}
          <div className="border rounded-lg bg-card overflow-hidden">
            {/* Table Header - Sticky */}
            <div className="bg-muted/50 border-b px-3 py-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="h-4 w-4" />
                Applications ({filteredActiveApplications.length})
              </div>
            </div>
            
            {/* Scrollable Table Container */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-muted backdrop-blur-sm z-10">
                  <TableRow className="hover:bg-transparent border-b-2">
                    <TableHead className="h-10 px-3 py-2 w-12">
                      <Checkbox
                        checked={activeSelection.isAllSelected}
                        onCheckedChange={activeSelection.toggleAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Ref #</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Product/Service</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Type</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Company</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Contact</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Email</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Mobile</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Status</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide text-right">Amount</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Created</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Updated</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActiveApplications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={13} className="text-center py-12 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">No applications found</p>
                        <p className="text-xs mt-1">Try adjusting your filters</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredActiveApplications.map((app) => (
                      <TableRow 
                        key={app.id}
                        className="hover:bg-muted/50 cursor-pointer transition-colors border-b"
                        onClick={(e) => {
                          if (!(e.target as HTMLElement).closest('.checkbox-cell')) {
                            navigate(`/applications/${app.id}`);
                          }
                        }}
                      >
                        <TableCell 
                          className="px-3 py-3 checkbox-cell"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={activeSelection.isSelected(app.id)}
                            onCheckedChange={() => activeSelection.toggleItem(app.id)}
                            aria-label={`Select ${app.customer?.company}`}
                          />
                        </TableCell>
                        <TableCell className="px-3 py-3 font-mono font-bold text-sm text-primary">
                          {formatApplicationReferenceWithPrefix(app.reference_number, maxReferenceNumber, app.created_at)}
                        </TableCell>
                        <TableCell className="px-3 py-3 font-semibold text-sm">
                          <div className="flex items-center gap-2 min-w-[150px]">
                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                            <span className="truncate text-foreground">{app.product?.name || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-xs font-semibold">
                          <span className="px-2.5 py-1.5 rounded-md bg-muted/80 font-bold text-foreground uppercase">
                            {app.application_type?.replace('_', ' ').toUpperCase() || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-sm font-medium">
                          <Button
                            variant="link"
                            className="p-0 h-auto text-sm font-semibold hover:underline text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/customers/${app.customer?.id}`);
                            }}
                          >
                            <Building2 className="h-4 w-4 mr-1.5" />
                            <span className="max-w-[200px] truncate">{app.customer?.company || 'N/A'}</span>
                          </Button>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-sm font-medium text-foreground">
                          <span className="max-w-[150px] truncate block">{app.customer?.name || 'N/A'}</span>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-xs font-medium text-foreground/80">
                          <span className="max-w-[180px] truncate block">{app.customer?.email || 'N/A'}</span>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-xs font-medium text-foreground/80">
                          {app.customer?.mobile || 'N/A'}
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <Badge 
                            variant={app.status?.toLowerCase() === 'draft' ? 'default' : 'secondary'} 
                            className={`${getStatusColor(app.status)} ${
                              app.status?.toLowerCase() === 'draft' 
                                ? 'bg-yellow-400 text-black dark:text-black ring-1 ring-yellow-600' 
                                : 'text-white border-0'
                            } text-xs px-3 py-1 font-bold tracking-wide shadow-sm`}
                          >
                            {getStatusLabel(app.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-sm font-bold text-right">
                          <span className="text-primary">${app.application_data?.amount?.toLocaleString() || '0'}</span>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-xs font-medium text-foreground/70 whitespace-nowrap">
                          {new Date(app.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </TableCell>
                        <TableCell className="px-3 py-3 text-xs font-medium text-foreground/70 whitespace-nowrap">
                          {new Date(app.updated_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </TableCell>
                        <TableCell className="px-3 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs font-semibold border-2 hover:bg-primary hover:text-primary-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/applications/${app.id}`);
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Rejected Tab */}
        <TabsContent value="rejected" className="space-y-3 mt-4">
          {/* Search Only */}
          <div className="flex flex-col sm:flex-row gap-3 bg-card rounded-lg p-3 border">
            <Input
              placeholder="Search rejected applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Rejected Applications Table */}
          <div className="border rounded-lg bg-card overflow-hidden">
            <div className="bg-red-50 dark:bg-red-950/20 border-b px-3 py-2">
              <div className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400">
                <XCircle className="h-4 w-4" />
                Rejected Applications ({filteredRejectedApplications.length})
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-muted backdrop-blur-sm z-10">
                  <TableRow className="hover:bg-transparent border-b-2">
                    <TableHead className="h-10 px-3 py-2 w-12">
                      <Checkbox
                        checked={rejectedSelection.isAllSelected}
                        onCheckedChange={rejectedSelection.toggleAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Ref #</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Product/Service</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Type</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Company</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Contact</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Email</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Mobile</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Status</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide text-right">Amount</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Created</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Updated</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRejectedApplications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={13} className="text-center py-12 text-muted-foreground">
                        <XCircle className="h-12 w-12 mx-auto mb-3 opacity-20 text-red-500" />
                        <p className="font-medium">No rejected applications</p>
                        <p className="text-xs mt-1">Rejected applications will appear here</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRejectedApplications.map((app) => (
                      <TableRow 
                        key={app.id}
                        className="hover:bg-muted/50 cursor-pointer transition-colors border-b"
                        onClick={(e) => {
                          if (!(e.target as HTMLElement).closest('.checkbox-cell')) {
                            navigate(`/applications/${app.id}`);
                          }
                        }}
                      >
                        <TableCell 
                          className="px-3 py-3 checkbox-cell"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={rejectedSelection.isSelected(app.id)}
                            onCheckedChange={() => rejectedSelection.toggleItem(app.id)}
                            aria-label={`Select ${app.customer?.company}`}
                          />
                        </TableCell>
                        <TableCell className="px-3 py-3 font-mono font-bold text-sm text-primary">
                          {formatApplicationReferenceWithPrefix(app.reference_number, maxReferenceNumber, app.created_at)}
                        </TableCell>
                        <TableCell className="px-3 py-3 font-semibold text-sm">
                          <div className="flex items-center gap-2 min-w-[150px]">
                            <div className="h-2 w-2 rounded-full bg-red-500 flex-shrink-0" />
                            <span className="truncate text-foreground">{app.product?.name || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-xs font-semibold">
                          <span className="px-2.5 py-1.5 rounded-md bg-muted/80 font-bold text-foreground uppercase">
                            {app.application_type?.replace('_', ' ').toUpperCase() || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-sm font-medium">
                          <Button
                            variant="link"
                            className="p-0 h-auto text-sm font-semibold hover:underline text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/customers/${app.customer?.id}`);
                            }}
                          >
                            <Building2 className="h-4 w-4 mr-1.5" />
                            <span className="max-w-[200px] truncate">{app.customer?.company || 'N/A'}</span>
                          </Button>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-sm font-medium text-foreground">
                          <span className="max-w-[150px] truncate block">{app.customer?.name || 'N/A'}</span>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-xs font-medium text-foreground/80">
                          <span className="max-w-[180px] truncate block">{app.customer?.email || 'N/A'}</span>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-xs font-medium text-foreground/80">
                          {app.customer?.mobile || 'N/A'}
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <Badge 
                            className="bg-red-500 text-white border-0 text-xs px-3 py-1 font-bold uppercase tracking-wide shadow-sm"
                          >
                            REJECTED
                          </Badge>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-sm font-bold text-right">
                          <span className="text-primary">${app.application_data?.amount?.toLocaleString() || '0'}</span>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-xs font-medium text-foreground/70 whitespace-nowrap">
                          {new Date(app.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </TableCell>
                        <TableCell className="px-3 py-3 text-xs font-medium text-foreground/70 whitespace-nowrap">
                          {new Date(app.updated_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </TableCell>
                        <TableCell className="px-3 py-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs font-semibold border-2 hover:bg-primary hover:text-primary-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/applications/${app.id}`);
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <ProductUsageAnalytics />
        </TabsContent>
      </Tabs>

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={currentSelection.selectedCount}
        isVisible={currentSelection.selectedCount > 0}
        onClearSelection={currentSelection.clearSelection}
        onStatusChange={openBulkStatusDialog}
        isLoading={isUpdating}
        mode="applications"
        selectedStatuses={currentSelection.getSelectedItems().map(app => app.status)}
        isAdmin={isAdmin}
      />

      {/* Bulk Status Change Dialog */}
      {bulkStatusDialog.status && (
        <BulkStatusChangeDialog
          isOpen={bulkStatusDialog.isOpen}
          onClose={() => setBulkStatusDialog({ isOpen: false, status: null })}
          selectedApplications={currentSelection.getSelectedItems()}
          newStatus={bulkStatusDialog.status}
          onConfirm={handleBulkStatusChange}
        />
      )}
    </div>
  );
};

export default memo(ApplicationsList);
