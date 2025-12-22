import React, { memo, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SecureAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Building2, XCircle, Clock, Edit, CalendarIcon, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

type DatePeriodFilter = 'all' | 'last30days' | 'last60days' | 'last90days' | 'custom';

import { useTableSelection } from '@/hooks/useTableSelection';
import { useBulkStatusUpdate } from '@/hooks/useBulkStatusUpdate';
import { BulkActionsToolbar } from '@/components/Customer/BulkActionsToolbar';
import { BulkStatusChangeDialog } from '@/components/Customer/BulkStatusChangeDialog';
import type { ApplicationStatus } from '@/types/application';
import { formatApplicationReferenceWithPrefix } from '@/utils/referenceNumberFormatter';
import * as XLSX from 'xlsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface ApplicationWithCustomer {
  id: string;
  reference_number: number;
  customer_id: string;
  status: ApplicationStatus;
  application_type: string;
  created_at: string;
  updated_at: string;
  submission_source?: string | null;
  estimated_completion_time?: string | null;
  completed_at?: string | null;
  completed_actual?: string | null;
  application_assessment?: Record<string, any> | null;
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
    user_id: string | null;
  };
  product?: {
    id: string;
    name: string;
  };
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

const ApplicationsList = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [applications, setApplications] = useState<ApplicationWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [submittedByFilter, setSubmittedByFilter] = useState<string>('all');
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState('applications');
  const [datePeriodFilter, setDatePeriodFilter] = useState<DatePeriodFilter>('all');
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>(undefined);
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>(undefined);
  
  // Calculate max reference number for auto-scaling formatter
  const maxReferenceNumber = useMemo(() => 
    Math.max(...applications.map(a => a.reference_number), 0),
    [applications]
  );
  
  // Separate bulk selections for each tab
  const activeSelection = useTableSelection(applications.filter(app => !['rejected', 'predraft', 'draft'].includes(app.status)));
  const rejectedSelection = useTableSelection(applications.filter(app => app.status === 'rejected'));
  const incompleteSelection = useTableSelection(applications.filter(app => app.status === 'predraft'));
  const draftSelection = useTableSelection(applications.filter(app => app.status === 'draft'));
  
  // Use the selection based on active tab
  const currentSelection = activeTab === 'rejected' ? rejectedSelection : activeTab === 'incomplete' ? incompleteSelection : activeTab === 'drafts' ? draftSelection : activeSelection;
  
  const { updateApplicationsStatus, isLoading: isUpdating } = useBulkStatusUpdate();
  const [bulkStatusDialog, setBulkStatusDialog] = useState<{
    isOpen: boolean;
    status: ApplicationStatus | null;
  }>({ isOpen: false, status: null });

  useEffect(() => {
    fetchApplications();
    if (isAdmin) {
      fetchUserProfiles();
    }
  }, [user?.id, isAdmin]);

  const fetchUserProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setUserProfiles(data || []);
    } catch (error) {
      console.error('Error fetching user profiles:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      
      let data: any[] = [];
      
      if (isAdmin) {
        // Admin sees all applications
        const { data: allData, error } = await supabase
          .from('account_applications')
          .select(`
            *,
            reference_number,
            customer:customers!customer_id (
              id,
              name,
              company,
              email,
              mobile,
              user_id
            )
          `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        data = allData || [];
      } else if (user?.id) {
        // Non-admin: first get customer IDs for this user, then get their applications
        const { data: customerIds, error: customerError } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id);
        
        if (customerError) throw customerError;
        
        if (customerIds && customerIds.length > 0) {
          const { data: appData, error: appError } = await supabase
            .from('account_applications')
            .select(`
              *,
              reference_number,
              customer:customers!customer_id (
                id,
                name,
                company,
                email,
                mobile,
                user_id
              )
            `)
            .in('customer_id', customerIds.map(c => c.id))
            .order('created_at', { ascending: false });
          
          if (appError) throw appError;
          data = appData || [];
        }
      }

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

  // Separate active, rejected, incomplete (predraft), and draft applications
  const activeApplications = useMemo(() => {
    return applications.filter(app => !['rejected', 'predraft', 'draft'].includes(app.status));
  }, [applications]);

  const rejectedApplications = useMemo(() => {
    return applications.filter(app => app.status === 'rejected');
  }, [applications]);

  const incompleteApplications = useMemo(() => {
    return applications.filter(app => app.status === 'predraft');
  }, [applications]);

  const draftApplications = useMemo(() => {
    return applications.filter(app => app.status === 'draft');
  }, [applications]);

  // Helper function to check if date matches the period filter
  const matchesDateFilter = (createdAt: string): boolean => {
    if (datePeriodFilter === 'all') return true;
    
    const appDate = new Date(createdAt);
    const now = new Date();
    
    switch (datePeriodFilter) {
      case 'last30days':
        return appDate >= subDays(now, 30);
      case 'last60days':
        return appDate >= subDays(now, 60);
      case 'last90days':
        return appDate >= subDays(now, 90);
      case 'custom':
        if (!customDateFrom && !customDateTo) return true;
        const fromDate = customDateFrom ? startOfDay(customDateFrom) : new Date(0);
        const toDate = customDateTo ? endOfDay(customDateTo) : new Date();
        return appDate >= fromDate && appDate <= toDate;
      default:
        return true;
    }
  };

  // Filter active applications with search, status, submitted by, and date period
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
      const matchesSubmittedBy = submittedByFilter === 'all' || app.customer?.user_id === submittedByFilter;
      const matchesDate = matchesDateFilter(app.created_at);
      return matchesSearch && matchesStatus && matchesSubmittedBy && matchesDate;
    });
  }, [activeApplications, searchTerm, statusFilter, submittedByFilter, datePeriodFilter, customDateFrom, customDateTo]);

  // Filter rejected applications with search and date period
  const filteredRejectedApplications = useMemo(() => {
    return rejectedApplications.filter(app => {
      let matchesSearch = searchTerm === '';
      
      if (!matchesSearch) {
        const searchLower = searchTerm.toLowerCase();
        const refNum = searchTerm.replace(/^#/, '').trim();
        const parsedRefNum = parseInt(refNum, 10);
        
        matchesSearch = app.customer?.company?.toLowerCase().includes(searchLower) ||
          app.customer?.name?.toLowerCase().includes(searchLower) ||
          app.application_type?.toLowerCase().includes(searchLower) ||
          (!isNaN(parsedRefNum) && app.reference_number === parsedRefNum);
      }
      
      const matchesDate = matchesDateFilter(app.created_at);
      return matchesSearch && matchesDate;
    });
  }, [rejectedApplications, searchTerm, datePeriodFilter, customDateFrom, customDateTo]);

  // Filter incomplete (predraft) applications with search and date period
  const filteredIncompleteApplications = useMemo(() => {
    return incompleteApplications.filter(app => {
      let matchesSearch = searchTerm === '';
      
      if (!matchesSearch) {
        const searchLower = searchTerm.toLowerCase();
        const refNum = searchTerm.replace(/^#/, '').trim();
        const parsedRefNum = parseInt(refNum, 10);
        
        matchesSearch = app.customer?.company?.toLowerCase().includes(searchLower) ||
          app.customer?.name?.toLowerCase().includes(searchLower) ||
          app.application_type?.toLowerCase().includes(searchLower) ||
          (!isNaN(parsedRefNum) && app.reference_number === parsedRefNum);
      }
      
      const matchesDate = matchesDateFilter(app.created_at);
      return matchesSearch && matchesDate;
    });
  }, [incompleteApplications, searchTerm, datePeriodFilter, customDateFrom, customDateTo]);

  // Filter draft applications with search and date period
  const filteredDraftApplications = useMemo(() => {
    return draftApplications.filter(app => {
      let matchesSearch = searchTerm === '';
      
      if (!matchesSearch) {
        const searchLower = searchTerm.toLowerCase();
        const refNum = searchTerm.replace(/^#/, '').trim();
        const parsedRefNum = parseInt(refNum, 10);
        
        matchesSearch = app.customer?.company?.toLowerCase().includes(searchLower) ||
          app.customer?.name?.toLowerCase().includes(searchLower) ||
          app.application_type?.toLowerCase().includes(searchLower) ||
          (!isNaN(parsedRefNum) && app.reference_number === parsedRefNum);
      }
      
      const matchesDate = matchesDateFilter(app.created_at);
      return matchesSearch && matchesDate;
    });
  }, [draftApplications, searchTerm, datePeriodFilter, customDateFrom, customDateTo]);

  // Get date period label for display
  const getDatePeriodLabel = (): string => {
    switch (datePeriodFilter) {
      case 'last30days': return 'Last 30 Days';
      case 'last60days': return 'Last 60 Days';
      case 'last90days': return 'Last 90 Days';
      case 'custom': 
        if (customDateFrom && customDateTo) {
          return `${format(customDateFrom, 'MMM d')} - ${format(customDateTo, 'MMM d, yyyy')}`;
        } else if (customDateFrom) {
          return `From ${format(customDateFrom, 'MMM d, yyyy')}`;
        } else if (customDateTo) {
          return `Until ${format(customDateTo, 'MMM d, yyyy')}`;
        }
        return 'Custom Period';
      default: return 'All Time';
    }
  };

  const statusColors: Record<string, string> = {
    predraft: 'bg-gray-500',
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
      predraft: 'Pre-draft',
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

  // Get current tab's filtered applications for export
  const getCurrentTabFilteredApplications = (): ApplicationWithCustomer[] => {
    switch (activeTab) {
      case 'rejected': return filteredRejectedApplications;
      case 'incomplete': return filteredIncompleteApplications;
      case 'drafts': return filteredDraftApplications;
      default: return filteredActiveApplications;
    }
  };

  // Get current tab's ALL applications (unfiltered) for export
  const getCurrentTabAllApplications = (): ApplicationWithCustomer[] => {
    switch (activeTab) {
      case 'rejected': return rejectedApplications;
      case 'incomplete': return incompleteApplications;
      case 'drafts': return draftApplications;
      default: return activeApplications;
    }
  };

  // Prepare export data - includeFullData adds the complete application_data JSON
  const prepareExportData = (apps: ApplicationWithCustomer[], includeFullData: boolean = false) => {
    return apps.map(app => {
      const baseData = {
        'Reference #': formatApplicationReferenceWithPrefix(app.reference_number, maxReferenceNumber, app.created_at, app.product?.name),
        'Company': app.customer?.company || '',
        'Contact Name': app.customer?.name || '',
        'Email': app.customer?.email || '',
        'Mobile': app.customer?.mobile || '',
        'Application Type': app.application_type || '',
        'Product': app.product?.name || '',
        'Status': getStatusLabel(app.status),
        'Amount': app.application_data?.amount || '',
        'Created At': format(new Date(app.created_at), 'yyyy-MM-dd HH:mm'),
        'Updated At': format(new Date(app.updated_at), 'yyyy-MM-dd HH:mm'),
      };
      
      if (includeFullData) {
        return {
          ...baseData,
          'Application ID': app.id,
          'Customer ID': app.customer_id,
          'Submission Source': app.submission_source || '',
          'Estimated Completion': app.estimated_completion_time || '',
          'Completed At': app.completed_at ? format(new Date(app.completed_at), 'yyyy-MM-dd HH:mm') : '',
          'Completed Actual': app.completed_actual ? format(new Date(app.completed_actual), 'yyyy-MM-dd HH:mm') : '',
          'Application Data': app.application_data || {},
          'Application Assessment': app.application_assessment || {},
        };
      }
      
      return baseData;
    });
  };

  // Export functions
  const exportToJSON = (exportAll: boolean = false) => {
    const apps = exportAll ? getCurrentTabAllApplications() : getCurrentTabFilteredApplications();
    const data = prepareExportData(apps, exportAll);
    if (data.length === 0) {
      toast({ title: 'No data', description: 'No applications to export', variant: 'destructive' });
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications-${activeTab}-${exportAll ? 'all' : 'filtered'}-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: `${data.length} applications exported to JSON` });
  };

  const exportToCSV = (exportAll: boolean = false) => {
    const apps = exportAll ? getCurrentTabAllApplications() : getCurrentTabFilteredApplications();
    const data = prepareExportData(apps, exportAll);
    if (data.length === 0) {
      toast({ title: 'No data', description: 'No applications to export', variant: 'destructive' });
      return;
    }
    const headers = Object.keys(data[0]).filter(h => h !== 'Application Data');
    const csvRows = [
      [...headers, 'Application Data (JSON)'].join(','),
      ...data.map(row => {
        const baseValues = headers.map(h => `"${String(row[h as keyof typeof row] || '').replace(/"/g, '""')}"`);
        const appDataValue = exportAll && row['Application Data'] 
          ? `"${JSON.stringify(row['Application Data']).replace(/"/g, '""')}"` 
          : '""';
        return [...baseValues, appDataValue].join(',');
      })
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications-${activeTab}-${exportAll ? 'all' : 'filtered'}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: `${data.length} applications exported to CSV` });
  };

  const exportToExcel = (exportAll: boolean = false) => {
    const apps = exportAll ? getCurrentTabAllApplications() : getCurrentTabFilteredApplications();
    const data = prepareExportData(apps, exportAll);
    if (data.length === 0) {
      toast({ title: 'No data', description: 'No applications to export', variant: 'destructive' });
      return;
    }
    // For Excel, stringify the Application Data JSON
    const excelData = data.map(row => ({
      ...row,
      'Application Data': row['Application Data'] ? JSON.stringify(row['Application Data']) : ''
    }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Applications');
    XLSX.writeFile(wb, `applications-${activeTab}-${exportAll ? 'all' : 'filtered'}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast({ title: 'Exported', description: `${data.length} applications exported to Excel` });
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
        <TabsList className="grid w-full grid-cols-4 max-w-3xl">
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
            value="drafts" 
            className="flex items-center gap-2 data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-700 data-[state=active]:border-b-2 data-[state=active]:border-b-yellow-500 dark:data-[state=active]:bg-yellow-950 dark:data-[state=active]:text-yellow-400"
          >
            <Edit className="h-4 w-4" />
            Drafts
            <Badge variant="secondary" className="ml-1">
              {filteredDraftApplications.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="incomplete" 
            className="flex items-center gap-2 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 data-[state=active]:border-b-2 data-[state=active]:border-b-amber-500 dark:data-[state=active]:bg-amber-950 dark:data-[state=active]:text-amber-400"
          >
            <Clock className="h-4 w-4" />
            Predraft
            <Badge variant="secondary" className="ml-1">
              {filteredIncompleteApplications.length}
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
        </TabsList>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-3 mt-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 bg-card rounded-lg p-3 border flex-wrap">
            <Input
              placeholder="Search by ref #, company, contact, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Date Period Filter */}
            {/* Date Period Filter */}
            <Select 
              value={datePeriodFilter} 
              onValueChange={(value: DatePeriodFilter) => {
                setDatePeriodFilter(value);
                if (value !== 'custom') {
                  setCustomDateFrom(undefined);
                  setCustomDateTo(undefined);
                }
              }}
            >
              <SelectTrigger className="sm:w-[160px]">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="last60days">Last 60 Days</SelectItem>
                <SelectItem value="last90days">Last 90 Days</SelectItem>
                <SelectItem value="custom">Custom Period</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Custom Date Range Pickers */}
            {datePeriodFilter === 'custom' && (
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "w-[130px] justify-start text-left font-normal",
                        !customDateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateFrom ? format(customDateFrom, 'MMM d, yyyy') : 'From'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={customDateFrom}
                      onSelect={setCustomDateFrom}
                      disabled={(date) => customDateTo ? date > customDateTo : false}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground">-</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "w-[130px] justify-start text-left font-normal",
                        !customDateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customDateTo ? format(customDateTo, 'MMM d, yyyy') : 'To'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={customDateTo}
                      onSelect={setCustomDateTo}
                      disabled={(date) => customDateFrom ? date < customDateFrom : false}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
            
            {isAdmin && (
              <Select value={submittedByFilter} onValueChange={setSubmittedByFilter}>
                <SelectTrigger className="sm:w-[200px]">
                  <SelectValue placeholder="Submitted by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {userProfiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Download Shown</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => exportToJSON(false)}>JSON</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToCSV(false)}>CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToExcel(false)}>Excel</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Download All</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => exportToJSON(true)}>JSON</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToCSV(true)}>CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToExcel(true)}>Excel</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
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
                          {formatApplicationReferenceWithPrefix(app.reference_number, maxReferenceNumber, app.created_at, app.product?.name)}
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
          {/* Search and Export */}
          <div className="flex flex-col sm:flex-row gap-3 bg-card rounded-lg p-3 border">
            <Input
              placeholder="Search rejected applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Download Shown</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => exportToJSON(false)}>JSON</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToCSV(false)}>CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToExcel(false)}>Excel</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Download All</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => exportToJSON(true)}>JSON</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToCSV(true)}>CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToExcel(true)}>Excel</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
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
                          {formatApplicationReferenceWithPrefix(app.reference_number, maxReferenceNumber, app.created_at, app.product?.name)}
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

        {/* Incomplete (Predraft) Tab */}
        <TabsContent value="incomplete" className="space-y-3 mt-4">
          {/* Search and Export */}
          <div className="flex flex-col sm:flex-row gap-3 bg-card rounded-lg p-3 border">
            <Input
              placeholder="Search predraft applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Download Shown</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => exportToJSON(false)}>JSON</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToCSV(false)}>CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToExcel(false)}>Excel</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Download All</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => exportToJSON(true)}>JSON</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToCSV(true)}>CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToExcel(true)}>Excel</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Incomplete Applications Table */}
          <div className="border rounded-lg bg-card overflow-hidden">
            <div className="bg-amber-50 dark:bg-amber-950/20 border-b px-3 py-2">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
                <Clock className="h-4 w-4" />
                Predraft Applications ({filteredIncompleteApplications.length})
                <span className="text-xs text-muted-foreground ml-2">Forms not yet submitted</span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-muted backdrop-blur-sm z-10">
                  <TableRow className="hover:bg-transparent border-b-2">
                    <TableHead className="h-10 px-3 py-2 w-12">
                      <Checkbox
                        checked={incompleteSelection.isAllSelected}
                        onCheckedChange={incompleteSelection.toggleAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Ref #</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Product/Service</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Company</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Contact</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Status</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Created</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Updated</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncompleteApplications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-3 opacity-20 text-amber-500" />
                        <p className="font-medium">No predraft applications</p>
                        <p className="text-xs mt-1">Partially filled forms will appear here</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredIncompleteApplications.map((app) => (
                      <TableRow 
                        key={app.id}
                        className="hover:bg-muted/50 cursor-pointer transition-colors border-b"
                        onClick={(e) => {
                          if (!(e.target as HTMLElement).closest('.checkbox-cell')) {
                            // Navigate to resume the application form at the right step
                            navigate(`/applications/new/${app.id}`);
                          }
                        }}
                      >
                        <TableCell 
                          className="px-3 py-3 checkbox-cell"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            checked={incompleteSelection.isSelected(app.id)}
                            onCheckedChange={() => incompleteSelection.toggleItem(app.id)}
                            aria-label={`Select ${app.customer?.company}`}
                          />
                        </TableCell>
                        <TableCell className="px-3 py-3 font-mono font-bold text-sm text-primary">
                          {formatApplicationReferenceWithPrefix(app.reference_number, maxReferenceNumber, app.created_at, app.product?.name)}
                        </TableCell>
                        <TableCell className="px-3 py-3 font-semibold text-sm">
                          <div className="flex items-center gap-2 min-w-[150px]">
                            <div className="h-2 w-2 rounded-full bg-amber-500 flex-shrink-0" />
                            <span className="truncate text-foreground">{app.product?.name || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-sm font-medium">
                          <Button
                            variant="link"
                            className="p-0 h-auto text-sm font-semibold hover:underline text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (app.customer?.id) navigate(`/customers/${app.customer.id}`);
                            }}
                          >
                            <Building2 className="h-4 w-4 mr-1.5" />
                            <span className="max-w-[200px] truncate">{app.customer?.company || 'N/A'}</span>
                          </Button>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-sm font-medium text-foreground">
                          <span className="max-w-[150px] truncate block">{app.customer?.name || 'N/A'}</span>
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <Badge 
                            className="bg-amber-500 text-white border-0 text-xs px-3 py-1 font-bold uppercase tracking-wide shadow-sm"
                          >
                            PRE-DRAFT
                          </Badge>
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
                              // Navigate to resume the application form at the right step
                              navigate(`/applications/new/${app.id}`);
                            }}
                          >
                            Continue
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

        {/* Drafts Tab */}
        <TabsContent value="drafts" className="space-y-3 mt-4">
          {/* Search and Export */}
          <div className="flex flex-col sm:flex-row gap-3 bg-card rounded-lg p-3 border">
            <Input
              placeholder="Search draft applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Download Shown</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => exportToJSON(false)}>JSON</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToCSV(false)}>CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToExcel(false)}>Excel</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Download All</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => exportToJSON(true)}>JSON</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToCSV(true)}>CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToExcel(true)}>Excel</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Draft Applications Table */}
          <div className="border rounded-lg bg-card overflow-hidden">
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border-b px-3 py-2">
              <div className="flex items-center gap-2 text-sm font-medium text-yellow-700 dark:text-yellow-400">
                <Edit className="h-4 w-4" />
                Draft Applications ({filteredDraftApplications.length})
                <span className="text-xs text-muted-foreground ml-2">Ready for submission</span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-muted backdrop-blur-sm z-10">
                  <TableRow className="hover:bg-transparent border-b-2">
                    <TableHead className="h-10 px-3 py-2 w-12">
                      <Checkbox
                        checked={draftSelection.isAllSelected}
                        onCheckedChange={draftSelection.toggleAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Ref #</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Product/Service</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Company</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Contact</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Status</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide text-right">Amount</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Created</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide">Updated</TableHead>
                    <TableHead className="h-10 px-3 py-2 text-xs font-bold text-foreground uppercase tracking-wide text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDraftApplications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                        <Edit className="h-12 w-12 mx-auto mb-3 opacity-20 text-yellow-500" />
                        <p className="font-medium">No draft applications</p>
                        <p className="text-xs mt-1">Saved drafts ready for submission will appear here</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDraftApplications.map((app) => (
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
                            checked={draftSelection.isSelected(app.id)}
                            onCheckedChange={() => draftSelection.toggleItem(app.id)}
                            aria-label={`Select ${app.customer?.company}`}
                          />
                        </TableCell>
                        <TableCell className="px-3 py-3 font-mono font-bold text-sm text-primary">
                          {formatApplicationReferenceWithPrefix(app.reference_number, maxReferenceNumber, app.created_at, app.product?.name)}
                        </TableCell>
                        <TableCell className="px-3 py-3 font-semibold text-sm">
                          <div className="flex items-center gap-2 min-w-[150px]">
                            <div className="h-2 w-2 rounded-full bg-yellow-500 flex-shrink-0" />
                            <span className="truncate text-foreground">{app.product?.name || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-sm font-medium">
                          <Button
                            variant="link"
                            className="p-0 h-auto text-sm font-semibold hover:underline text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (app.customer?.id) navigate(`/customers/${app.customer.id}`);
                            }}
                          >
                            <Building2 className="h-4 w-4 mr-1.5" />
                            <span className="max-w-[200px] truncate">{app.customer?.company || 'N/A'}</span>
                          </Button>
                        </TableCell>
                        <TableCell className="px-3 py-3 text-sm font-medium text-foreground">
                          <span className="max-w-[150px] truncate block">{app.customer?.name || 'N/A'}</span>
                        </TableCell>
                        <TableCell className="px-3 py-3">
                          <Badge 
                            className="bg-yellow-400 text-black border-0 text-xs px-3 py-1 font-bold uppercase tracking-wide shadow-sm ring-1 ring-yellow-600"
                          >
                            DRAFT
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
                            Edit
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
