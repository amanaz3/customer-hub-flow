import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, Phone, FileText, MessageSquare, Users, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/SecureAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ApplicationService } from '@/services/applicationService';
import { supabase } from '@/integrations/supabase/client';
import type { Application } from '@/types/application';
import { formatApplicationReferenceWithHash } from '@/utils/referenceNumberFormatter';
import { CompletionDateDialog } from '@/components/Customer/CompletionDateDialog';

const ApplicationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showCompletionDateDialog, setShowCompletionDateDialog] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplication = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await ApplicationService.fetchApplicationById(id);
        setApplication(data);
        setSelectedStatus(data?.status || '');
      } catch (error) {
        console.error('Error fetching application:', error);
        toast({
          title: 'Error',
          description: 'Failed to load application',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id, toast]);

  const handleStatusUpdate = async () => {
    if (!id || !selectedStatus || !user) return;

    // If changing to completed, show completion date dialog
    if (selectedStatus.toLowerCase() === 'completed') {
      setPendingStatusUpdate(selectedStatus);
      setShowCompletionDateDialog(true);
      return;
    }

    // Otherwise, proceed with normal status update
    await performStatusUpdate(selectedStatus);
  };

  const performStatusUpdate = async (status: string, completionDate?: Date) => {
    if (!id || !user) return;

    try {
      setUpdatingStatus(true);

      // If completion date provided, update completed_at column
      if (completionDate) {
        await supabase
          .from('account_applications')
          .update({
            completed_at: completionDate.toISOString(),
          })
          .eq('id', id);
      }

      await ApplicationService.updateApplicationStatus(
        id,
        status,
        `Status updated by ${user.email}`,
        user.id,
        isAdmin ? 'admin' : 'user'
      );

      // Refresh application data
      const updatedApp = await ApplicationService.fetchApplicationById(id);
      setApplication(updatedApp);

      toast({
        title: 'Success',
        description: `Status updated to ${status}. Notifications sent to relevant users.`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
      setShowCompletionDateDialog(false);
      setPendingStatusUpdate(null);
    }
  };

  const handleCompletionDateConfirm = (date: Date) => {
    if (pendingStatusUpdate) {
      performStatusUpdate(pendingStatusUpdate, date);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!application) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Application not found</p>
        <Button onClick={() => navigate('/customers')} className="mt-4">
          Back to Customers
        </Button>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-yellow-400 text-black',
    submitted: 'bg-blue-500 text-white',
    'under review': 'bg-orange-500 text-white',
    'under_review': 'bg-orange-500 text-white',
    approved: 'bg-green-500 text-white',
    rejected: 'bg-red-500 text-white',
    completed: 'bg-purple-500 text-white',
    paid: 'bg-green-600 text-white',
    'need more info': 'bg-amber-500 text-white',
    'need_more_info': 'bg-amber-500 text-white',
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || '';
    return statusColors[normalizedStatus] || 'bg-gray-500 text-white';
  };

  const availableStatuses = [
    { value: 'Draft', label: 'Draft' },
    { value: 'Submitted', label: 'Submitted' },
    { value: 'Under Review', label: 'Under Review' },
    { value: 'Need More Info', label: 'Need More Info' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Completed', label: 'Completed' },
  ];

  return (
    <div className="space-y-6 p-6">
      <CompletionDateDialog
        open={showCompletionDateDialog}
        onOpenChange={setShowCompletionDateDialog}
        onConfirm={handleCompletionDateConfirm}
        isLoading={updatingStatus}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">
                {formatApplicationReferenceWithHash(application.reference_number)}
              </h1>
              <Badge variant="outline" className="font-mono text-sm">
                {application.application_type.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {application.customer?.name || 'Application Details'}
            </p>
          </div>
        </div>
        <Badge className={getStatusColor(application.status)}>
          {application.status?.replace(/_/g, ' ').toUpperCase()}
        </Badge>
      </div>

      {/* Status Update Card - Admin Only */}
      {isAdmin && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Update Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 w-full">
                <label className="text-sm font-medium mb-2 block">Select New Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose status..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleStatusUpdate} 
                disabled={updatingStatus || selectedStatus === application.status}
                className="whitespace-nowrap"
              >
                {updatingStatus ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Status'
                )}
              </Button>
            </div>
            {selectedStatus !== application.status && selectedStatus && (
              <p className="text-sm text-muted-foreground mt-2">
                Status will change from <strong>{application.status}</strong> to <strong>{selectedStatus}</strong>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Customer Info Card */}
      {application.customer && (
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
                <p className="text-sm text-muted-foreground">Company</p>
                <Link 
                  to={`/customers/${application.customer.id}`}
                  className="font-medium hover:underline"
                >
                  {application.customer.company}
                </Link>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contact Name</p>
                <p className="font-medium">{application.customer.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{application.customer.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Mobile</p>
                  <p className="font-medium">{application.customer.mobile}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Application Details</TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            Documents ({application.documents?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageSquare className="h-4 w-4 mr-2" />
            Messages ({application.messages?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="owners">
            <Users className="h-4 w-4 mr-2" />
            Owners ({application.owners?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Application Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">License Type</p>
                  <p className="font-medium">{application.customer?.license_type || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">${application.application_data.amount?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lead Source</p>
                  <p className="font-medium">{application.application_data.lead_source || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jurisdiction</p>
                  <p className="font-medium">{application.application_data.jurisdiction || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Preferred Bank</p>
                  <p className="font-medium">{application.application_data.preferred_bank || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Annual Turnover</p>
                  <p className="font-medium">
                    {application.application_data.annual_turnover 
                      ? `$${application.application_data.annual_turnover.toLocaleString()}` 
                      : '-'}
                  </p>
                </div>
              </div>
              
              {application.application_data.customer_notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Notes</p>
                  <p className="p-3 bg-muted rounded-md">
                    {application.application_data.customer_notes}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <p>Created</p>
                  <p className="font-medium text-foreground">
                    {new Date(application.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p>Last Updated</p>
                  <p className="font-medium text-foreground">
                    {new Date(application.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {!application.documents || application.documents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No documents uploaded yet
                </p>
              ) : (
                <div className="space-y-2">
                  {application.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.document_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant={doc.is_uploaded ? 'default' : 'secondary'}>
                        {doc.is_uploaded ? 'Uploaded' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Messages & Comments</CardTitle>
            </CardHeader>
            <CardContent>
              {!application.messages || application.messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No messages yet
                </p>
              ) : (
                <div className="space-y-4">
                  {application.messages.map((msg) => (
                    <div key={msg.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant={msg.sender_type === 'admin' ? 'default' : 'secondary'}>
                          {msg.sender_type}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="owners">
          <Card>
            <CardHeader>
              <CardTitle>Application Owners</CardTitle>
            </CardHeader>
            <CardContent>
              {!application.owners || application.owners.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No owners added yet
                </p>
              ) : (
                <div className="space-y-2">
                  {application.owners.map((owner) => (
                    <div key={owner.id} className="p-4 border rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p className="font-medium">{owner.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Nationality</p>
                          <p className="font-medium">{owner.nationality || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Passport</p>
                          <p className="font-medium">{owner.passport_number || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Ownership</p>
                          <p className="font-medium">{owner.ownership_percentage || '-'}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApplicationDetail;
