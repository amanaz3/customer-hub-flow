import { useState } from 'react';
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
import { Loader2, Trash2, AlertTriangle, Search, ShieldAlert } from 'lucide-react';
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
}

const MAX_BULK_SELECT = 10;

export function PermanentDeleteSection() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [customers, setCustomers] = useState<CustomerPreview[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<CustomerPreview[]>([]);
  const [cascadePreview, setCascadePreview] = useState<CascadePreview[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSecurePasswordDialog, setShowSecurePasswordDialog] = useState(false);

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

  const searchCustomers = async () => {
    if (!searchTerm.trim()) {
      toast({ title: "Enter search term", description: "Please enter a name, email, or company to search", variant: "destructive" });
      return;
    }

    setIsSearching(true);
    setCustomers([]);
    setSelectedCustomers([]);
    setCascadePreview([]);

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, company, created_at')
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%`)
        .limit(20);

      if (error) throw error;

      setCustomers(data || []);
      
      if (!data || data.length === 0) {
        toast({ title: "No customers found", description: "No customers match your search criteria" });
      }
    } catch (error: any) {
      console.error('Error searching customers:', error);
      toast({ title: "Search failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSearching(false);
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

  const loadCascadePreview = async () => {
    if (selectedCustomers.length === 0) {
      toast({ title: "No selection", description: "Please select at least one customer", variant: "destructive" });
      return;
    }

    setIsLoadingPreview(true);
    setCascadePreview([]);

    try {
      const customerIds = selectedCustomers.map(c => c.id);
      
      // Get all applications for selected customers
      const { data: applications } = await supabase
        .from('account_applications')
        .select('id')
        .in('customer_id', customerIds);

      const applicationIds = applications?.map(a => a.id) || [];
      
      const preview: CascadePreview[] = [];

      // Count application-level child records
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

      // Count customer-level child records for all selected customers
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
      setCascadePreview(preview);

    } catch (error: any) {
      console.error('Error loading cascade preview:', error);
      toast({ title: "Preview failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const executeDelete = async () => {
    if (selectedCustomers.length === 0) return;

    setIsDeleting(true);
    setShowConfirmDialog(false);

    try {
      const customerIds = selectedCustomers.map(c => c.id);
      
      // Get all application IDs first
      const { data: applications } = await supabase
        .from('account_applications')
        .select('id')
        .in('customer_id', customerIds);

      const applicationIds = applications?.map(a => a.id) || [];

      // Delete in cascade order - application children first
      if (applicationIds.length > 0) {
        await supabase.from('application_status_changes').delete().in('application_id', applicationIds);
        await supabase.from('application_step_history').delete().in('application_id', applicationIds);
        await supabase.from('application_assessment_history').delete().in('application_id', applicationIds);
        await supabase.from('application_workflow_steps').delete().in('application_id', applicationIds);
        await supabase.from('application_documents').delete().in('application_id', applicationIds);
        await supabase.from('application_messages').delete().in('application_id', applicationIds);
        await supabase.from('application_owners').delete().in('application_id', applicationIds);
        await supabase.from('completion_date_history').delete().in('application_id', applicationIds);
        
        // Delete applications
        await supabase.from('account_applications').delete().in('id', applicationIds);
      }

      // Delete customer children
      await supabase.from('documents').delete().in('customer_id', customerIds);
      await supabase.from('comments').delete().in('customer_id', customerIds);
      await supabase.from('status_changes').delete().in('customer_id', customerIds);
      await supabase.from('customer_services').delete().in('customer_id', customerIds);
      await supabase.from('deals').delete().in('customer_id', customerIds);
      await supabase.from('notifications').delete().in('customer_id', customerIds);

      // Finally delete the customers
      const { error } = await supabase.from('customers').delete().in('id', customerIds);
      if (error) throw error;

      toast({
        title: "Permanently Deleted",
        description: `${selectedCustomers.length} customer(s) and all related data have been permanently deleted.`,
      });

      // Reset state
      setCustomers(customers.filter(c => !customerIds.includes(c.id)));
      setSelectedCustomers([]);
      setCascadePreview([]);

    } catch (error: any) {
      console.error('Error deleting customers:', error);
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const totalRecords = cascadePreview.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-6">
      <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Danger Zone - Permanent Delete</AlertTitle>
        <AlertDescription>
          This action permanently deletes customer data and ALL related records. This cannot be undone.
          Use this only for junk/test data that should not be archived. Maximum {MAX_BULK_SELECT} customers at a time.
        </AlertDescription>
      </Alert>

      {/* Search Section */}
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchCustomers()}
              />
            </div>
            <Button onClick={searchCustomers} disabled={isSearching}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-2">Search</span>
            </Button>
          </div>

          {/* Search Results */}
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
                              <Badge variant="outline" className="text-xs">
                                {new Date(customer.created_at).toLocaleDateString()}
                              </Badge>
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
                  onClick={loadCascadePreview} 
                  disabled={isLoadingPreview}
                  className="w-full mt-2"
                >
                  {isLoadingPreview ? (
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

      {/* Cascade Preview */}
      {cascadePreview.length > 0 && (
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
                {cascadePreview.map((item) => (
                  <div key={item.table} className="flex items-center justify-between p-2 bg-destructive/10 rounded-md">
                    <span className="text-sm font-mono">{item.table}</span>
                    <Badge variant="destructive">{item.count}</Badge>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm">
                  <span className="text-muted-foreground">Total records to delete:</span>
                  <Badge variant="destructive" className="ml-2">{totalRecords}</Badge>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setShowSecurePasswordDialog(true)}
                  disabled={isDeleting || cascadePreview.length === 0}
                >
                  {isDeleting ? (
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

      {/* Secure Password Dialog - First Gate */}
      <SecureDeleteVerificationDialog
        open={showSecurePasswordDialog}
        onOpenChange={setShowSecurePasswordDialog}
        onVerified={() => setShowConfirmDialog(true)}
      />

      {/* Confirmation Dialog - Second Gate */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
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
                {totalRecords} records across {cascadePreview.length} tables
              </p>
              <p className="text-destructive font-bold">
                This action cannot be undone!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
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
