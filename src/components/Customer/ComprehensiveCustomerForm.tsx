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
import { CreateCompanyDialog } from './CreateCompanyDialog';
import { Building2, Plus, Users } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

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
  product_id: z.string().min(1, "Please select a product/service"),
  no_of_shareholders: z.number()
    .min(1, "Number of shareholders must be at least 1")
    .max(10, "Number of shareholders cannot exceed 10")
    .default(1),
  // Bookkeeping-specific fields
  accounting_software: z.string().optional(),
  monthly_transactions: z.string().optional(),
  vat_registered: z.boolean().optional(),
  bank_accounts_count: z.number().optional(),
  employees_count: z.number().optional(),
  service_start_date: z.string().optional(),
  has_previous_records: z.boolean().optional(),
  reporting_frequency: z.string().optional(),
  // Corporate tax filing fields
  tax_year_period: z.string().optional(),
  first_time_filing: z.boolean().optional(),
  tax_registration_number: z.string().optional(),
  financial_year_end_date: z.string().optional(),
  has_foreign_operations: z.boolean().optional(),
  tax_exemptions: z.string().optional(),
  previous_tax_consultant: z.string().optional(),
  filing_deadline: z.string().optional(),
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
  const [customerMode, setCustomerMode] = useState<'new' | 'existing'>('new');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [existingCustomers, setExistingCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const { user, isAdmin } = useAuth();
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
      product_id: '',
      no_of_shareholders: 1,
      // Bookkeeping defaults
      accounting_software: '',
      monthly_transactions: '',
      vat_registered: false,
      bank_accounts_count: 1,
      employees_count: 0,
      service_start_date: '',
      has_previous_records: false,
      reporting_frequency: 'Monthly',
      // Tax filing defaults
      tax_year_period: '',
      first_time_filing: false,
      tax_registration_number: '',
      financial_year_end_date: '',
      has_foreign_operations: false,
      tax_exemptions: '',
      previous_tax_consultant: '',
      filing_deadline: '',
      ...initialData
    },
  });

  const watchAnySuitableBank = form.watch('any_suitable_bank');
  const watchLicenseType = form.watch('license_type');
  const watchShareholderCount = form.watch('no_of_shareholders');
  const watchProductId = form.watch('product_id');

  // Check which product type is selected
  const selectedProduct = products.find(p => p.id === watchProductId);
  const selectedProductName = selectedProduct?.name.toLowerCase() || '';
  const selectedProductNameNoSpaces = selectedProductName.replace(/\s+/g, '');
  
  const hasBookkeeping = selectedProductNameNoSpaces.includes('bookkeeping') || 
                         selectedProductNameNoSpaces.includes('book') || 
                         selectedProductName.includes('accounting');
  const hasCompanyFormation = selectedProductName.includes('company') || 
                              selectedProductName.includes('formation') || 
                              selectedProductName.includes('license');
  const hasBankAccount = selectedProductName.includes('bank');
  const hasTaxFiling = selectedProductName.includes('tax') || 
                       selectedProductName.includes('filing');

  // Fetch existing customers for selection
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        let query = supabase
          .from('customers')
          .select('id, company, name, email, mobile')
          .order('company', { ascending: true });

        // Non-admin users can only see their own customers
        if (!isAdmin && user?.id) {
          query = query.eq('user_id', user.id);
        }

        const { data, error } = await query;
        if (error) throw error;
        setExistingCustomers(data || []);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };

    if (user?.id) {
      fetchCustomers();
    }
  }, [user?.id, isAdmin]);

  // Handle existing customer selection
  const handleCustomerSelect = useCallback((customerId: string) => {
    setSelectedCustomerId(customerId);
    const customer = existingCustomers.find(c => c.id === customerId);
    if (customer) {
      form.setValue('company', customer.company);
      form.setValue('name', customer.name);
      form.setValue('email', customer.email);
      form.setValue('mobile', customer.mobile);
    }
  }, [existingCustomers, form]);

  // Handle new company creation from dialog
  const handleCompanyCreated = useCallback((customer: any) => {
    setExistingCustomers(prev => [...prev, customer]);
    setSelectedCustomerId(customer.id);
    form.setValue('company', customer.company);
    form.setValue('name', customer.name);
    form.setValue('email', customer.email);
    form.setValue('mobile', customer.mobile);
    toast({
      title: 'Success',
      description: 'Company added to the list',
    });
  }, [form, toast]);

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
        description: 'Please log in to create applications.',
        variant: 'destructive',
      });
      return;
    }

    // Rate limiting check
    const rateLimitResult = ProductionRateLimit.checkRateLimit(user.id, 'customerCreate');
    if (!rateLimitResult.allowed) {
      toast({
        title: 'Rate Limited',
        description: `Too many creation attempts. Please wait before trying again.`,
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
    PerformanceMonitor.startTiming('application-create');

    try {
      FeatureAnalytics.trackUserAction('application_create_attempt', {
        license_type: data.license_type,
        lead_source: data.lead_source,
        amount: data.amount
      }, user.id);

      // Step 1: Find or create customer
      let customerId = selectedCustomerId;
      
      if (customerMode === 'new' || !selectedCustomerId) {
        // Create new customer with basic info + license_type
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .insert([{
            name: sanitizeInput(data.name.trim()),
            email: data.email.toLowerCase().trim(),
            mobile: data.mobile.replace(/\s/g, ''),
            company: sanitizeInput(data.company.trim()),
            license_type: data.license_type, // license_type stays with customer
            user_id: user.id,
            lead_source: 'Website', // Default value
            amount: 0, // Default value, actual amount goes to application
            status: 'Draft',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (customerError) {
          console.error('Customer creation error:', customerError);
          throw customerError;
        }

        customerId = customer.id;
      }

      // Step 2: Create application with application-specific data
      const { data: application, error: appError } = await supabase
        .from('account_applications')
        .insert([{
          customer_id: customerId,
          application_type: 'license',
          submission_source: 'web_form',
          status: 'draft',
          application_data: {
            lead_source: data.lead_source,
            amount: data.amount,
            preferred_bank: data.any_suitable_bank ? 'Any Suitable Bank' : [
              data.bank_preference_1?.trim(),
              data.bank_preference_2?.trim(), 
              data.bank_preference_3?.trim()
            ].filter(Boolean).join(', ') || null,
            annual_turnover: data.annual_turnover,
            jurisdiction: data.jurisdiction ? sanitizeInput(data.jurisdiction.trim()) : null,
            customer_notes: data.customer_notes ? sanitizeInput(data.customer_notes.trim()) : null,
            product_id: data.product_id,
            user_id: user.id,
            // Bookkeeping-specific fields
            ...(data.accounting_software && { accounting_software: data.accounting_software }),
            ...(data.monthly_transactions && { monthly_transactions: data.monthly_transactions }),
            ...(data.vat_registered !== undefined && { vat_registered: data.vat_registered }),
            ...(data.bank_accounts_count && { bank_accounts_count: data.bank_accounts_count }),
            ...(data.employees_count !== undefined && { employees_count: data.employees_count }),
            ...(data.service_start_date && { service_start_date: data.service_start_date }),
            ...(data.has_previous_records !== undefined && { has_previous_records: data.has_previous_records }),
            ...(data.reporting_frequency && { reporting_frequency: data.reporting_frequency }),
            // Corporate tax filing fields
            ...(data.tax_year_period && { tax_year_period: data.tax_year_period }),
            ...(data.first_time_filing !== undefined && { first_time_filing: data.first_time_filing }),
            ...(data.tax_registration_number && { tax_registration_number: data.tax_registration_number }),
            ...(data.financial_year_end_date && { financial_year_end_date: data.financial_year_end_date }),
            ...(data.has_foreign_operations !== undefined && { has_foreign_operations: data.has_foreign_operations }),
            ...(data.tax_exemptions && { tax_exemptions: data.tax_exemptions }),
            ...(data.previous_tax_consultant && { previous_tax_consultant: data.previous_tax_consultant }),
            ...(data.filing_deadline && { filing_deadline: data.filing_deadline }),
          }
        }])
        .select()
        .single();

      if (appError) {
        console.error('Application creation error:', appError);
        throw appError;
      }

      // Step 3: Create default application documents
      const defaultDocTypes = [
        'Passport Copy',
        'Emirates ID Copy',
        'Trade License Copy',
        'Memorandum of Association (MOA)',
        'Bank Statements (Last 6 months)',
        'Company Profile',
        'Audited Financial Statements',
        'Business Plan',
        'Proof of Address'
      ];

      // Add shareholder documents
      for (let i = 1; i <= data.no_of_shareholders; i++) {
        const shareholderLabel = data.no_of_shareholders > 1 ? ` (Shareholder ${i})` : '';
        defaultDocTypes.push(
          `Authorized Signatory Passport${shareholderLabel}`,
          `Authorized Signatory Emirates ID${shareholderLabel}`,
          `Bank Statement${shareholderLabel}`
        );
      }

      // Add Freezone-specific documents
      if (data.license_type === 'Freezone') {
        defaultDocTypes.push(
          'Freezone License Copy',
          'Lease Agreement (Freezone)',
          'No Objection Certificate'
        );
      }

      const documentsToInsert = defaultDocTypes.map(docType => ({
        application_id: application.id,
        document_type: docType,
        is_uploaded: false,
        file_path: null
      }));

      const { data: appDocs, error: docsError } = await supabase
        .from('application_documents')
        .insert(documentsToInsert)
        .select();

      if (docsError) {
        console.error('Error creating application documents:', docsError);
        // Don't fail the whole process if documents fail
      }

      // Note: appDocs are application_documents, not customer documents
      // Store application ID for later reference
      setCreatedCustomerId(application.id); // Store application ID for document upload

      PerformanceMonitor.endTiming('application-create');
      
      FeatureAnalytics.trackUserAction('application_create_success', {
        application_id: application.id,
        customer_id: customerId,
        license_type: data.license_type,
        lead_source: data.lead_source
      }, user.id);

      toast({
        title: 'Application Created',
        description: `Application for ${data.company} has been successfully created.`,
      });

      // Move to documents tab
      setActiveTab('documents');
      
      // Trigger refresh in parent
      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error('Unexpected error:', error);
      ErrorTracker.captureError(error as Error, {
        userId: user.id,
        userRole: user.profile?.role,
        page: 'application_create'
      });

      FeatureAnalytics.trackUserAction('application_create_failed', {
        error: 'Unexpected error'
      }, user.id);

      toast({
        title: 'Error',
        description: 'Failed to create application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, toast, validateForm, customerMode, selectedCustomerId]);

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
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">New Application</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pb-2">
        {/* Customer Selection Section */}
        <div className="p-3 border rounded-lg bg-muted/30">
          <div className="space-y-3">
            <div>
              <Label className="text-base font-medium">Customer Selection</Label>
            </div>

            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setCustomerMode('new');
                  setSelectedCustomerId('');
                  form.reset();
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all font-medium",
                  customerMode === 'new'
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Building2 className="h-4 w-4" />
                Create New Company
              </button>
              
              <button
                type="button"
                onClick={() => setCustomerMode('existing')}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all font-medium",
                  customerMode === 'existing'
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Users className="h-4 w-4" />
                Select Existing
              </button>
            </div>

            {customerMode === 'existing' && (
              <div className="space-y-3 pt-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select value={selectedCustomerId} onValueChange={handleCustomerSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer..." />
                      </SelectTrigger>
                      <SelectContent>
                        {existingCustomers.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            No customers found
                          </div>
                        ) : (
                          existingCustomers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.company} - {customer.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowCreateDialog(true)}
                    title="Create new company"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {selectedCustomerId && (
                  <div className="p-3 bg-background rounded-md border">
                    <p className="text-sm font-medium">Selected Customer</p>
                    <p className="text-sm text-muted-foreground">
                      {existingCustomers.find(c => c.id === selectedCustomerId)?.company}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <CreateCompanyDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onCompanyCreated={handleCompanyCreated}
        />

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

          <TabsContent value="details" className="space-y-4 mt-4">
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* Basic Information */}
              <div>
                <h3 className="text-base font-medium mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

              <Separator className="my-3" />

              {/* Business Details */}
              <div>
                <h3 className="text-base font-medium mb-3">Business Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

                  <div className="space-y-3 md:col-span-2">
                    <Label>Product / Service *</Label>
                    {productsLoading ? (
                      <p className="text-sm text-muted-foreground">Loading products...</p>
                    ) : products.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No products available.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {products.map((product) => {
                          const isSelected = watchProductId === product.id;
                          return (
                            <div
                              key={product.id}
                              onClick={() => !isSubmitting && form.setValue('product_id', product.id)}
                              className={cn(
                                "relative p-3 rounded-md border-2 cursor-pointer transition-all duration-200",
                                "hover:shadow-sm",
                                isSelected
                                  ? "border-green-500 bg-green-50 dark:bg-green-950"
                                  : "border-border bg-card hover:border-green-300",
                                isSubmitting && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className={cn(
                                    "font-medium text-sm truncate",
                                    isSelected && "text-green-700 dark:text-green-400"
                                  )}>
                                    {product.name}
                                  </h4>
                                </div>
                                {isSelected && (
                                  <div className="flex-shrink-0">
                                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                      <svg
                                        className="w-3 h-3 text-white"
                                        fill="none"
                                        strokeWidth="2.5"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {form.formState.errors.product_id && (
                      <p className="text-sm text-red-600">{form.formState.errors.product_id.message}</p>
                    )}
                  </div>

                  {/* Conditional fields based on selected products */}
                  
                  {hasCompanyFormation && (
                    <>
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
                    </>
                  )}

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
                </div>
              </div>

              <Separator className="my-3" />

              {/* Bookkeeping-Specific Information */}
              {hasBookkeeping && (
                <>
                  <div>
                    <h3 className="text-base font-medium mb-3">Bookkeeping Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="accounting_software">Current Accounting Software</Label>
                        <Select
                          value={form.watch('accounting_software') || ''}
                          onValueChange={(value) => form.setValue('accounting_software', value)}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select software" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="xero">Xero</SelectItem>
                            <SelectItem value="quickbooks">QuickBooks</SelectItem>
                            <SelectItem value="zoho">Zoho Books</SelectItem>
                            <SelectItem value="sage">Sage</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="monthly_transactions">Monthly Transaction Volume</Label>
                        <Select
                          value={form.watch('monthly_transactions') || ''}
                          onValueChange={(value) => form.setValue('monthly_transactions', value)}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select volume" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0-50">0-50 transactions</SelectItem>
                            <SelectItem value="51-100">51-100 transactions</SelectItem>
                            <SelectItem value="101-250">101-250 transactions</SelectItem>
                            <SelectItem value="251-500">251-500 transactions</SelectItem>
                            <SelectItem value="500+">500+ transactions</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bank_accounts_count">Number of Bank Accounts</Label>
                        <Input
                          id="bank_accounts_count"
                          type="number"
                          min="1"
                          max="20"
                          {...form.register('bank_accounts_count', { valueAsNumber: true })}
                          disabled={isSubmitting}
                          placeholder="How many bank accounts to reconcile?"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="employees_count">Number of Employees (for Payroll)</Label>
                        <Input
                          id="employees_count"
                          type="number"
                          min="0"
                          max="1000"
                          {...form.register('employees_count', { valueAsNumber: true })}
                          disabled={isSubmitting}
                          placeholder="Enter number of employees"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="service_start_date">Preferred Service Start Date</Label>
                        <Input
                          id="service_start_date"
                          type="date"
                          {...form.register('service_start_date')}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reporting_frequency">Reporting Frequency</Label>
                        <Select
                          value={form.watch('reporting_frequency') || 'Monthly'}
                          onValueChange={(value) => form.setValue('reporting_frequency', value)}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Monthly">Monthly</SelectItem>
                            <SelectItem value="Quarterly">Quarterly</SelectItem>
                            <SelectItem value="Annual">Annual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="vat_registered"
                          checked={form.watch('vat_registered') || false}
                          onCheckedChange={(checked) => form.setValue('vat_registered', !!checked)}
                          disabled={isSubmitting}
                        />
                        <Label htmlFor="vat_registered">VAT Registered</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="has_previous_records"
                          checked={form.watch('has_previous_records') || false}
                          onCheckedChange={(checked) => form.setValue('has_previous_records', !!checked)}
                          disabled={isSubmitting}
                        />
                        <Label htmlFor="has_previous_records">Has Previous Accounting Records</Label>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-3" />
                </>
              )}

              {/* Corporate Tax Filing Details */}
              {hasTaxFiling && (
                <>
                  <div>
                    <h3 className="text-base font-medium mb-3">Corporate Tax Filing Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="tax_year_period">Tax Year/Period</Label>
                        <Input
                          id="tax_year_period"
                          {...form.register('tax_year_period')}
                          placeholder="e.g., 2024"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tax_registration_number">Tax Registration Number (TRN)</Label>
                        <Input
                          id="tax_registration_number"
                          {...form.register('tax_registration_number')}
                          placeholder="Enter TRN if already registered"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="financial_year_end_date">Financial Year End Date</Label>
                        <Input
                          id="financial_year_end_date"
                          type="date"
                          {...form.register('financial_year_end_date')}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="filing_deadline">Filing Deadline</Label>
                        <Input
                          id="filing_deadline"
                          type="date"
                          {...form.register('filing_deadline')}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="previous_tax_consultant">Previous Tax Consultant</Label>
                        <Input
                          id="previous_tax_consultant"
                          {...form.register('previous_tax_consultant')}
                          placeholder="If switching from another consultant"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="tax_exemptions">Tax Exemptions or Special Status</Label>
                        <Textarea
                          id="tax_exemptions"
                          {...form.register('tax_exemptions')}
                          placeholder="Describe any tax exemptions or special status"
                          disabled={isSubmitting}
                          rows={3}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="first_time_filing"
                          checked={form.watch('first_time_filing') || false}
                          onCheckedChange={(checked) => form.setValue('first_time_filing', !!checked)}
                          disabled={isSubmitting}
                        />
                        <Label htmlFor="first_time_filing">First time filing</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="has_foreign_operations"
                          checked={form.watch('has_foreign_operations') || false}
                          onCheckedChange={(checked) => form.setValue('has_foreign_operations', !!checked)}
                          disabled={isSubmitting}
                        />
                        <Label htmlFor="has_foreign_operations">Has foreign operations/transactions</Label>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-3" />
                </>
              )}

              {/* Banking Preferences - shown for bank account products or company formation */}
              {(hasBankAccount || hasCompanyFormation) && (
                <div>
                  <h3 className="text-base font-medium mb-3">Banking Preferences</h3>
                  <div className="space-y-3">
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
              )}

              <Separator className="my-3" />

              {/* Additional Notes */}
              <div>
                <h3 className="text-base font-medium mb-3">Additional Information</h3>
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

              <div className="flex justify-end space-x-4 pt-4 pb-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || !!createdCustomerId}
                  className="min-w-[120px] bg-green-700 hover:bg-green-800 text-white font-semibold shadow-lg border-2 border-green-600"
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