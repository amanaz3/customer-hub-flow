
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import DocumentUpload from '@/components/Customer/DocumentUpload';
import { useCustomers, Status } from '@/contexts/CustomerContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const { 
    getCustomerById, 
    updateCustomer, 
    uploadDocument, 
    updateCustomerStatus 
  } = useCustomers();
  
  const customer = getCustomerById(id || '');
  
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    mobile: customer?.mobile || '',
    company: customer?.company || '',
    email: customer?.email || '',
    leadSource: customer?.leadSource || 'Website',
    amount: customer?.amount.toString() || '',
  });
  
  const [comment, setComment] = useState('');
  
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleUpdateCustomer = () => {
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

  const handleStatusChange = (status: Status) => {
    if (!customer) return;
    
    updateCustomerStatus(customer.id, status, comment);
    
    toast({
      title: "Status Updated",
      description: `Case status changed to ${status}`,
    });
    
    setComment('');
    
    if (status === 'Completed') {
      navigate('/completed');
    }
  };

  // Check if all mandatory documents are uploaded
  const mandatoryDocumentsUploaded = customer.documents
    .filter(doc => doc.isMandatory)
    .every(doc => doc.isUploaded);

  const isEditable = customer.status !== 'Completed';
  const canChangeStatus = isAdmin || (customer.status === 'Returned');
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
          <div className="mt-4 md:mt-0 space-x-2">
            {isAdmin && customer.status !== 'Completed' && (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">Return to User</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Return Case to User</AlertDialogTitle>
                      <AlertDialogDescription>
                        Please provide a comment explaining what needs to be corrected.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Enter your comments..."
                      className="my-4"
                    />
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleStatusChange('Returned')}
                        disabled={!comment.trim()}
                      >
                        Return to User
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="default" 
                      disabled={!mandatoryDocumentsUploaded}
                    >
                      Submit to Bank
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Submit Case to Bank</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to submit this case to the bank?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Optional comments..."
                      className="my-4"
                    />
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleStatusChange('Submitted to Bank')}>
                        Submit to Bank
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            
            {isAdmin && customer.status === 'Submitted to Bank' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="default">Mark as Completed</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Mark Case as Completed</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to mark this case as completed? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Optional comments..."
                    className="my-4"
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleStatusChange('Completed')}>
                      Mark as Completed
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            
            {!isAdmin && customer.status === 'Returned' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="default" 
                    disabled={!mandatoryDocumentsUploaded}
                  >
                    Resubmit
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Resubmit Case</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to resubmit this case? Make sure you've addressed all the feedback.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleStatusChange('Pending')}>
                      Resubmit Case
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1 md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Case Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Current Status</Label>
                    <div className={`text-lg font-semibold mt-1 ${
                      customer.status === 'Pending' ? 'text-status-pending' :
                      customer.status === 'Returned' ? 'text-status-returned' :
                      customer.status === 'Submitted to Bank' ? 'text-status-submitted' :
                      'text-status-completed'
                    }`}>
                      {customer.status}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Amount</Label>
                    <div className="text-lg font-semibold mt-1">
                      {formatCurrency(customer.amount)}
                    </div>
                  </div>
                  
                  {customer.comments.length > 0 && (
                    <div>
                      <Label>Comments</Label>
                      <ul className="mt-2 space-y-2">
                        {customer.comments.map((comment, index) => (
                          <li key={index} className="p-2 bg-gray-50 rounded-md text-sm">
                            {comment}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="col-span-1 md:col-span-2">
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Customer Details</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Customer Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="mt-1"
                          disabled={!isEditable || !isUserOwner}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="mobile">Mobile</Label>
                        <Input
                          id="mobile"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleInputChange}
                          className="mt-1"
                          disabled={!isEditable || !isUserOwner}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="company">Company Name</Label>
                        <Input
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          className="mt-1"
                          disabled={!isEditable || !isUserOwner}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="mt-1"
                          disabled={!isEditable || !isUserOwner}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="leadSource">Lead Source</Label>
                        <Select
                          disabled={!isEditable || !isUserOwner}
                          value={formData.leadSource}
                          onValueChange={(value) => handleSelectChange('leadSource', value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select lead source" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Website">Website</SelectItem>
                            <SelectItem value="Referral">Referral</SelectItem>
                            <SelectItem value="Social Media">Social Media</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                          id="amount"
                          name="amount"
                          value={formData.amount}
                          onChange={handleInputChange}
                          className="mt-1"
                          disabled={!isEditable || !isUserOwner}
                        />
                      </div>
                    </div>
                    
                    {isEditable && isUserOwner && (
                      <div className="mt-6 flex justify-end">
                        <Button onClick={handleUpdateCustomer}>
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
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
                      ⚠️ All mandatory documents must be uploaded before the case can be submitted to the bank.
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
