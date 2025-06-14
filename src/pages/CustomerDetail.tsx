import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import CategorizedDocumentUpload from '@/components/Customer/CategorizedDocumentUpload';
import CustomerStatusCard from '@/components/Customer/CustomerStatusCard';
import CustomerDetailsForm from '@/components/Customer/CustomerDetailsForm';
import CustomerActionButtons from '@/components/Customer/CustomerActionButtons';
import StatusHistoryCard from '@/components/Customer/StatusHistoryCard';
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
    markPaymentReceived,
    submitToAdmin
  } = useCustomer();
  
  const customer = getCustomerById(id || '');
  
  if (!customer) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold">Customer not found</h1>
          <Button
            onClick={() => navigate('/customers')}
            className="mt-4"
          >
            Back to Customers
          </Button>
        </div>
      </MainLayout>
    );
  }

  const handleUpdateCustomer = (formData: {
    name: string;
    mobile: string;
    company: string;
    email: string;
    leadSource: string;
    licenseType: string;
    amount: string;
  }) => {
    if (!customer) return;
    
    updateCustomer(customer.id, {
      name: formData.name,
      mobile: formData.mobile,
      company: formData.company,
      email: formData.email,
      leadSource: formData.leadSource as any,
      licenseType: formData.licenseType as any,
      amount: parseFloat(formData.amount),
    });
    
    toast({
      title: "Success",
      description: "Customer information updated",
    });
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
      user.profile?.name || user.email || 'Unknown User', 
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

  const handlePaymentReceived = () => {
    if (!customer || !user) return;
    
    markPaymentReceived(customer.id, user.profile?.name || user.email || 'Unknown User');
    
    toast({
      title: "Payment Confirmed",
      description: "Application marked as paid",
    });
    
    navigate('/completed');
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
  const canSubmitApplication = (customer.status === 'Draft' || customer.status === 'Returned') && isUserOwner && mandatoryDocumentsUploaded;

  return (
    <MainLayout>
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
                mandatoryDocumentsUploaded={mandatoryDocumentsUploaded}
                onStatusChange={handleStatusChange}
                onPaymentReceived={handlePaymentReceived}
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
              paymentReceived={customer.payment_received}
              paymentDate={customer.payment_date}
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
                <CategorizedDocumentUpload 
                  documents={customer.documents || []}
                  customerId={customer.id}
                  customerLicenseType={customer.licenseType}
                  onUpload={handleDocumentUpload}
                />
                
                {!mandatoryDocumentsUploaded && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ All mandatory documents must be uploaded before the application can be submitted.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CustomerDetail;
