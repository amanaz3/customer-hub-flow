
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import DocumentUpload from '@/components/Customer/DocumentUpload';
import CustomerStatusCard from '@/components/Customer/CustomerStatusCard';
import CustomerDetailsForm from '@/components/Customer/CustomerDetailsForm';
import CustomerActionButtons from '@/components/Customer/CustomerActionButtons';
import StatusHistoryCard from '@/components/Customer/StatusHistoryCard';
import { useCustomers, Status } from '@/contexts/CustomerContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';

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
    markPaymentReceived
  } = useCustomers();
  
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
    amount: string;
  }) => {
    if (!customer) return;
    
    updateCustomer(customer.id, {
      name: formData.name,
      mobile: formData.mobile,
      company: formData.company,
      email: formData.email,
      leadSource: formData.leadSource as any,
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
      user.name, 
      user.role
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
    
    markPaymentReceived(customer.id, user.name);
    
    toast({
      title: "Payment Confirmed",
      description: "Application marked as paid",
    });
    
    navigate('/completed');
  };

  // Check if all mandatory documents are uploaded
  const mandatoryDocumentsUploaded = customer.documents
    .filter(doc => doc.isMandatory)
    .every(doc => doc.isUploaded);

  const isEditable = !['Paid', 'Complete'].includes(customer.status);
  const isUserOwner = customer.userId === user?.id;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{customer.name}</h1>
            <p className="text-muted-foreground">
              Created on {formatDate(customer.createdAt)}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <CustomerActionButtons 
              status={customer.status}
              isAdmin={isAdmin}
              isUserOwner={isUserOwner}
              mandatoryDocumentsUploaded={mandatoryDocumentsUploaded}
              onStatusChange={handleStatusChange}
              onPaymentReceived={handlePaymentReceived}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1 md:col-span-1 space-y-4">
            <CustomerStatusCard 
              status={customer.status} 
              amount={customer.amount} 
              comments={customer.comments}
              paymentReceived={customer.paymentReceived}
              paymentDate={customer.paymentDate}
            />
            
            <StatusHistoryCard statusHistory={customer.statusHistory} />
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Application Details</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
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
                <DocumentUpload 
                  documents={customer.documents}
                  customerId={customer.id}
                  onUpload={handleDocumentUpload}
                />
                
                {!mandatoryDocumentsUploaded && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ All mandatory documents must be uploaded before the application can be processed.
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
