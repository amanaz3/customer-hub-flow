import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Trash2, AlertTriangle, Search, ShieldAlert, Users, FileText } from 'lucide-react';
import { formatApplicationReferenceWithPrefix } from '@/utils/referenceNumberFormatter';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SecureDeleteVerificationDialog } from '@/components/Admin/SecureDeleteVerificationDialog';

interface CascadePreview {
  table: string;
  count: number;
}

interface CustomerPreview {
  id: string;
  name: string;
  email: string;
  company: string;
  created_at: string;
  applicationCount?: number;
}

interface ApplicationPreview {
  id: string;
  reference_number: number;
  application_type: string | null;
  status: string;
  created_at: string;
  customer_name?: string;
}

const MAX_BULK_SELECT = 10;

export function PermanentDeleteSection() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'customers' | 'applications'>('customers');
  
  // Customer state
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [customers, setCustomers] = useState<CustomerPreview[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<CustomerPreview[]>([]);
  const [customerCascadePreview, setCustomerCascadePreview] = useState<CascadePreview[]>([]);
  const [isLoadingCustomerPreview, setIsLoadingCustomerPreview] = useState(false);
  const [isDeletingCustomers, setIsDeletingCustomers] = useState(false);
  const [showCustomerConfirmDialog, setShowCustomerConfirmDialog] = useState(false);
  const [showCustomerPasswordDialog, setShowCustomerPasswordDialog] = useState(false);

  // Application state
  const [appSearchTerm, setAppSearchTerm] = useState('');
  const [isSearchingApps, setIsSearchingApps] = useState(false);
  const [applications, setApplications] = useState<ApplicationPreview[]>([]);
  const [selectedApps, setSelectedApps] = useState<ApplicationPreview[]>([]);
  const [appCascadePreview, setAppCascadePreview] = useState<CascadePreview[]>([]);
  const [isLoadingAppPreview, setIsLoadingAppPreview] = useState(false);
  const [isDeletingApps, setIsDeletingApps] = useState(false);
  const [showAppConfirmDialog, setShowAppConfirmDialog] = useState(false);
  const [showAppPasswordDialog, setShowAppPasswordDialog] = useState(false);
  const [maxAppReference, setMaxAppReference] = useState(99999);

  // Fetch max reference on mount
  useEffect(() => {
    const fetchMaxReference = async () => {
      const { data } = await supabase
        .from('account_applications')
        .select('reference_number')
        .order('reference_number', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.reference_number) {
        setMaxAppReference(data.reference_number);
      }
    };
    fetchMaxReference();
  }, []);

  // Only render for admins
  if (!isAdmin) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          Only administrators can access the permanent delete functionality.
        </AlertDescription>
      </Alert>
    );
  }

  // ============ Customer Functions ============
  const searchCustomers = async () => {
    if (!customerSearchTerm.trim()) {
      toast({ title: "Enter search term", description: "Please enter a name, email, or company to search", variant: "destructive" });
      return;
    }

    setIsSearchingCustomers(true);
    setCustomers([]);
    setSelectedCustomers([]);
    setCustomerCascadePreview([]);

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, company, created_at')
        .or(`name.ilike.%${customerSearchTerm}%,email.ilike.%${customerSearchTerm}%,company.ilike.%${customerSearchTerm}%`)
        .limit(20);

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({ title: "No customers found", description: "No customers match your search criteria" });
        setCustomers([]);
        return;
      }

      // Fetch application counts for each customer
      const customerIds = data.map(c => c.id);
      const { data: appCounts } = await supabase
        .from('account_applications')
        .select('customer_id')
        .in('customer_id', customerIds);

      const appCountMap: Record<string, number> = {};
      appCounts?.forEach(app => {
        if (app.customer_id) {
          appCountMap[app.customer_id] = (appCountMap[app.customer_id] || 0) + 1;
        }
      });

      const customersWithCounts = data.map(c => ({
        ...c,
        applicationCount: appCountMap[c.id] || 0,
      }));

      setCustomers(customersWithCounts);
    } catch (error: any) {
      console.error('Error searching customers:', error);
      toast({ title: "Search failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSearchingCustomers(false);
    }
  };

  const toggleCustomerSelection = (customer: CustomerPreview) => {
    setSelectedCustomers(prev => {
      const isSelected = prev.some(c => c.id === customer.id);
      if (isSelected) {
        return prev.filter(c => c.id !== customer.id);
      } else {
        if (prev.length >= MAX_BULK_SELECT) {
          toast({ 
            title: "Selection limit reached", 
            description: `You can only select up to ${MAX_BULK_SELECT} customers at a time`,
            variant: "destructive" 
          });
          return prev;
        }
        return [...prev, customer];
      }
    });
  };

  const loadCustomerCascadePreview = async () => {
    if (selectedCustomers.length === 0) {
      toast({ title: "No selection", description: "Please select at least one customer", variant: "destructive" });
      return;
    }

    setIsLoadingCustomerPreview(true);
    setCustomerCascadePreview([]);

    try {
      const customerIds = selectedCustomers.map(c => c.id);
      
      const { data: apps } = await supabase
        .from('account_applications')
        .select('id')
        .in('customer_id', customerIds);

      const applicationIds = apps?.map(a => a.id) || [];
      
      const preview: CascadePreview[] = [];

      if (applicationIds.length > 0) {
        const counts = await Promise.all([
          supabase.from('application_status_changes').select('id', { count: 'exact', head: true }).in('application_id', applicationIds),
          supabase.from('application_step_history').select('id', { count: 'exact', head: true }).in('application_id', applicationIds),
          supabase.from('application_assessment_history').select('id', { count: 'exact', head: true }).in('application_id', applicationIds),
          supabase.from('application_workflow_steps').select('id', { count: 'exact', head: true }).in('application_id', applicationIds),
          supabase.from('application_documents').select('id', { count: 'exact', head: true }).in('application_id', applicationIds),
          supabase.from('application_messages').select('id', { count: 'exact', head: true }).in('application_id', applicationIds),
          supabase.from('application_owners').select('id', { count: 'exact', head: true }).in('application_id', applicationIds),
          supabase.from('completion_date_history').select('id', { count: 'exact', head: true }).in('application_id', applicationIds),
        ]);

        const tables = [
          'application_status_changes',
          'application_step_history', 
          'application_assessment_history',
          'application_workflow_steps',
          'application_documents',
          'application_messages',
          'application_owners',
          'completion_date_history',
        ];

        counts.forEach((result, idx) => {
          const count = result.count || 0;
          if (count > 0) {
            preview.push({ table: tables[idx], count });
          }
        });

        preview.push({ table: 'account_applications', count: applicationIds.length });
      }

      const customerCounts = await Promise.all([
        supabase.from('documents').select('id', { count: 'exact', head: true }).in('customer_id', customerIds),
        supabase.from('comments').select('id', { count: 'exact', head: true }).in('customer_id', customerIds),
        supabase.from('status_changes').select('id', { count: 'exact', head: true }).in('customer_id', customerIds),
        supabase.from('customer_services').select('id', { count: 'exact', head: true }).in('customer_id', customerIds),
        supabase.from('deals').select('id', { count: 'exact', head: true }).in('customer_id', customerIds),
        supabase.from('notifications').select('id', { count: 'exact', head: true }).in('customer_id', customerIds),
      ]);

      const customerTables = ['documents', 'comments', 'status_changes', 'customer_services', 'deals', 'notifications'];
      customerCounts.forEach((result, idx) => {
        const count = result.count || 0;
        if (count > 0) {
          preview.push({ table: customerTables[idx], count });
        }
      });

      preview.push({ table: 'customers', count: selectedCustomers.length });
      setCustomerCascadePreview(preview);

    } catch (error: any) {
      console.error('Error loading cascade preview:', error);
      toast({ title: "Preview failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoadingCustomerPreview(false);
    }
  };

  const executeCustomerDelete = async () => {
    if (selectedCustomers.length === 0) return;

    setIsDeletingCustomers(true);
    setShowCustomerConfirmDialog(false);

    try {
      const customerIds = selectedCustomers.map(c => c.id);
      
      const { data: apps } = await supabase
        .from('account_applications')
        .select('id')
        .in('customer_id', customerIds);

      const applicationIds = apps?.map(a => a.id) || [];

      if (applicationIds.length > 0) {
        await supabase.from('application_status_changes').delete().in('application_id', applicationIds);
        await supabase.from('application_step_history').delete().in('application_id', applicationIds);
        await supabase.from('application_assessment_history').delete().in('application_id', applicationIds);
        await supabase.from('application_workflow_steps').delete().in('application_id', applicationIds);
        await supabase.from('application_documents').delete().in('application_id', applicationIds);
        await supabase.from('application_messages').delete().in('application_id', applicationIds);
        await supabase.from('application_owners').delete().in('application_id', applicationIds);
        await supabase.from('completion_date_history').delete().in('application_id', applicationIds);
        await supabase.from('account_applications').delete().in('id', applicationIds);
      }

      await supabase.from('documents').delete().in('customer_id', customerIds);
      await supabase.from('comments').delete().in('customer_id', customerIds);
      await supabase.from('status_changes').delete().in('customer_id', customerIds);
      await supabase.from('customer_services').delete().in('customer_id', customerIds);
      await supabase.from('deals').delete().in('customer_id', customerIds);
      await supabase.from('notifications').delete().in('customer_id', customerIds);

      const { error } = await supabase.from('customers').delete().in('id', customerIds);
      if (error) throw error;

      toast({
        title: "Permanently Deleted",
        description: `${selectedCustomers.length} customer(s) and all related data have been permanently deleted.`,
      });

      setCustomers(customers.filter(c => !customerIds.includes(c.id)));
      setSelectedCustomers([]);
      setCustomerCascadePreview([]);

    } catch (error: any) {
      console.error('Error deleting customers:', error);
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeletingCustomers(false);
    }
  };

  // ============ Application Functions ============
  const searchApplications = async () => {
    if (!appSearchTerm.trim()) {
      toast({ title: "Enter search term", description: "Please enter a reference number, type, or status to search", variant: "destructive" });
      return;
    }

    setIsSearchingApps(true);
    setApplications([]);
    setSelectedApps([]);
    setAppCascadePreview([]);

    try {
      // Try to parse as reference number first
      const refNum = parseInt(appSearchTerm);
      let query = supabase
        .from('account_applications')
        .select(`
          id, 
          reference_number, 
          application_type, 
          status, 
          created_at,
          customers(name)
        `)
        .limit(20);

      if (!isNaN(refNum)) {
        query = query.eq('reference_number', refNum);
      } else {
        query = query.or(`application_type.ilike.%${appSearchTerm}%,status.eq.${appSearchTerm}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({ title: "No applications found", description: "No applications match your search criteria" });
        setApplications([]);
        return;
      }

      const appsWithCustomer = data.map(app => ({
        id: app.id,
        reference_number: app.reference_number,
        application_type: app.application_type,
        status: app.status,
        created_at: app.created_at,
        customer_name: (app.customers as any)?.name || 'Unknown',
      }));

      setApplications(appsWithCustomer);
    } catch (error: any) {
      console.error('Error searching applications:', error);
      toast({ title: "Search failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSearchingApps(false);
    }
  };

  const toggleAppSelection = (app: ApplicationPreview) => {
    setSelectedApps(prev => {
      const isSelected = prev.some(a => a.id === app.id);
      if (isSelected) {
        return prev.filter(a => a.id !== app.id);
      } else {
        if (prev.length >= MAX_BULK_SELECT) {
          toast({ 
            title: "Selection limit reached", 
            description: `You can only select up to ${MAX_BULK_SELECT} applications at a time`,
            variant: "destructive" 
          });
          return prev;
        }
        return [...prev, app];
      }
    });
  };

  const loadAppCascadePreview = async () => {
    if (selectedApps.length === 0) {
      toast({ title: "No selection", description: "Please select at least one application", variant: "destructive" });
      return;
    }

    setIsLoadingAppPreview(true);
    setAppCascadePreview([]);

    try {
      const applicationIds = selectedApps.map(a => a.id);
      const preview: CascadePreview[] = [];

      const counts = await Promise.all([
        supabase.from('application_status_changes').select('id', { count: 'exact', head: true }).in('application_id', applicationIds),
        supabase.from('application_step_history').select('id', { count: 'exact', head: true }).in('application_id', applicationIds),
        supabase.from('application_assessment_history').select('id', { count: 'exact', head: true }).in('application_id', applicationIds),
        supabase.from('application_workflow_steps').select('id', { count: 'exact', head: true }).in('application_id', applicationIds),
        supabase.from('application_documents').select('id', { count: 'exact', head: true }).in('application_id', applicationIds),
        supabase.from('application_messages').select('id', { count: 'exact', head: true }).in('application_id', applicationIds),
        supabase.from('application_owners').select('id', { count: 'exact', head: true }).in('application_id', applicationIds),
        supabase.from('completion_date_history').select('id', { count: 'exact', head: true }).in('application_id', applicationIds),
      ]);

      const tables = [
        'application_status_changes',
        'application_step_history', 
        'application_assessment_history',
        'application_workflow_steps',
        'application_documents',
        'application_messages',
        'application_owners',
        'completion_date_history',
      ];

      counts.forEach((result, idx) => {
        const count = result.count || 0;
        if (count > 0) {
          preview.push({ table: tables[idx], count });
        }
      });

      preview.push({ table: 'account_applications', count: selectedApps.length });
      setAppCascadePreview(preview);

    } catch (error: any) {
      console.error('Error loading app cascade preview:', error);
      toast({ title: "Preview failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoadingAppPreview(false);
    }
  };

  const executeAppDelete = async () => {
    if (selectedApps.length === 0) return;

    setIsDeletingApps(true);
    setShowAppConfirmDialog(false);

    try {
      const applicationIds = selectedApps.map(a => a.id);

      await supabase.from('application_status_changes').delete().in('application_id', applicationIds);
      await supabase.from('application_step_history').delete().in('application_id', applicationIds);
      await supabase.from('application_assessment_history').delete().in('application_id', applicationIds);
      await supabase.from('application_workflow_steps').delete().in('application_id', applicationIds);
      await supabase.from('application_documents').delete().in('application_id', applicationIds);
      await supabase.from('application_messages').delete().in('application_id', applicationIds);
      await supabase.from('application_owners').delete().in('application_id', applicationIds);
      await supabase.from('completion_date_history').delete().in('application_id', applicationIds);

      const { error } = await supabase.from('account_applications').delete().in('id', applicationIds);
      if (error) throw error;

      toast({
        title: "Permanently Deleted",
        description: `${selectedApps.length} application(s) and all related data have been permanently deleted.`,
      });

      setApplications(applications.filter(a => !applicationIds.includes(a.id)));
      setSelectedApps([]);
      setAppCascadePreview([]);

    } catch (error: any) {
      console.error('Error deleting applications:', error);
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeletingApps(false);
    }
  };

  const customerTotalRecords = customerCascadePreview.reduce((sum, item) => sum + item.count, 0);
  const appTotalRecords = appCascadePreview.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-6">
      <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Danger Zone - Permanent Delete</AlertTitle>
        <AlertDescription>
          This action permanently deletes data and ALL related records. This cannot be undone.
          Use this only for junk/test data that should not be archived. Maximum {MAX_BULK_SELECT} items at a time.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'customers' | 'applications')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Applications
          </TabsTrigger>
        </TabsList>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search Customers to Delete
              </CardTitle>
              <CardDescription>
                Search by name, email, or company name. Select up to {MAX_BULK_SELECT} customers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Enter name, email, or company..."
                    value={customerSearchTerm}
                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchCustomers()}
                  />
                </div>
                <Button onClick={searchCustomers} disabled={isSearchingCustomers}>
                  {isSearchingCustomers ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  <span className="ml-2">Search</span>
                </Button>
              </div>

              {customers.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Found {customers.length} customers • Selected {selectedCustomers.length}/{MAX_BULK_SELECT}:
                    </Label>
                    {selectedCustomers.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedCustomers([])}
                      >
                        Clear Selection
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="h-[250px] border rounded-md">
                    <div className="p-2 space-y-1">
                      {customers.map((customer) => {
                        const isSelected = selectedCustomers.some(c => c.id === customer.id);
                        return (
                          <div
                            key={customer.id}
                            onClick={() => toggleCustomerSelection(customer)}
                            className={`p-3 rounded-md cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-destructive/20 border border-destructive/50'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleCustomerSelection(customer)}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">{customer.name}</p>
                                    <p className="text-sm text-muted-foreground">{customer.email}</p>
                                    <p className="text-sm text-muted-foreground">{customer.company}</p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <Badge variant="outline" className="text-xs">
                                      {new Date(customer.created_at).toLocaleDateString()}
                                    </Badge>
                                    {customer.applicationCount && customer.applicationCount > 0 ? (
                                      <Badge variant="destructive" className="text-xs flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        {customer.applicationCount} app{customer.applicationCount > 1 ? 's' : ''}
                                      </Badge>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                  
                  {selectedCustomers.length > 0 && (
                    <Button 
                      onClick={loadCustomerCascadePreview} 
                      disabled={isLoadingCustomerPreview}
                      className="w-full mt-2"
                    >
                      {isLoadingCustomerPreview ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Search className="h-4 w-4 mr-2" />
                      )}
                      Preview Deletion ({selectedCustomers.length} selected)
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {customerCascadePreview.length > 0 && (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Deletion Preview
                </CardTitle>
                <CardDescription>
                  The following records will be permanently deleted for {selectedCustomers.length} customer(s):
                  <span className="block mt-1 font-medium">
                    {selectedCustomers.map(c => c.name).join(', ')}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {customerCascadePreview.map((item) => (
                      <div key={item.table} className="flex items-center justify-between p-2 bg-destructive/10 rounded-md">
                        <span className="text-sm font-mono">{item.table}</span>
                        <Badge variant="destructive">{item.count}</Badge>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Total records to delete:</span>
                      <Badge variant="destructive" className="ml-2">{customerTotalRecords}</Badge>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => setShowCustomerPasswordDialog(true)}
                      disabled={isDeletingCustomers || customerCascadePreview.length === 0}
                    >
                      {isDeletingCustomers ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Permanently Delete {selectedCustomers.length} Customer(s)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search Applications to Delete
              </CardTitle>
              <CardDescription>
                Search by reference number, type, or status. Select up to {MAX_BULK_SELECT} applications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Enter reference number, type, or status..."
                    value={appSearchTerm}
                    onChange={(e) => setAppSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchApplications()}
                  />
                </div>
                <Button onClick={searchApplications} disabled={isSearchingApps}>
                  {isSearchingApps ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  <span className="ml-2">Search</span>
                </Button>
              </div>

              {applications.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Found {applications.length} applications • Selected {selectedApps.length}/{MAX_BULK_SELECT}:
                    </Label>
                    {selectedApps.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedApps([])}
                      >
                        Clear Selection
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="h-[250px] border rounded-md">
                    <div className="p-2 space-y-1">
                      {applications.map((app) => {
                        const isSelected = selectedApps.some(a => a.id === app.id);
                        return (
                          <div
                            key={app.id}
                            onClick={() => toggleAppSelection(app)}
                            className={`p-3 rounded-md cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-destructive/20 border border-destructive/50'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleAppSelection(app)}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">{formatApplicationReferenceWithPrefix(app.reference_number, maxAppReference, app.created_at, app.application_type)}</p>
                                    <p className="text-sm text-muted-foreground">{app.application_type || 'Unknown type'}</p>
                                    <p className="text-sm text-muted-foreground">Customer: {app.customer_name}</p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <Badge variant="outline" className="text-xs">
                                      {new Date(app.created_at).toLocaleDateString()}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs capitalize">
                                      {app.status}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                  
                  {selectedApps.length > 0 && (
                    <Button 
                      onClick={loadAppCascadePreview} 
                      disabled={isLoadingAppPreview}
                      className="w-full mt-2"
                    >
                      {isLoadingAppPreview ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Search className="h-4 w-4 mr-2" />
                      )}
                      Preview Deletion ({selectedApps.length} selected)
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {appCascadePreview.length > 0 && (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Deletion Preview
                </CardTitle>
                <CardDescription>
                  The following records will be permanently deleted for {selectedApps.length} application(s):
                  <span className="block mt-1 font-medium">
                    {selectedApps.map(a => formatApplicationReferenceWithPrefix(a.reference_number, maxAppReference, a.created_at, a.application_type)).join(', ')}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {appCascadePreview.map((item) => (
                      <div key={item.table} className="flex items-center justify-between p-2 bg-destructive/10 rounded-md">
                        <span className="text-sm font-mono">{item.table}</span>
                        <Badge variant="destructive">{item.count}</Badge>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Total records to delete:</span>
                      <Badge variant="destructive" className="ml-2">{appTotalRecords}</Badge>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => setShowAppPasswordDialog(true)}
                      disabled={isDeletingApps || appCascadePreview.length === 0}
                    >
                      {isDeletingApps ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Permanently Delete {selectedApps.length} Application(s)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Customer Secure Password Dialog */}
      <SecureDeleteVerificationDialog
        open={showCustomerPasswordDialog}
        onOpenChange={setShowCustomerPasswordDialog}
        onVerified={() => setShowCustomerConfirmDialog(true)}
      />

      {/* Customer Confirmation Dialog */}
      <AlertDialog open={showCustomerConfirmDialog} onOpenChange={setShowCustomerConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Confirm Permanent Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>You are about to permanently delete:</p>
              <p className="font-semibold">{selectedCustomers.length} Customer(s): {selectedCustomers.map(c => c.name).join(', ')}</p>
              <p className="text-destructive font-medium">
                {customerTotalRecords} records across {customerCascadePreview.length} tables
              </p>
              <p className="text-destructive font-bold">
                This action cannot be undone!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeCustomerDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Application Secure Password Dialog */}
      <SecureDeleteVerificationDialog
        open={showAppPasswordDialog}
        onOpenChange={setShowAppPasswordDialog}
        onVerified={() => setShowAppConfirmDialog(true)}
      />

      {/* Application Confirmation Dialog */}
      <AlertDialog open={showAppConfirmDialog} onOpenChange={setShowAppConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Confirm Permanent Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>You are about to permanently delete:</p>
              <p className="font-semibold">{selectedApps.length} Application(s): {selectedApps.map(a => `REF-${a.reference_number}`).join(', ')}</p>
              <p className="text-destructive font-medium">
                {appTotalRecords} records across {appCascadePreview.length} tables
              </p>
              <p className="text-destructive font-bold">
                This action cannot be undone!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAppDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
