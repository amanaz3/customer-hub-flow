import React, { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useCustomer } from '@/contexts/CustomerContext';
import { supabase } from '@/lib/supabase';
import { Document } from '@/types/customer';
import DocumentUpload from './DocumentUpload';
import { ProductionRateLimit } from '@/utils/productionRateLimit';
import FeatureAnalytics from '@/utils/featureAnalytics';
import ErrorTracker from '@/utils/errorTracking';
import PerformanceMonitor from '@/utils/performanceMonitoring';
import { validateEmail, validatePhoneNumber, validateCompanyName, sanitizeInput } from '@/utils/inputValidation';

// Form validation schema
const formSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z.string()
    .email("Enter a valid email address")
    .max(254, "Email address too long"),
  mobile: z.string()
    .min(10, "Enter a valid phone number")
    .max(20, "Phone number too long"),
  company: z.string()
    .min(1, "Company name is required")
    .max(200, "Company name too long"),
  amount: z.number()
    .min(0.01, "Amount must be greater than 0")
    .max(10000000, "Amount cannot exceed 10,000,000"),
  license_type: z.enum(['Mainland', 'Freezone', 'Offshore']),
  lead_source: z.enum(['Website', 'Referral', 'Social Media', 'Other']),
  annual_turnover: z.number()
    .min(0.01, "Annual turnover must be greater than 0")
    .max(1000000000, "Annual turnover cannot exceed 1,000,000,000"),
  jurisdiction: z.string().optional(),
  any_suitable_bank: z.boolean().default(false),
  bank_preference_1: z.string().optional(),
  bank_preference_2: z.string().optional(),
  bank_preference_3: z.string().optional(),
  customer_notes: z.string().optional(),
  product_id: z.string().optional(),
  no_of_shareholders: z.number()
    .min(1, "Number of shareholders must be at least 1")
    .max(10, "Number of shareholders cannot exceed 10")
    .default(1),
});

type FormData = z.infer<typeof formSchema>;

interface ComprehensiveCustomerFormProps {
  onSuccess?: () => void;
  initialData?: Partial<FormData>;
}

const ComprehensiveCustomerForm: React.FC<ComprehensiveCustomerFormProps> = ({
  onSuccess,
  initialData
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [createdCustomerId, setCreatedCustomerId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const { uploadDocument } = useCustomer();

  // Fetch all active products for the dropdown
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
      
      return data || [];
    }
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      mobile: '',
      company: '',
      amount: 0,
      license_type: 'Mainland',
      lead_source: 'Website',
      annual_turnover: 0,
      jurisdiction: '',
      any_suitable_bank: false,
      bank_preference_1: '',
      bank_preference_2: '',
      bank_preference_3: '',
      customer_notes: '',
      product_id: undefined,
      no_of_shareholders: 1,
      ...initialData
    },
  });

  const watchAnySuitableBank = form.watch('any_suitable_bank');
  const watchLicenseType = form.watch('license_type');
  const watchShareholderCount = form.watch('no_of_shareholders');

  // Create default documents when license type changes
  const createDefaultDocuments = useCallback(async (customerId: string, licenseType: string, shareholderCount: number = 1) => {
    interface DefaultDocument {
      name: string;
      is_mandatory: boolean;
      category: string;
      requires_license_type?: string;
    }

    const defaultDocuments: DefaultDocument[] = [
      // Mandatory documents for all license types
      { name: 'Passport Copy', is_mandatory: true, category: 'mandatory' },
      { name: 'Emirates ID Copy', is_mandatory: true, category: 'mandatory' },
      { name: 'Trade License Copy', is_mandatory: true, category: 'mandatory' },
      { name: 'Memorandum of Association (MOA)', is_mandatory: true, category: 'mandatory' },
      { name: 'Bank Statements (Last 6 months)', is_mandatory: true, category: 'mandatory' },
      
      // Supporting documents (optional but recommended)
      { name: 'Company Profile', is_mandatory: false, category: 'supporting' },
      { name: 'Audited Financial Statements', is_mandatory: false, category: 'supporting' },
      { name: 'Business Plan', is_mandatory: false, category: 'supporting' },
      { name: 'Proof of Address', is_mandatory: false, category: 'supporting' },
    ];

    // Generate multiple signatory document sets based on number of shareholders
    for (let i = 1; i <= shareholderCount; i++) {
      const shareholderLabel = shareholderCount > 1 ? ` (Shareholder ${i})` : '';
      // Segregate documents into different categories
      defaultDocuments.push(
        { name: `Authorized Signatory Passport${shareholderLabel}`, is_mandatory: false, category: 'passport_docs' },
        { name: `Authorized Signatory Emirates ID${shareholderLabel}`, is_mandatory: false, category: 'emirates_id_docs' },
        { name: `Bank Statement${shareholderLabel}`, is_mandatory: false, category: 'bank_statement_docs' },
      );
    }

    // Add Freezone-specific documents if applicable
    if (licenseType === 'Freezone') {
      defaultDocuments.push(
        { name: 'Freezone License Copy', is_mandatory: true, category: 'freezone', requires_license_type: 'Freezone' },
        { name: 'Lease Agreement (Freezone)', is_mandatory: true, category: 'freezone', requires_license_type: 'Freezone' },
        { name: 'No Objection Certificate', is_mandatory: false, category: 'freezone', requires_license_type: 'Freezone' }
      );
    }

    const documentsToInsert = defaultDocuments.map(doc => ({
      customer_id: customerId,
      name: doc.name,
      is_mandatory: doc.is_mandatory,
      category: doc.category as "mandatory" | "freezone" | "supporting" | "signatory",
      requires_license_type: doc.requires_license_type ? doc.requires_license_type as "Mainland" | "Freezone" | "Offshore" : null,
      is_uploaded: false,
      file_path: null
    }));

    const { data, error } = await supabase
      .from('documents')
      .insert(documentsToInsert)
      .select();

    if (error) {
      console.error('Error creating default documents:', error);
      throw error;
    }

    return data;
  }, []);

  const validateForm = useCallback((data: FormData): string[] => {
    const errors: string[] = [];
    
    if (!validateEmail(data.email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (!validatePhoneNumber(data.mobile)) {
      errors.push('Please enter a valid phone number');
    }
    
    if (!validateCompanyName(data.company)) {
      errors.push('Please enter a valid company name');
    }
    
    return errors;
  }, []);

  const handleSubmit = useCallback(async (data: FormData) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to create customers.',
        variant: 'destructive',
      });
      return;
    }

    // Rate limiting check
    const rateLimitResult = ProductionRateLimit.checkRateLimit(user.id, 'customerCreate');
    if (!rateLimitResult.allowed) {
      toast({
        title: 'Rate Limited',
        description: `Too many customer creation attempts. Please wait before trying again.`,
        variant: 'destructive',
      });
      return;
    }

    // Form validation
    const validationErrors = validateForm(data);
    if (validationErrors.length > 0) {
      toast({
        title: 'Validation Error',
        description: validationErrors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    PerformanceMonitor.startTiming('customer-create');

    try {
      FeatureAnalytics.trackUserAction('customer_create_attempt', {
        license_type: data.license_type,
        lead_source: data.lead_source,
        amount: data.amount
      }, user.id);

      // Sanitize inputs
      const sanitizedData = {
        name: sanitizeInput(data.name.trim()),
        email: data.email.toLowerCase().trim(),
        mobile: data.mobile.replace(/\s/g, ''),
        company: sanitizeInput(data.company.trim()),
        amount: data.amount,
        license_type: data.license_type,
        lead_source: data.lead_source,
        annual_turnover: data.annual_turnover,
        jurisdiction: data.jurisdiction ? sanitizeInput(data.jurisdiction.trim()) : null,
        preferred_bank: data.any_suitable_bank ? 'Any Suitable Bank' : [
          data.bank_preference_1?.trim(),
          data.bank_preference_2?.trim(), 
          data.bank_preference_3?.trim()
        ].filter(Boolean).join(', ') || null,
        customer_notes: data.customer_notes ? sanitizeInput(data.customer_notes.trim()) : null,
        product_id: data.product_id || null,
        user_id: user.id,
        status: 'Draft' as const
      };

      const { data: customer, error } = await supabase
        .from('customers')
        .insert([sanitizedData])
        .select()
        .single();

      if (error) {
        console.error('Customer creation error:', error);
        ErrorTracker.captureError(error, {
          userId: user.id,
          userRole: user.profile?.role,
          page: 'customer_create',
          customerContext: {
            action: 'create',
            company: data.company
          }
        });

        FeatureAnalytics.trackUserAction('customer_create_failed', {
          error: error.message
        }, user.id);

        toast({
          title: 'Error Creating Customer',
          description: error.message || 'Failed to create customer. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Create default documents
      const defaultDocs = await createDefaultDocuments(customer.id, data.license_type, data.no_of_shareholders);
      setDocuments(defaultDocs);
      setCreatedCustomerId(customer.id);

      PerformanceMonitor.endTiming('customer-create');
      
      FeatureAnalytics.trackUserAction('customer_create_success', {
        customer_id: customer.id,
        license_type: data.license_type,
        lead_source: data.lead_source
      }, user.id);

      FeatureAnalytics.trackCustomerWorkflow('created', customer.id, {
        license_type: data.license_type,
        amount: data.amount
      });

      toast({
        title: 'Customer Created',
        description: `${data.name} has been successfully created. You can now upload documents.`,
      });

      // Move to documents tab and refresh parent component
      setActiveTab('documents');
      
      // Trigger refresh in parent to update customer list
      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error('Unexpected error:', error);
      ErrorTracker.captureError(error as Error, {
        userId: user.id,
        userRole: user.profile?.role,
        page: 'customer_create'
      });

      FeatureAnalytics.trackUserAction('customer_create_failed', {
        error: 'Unexpected error'
      }, user.id);

      toast({
        title: 'Unexpected Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, toast, validateForm, createDefaultDocuments]);

  const handleDocumentUpload = useCallback(async (documentId: string, filePath: string) => {
    if (!createdCustomerId) return;
    
    try {
      await uploadDocument(createdCustomerId, documentId, filePath);
      
      // Update local documents state
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, is_uploaded: true, file_path: filePath }
          : doc
      ));
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Upload Error',
        description: 'Failed to upload document. Please try again.',
        variant: 'destructive',
      });
    }
  }, [createdCustomerId, uploadDocument, toast]);

  const handleFinish = useCallback(() => {
    // Always call onSuccess to trigger refresh
    if (onSuccess) {
      onSuccess();
    }
    
    toast({
      title: 'Application Complete',
      description: 'Customer application has been created successfully.',
    });
  }, [onSuccess, toast]);

  const mandatoryDocuments = documents.filter(doc => doc.is_mandatory);
  const mandatoryDocumentsUploaded = mandatoryDocuments.every(doc => doc.is_uploaded);
  const allMandatoryUploaded = mandatoryDocuments.length > 0 && mandatoryDocumentsUploaded;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>New Application</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Customer Details</TabsTrigger>
            <TabsTrigger value="documents" disabled={!createdCustomerId}>
              Documents 
              {createdCustomerId && (
                <Badge variant={allMandatoryUploaded ? "default" : "secondary"} className="ml-2">
                  {documents.filter(doc => doc.is_uploaded).length}/{documents.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      {...form.register('name')}
                      disabled={isSubmitting}
                      required
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register('email')}
                      disabled={isSubmitting}
                      required
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile *</Label>
                    <Input
                      id="mobile"
                      {...form.register('mobile')}
                      disabled={isSubmitting}
                      required
                    />
                    {form.formState.errors.mobile && (
                      <p className="text-sm text-red-600">{form.formState.errors.mobile.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company *</Label>
                    <Input
                      id="company"
                      {...form.register('company')}
                      disabled={isSubmitting}
                      required
                    />
                    {form.formState.errors.company && (
                      <p className="text-sm text-red-600">{form.formState.errors.company.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Business Details */}
              <div>
                <h3 className="text-lg font-medium mb-4">Business Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="license_type">License Type *</Label>
                    <Select
                      value={form.watch('license_type')}
                      onValueChange={(value) => form.setValue('license_type', value as any)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mainland">Mainland</SelectItem>
                        <SelectItem value="Freezone">Freezone</SelectItem>
                        <SelectItem value="Offshore">Offshore</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lead_source">Lead Source *</Label>
                    <Select
                      value={form.watch('lead_source')}
                      onValueChange={(value) => form.setValue('lead_source', value as any)}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Website">Website</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Social Media">Social Media</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product">Product</Label>
                    <Select
                      value={form.watch('product_id') || undefined}
                      onValueChange={(value) => form.setValue('product_id', value === 'none' ? undefined : value)}
                      disabled={isSubmitting || productsLoading}
                    >
                      <SelectTrigger className="bg-popover/95 backdrop-blur-sm border border-border z-50">
                        <SelectValue placeholder={productsLoading ? "Loading products..." : "Select a product (optional)"} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover/95 backdrop-blur-sm border border-border z-50">
                        <SelectItem value="none">No product selected</SelectItem>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{product.name}</span>
                              {product.description && (
                                <span className="text-xs text-muted-foreground">{product.description}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {products.length === 0 && !productsLoading && (
                      <p className="text-xs text-muted-foreground">No products available.</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (AED) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      {...form.register('amount', { valueAsNumber: true })}
                      disabled={isSubmitting}
                      required
                    />
                    {form.formState.errors.amount && (
                      <p className="text-sm text-red-600">{form.formState.errors.amount.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="annual_turnover">Annual Turnover (AED) *</Label>
                    <Input
                      id="annual_turnover"
                      type="number"
                      min="0"
                      step="0.01"
                      {...form.register('annual_turnover', { valueAsNumber: true })}
                      disabled={isSubmitting}
                      required
                    />
                    {form.formState.errors.annual_turnover && (
                      <p className="text-sm text-red-600">{form.formState.errors.annual_turnover.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jurisdiction">Jurisdiction</Label>
                    <select
                      id="jurisdiction"
                      {...form.register('jurisdiction')}
                      disabled={isSubmitting}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select jurisdiction (optional)</option>
                      <option value="Dubai">Dubai</option>
                      <option value="Abu Dhabi">Abu Dhabi</option>
                      <option value="Sharjah">Sharjah</option>
                      <option value="Ajman">Ajman</option>
                      <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                      <option value="Fujairah">Fujairah</option>
                      <option value="Umm Al Quwain">Umm Al Quwain</option>
                      <option value="Mainland">Mainland</option>
                      <option value="Freezone">Freezone</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="no_of_shareholders">Number of Shareholders *</Label>
                    <Input
                      id="no_of_shareholders"
                      type="number"
                      min="1"
                      max="10"
                      {...form.register('no_of_shareholders', { valueAsNumber: true })}
                      disabled={isSubmitting}
                      required
                    />
                    {form.formState.errors.no_of_shareholders && (
                      <p className="text-sm text-red-600">{form.formState.errors.no_of_shareholders.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Number of shareholders will determine how many signatory document sets are created (1-10)
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Banking Preferences */}
              <div>
                <h3 className="text-lg font-medium mb-4">Banking Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="any_suitable_bank"
                      checked={watchAnySuitableBank}
                      onCheckedChange={(checked) => form.setValue('any_suitable_bank', !!checked)}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor="any_suitable_bank">Any Suitable Bank</Label>
                  </div>

                  {!watchAnySuitableBank && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="bank_preference_1">First Preference</Label>
                        <Input
                          id="bank_preference_1"
                          {...form.register('bank_preference_1')}
                          placeholder="Enter first preference bank"
                          disabled={isSubmitting}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bank_preference_2">Second Preference</Label>
                        <Input
                          id="bank_preference_2"
                          {...form.register('bank_preference_2')}
                          placeholder="Enter second preference bank"
                          disabled={isSubmitting}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bank_preference_3">Third Preference</Label>
                        <Input
                          id="bank_preference_3"
                          {...form.register('bank_preference_3')}
                          placeholder="Enter third preference bank"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Additional Notes */}
              <div>
                <h3 className="text-lg font-medium mb-4">Additional Information</h3>
                <div className="space-y-2">
                  <Label htmlFor="customer_notes">Notes</Label>
                  <Textarea
                    id="customer_notes"
                    {...form.register('customer_notes')}
                    disabled={isSubmitting}
                    rows={3}
                    placeholder="Any additional notes or requirements..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 pb-8">
                <Button
                  type="submit"
                  disabled={isSubmitting || !!createdCustomerId}
                  className="min-w-[120px]"
                  size="lg"
                >
                  {isSubmitting ? 'Creating...' : createdCustomerId ? 'Customer Created' : 'Create Customer'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            {createdCustomerId && documents.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Document Upload</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload required documents for the customer application
                    </p>
                  </div>
                  <Badge variant={allMandatoryUploaded ? "default" : "secondary"}>
                    {documents.filter(doc => doc.is_uploaded).length}/{documents.length} Uploaded
                  </Badge>
                </div>

                <DocumentUpload
                  documents={documents}
                  customerId={createdCustomerId}
                  onUpload={handleDocumentUpload}
                />

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('details')}
                    disabled={isSubmitting}
                  >
                    Back to Details
                  </Button>
                  <Button
                    onClick={handleFinish}
                    disabled={isSubmitting}
                    className="min-w-[120px]"
                  >
                    {allMandatoryUploaded ? 'Complete Application' : 'Save & Continue Later'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Please create the customer first to upload documents.</p>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('details')}
                  className="mt-4"
                >
                  Go to Customer Details
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ComprehensiveCustomerForm;