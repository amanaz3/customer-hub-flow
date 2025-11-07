import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, Phone, FileText, Plus, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/SecureAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { BaseCustomer, Document } from '@/types/customer';
import type { Application } from '@/types/application';
import CustomDocumentUpload from '@/components/Customer/CustomDocumentUpload';

interface CustomerWithApplications extends BaseCustomer {
  applications?: Application[];
  documents?: Document[];
  status?: string;
}

const CustomerDetailNew = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [customer, setCustomer] = useState<CustomerWithApplications | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCustomerData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Fetch customer with status from latest application
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id, name, email, mobile, company, license_type, reference_number, created_at, updated_at')
        .eq('id', id)
        .single();

      if (customerError) throw customerError;

      // Map license_type to licenseType for consistency
      const mappedCustomer = {
        ...customerData,
        licenseType: customerData.license_type,
      };

      // Fetch applications for this customer
      const { data: applicationsData, error: appsError } = await supabase
        .from('account_applications')
        .select('*')
        .eq('customer_id', id)
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;

      // Fetch documents
      const { data: documentsData, error: docsError } = await supabase
        .from('documents')
        .select('*')
        .eq('customer_id', id)
        .order('created_at', { ascending: false });

      if (docsError) throw docsError;

      // Get status from latest application or default to 'Draft'
      const latestStatus = applicationsData && applicationsData.length > 0 
        ? applicationsData[0].status 
        : 'Draft';

      setCustomer({
        ...mappedCustomer,
        reference_number: customerData.reference_number,
        applications: applicationsData as Application[],
        documents: documentsData as Document[],
        status: latestStatus
      });
    } catch (error) {
      console.error('Error fetching customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to load customer',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [id, toast]);

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!customer) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Customer not found</p>
        <Button onClick={() => navigate('/customers')} className="mt-4">
          Back to Customers
        </Button>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500',
    submitted: 'bg-blue-500',
    under_review: 'bg-yellow-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
    completed: 'bg-purple-500',
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/customers')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{customer.company}</h1>
            <p className="text-muted-foreground">
              {customer.licenseType} License • Customer Profile
            </p>
          </div>
        </div>
        <Button onClick={() => navigate('/applications/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Application
        </Button>
      </div>

      {/* Customer Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Company Name</p>
              <p className="font-medium">{customer.company}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contact Person</p>
              <p className="font-medium">{customer.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{customer.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Mobile</p>
                <p className="font-medium">{customer.mobile}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">License Type</p>
              <Badge variant="outline">{customer.licenseType}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer Since</p>
              <p className="font-medium">
                {new Date(customer.created_at || '').toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Applications ({customer.applications?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!customer.applications || customer.applications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No applications yet</p>
              <Button onClick={() => navigate('/applications/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Application
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">
                      {app.application_type.replace('_', ' ').toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[app.status] || 'bg-gray-500'}>
                        {app.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      ${app.application_data?.amount?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>
                      {new Date(app.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(app.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/applications/${app.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Documents Section - Always visible for admins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Documents
            {isAdmin && (
              <Badge variant="secondary" className="ml-2">Admin Access</Badge>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {isAdmin 
              ? 'As admin, you can upload documents at any time'
              : 'Upload supporting documents for this customer'}
          </p>
        </CardHeader>
        <CardContent>
          <CustomDocumentUpload
            customerId={id!}
            customerStatus={isAdmin ? 'Draft' : customer.status}
            onDocumentAdded={fetchCustomerData}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerDetailNew;