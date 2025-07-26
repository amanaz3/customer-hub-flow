import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CategorizedDocumentUpload from '@/components/Customer/CategorizedDocumentUpload';
import CustomDocumentUpload from '@/components/Customer/CustomDocumentUpload';
import CustomerStatusCard from '@/components/Customer/CustomerStatusCard';
import CustomerDetailsForm from '@/components/Customer/CustomerDetailsForm';
import CustomerActionButtons from '@/components/Customer/CustomerActionButtons';
import StatusHistoryCard from '@/components/Customer/StatusHistoryCard';
import DocumentCompleteCheckbox from '@/components/Customer/DocumentCompleteCheckbox';
import { useCustomer } from '@/contexts/CustomerContext';
import { Status } from '@/types/customer';
import { useAuth } from '@/contexts/SecureAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { Send, Shield, CheckCircle } from 'lucide-react';

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const { 
    getCustomerById, 
    updateCustomer, 
    uploadDocument, 
    updateCustomerStatus,
    submitToAdmin,
    refreshData
  } = useCustomer();
  
  const customer = getCustomerById(id || '');
  
  const [documentChecklistComplete, setDocumentChecklistComplete] = useState(
    customer?.document_checklist_complete || false
  );
  
  if (!customer) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold">Customer not found</h1>
        <Button
          onClick={() => navigate('/customers')}
          className="mt-4"
        >
          Back to Customers
        </Button>
      </div>
    );
  }

  const handleUpdateCustomer = async (formData: {
    name: string;
    mobile: string;
    company: string;
    email: string;
    leadSource: string;
    licenseType: string;
    amount: string;
    preferredBank?: string;
    annualTurnover?: string;
    jurisdiction?: string;
    customerNotes?: string;
  }) => {
    if (!customer) return;
    
    try {
      await updateCustomer(customer.id, {
        name: formData.name,
        mobile: formData.mobile,
        company: formData.company,
        email: formData.email,
        leadSource: formData.leadSource as any,
        licenseType: formData.licenseType as any,
        amount: parseFloat(formData.amount),
        preferred_bank: formData.preferredBank,
        annual_turnover: formData.annualTurnover ? parseFloat(formData.annualTurnover) : undefined,
        jurisdiction: formData.jurisdiction,
        customer_notes: formData.customerNotes,
      });
      
      // Refresh data to get updated information
      await refreshData();
      
      toast({
        title: "Success",
        description: "Customer information updated successfully",
      });
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: "Error",
        description: "Failed to update customer information. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDocumentChecklistChange = async (checked: boolean) => {
    if (!isAdmin) return;
    
    try {
      setDocumentChecklistComplete(checked);
      
      // Update customer record with document checklist status
      await updateCustomer(customer.id, {
        ...customer,
        document_checklist_complete: checked
      });
      
      toast({
        title: checked ? "Document Checklist Marked Complete" : "Document Checklist Unmarked",
        description: checked ? 
          "All documents have been confirmed as reviewed and complete." :
          "Document checklist status has been updated.",
      });
      
    } catch (error) {
      console.error('Error updating document checklist:', error);
      setDocumentChecklistComplete(!checked); // Revert on error
      toast({
        title: "Error",
        description: "Failed to update document checklist status.",
        variant: "destructive",
      });
    }
  };

  const handleDocumentUpload = (documentId: string, filePath: string) => {
    if (!customer) return;
    uploadDocument(customer.id, documentId, filePath);
  };

  const handleStatusChange = (status: Status, commentText: string) => {
    if (!customer || !user) return;
    
    updateCustomerStatus(
      customer.id, 
      status, 
      commentText, 
      user.id, 
      isAdmin ? 'admin' : 'user'
    );
    
    toast({
      title: "Status Updated",
      description: `Application status changed to ${status}`,
    });
    
    if (status === 'Paid') {
      navigate('/completed');
    }
  };

  const handleSubmitApplication = () => {
    if (!customer || !user) return;
    
    submitToAdmin(customer.id, user.id, user.profile?.name || user.email || 'Unknown User');
    
    toast({
      title: "Application Submitted",
      description: "Application submitted successfully and status changed to Submitted",
    });
  };

  const mandatoryDocumentsUploaded = customer.documents
    ? customer.documents
        .filter(doc => {
          if (doc.category === 'freezone' && customer.licenseType !== 'Freezone') {
            return false;
          }
          return doc.is_mandatory;
        })
        .every(doc => doc.is_uploaded)
    : false;

  const uploadedDocumentsCount = customer.documents ? customer.documents.filter(doc => doc.is_uploaded).length : 0;
  const isEditable = !['Paid', 'Complete'].includes(customer.status);
  const isUserOwner = customer.user_id === user?.id;
  const canSubmitApplication = (customer.status === 'Draft' || customer.status === 'Returned' || customer.status === 'Need more info' || customer.status === 'Rejected') && isUserOwner && mandatoryDocumentsUploaded;

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{customer.name}</h1>
            <p className="text-muted-foreground">
              {customer.company} • {customer.licenseType} License • Created on {formatDate(customer.created_at || new Date())}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            {canSubmitApplication && (
              <Button 
                onClick={handleSubmitApplication}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit the Application
              </Button>
            )}
            
            {isAdmin && (
              <CustomerActionButtons 
                status={customer.status}
                isAdmin={isAdmin}
                isUserOwner={isUserOwner}
                mandatoryDocumentsUploaded={mandatoryDocumentsUploaded && documentChecklistComplete}
                onStatusChange={handleStatusChange}
              />
            )}
          </div>
        </div>

        {uploadedDocumentsCount > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4" />
                File Storage Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">
                    {uploadedDocumentsCount} document{uploadedDocumentsCount !== 1 ? 's' : ''} uploaded
                  </span>
                </div>
                
                <Badge variant="default" className="text-xs">
                  Supabase Storage
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1 md:col-span-1 space-y-4">
            <CustomerStatusCard 
              status={customer.status} 
              amount={customer.amount} 
              comments={customer.comments || []}
              onStatusChange={handleStatusChange}
            />
            
            <StatusHistoryCard statusHistory={customer.statusHistory || []} />
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Application Details</TabsTrigger>
                <TabsTrigger value="documents">
                  Documents {uploadedDocumentsCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {uploadedDocumentsCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="details">
                <CustomerDetailsForm 
                  customer={customer}
                  isEditable={isEditable}
                  isUserOwner={isUserOwner}
                  onUpdate={handleUpdateCustomer}
                />
              </TabsContent>
              
              <TabsContent value="documents">
                {customer.status === 'Draft' && customer.name === '' ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-lg font-medium">Save Application First</p>
                        <p className="text-sm mt-2">Complete and save the application details before uploading documents.</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    <CategorizedDocumentUpload 
                      documents={customer.documents || []}
                      customerId={customer.id}
                      customerLicenseType={customer.licenseType}
                      customerStatus={customer.status}
                      onUpload={handleDocumentUpload}
                    />
                    
                    <CustomDocumentUpload 
                      customerId={customer.id}
                      customerStatus={customer.status}
                      onDocumentAdded={refreshData}
                    />
                  </div>
                )}
                
                {/* Admin Document Checklist */}
                {isAdmin && (
                  <div className="mt-6">
                    <DocumentCompleteCheckbox
                      isChecked={documentChecklistComplete}
                      onCheckedChange={handleDocumentChecklistChange}
                      documents={customer.documents || []}
                      disabled={customer.status === 'Complete' || customer.status === 'Paid'}
                    />
                  </div>
                )}
                
                {!mandatoryDocumentsUploaded && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ All mandatory documents must be uploaded before the application can be submitted.
                    </p>
                  </div>
                )}
                
                {isAdmin && mandatoryDocumentsUploaded && !documentChecklistComplete && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-blue-800 text-sm">
                      📋 Please review all documents and confirm completion using the checklist above before advancing the application status.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  };

export default CustomerDetail;
