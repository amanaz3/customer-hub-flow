import React, { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Building2, Plus, Save, Users, ClipboardList } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { NavigationBlocker } from '@/components/Navigation/NavigationBlocker';
import { StickyFormNavigation } from './StickyFormNavigation';

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
  lead_source: z.enum(['Website', 'Referral', 'Social Media', 'WhatsApp', 'Other']),
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
  service_type_id: z.string().optional(),
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
  // GoAML fields
  trade_license_number: z.string().optional(),
  date_of_incorporation: z.string().optional(),
  registered_office_address: z.string().optional(),
  nature_of_business: z.string().optional(),
  number_of_ubos: z.number().optional(),
  compliance_officer_name: z.string().optional(),
  compliance_officer_email: z.string().email().optional().or(z.literal('')),
  compliance_officer_phone: z.string().optional(),
  compliance_officer_position: z.string().optional(),
  expected_annual_transaction_volume: z.string().optional(),
  transaction_types: z.string().optional(),
  customer_types: z.string().optional(),
  high_risk_countries: z.string().optional(),
  source_of_funds: z.string().optional(),
  // Home Finance fields
  monthly_gross_salary: z.number().optional(),
  employment_status: z.string().optional(),
  employer_name: z.string().optional(),
  years_with_employer: z.number().optional(),
  additional_income: z.number().optional(),
  additional_income_source: z.string().optional(),
  existing_loan_commitments: z.number().optional(),
  credit_card_limit: z.number().optional(),
  credit_card_outstanding: z.number().optional(),
  property_type: z.string().optional(),
  property_location: z.string().optional(),
  property_value: z.number().optional(),
  developer_name: z.string().optional(),
  property_status: z.string().optional(),
  intended_use: z.string().optional(),
  loan_amount_required: z.number().optional(),
  down_payment_amount: z.number().optional(),
  preferred_loan_tenure: z.number().optional(),
  purchase_purpose: z.string().optional(),
  has_co_applicant: z.boolean().optional(),
  co_applicant_name: z.string().optional(),
  co_applicant_income: z.number().optional(),
  co_applicant_relationship: z.string().optional(),
  // VAT Registration fields
  vat_registration_type: z.string().optional(),
  already_registered_vat: z.boolean().optional(),
  existing_trn: z.string().optional(),
  business_activity_description: z.string().optional(),
  import_activities: z.boolean().optional(),
  export_activities: z.boolean().optional(),
  import_countries: z.string().optional(),
  export_countries: z.string().optional(),
  previous_tax_period: z.string().optional(),
  vat_accounting_software: z.string().optional(),
  multiple_business_locations: z.boolean().optional(),
  number_of_locations: z.number().optional(),
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
  const [currentStage, setCurrentStage] = useState<'details' | 'preview' | 'documents'>('details');
  const [createdCustomerId, setCreatedCustomerId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showSuccessTransition, setShowSuccessTransition] = useState(false);
  const [customerMode, setCustomerMode] = useState<'new' | 'existing'>('new');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [existingCustomers, setExistingCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accordionValue, setAccordionValue] = useState<string[]>(["basic"]);
  const [highlightDealInfo, setHighlightDealInfo] = useState(false);
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [pendingMode, setPendingMode] = useState<'new' | 'existing' | null>(null);
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const { uploadDocument } = useCustomer();
  const queryClient = useQueryClient();

  // Fetch all active products for the dropdown
  const { data: allProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, is_active, service_category_id')
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
      
      return data || [];
    }
  });

  // Filter products based on category filter and sort "Others" to the end
  const products = (categoryFilter === 'all' 
    ? allProducts 
    : allProducts.filter(p => p.service_category_id === categoryFilter))
    .sort((a, b) => {
      const aIsOther = a.name?.toLowerCase().includes('other');
      const bIsOther = b.name?.toLowerCase().includes('other');
      if (aIsOther && !bIsOther) return 1;
      if (!aIsOther && bIsOther) return -1;
      return 0;
    });

  // Fetch all active service categories for the dropdown
  const { data: serviceCategories = [], isLoading: serviceCategoriesLoading } = useQuery({
    queryKey: ['service_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_category')
        .select('*')
        .eq('is_active', true)
        .order('category_name');
      
      if (error) {
        console.error('Error fetching service categories:', error);
        throw error;
      }
      return data;
    }
  });

  // Fetch the most popular product in real-time
  const { data: mostPopularProduct } = useQuery({
    queryKey: ['most_popular_product'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('product_id')
        .not('product_id', 'is', null);
      
      if (error) {
        console.error('Error fetching popular products:', error);
        return null;
      }

      // Count frequency of each product
      const productCounts = data.reduce((acc: Record<string, number>, curr) => {
        if (curr.product_id) {
          acc[curr.product_id] = (acc[curr.product_id] || 0) + 1;
        }
        return acc;
      }, {});

      // Find most frequent product
      const mostPopular = Object.entries(productCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))[0];

      return mostPopular ? mostPopular[0] : null;
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
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
      lead_source: 'Referral',
      annual_turnover: 0,
      jurisdiction: '',
      any_suitable_bank: false,
      bank_preference_1: '',
      bank_preference_2: '',
      bank_preference_3: '',
      customer_notes: '',
      product_id: '',
      service_type_id: '',
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
      // GoAML defaults
      trade_license_number: '',
      date_of_incorporation: '',
      registered_office_address: '',
      nature_of_business: '',
      number_of_ubos: 1,
      compliance_officer_name: '',
      compliance_officer_email: '',
      compliance_officer_phone: '',
      compliance_officer_position: '',
      expected_annual_transaction_volume: '',
      transaction_types: '',
      customer_types: '',
      high_risk_countries: '',
      source_of_funds: '',
      // Home Finance defaults
      monthly_gross_salary: 0,
      employment_status: '',
      employer_name: '',
      years_with_employer: 0,
      additional_income: 0,
      additional_income_source: '',
      existing_loan_commitments: 0,
      credit_card_limit: 0,
      credit_card_outstanding: 0,
      property_type: '',
      property_location: '',
      property_value: 0,
      developer_name: '',
      property_status: '',
      intended_use: '',
      loan_amount_required: 0,
      down_payment_amount: 0,
      preferred_loan_tenure: 25,
      purchase_purpose: '',
      has_co_applicant: false,
      co_applicant_name: '',
      co_applicant_income: 0,
      co_applicant_relationship: '',
      // VAT defaults
      vat_registration_type: '',
      already_registered_vat: false,
      existing_trn: '',
      business_activity_description: '',
      import_activities: false,
      export_activities: false,
      import_countries: '',
      export_countries: '',
      previous_tax_period: '',
      vat_accounting_software: '',
      multiple_business_locations: false,
      number_of_locations: 1,
      ...initialData
    },
  });

  const watchAnySuitableBank = form.watch('any_suitable_bank');
  const watchLicenseType = form.watch('license_type');
  const watchShareholderCount = form.watch('no_of_shareholders');
  const watchProductId = form.watch('product_id');
  
  // Watch form fields for section validation
  const watchName = form.watch('name');
  const watchEmail = form.watch('email');
  const watchMobile = form.watch('mobile');
  const watchCompany = form.watch('company');
  const watchLeadSource = form.watch('lead_source');
  
  // Section completion checks
  const isBasicInfoComplete = watchName && watchEmail && watchMobile && watchCompany;
  const isSourceChannelComplete = isBasicInfoComplete && watchLeadSource;
  const isServiceSelectionComplete = isSourceChannelComplete && watchProductId;

  // Auto-select most popular product when form loads
  useEffect(() => {
    if (mostPopularProduct && !watchProductId && !initialData) {
      form.setValue('product_id', mostPopularProduct);
    }
  }, [mostPopularProduct, watchProductId, initialData, form]);

  // Real-time subscription to update most popular product when customers change
  useEffect(() => {
    const channel = supabase
      .channel('customer-product-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers',
          filter: 'product_id=not.is.null'
        },
        () => {
          // Invalidate and refetch the most popular product query
          queryClient.invalidateQueries({ queryKey: ['most_popular_product'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Auto-scroll and highlight Deal Information when product is selected
  useEffect(() => {
    if (watchProductId) {
      // Expand Deal Information section if not already expanded
      setAccordionValue(prev => {
        if (!prev.includes('application')) {
          return [...prev, 'application'];
        }
        return prev;
      });

      // Scroll to Deal Information section smoothly
      setTimeout(() => {
        const dealInfoSection = document.querySelector('[data-section="deal-information"]');
        if (dealInfoSection) {
          const elementPosition = dealInfoSection.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - 80;
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
          
          // Add highlight pulse effect
          setHighlightDealInfo(true);
          setTimeout(() => setHighlightDealInfo(false), 2000);
        }
      }, 100);
    }
  }, [watchProductId]);

  // Check which product type is selected
  const selectedProduct = products.find(p => p.id === watchProductId);
  const selectedProductName = selectedProduct?.name.toLowerCase() || '';
  const selectedProductCategoryId = selectedProduct?.service_category_id || '';
  
  // Find the category name for the selected product
  const selectedCategory = serviceCategories.find(cat => cat.id === selectedProductCategoryId);
  const selectedProductNameNoSpaces = selectedProductName.replace(/\s+/g, '');
  
  const hasBookkeeping = selectedProductNameNoSpaces.includes('bookkeeping') || 
                         selectedProductNameNoSpaces.includes('book') || 
                         selectedProductName.includes('accounting');
  const hasCompanyFormation = selectedProductName.includes('company') || 
                              selectedProductName.includes('formation') || 
                              selectedProductName.includes('license');
  const hasBankAccount = selectedProductName.includes('bank');
  const hasGoAML = selectedProductName.includes('goaml');
  const hasHomeFinance = selectedProductName.includes('home') && selectedProductName.includes('finance');
  const hasVAT = selectedProductName.includes('vat');
  
  // Differentiate between tax registration and tax filing
  const hasTaxRegistration = selectedProductName.includes('registration') && !hasGoAML;
  const hasTaxFiling = (selectedProductName.includes('filing') || selectedProductName.includes('filling')) && 
                       !hasTaxRegistration;

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

  // Check if form has unsaved data
  const hasUnsavedData = useCallback(() => {
    const formValues = form.getValues();
    
    // Check if any field has been filled
    if (customerMode === 'new') {
      return formValues.name || formValues.email || formValues.mobile || 
             formValues.company || formValues.amount || formValues.product_id ||
             formValues.customer_notes;
    } else {
      // For existing customer mode, check if they selected a customer or filled deal info
      return selectedCustomerId !== '' || formValues.amount || formValues.product_id;
    }
  }, [form, customerMode, selectedCustomerId]);

  // Handle mode switch with confirmation
  const handleModeSwitch = useCallback((newMode: 'new' | 'existing') => {
    if (newMode === customerMode) return;

    if (hasUnsavedData()) {
      setPendingMode(newMode);
      setShowSwitchConfirm(true);
    } else {
      // No unsaved data, switch directly
      setCustomerMode(newMode);
      if (newMode === 'new') {
        setSelectedCustomerId('');
        form.reset();
      }
    }
  }, [customerMode, hasUnsavedData, form]);

  // Confirm mode switch without saving
  const confirmModeSwitch = useCallback(() => {
    if (pendingMode) {
      setCustomerMode(pendingMode);
      if (pendingMode === 'new') {
        setSelectedCustomerId('');
        form.reset();
      } else {
        // Switching to existing, clear form
        form.reset();
      }
      setPendingMode(null);
    }
    setShowSwitchConfirm(false);
  }, [pendingMode, form]);

  // Cancel mode switch
  const cancelModeSwitch = useCallback(() => {
    setPendingMode(null);
    setShowSwitchConfirm(false);
  }, []);

  // Handle section navigation
  const handleSectionNavigation = useCallback((sectionId: string) => {
    // Expand the section if not already expanded
    setAccordionValue(prev => {
      if (!prev.includes(sectionId)) {
        return [...prev, sectionId];
      }
      return prev;
    });

    // Scroll to the section with offset for sticky header
    setTimeout(() => {
      const sectionElement = document.querySelector(`[data-section-id="${sectionId}"]`);
      if (sectionElement) {
        const elementPosition = sectionElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - 80; // 80px offset for sticky header
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 100);
  }, []);

  // Define sections for navigation
  const navigationSections = [
    {
      id: 'basic',
      label: 'Basic Info',
      isComplete: !!isBasicInfoComplete,
      isActive: accordionValue.includes('basic'),
      isVisible: true,
    },
    {
      id: 'lead',
      label: 'Source & Channel',
      isComplete: !!isSourceChannelComplete,
      isActive: accordionValue.includes('lead'),
      isVisible: true, // Always show in sticky nav
    },
    {
      id: 'service',
      label: 'Service',
      isComplete: !!isServiceSelectionComplete,
      isActive: accordionValue.includes('service'),
      isVisible: true, // Always show in sticky nav
    },
    {
      id: 'application',
      label: 'Deal Info',
      isComplete: false, // Add logic for deal info completion if needed
      isActive: accordionValue.includes('application'),
      isVisible: !!isServiceSelectionComplete || (accordionValue.includes('service') && !!watchProductId),
    },
  ];

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

      // Show success transition animation
      setShowSuccessTransition(true);
      
      // Wait for animation then move to documents stage
      setTimeout(() => {
        setShowSuccessTransition(false);
        setCurrentStage('documents');
      }, 2000);
      
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
    <div className="space-y-6 relative">
      {/* Navigation Blocker - prevents navigation when there's unsaved data */}
      <NavigationBlocker 
        when={hasUnsavedData() && !createdCustomerId} 
        message="You have unsaved changes in the application form. Leaving this page will discard all your progress. Are you sure you want to continue?"
      />
      
      {/* Success Transition Overlay */}
      {showSuccessTransition && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md mx-4 shadow-2xl animate-scale-in">
            <div className="text-center space-y-4">
              {/* Success Checkmark */}
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Application Created! 🎉
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Moving to document upload...
                </p>
              </div>

              {/* Animated Arrow */}
              <div className="flex items-center justify-center gap-3 pt-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <ClipboardList className="w-5 h-5 text-green-600" />
                  Details
                </div>
                <div className="flex gap-1 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <div className="w-2 h-2 rounded-full bg-green-500 animation-delay-100"></div>
                  <div className="w-2 h-2 rounded-full bg-green-500 animation-delay-200"></div>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Documents
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage Indicator - Sticky Card */}
      <Card className="sticky top-0 z-30 shadow-lg border mb-3">
        <CardHeader className="pb-1.5 pt-2.5 px-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm flex items-center gap-1.5">
                <ClipboardList className="h-3.5 w-3.5 text-primary" />
                Application Creation Process
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentStage === 'details' 
                  ? 'Fill in customer and service details'
                  : currentStage === 'preview'
                  ? 'Review and confirm information'
                  : 'Upload required documents'
                }
              </p>
            </div>
            <Badge variant="outline" className="text-2xs px-1.5 py-0.5 h-5">
              {currentStage === 'details' ? '1' : currentStage === 'preview' ? '2' : '3'}/3
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-2.5 px-3">
          <div className="relative w-full">
            <div className="flex items-center justify-between">
              {/* Stage 1: Application Details */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full font-semibold text-xs transition-all duration-300 border-2 shadow-sm",
                  currentStage === 'details' 
                    ? "bg-green-600 text-white border-green-600 shadow-green-200 scale-110" 
                    : createdCustomerId
                    ? "bg-green-500 text-white border-green-500 shadow-green-200"
                    : "bg-gray-200 text-gray-400 border-gray-300"
                )}>
                  {createdCustomerId ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <ClipboardList className="w-4 h-4" />
                  )}
                </div>
                <div className="text-center">
                  <div className={cn(
                    "text-2xs font-bold transition-colors leading-tight",
                    currentStage === 'details' || createdCustomerId
                      ? "text-gray-900 dark:text-gray-100" 
                      : "text-gray-500"
                  )}>
                    Details
                  </div>
                </div>
              </div>

              {/* Connecting Line 1 with Animated Arrow */}
              <div className="flex-1 relative px-1.5" style={{ maxWidth: '50px' }}>
                <div className="relative h-1 flex items-center">
                  <div className={cn(
                    "h-1 rounded-full transition-all duration-500 flex-1",
                    currentStage === 'preview' || currentStage === 'documents' ? "bg-green-500" : "bg-gray-300"
                  )} />
                  <svg 
                    className={cn(
                      "absolute -right-0.5 w-2.5 h-2.5 transition-all duration-500",
                      currentStage === 'preview' || currentStage === 'documents' 
                        ? "text-green-500 animate-pulse" 
                        : "text-gray-300"
                    )}
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              {/* Stage 2: Preview */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full font-semibold text-xs transition-all duration-300 border-2 shadow-sm",
                  currentStage === 'preview' 
                    ? "bg-blue-600 text-white border-blue-600 shadow-blue-200 scale-110" 
                    : currentStage === 'documents'
                    ? "bg-green-500 text-white border-green-500 shadow-green-200"
                    : "bg-gray-200 text-gray-400 border-gray-300"
                )}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div className="text-center">
                  <div className={cn(
                    "text-2xs font-bold transition-colors leading-tight",
                    currentStage === 'preview' || currentStage === 'documents'
                      ? "text-gray-900 dark:text-gray-100" 
                      : "text-gray-500"
                  )}>
                    Preview
                  </div>
                </div>
              </div>

              {/* Connecting Line 2 with Animated Arrow */}
              <div className="flex-1 relative px-1.5" style={{ maxWidth: '50px' }}>
                <div className="relative h-1 flex items-center">
                  <div className={cn(
                    "h-1 rounded-full transition-all duration-500 flex-1",
                    createdCustomerId ? "bg-green-500" : "bg-gray-300"
                  )} />
                  <svg 
                    className={cn(
                      "absolute -right-0.5 w-2.5 h-2.5 transition-all duration-500",
                      createdCustomerId
                        ? "text-green-500 animate-pulse" 
                        : "text-gray-300"
                    )}
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              {/* Stage 3: Documents */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full font-semibold text-xs transition-all duration-300 border-2 relative shadow-sm",
                  currentStage === 'documents' && createdCustomerId
                    ? "bg-green-600 text-white border-green-600 shadow-green-200 scale-110" 
                    : createdCustomerId 
                    ? "bg-white text-green-600 border-green-500 hover:border-green-600 cursor-pointer shadow-green-100"
                    : "bg-gray-200 text-gray-400 border-gray-300 opacity-60"
                )}
                onClick={() => createdCustomerId && setCurrentStage('documents')}
                >
                  <Building2 className="w-4 h-4" />
                  {createdCustomerId && documents.length > 0 && (
                    <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-2xs font-bold border border-white shadow-sm">
                       {documents.filter(doc => doc.is_uploaded).length}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className={cn(
                    "text-2xs font-bold transition-colors leading-tight",
                    currentStage === 'documents' && createdCustomerId
                      ? "text-gray-900 dark:text-gray-100" 
                      : createdCustomerId
                      ? "text-gray-700 dark:text-gray-300"
                      : "text-gray-500"
                  )}>
                    Docs
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stage Description Banner - Inside sticky card */}
          <div className={cn(
            "mt-2 p-2 rounded-md border transition-all duration-300",
            currentStage === 'details' 
              ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
              : currentStage === 'preview'
              ? "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
              : "bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800"
          )}>
            <div className="flex items-start gap-2">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                currentStage === 'details' 
                  ? "bg-green-100 dark:bg-green-900"
                  : currentStage === 'preview'
                  ? "bg-blue-100 dark:bg-blue-900"
                  : "bg-purple-100 dark:bg-purple-900"
              )}>
                {currentStage === 'details' ? (
                  <ClipboardList className="w-3 h-3 text-green-700 dark:text-green-300" />
                ) : currentStage === 'preview' ? (
                  <svg className="w-3 h-3 text-blue-700 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <Building2 className="w-3 h-3 text-purple-700 dark:text-purple-300" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-xs mb-0.5 text-gray-900 dark:text-gray-100 leading-tight">
                  {currentStage === 'details' 
                    ? 'Step 1: Fill Draft Details'
                    : currentStage === 'preview'
                    ? 'Step 2: Review Your Draft'
                    : 'Step 3: Upload Documents'
                  }
                </h3>
                <p className="text-2xs text-gray-700 dark:text-gray-300 leading-snug">
                  {currentStage === 'details'
                    ? 'Select customer, choose service, and provide business information'
                    : currentStage === 'preview'
                    ? 'Review details before saving. You can go back to edit if needed'
                    : 'Upload required documents. Mandatory files must be uploaded'
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full max-w-4xl mx-auto overflow-visible mt-6 relative z-10">
        <CardContent className="space-y-4 pb-6 pt-6">
        {/* Customer Selection Section */}
        <div className="space-y-3">
          <div>
            <Label className="text-base font-medium">Customer Selection</Label>
          </div>

          <div className="grid grid-cols-2 w-full bg-background border-b-2 border-border">
            <button
              type="button"
              onClick={() => handleModeSwitch('new')}
              className={cn(
                "relative flex items-center justify-center gap-2 py-4 px-4 rounded-none border-b-4 transition-all font-medium",
                customerMode === 'new'
                  ? "border-b-green-500 bg-green-50 text-green-700"
                  : "border-b-transparent text-muted-foreground hover:text-foreground"
              )}
              aria-selected={customerMode === 'new'}
            >
              <Building2 className="h-4 w-4" />
              Create New Company
            </button>
            
            <button
              type="button"
              onClick={() => handleModeSwitch('existing')}
              className={cn(
                "relative flex items-center justify-center gap-2 py-4 px-4 rounded-none border-b-4 transition-all font-medium",
                customerMode === 'existing'
                  ? "border-b-green-500 bg-green-50 text-green-700"
                  : "border-b-transparent text-muted-foreground hover:text-foreground"
              )}
              aria-selected={customerMode === 'existing'}
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

        <CreateCompanyDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onCompanyCreated={handleCompanyCreated}
        />

        {currentStage === 'details' && (
          <div className="space-y-4">
            {/* Sticky Section Navigation */}
            <StickyFormNavigation 
              sections={navigationSections}
              onSectionClick={handleSectionNavigation}
            />
            
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <Accordion type="multiple" value={accordionValue} onValueChange={setAccordionValue} className="space-y-4">
                {/* Basic Information */}
                <AccordionItem value="basic" className="border rounded-lg" data-section-id="basic">
                  <AccordionTrigger className="px-4 hover:no-underline justify-start gap-2">
                    <h3 className="text-base font-medium">Basic Information</h3>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
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
                  </AccordionContent>
                </AccordionItem>

            {/* Source & Channel - Shown when basic info complete OR clicked in nav */}
            {(isBasicInfoComplete || accordionValue.includes('lead')) && (
            <AccordionItem value="lead" className="border rounded-lg" data-section-id="lead">
                  <AccordionTrigger className="px-4 hover:no-underline justify-start gap-2">
                    <h3 className="text-base font-medium">Source & Channel Information</h3>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
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
                            <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                )}

        {/* Service Selection - Shown when basic info complete OR clicked in nav */}
        {(isBasicInfoComplete || accordionValue.includes('service')) && (
        <AccordionItem value="service" className="border rounded-lg" data-section-id="service">
              <AccordionTrigger className="px-4 hover:no-underline justify-start gap-2">
                <h3 className="text-base font-medium">Service Selection</h3>
              </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="pt-2 space-y-4">
                      {/* Category Filter Tabs */}
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Filter by Category (Optional)</Label>
                        <Tabs 
                          value={categoryFilter} 
                          onValueChange={(value) => {
                            setCategoryFilter(value);
                            if (value === 'all') {
                              form.setValue('product_id', '');
                            }
                          }} 
                          className="w-full"
                        >
                          <TabsList className="grid w-full h-auto bg-background border-b-2 border-border p-0" style={{ gridTemplateColumns: `repeat(${serviceCategories.length + 1}, minmax(0, 1fr))` }}>
                            <TabsTrigger 
                              value="all"
                              disabled={isSubmitting || serviceCategoriesLoading}
                              className="relative flex items-center justify-center gap-2 py-3 px-4 rounded-none border-b-4 border-transparent data-[state=active]:border-b-green-500 data-[state=active]:bg-green-50 dark:data-[state=active]:bg-green-950/30 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-400 transition-all"
                            >
                              <span className="font-medium text-sm">All Products</span>
                              <Badge variant="secondary" className={cn(
                                "text-xs",
                                categoryFilter === 'all' && "bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200"
                              )}>
                                {allProducts.length}
                              </Badge>
                            </TabsTrigger>
                            {serviceCategories.map((category) => {
                              const count = allProducts.filter(p => p.service_category_id === category.id).length;
                              return (
                                <TabsTrigger 
                                  key={category.id}
                                  value={category.id}
                                  disabled={isSubmitting || serviceCategoriesLoading}
                                  className="relative flex items-center justify-center gap-2 py-3 px-4 rounded-none border-b-4 border-transparent data-[state=active]:border-b-green-500 data-[state=active]:bg-green-50 dark:data-[state=active]:bg-green-950/30 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-400 transition-all"
                                >
                                  <span className="font-medium text-sm">{category.category_name}</span>
                                  <Badge variant="secondary" className={cn(
                                    "text-xs",
                                    categoryFilter === category.id && "bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200"
                                  )}>
                                    {count}
                                  </Badge>
                                </TabsTrigger>
                              );
                            })}
                          </TabsList>
                        </Tabs>
                      </div>

                      {/* Products Grid */}
                      <div className="space-y-3">
                        <Label>Product / Service *</Label>
                        {productsLoading ? (
                          <p className="text-sm text-muted-foreground">Loading products...</p>
                        ) : products.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No products available in this category.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {products.map((product) => {
                              const isSelected = watchProductId === product.id;
                              return (
                                 <div
                                   key={product.id}
                                   onClick={() => {
                                     if (!isSubmitting) {
                                       form.setValue('product_id', product.id);
                                       setCategoryFilter(product.service_category_id || 'all');
                                     }
                                   }}
                                   className={cn(
                                     "relative p-3 rounded-md border-2 cursor-pointer transition-all duration-200",
                                     "hover:shadow-sm",
                                     isSelected
                                       ? "border-green-600 bg-green-50 dark:bg-green-950/30 shadow-md"
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
                                         <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
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
                    </div>
                  </AccordionContent>
                </AccordionItem>
                )}

        {/* Deal Information - Only shown when service selection is complete OR when service is active and product is selected */}
        {(isServiceSelectionComplete || (accordionValue.includes('service') && watchProductId)) && (
        <AccordionItem
          value="application" 
          className={cn(
            "border rounded-lg transition-all duration-500",
            highlightDealInfo && "ring-4 ring-blue-400 shadow-lg shadow-blue-200 dark:shadow-blue-900"
          )}
          data-section="deal-information"
          data-section-id="application"
        >
              <AccordionTrigger className="px-4 hover:no-underline justify-start gap-2">
                <h3 className={cn(
                  "text-base font-medium transition-colors",
                  highlightDealInfo && "text-blue-600 dark:text-blue-400"
                )}>
                  Deal Information
                  {highlightDealInfo && (
                    <span className="ml-2 inline-block animate-pulse">✨</span>
                  )}
                </h3>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-4">
                {/* Application Information */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2 px-2 py-1.5 bg-primary/5 rounded">
                    <span className="text-xs">📋</span>
                    <h4 className="text-xs font-semibold text-foreground">Application Information</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

                    {/* Banking Preferences - shown for bank account products */}
                    {hasBankAccount && (
                      <>
                        <div className="col-span-full mt-2">
                          <h5 className="text-sm font-medium mb-2">Banking Preferences</h5>
                        </div>
                        <div className="col-span-full">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="any_suitable_bank"
                              checked={watchAnySuitableBank}
                              onCheckedChange={(checked) => form.setValue('any_suitable_bank', !!checked)}
                              disabled={isSubmitting}
                            />
                            <Label htmlFor="any_suitable_bank">Any Suitable Bank</Label>
                          </div>
                        </div>

                        {!watchAnySuitableBank && (
                          <>
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
                          </>
                        )}
                      </>
                    )}

                    {/* GoAML Application Fields */}
                    {hasGoAML && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="trade_license_number">Trade License Number *</Label>
                          <Input
                            id="trade_license_number"
                            {...form.register('trade_license_number')}
                            placeholder="Enter trade license number"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="date_of_incorporation">Date of Incorporation</Label>
                          <Input
                            id="date_of_incorporation"
                            type="date"
                            {...form.register('date_of_incorporation')}
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="compliance_officer_name">Compliance Officer Name *</Label>
                          <Input
                            id="compliance_officer_name"
                            {...form.register('compliance_officer_name')}
                            placeholder="Full name"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="compliance_officer_position">Officer Position</Label>
                          <Input
                            id="compliance_officer_position"
                            {...form.register('compliance_officer_position')}
                            placeholder="e.g., Chief Compliance Officer"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="compliance_officer_email">Officer Email</Label>
                          <Input
                            id="compliance_officer_email"
                            type="email"
                            {...form.register('compliance_officer_email')}
                            placeholder="officer@company.com"
                            disabled={isSubmitting}
                          />
                          {form.formState.errors.compliance_officer_email && (
                            <p className="text-sm text-red-600">{form.formState.errors.compliance_officer_email.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="compliance_officer_phone">Officer Phone</Label>
                          <Input
                            id="compliance_officer_phone"
                            {...form.register('compliance_officer_phone')}
                            placeholder="+971 XX XXX XXXX"
                            disabled={isSubmitting}
                          />
                        </div>
                      </>
                    )}

                    {/* Bookkeeping Details - shown for bookkeeping products */}
                    {hasBookkeeping && (
                      <>
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
                      </>
                    )}
                  </div>
                </div>

                {/* Business Information */}
                {hasCompanyFormation && (
                  <div className="mt-3">
                    <div className="flex items-center gap-1.5 mb-2 px-2 py-1.5 bg-primary/5 rounded">
                      <span className="text-xs">🏢</span>
                      <h4 className="text-xs font-semibold text-foreground">Business Information</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <Label htmlFor="amount">Annual Turnover (AED) *</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          {...form.register('amount', { valueAsNumber: true })}
                          placeholder="Enter annual turnover"
                          disabled={isSubmitting}
                          required
                        />
                        {form.formState.errors.amount && (
                          <p className="text-sm text-red-600">{form.formState.errors.amount.message}</p>
                        )}
                      </div>

                      {/* GoAML Business Fields */}
                      {hasGoAML && (
                        <>
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="registered_office_address">Registered Office Address</Label>
                            <Textarea
                              id="registered_office_address"
                              {...form.register('registered_office_address')}
                              placeholder="Full registered address"
                              disabled={isSubmitting}
                              rows={2}
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="nature_of_business">Nature of Business Operations</Label>
                            <Textarea
                              id="nature_of_business"
                              {...form.register('nature_of_business')}
                              placeholder="Describe business activities in detail"
                              disabled={isSubmitting}
                              rows={2}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="number_of_ubos">Number of Beneficial Owners (UBOs)</Label>
                            <Input
                              id="number_of_ubos"
                              type="number"
                              min="1"
                              {...form.register('number_of_ubos', { valueAsNumber: true })}
                              disabled={isSubmitting}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="customer_types">Customer Types</Label>
                            <Input
                              id="customer_types"
                              {...form.register('customer_types')}
                              placeholder="e.g., Individual, Corporate"
                              disabled={isSubmitting}
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="high_risk_countries">High-Risk Countries (if any)</Label>
                            <Textarea
                              id="high_risk_countries"
                              {...form.register('high_risk_countries')}
                              placeholder="List any high-risk jurisdictions"
                              disabled={isSubmitting}
                              rows={2}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Financial Information */}
                <div className="mt-3">
                  <div className="flex items-center gap-1.5 mb-2 px-2 py-1.5 bg-primary/5 rounded">
                    <span className="text-xs">💰</span>
                    <h4 className="text-xs font-semibold text-foreground">Financial Information</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    {/* GoAML Financial Fields */}
                    {hasGoAML && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="expected_annual_transaction_volume">Expected Annual Transaction Volume</Label>
                          <select
                            id="expected_annual_transaction_volume"
                            {...form.register('expected_annual_transaction_volume')}
                            disabled={isSubmitting}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select volume range</option>
                            <option value="0-100k">0 - 100,000 AED</option>
                            <option value="100k-500k">100,000 - 500,000 AED</option>
                            <option value="500k-1m">500,000 - 1,000,000 AED</option>
                            <option value="1m-5m">1,000,000 - 5,000,000 AED</option>
                            <option value="5m+">5,000,000+ AED</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="transaction_types">Expected Transaction Types</Label>
                          <Input
                            id="transaction_types"
                            {...form.register('transaction_types')}
                            placeholder="e.g., Wire Transfer, Cash, Cheques"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="source_of_funds">Primary Source of Funds</Label>
                          <Input
                            id="source_of_funds"
                            {...form.register('source_of_funds')}
                            placeholder="e.g., Trading revenue, Investment income"
                            disabled={isSubmitting}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Required Documents Section */}
                {hasGoAML && (
                  <div className="mt-3">
                    <div className="flex items-center gap-1.5 mb-2 px-2 py-1.5 bg-primary/5 rounded">
                      <span className="text-xs">ℹ️</span>
                      <h4 className="text-xs font-semibold text-foreground">Required Documents</h4>
                    </div>
                    <p className="text-xs text-foreground/70 italic mb-2 px-2 ml-3 flex items-start gap-1.5">
                      <span className="text-base leading-none">💡</span>
                      <span>This is an informational checklist only. Documents will be collected in subsequent registration steps.</span>
                    </p>
                      <Accordion type="single" collapsible className="w-full ml-3 border-l-2 border-muted pl-2">
                        <AccordionItem value="goaml-docs" className="border-0">
                          <AccordionTrigger className="pl-6 py-2 hover:no-underline text-sm justify-start gap-2">
                            <span className="text-muted-foreground">View document checklist</span>
                          </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-background/50 p-3">
                          <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">📋 Required Documents:</p>
                          <ul className="text-sm space-y-1.5 text-muted-foreground">
                            <li className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>Trade License Copy (certified)</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>Passport Copies of all Beneficial Owners (UBOs)</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>Emirates ID Copies of all UBOs</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>Proof of Address for all UBOs</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>Memorandum of Association (MOA)</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>Board Resolution appointing Compliance Officer</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>Company Organization Chart</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>Bank Account Details & Statements (Last 6 months)</span>
                            </li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
                )}
            </AccordionContent>
          </AccordionItem>
            )}

              {/* Home Finance Application Details */}
              {hasHomeFinance && (
                <>
                  <div>
                    <h3 className="text-base font-medium mb-3">Home Finance Draft Details</h3>
                    
                    {/* Personal Financial Information */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-3 text-muted-foreground">Personal Financial Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="monthly_gross_salary">Monthly Gross Salary (AED) *</Label>
                          <Input
                            id="monthly_gross_salary"
                            type="number"
                            step="0.01"
                            {...form.register('monthly_gross_salary', { valueAsNumber: true })}
                            placeholder="Enter monthly salary"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="employment_status">Employment Status *</Label>
                          <select
                            id="employment_status"
                            {...form.register('employment_status')}
                            disabled={isSubmitting}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select employment status</option>
                            <option value="Employed">Employed (Salaried)</option>
                            <option value="Self-Employed">Self-Employed</option>
                            <option value="Business Owner">Business Owner</option>
                            <option value="Professional">Professional (Doctor/Lawyer/etc.)</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="employer_name">Employer/Company Name</Label>
                          <Input
                            id="employer_name"
                            {...form.register('employer_name')}
                            placeholder="Current employer"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="years_with_employer">Years with Current Employer</Label>
                          <Input
                            id="years_with_employer"
                            type="number"
                            step="0.5"
                            {...form.register('years_with_employer', { valueAsNumber: true })}
                            placeholder="e.g., 2.5"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="additional_income">Additional Monthly Income (AED)</Label>
                          <Input
                            id="additional_income"
                            type="number"
                            step="0.01"
                            {...form.register('additional_income', { valueAsNumber: true })}
                            placeholder="Rental, investment income, etc."
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="additional_income_source">Source of Additional Income</Label>
                          <Input
                            id="additional_income_source"
                            {...form.register('additional_income_source')}
                            placeholder="e.g., Rental income, dividends"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="existing_loan_commitments">Existing Monthly Loan Commitments (AED)</Label>
                          <Input
                            id="existing_loan_commitments"
                            type="number"
                            step="0.01"
                            {...form.register('existing_loan_commitments', { valueAsNumber: true })}
                            placeholder="Total monthly payments"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="credit_card_limit">Total Credit Card Limit (AED)</Label>
                          <Input
                            id="credit_card_limit"
                            type="number"
                            step="0.01"
                            {...form.register('credit_card_limit', { valueAsNumber: true })}
                            placeholder="Combined credit limit"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="credit_card_outstanding">Credit Card Outstanding (AED)</Label>
                          <Input
                            id="credit_card_outstanding"
                            type="number"
                            step="0.01"
                            {...form.register('credit_card_outstanding', { valueAsNumber: true })}
                            placeholder="Current outstanding balance"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Property Details */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-3 text-muted-foreground">Property Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="property_type">Property Type *</Label>
                          <select
                            id="property_type"
                            {...form.register('property_type')}
                            disabled={isSubmitting}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select property type</option>
                            <option value="Villa">Villa</option>
                            <option value="Apartment">Apartment</option>
                            <option value="Townhouse">Townhouse</option>
                            <option value="Penthouse">Penthouse</option>
                            <option value="Land">Land/Plot</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="property_location">Property Location/Area *</Label>
                          <Input
                            id="property_location"
                            {...form.register('property_location')}
                            placeholder="e.g., Dubai Marina, Downtown Dubai"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="property_value">Property Value/Price (AED) *</Label>
                          <Input
                            id="property_value"
                            type="number"
                            step="0.01"
                            {...form.register('property_value', { valueAsNumber: true })}
                            placeholder="Total property price"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="property_status">Property Status</Label>
                          <select
                            id="property_status"
                            {...form.register('property_status')}
                            disabled={isSubmitting}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select status</option>
                            <option value="Ready">Ready Property</option>
                            <option value="Under Construction">Under Construction (Off-plan)</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="developer_name">Developer Name (if off-plan)</Label>
                          <Input
                            id="developer_name"
                            {...form.register('developer_name')}
                            placeholder="Developer name"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="intended_use">Intended Use</Label>
                          <select
                            id="intended_use"
                            {...form.register('intended_use')}
                            disabled={isSubmitting}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select intended use</option>
                            <option value="Primary Residence">Primary Residence</option>
                            <option value="Investment">Investment Property</option>
                            <option value="Second Home">Second Home</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="purchase_purpose">Purchase Purpose</Label>
                          <select
                            id="purchase_purpose"
                            {...form.register('purchase_purpose')}
                            disabled={isSubmitting}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select purpose</option>
                            <option value="First Home">First Home Purchase</option>
                            <option value="Upgrade">Property Upgrade</option>
                            <option value="Investment">Investment</option>
                            <option value="Additional Property">Additional Property</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Financing Requirements */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-3 text-muted-foreground">Financing Requirements</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="loan_amount_required">Loan Amount Required (AED) *</Label>
                          <Input
                            id="loan_amount_required"
                            type="number"
                            step="0.01"
                            {...form.register('loan_amount_required', { valueAsNumber: true })}
                            placeholder="Amount to finance"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="down_payment_amount">Down Payment Available (AED) *</Label>
                          <Input
                            id="down_payment_amount"
                            type="number"
                            step="0.01"
                            {...form.register('down_payment_amount', { valueAsNumber: true })}
                            placeholder="Your down payment"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="preferred_loan_tenure">Preferred Loan Tenure (years)</Label>
                          <select
                            id="preferred_loan_tenure"
                            {...form.register('preferred_loan_tenure', { valueAsNumber: true })}
                            disabled={isSubmitting}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="15">15 years</option>
                            <option value="20">20 years</option>
                            <option value="25">25 years</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Co-Applicant Information */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-3 text-muted-foreground">Co-Applicant Information (Optional)</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="has_co_applicant"
                            checked={form.watch('has_co_applicant') || false}
                            onCheckedChange={(checked) => form.setValue('has_co_applicant', !!checked)}
                            disabled={isSubmitting}
                          />
                          <Label htmlFor="has_co_applicant">I have a co-applicant</Label>
                        </div>

                        {form.watch('has_co_applicant') && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                            <div className="space-y-2">
                              <Label htmlFor="co_applicant_name">Co-Applicant Name</Label>
                              <Input
                                id="co_applicant_name"
                                {...form.register('co_applicant_name')}
                                placeholder="Full name"
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="co_applicant_income">Co-Applicant Monthly Income (AED)</Label>
                              <Input
                                id="co_applicant_income"
                                type="number"
                                step="0.01"
                                {...form.register('co_applicant_income', { valueAsNumber: true })}
                                placeholder="Monthly salary"
                                disabled={isSubmitting}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="co_applicant_relationship">Relationship to Main Applicant</Label>
                              <select
                                id="co_applicant_relationship"
                                {...form.register('co_applicant_relationship')}
                                disabled={isSubmitting}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="">Select relationship</option>
                                <option value="Spouse">Spouse</option>
                                <option value="Parent">Parent</option>
                                <option value="Sibling">Sibling</option>
                                <option value="Business Partner">Business Partner</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Required Documents Section */}
                    <div className="mt-3">
                      <div className="flex items-center gap-1.5 mb-2 px-2 py-1.5 bg-primary/5 rounded">
                        <span className="text-xs">ℹ️</span>
                        <h4 className="text-xs font-semibold text-foreground">Required Documents</h4>
                      </div>
                      <p className="text-xs text-foreground/70 italic mb-2 px-2 ml-3 flex items-start gap-1.5">
                        <span className="text-base leading-none">💡</span>
                        <span>This is an informational checklist only. Documents will be requested during the mortgage processing stage.</span>
                      </p>
                        <Accordion type="single" collapsible className="w-full ml-3 border-l-2 border-muted pl-2">
                          <AccordionItem value="home-finance-docs" className="border-0">
                            <AccordionTrigger className="pl-6 py-2 hover:no-underline text-sm justify-start gap-2">
                              <span className="text-muted-foreground">View document checklist</span>
                            </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-background/50 p-3">
                            <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">📋 Supporting Documents Required:</p>
                            <ul className="text-sm space-y-1.5 text-muted-foreground">
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Passport Copy with valid UAE Visa</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Emirates ID Copy (both sides)</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Salary Certificate (last 3 months)</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Bank Statements (last 6 months)</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Property Valuation Report</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Property Documents (Title Deed / MOU / Sale Agreement)</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Proof of Down Payment (Bank Statement showing available funds)</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Credit Report Authorization Form</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-orange-600 mt-0.5">•</span>
                                <span><strong>If Self-Employed:</strong> Trade License, MOA, Audited Financials (last 2 years)</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-orange-600 mt-0.5">•</span>
                                <span><strong>If Co-Applicant:</strong> All above documents for co-applicant as well</span>
                              </li>
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </div>

                  <Separator className="my-3" />
                </>
              )}

              {/* VAT Registration Details */}
              {hasVAT && (
                <>
                  <div>
                    <h3 className="text-base font-medium mb-3">VAT Registration Details</h3>
                    
                    {/* Registration Type & Status */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-3 text-muted-foreground">Registration Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="vat_registration_type">Registration Type *</Label>
                          <select
                            id="vat_registration_type"
                            {...form.register('vat_registration_type')}
                            disabled={isSubmitting}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select type</option>
                            <option value="Mandatory">Mandatory Registration (Turnover &gt; AED 375,000)</option>
                            <option value="Voluntary">Voluntary Registration (Turnover &lt; AED 375,000)</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="annual_turnover">Expected Annual Turnover (AED) *</Label>
                          <Input
                            id="annual_turnover"
                            type="number"
                            step="0.01"
                            {...form.register('annual_turnover', { valueAsNumber: true })}
                            placeholder="Total annual revenue"
                            disabled={isSubmitting}
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="already_registered_vat"
                              checked={form.watch('already_registered_vat') || false}
                              onCheckedChange={(checked) => form.setValue('already_registered_vat', !!checked)}
                              disabled={isSubmitting}
                            />
                            <Label htmlFor="already_registered_vat">Already registered for VAT (need to update/amend)</Label>
                          </div>
                        </div>

                        {form.watch('already_registered_vat') && (
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="existing_trn">Existing Tax Registration Number (TRN)</Label>
                            <Input
                              id="existing_trn"
                              {...form.register('existing_trn')}
                              placeholder="Enter your TRN"
                              disabled={isSubmitting}
                            />
                          </div>
                        )}

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
                          <Label htmlFor="vat_accounting_software">Accounting Software Used</Label>
                          <Input
                            id="vat_accounting_software"
                            {...form.register('vat_accounting_software')}
                            placeholder="e.g., Zoho Books, QuickBooks, Tally"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Business Activity Details */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-3 text-muted-foreground">Business Activity Details</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="business_activity_description">Detailed Business Activity Description *</Label>
                          <Textarea
                            id="business_activity_description"
                            {...form.register('business_activity_description')}
                            placeholder="Describe all business activities (trading, services, manufacturing, etc.)"
                            disabled={isSubmitting}
                            rows={3}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="import_activities"
                                checked={form.watch('import_activities') || false}
                                onCheckedChange={(checked) => form.setValue('import_activities', !!checked)}
                                disabled={isSubmitting}
                              />
                              <Label htmlFor="import_activities">Business involves imports</Label>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="export_activities"
                                checked={form.watch('export_activities') || false}
                                onCheckedChange={(checked) => form.setValue('export_activities', !!checked)}
                                disabled={isSubmitting}
                              />
                              <Label htmlFor="export_activities">Business involves exports</Label>
                            </div>
                          </div>
                        </div>

                        {form.watch('import_activities') && (
                          <div className="space-y-2">
                            <Label htmlFor="import_countries">Main Countries for Imports</Label>
                            <Input
                              id="import_countries"
                              {...form.register('import_countries')}
                              placeholder="e.g., China, India, Germany"
                              disabled={isSubmitting}
                            />
                          </div>
                        )}

                        {form.watch('export_activities') && (
                          <div className="space-y-2">
                            <Label htmlFor="export_countries">Main Countries for Exports</Label>
                            <Input
                              id="export_countries"
                              {...form.register('export_countries')}
                              placeholder="e.g., Saudi Arabia, Kuwait, Oman"
                              disabled={isSubmitting}
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="multiple_business_locations"
                                checked={form.watch('multiple_business_locations') || false}
                                onCheckedChange={(checked) => form.setValue('multiple_business_locations', !!checked)}
                                disabled={isSubmitting}
                              />
                              <Label htmlFor="multiple_business_locations">Multiple business locations/branches</Label>
                            </div>
                          </div>

                          {form.watch('multiple_business_locations') && (
                            <div className="space-y-2">
                              <Label htmlFor="number_of_locations">Number of Locations</Label>
                              <Input
                                id="number_of_locations"
                                type="number"
                                min="1"
                                {...form.register('number_of_locations', { valueAsNumber: true })}
                                placeholder="Total branches/locations"
                                disabled={isSubmitting}
                              />
                            </div>
                          )}
                        </div>

                        {form.watch('already_registered_vat') && (
                          <div className="space-y-2">
                            <Label htmlFor="previous_tax_period">Previous Tax Period Filed</Label>
                            <Input
                              id="previous_tax_period"
                              {...form.register('previous_tax_period')}
                              placeholder="e.g., Q4 2024, Jan-Mar 2024"
                              disabled={isSubmitting}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Required Documents Section */}
                    <div className="mt-3">
                      <div className="flex items-center gap-1.5 mb-2 px-2 py-1.5 bg-primary/5 rounded">
                        <span className="text-xs">ℹ️</span>
                        <h4 className="text-xs font-semibold text-foreground">Required Documents</h4>
                      </div>
                      <p className="text-xs text-foreground/70 italic mb-2 px-2 ml-3 flex items-start gap-1.5">
                        <span className="text-base leading-none">💡</span>
                        <span>This is an informational checklist only. Documents will be collected during the VAT registration process.</span>
                      </p>
                        <Accordion type="single" collapsible className="w-full ml-3 border-l-2 border-muted pl-2">
                          <AccordionItem value="vat-reg-docs" className="border-0">
                            <AccordionTrigger className="pl-6 py-2 hover:no-underline text-sm justify-start gap-2">
                              <span className="text-muted-foreground">View document checklist</span>
                            </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-background/50 p-3">
                            <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">📋 Required Documents:</p>
                            <ul className="text-sm space-y-1.5 text-muted-foreground">
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Trade License Copy (certified)</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Passport Copies of all Partners/Shareholders</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Emirates ID Copies of all Partners/Shareholders</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Memorandum of Association (MOA)</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Tenancy Contract / Ejari</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Bank Account Details & Bank Statements (last 6 months)</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Financial Statements (if available)</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Customs Registration (if importing/exporting)</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-orange-600 mt-0.5">•</span>
                                <span><strong>If already VAT registered:</strong> Previous VAT returns and TRN certificate</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-orange-600 mt-0.5">•</span>
                                <span><strong>If multiple locations:</strong> Details and documents for all branches</span>
                              </li>
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </div>

                  <Separator className="my-3" />
                </>
              )}

              {/* Corporate Tax Registration Details */}
              {hasTaxRegistration && (
                <AccordionItem value="tax-registration" className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <h3 className="text-base font-medium">Corporate Tax Registration Details</h3>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="company">Trade License Number *</Label>
                        <Input
                          id="trade_license_number"
                          {...form.register('customer_notes')}
                          placeholder="Enter trade license number"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="annual_turnover">Expected Annual Revenue (AED) *</Label>
                        <Input
                          id="annual_turnover"
                          type="number"
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
                        <Label htmlFor="financial_year_end_date">Financial Year End Date</Label>
                        <Input
                          id="financial_year_end_date"
                          type="date"
                          {...form.register('financial_year_end_date')}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="jurisdiction">Business Activity/Sector</Label>
                        <Input
                          id="jurisdiction"
                          {...form.register('jurisdiction')}
                          placeholder="e.g., Trading, Consulting, Manufacturing"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="customer_notes">Additional Registration Notes</Label>
                        <Textarea
                          id="customer_notes"
                          {...form.register('customer_notes')}
                          placeholder="Any special requirements or information for registration"
                          disabled={isSubmitting}
                          rows={3}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="has_foreign_operations"
                          checked={form.watch('has_foreign_operations') || false}
                          onCheckedChange={(checked) => form.setValue('has_foreign_operations', !!checked)}
                          disabled={isSubmitting}
                        />
                        <Label htmlFor="has_foreign_operations">Has foreign shareholders or operations</Label>
                      </div>
                    </div>

                    {/* Required Documents Section */}
                    <div className="mt-3">
                      <div className="flex items-center gap-1.5 mb-2 px-2 py-1.5 bg-primary/5 rounded">
                        <span className="text-xs">ℹ️</span>
                        <h4 className="text-xs font-semibold text-foreground">Required Documents</h4>
                      </div>
                      <p className="text-xs text-foreground/70 italic mb-2 px-2 ml-3 flex items-start gap-1.5">
                        <span className="text-base leading-none">💡</span>
                        <span>This is an informational checklist only. Documents will be collected during the registration process.</span>
                      </p>
                        <Accordion type="single" collapsible className="w-full ml-3 border-l-2 border-muted pl-2">
                          <AccordionItem value="corp-tax-reg-docs" className="border-0">
                            <AccordionTrigger className="pl-6 py-2 hover:no-underline text-sm justify-start gap-2">
                              <span className="text-muted-foreground">View document checklist</span>
                            </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-background/50 p-3">
                            <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">📋 Required Documents:</p>
                            <ul className="text-sm space-y-1.5 text-muted-foreground">
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Trade License Copy (certified)</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Passport Copies of all Shareholders/Partners</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Emirates ID Copies of all Shareholders/Partners</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Memorandum of Association (MOA)</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Tenancy Contract / Ejari</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Financial Year End Confirmation Letter</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Bank Account Details</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>Company Organization Chart</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-orange-600 mt-0.5">•</span>
                                <span><strong>If foreign operations:</strong> Details of foreign entities and cross-border transactions</span>
                              </li>
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Corporate Tax Filing Details */}
              {hasTaxFiling && (
                <AccordionItem value="tax-filing" className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <h3 className="text-base font-medium">Corporate Tax Filing Details</h3>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="tax_registration_number">Tax Registration Number (TRN) *</Label>
                        <Input
                          id="tax_registration_number"
                          {...form.register('tax_registration_number')}
                          placeholder="Enter your TRN"
                          disabled={isSubmitting}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tax_year_period">Tax Year/Period *</Label>
                        <Input
                          id="tax_year_period"
                          {...form.register('tax_year_period')}
                          placeholder="e.g., 2024"
                          disabled={isSubmitting}
                          required
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

                      <div className="space-y-2">
                        <Label htmlFor="annual_turnover">Annual Revenue (AED)</Label>
                        <Input
                          id="annual_turnover"
                          type="number"
                          step="0.01"
                          {...form.register('annual_turnover', { valueAsNumber: true })}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
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

                    {/* Required Documents Section */}
                    <div className="mt-3">
                      <div className="flex items-center gap-1.5 mb-2 px-2 py-1.5 bg-primary/5 rounded">
                        <span className="text-xs">ℹ️</span>
                        <h4 className="text-xs font-semibold text-foreground">Required Documents</h4>
                      </div>
                      <p className="text-xs text-foreground/70 italic mb-2 px-2 ml-3 flex items-start gap-1.5">
                        <span className="text-base leading-none">💡</span>
                        <span>This is an informational checklist only. Documents will be collected during the filing process.</span>
                      </p>
                        <Accordion type="single" collapsible className="w-full ml-3 border-l-2 border-muted pl-2">
                          <AccordionItem value="required-docs" className="border-0">
                            <AccordionTrigger className="pl-6 py-2 hover:no-underline text-sm justify-start gap-2">
                              <span className="text-muted-foreground">View document checklist</span>
                            </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-background/50 p-3">
                              <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">📋 Required Documents:</p>
                              <ul className="text-sm space-y-1.5 text-muted-foreground">
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span>Tax Registration Number (TRN) Certificate</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span>Financial Statements (Balance Sheet, P&L, Cash Flow)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span>Trial Balance for the tax period</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span>General Ledger (detailed transactions)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span>Bank Statements (entire tax period)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span>Schedule of Fixed Assets & Depreciation</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span>Details of Related Party Transactions</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span>Payroll Records (if applicable)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  <span>VAT Returns (if registered)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-orange-600 mt-0.5">•</span>
                                  <span><strong>If first time filing:</strong> Opening balance sheet and incorporation documents</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-orange-600 mt-0.5">•</span>
                                  <span><strong>If foreign operations:</strong> Foreign subsidiary financials and transfer pricing documentation</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-orange-600 mt-0.5">•</span>
                                  <span><strong>If switching consultant:</strong> Previous tax returns and correspondence with FTA</span>
                                </li>
                              </ul>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}


              </Accordion>

              {/* Additional Notes */}
              <div className="mt-4">
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
            </form>
          </div>
        )}

        {currentStage === 'preview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Review Draft</h3>
                <p className="text-sm text-muted-foreground">
                  Please review all details before saving
                </p>
              </div>
              <Badge variant="outline">Draft Preview</Badge>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Contact Name</p>
                      <p className="font-medium">{form.getValues('name')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{form.getValues('email')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Mobile</p>
                      <p className="font-medium">{form.getValues('mobile')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Company</p>
                      <p className="font-medium">{form.getValues('company')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Service Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Service Selection</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Product/Service</p>
                      <p className="font-medium">
                        {products.find(p => p.id === form.getValues('product_id'))?.name || 'Not selected'}
                      </p>
                    </div>
                    {form.getValues('license_type') && (
                      <div>
                        <p className="text-sm text-muted-foreground">License Type</p>
                        <p className="font-medium">{form.getValues('license_type')}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Business Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Business Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    {form.getValues('jurisdiction') && (
                      <div>
                        <p className="text-sm text-muted-foreground">Jurisdiction</p>
                        <p className="font-medium">{form.getValues('jurisdiction')}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Annual Turnover</p>
                      <p className="font-medium">AED {form.getValues('amount')?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lead Source</p>
                      <p className="font-medium">{form.getValues('lead_source')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Number of Shareholders</p>
                      <p className="font-medium">{form.getValues('no_of_shareholders')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Financial Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Annual Turnover</p>
                      <p className="font-medium">AED {form.getValues('annual_turnover')?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bank Preference</p>
                      <p className="font-medium">
                        {form.getValues('any_suitable_bank') 
                          ? 'Any suitable bank' 
                          : form.getValues('bank_preference_1') || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Notes */}
              {form.getValues('customer_notes') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Additional Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{form.getValues('customer_notes')}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStage('details')}
                disabled={isSubmitting}
              >
                Back to Edit
              </Button>
              <Button
                onClick={form.handleSubmit(handleSubmit)}
                disabled={isSubmitting}
                className="min-w-[150px]"
              >
                {isSubmitting ? 'Saving Draft...' : 'Confirm & Save Draft'}
              </Button>
            </div>
          </div>
        )}

        {currentStage === 'documents' && createdCustomerId && (
          <div className="space-y-6">
            {documents.length > 0 ? (
              <>
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
                    onClick={() => setCurrentStage('details')}
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
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Please create the customer first to upload documents.</p>
                <Button
                  variant="outline"
                  onClick={() => setCurrentStage('details')}
                  className="mt-4"
                >
                  Go to Customer Details
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Floating Action Buttons - Only show on details stage before submission */}
    {currentStage === 'details' && !createdCustomerId && (
      <div className="fixed bottom-8 right-8 flex gap-3 z-50">
        <button
          type="button"
          onClick={async () => {
            const isValid = await form.trigger();
            if (isValid) {
              setCurrentStage('preview');
            }
          }}
          disabled={isSubmitting}
          className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg border-2 border-blue-600/20 rounded-full transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
          title="Preview Draft"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="absolute -top-10 right-0 bg-popover text-popover-foreground text-xs font-semibold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg border border-border">
            Preview Draft (Optional)
          </span>
        </button>
        <button
          type="button"
          onClick={form.handleSubmit(handleSubmit)}
          disabled={isSubmitting}
          className="w-12 h-12 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg border-2 border-green-600/20 rounded-full transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
          title="Save as Draft"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Save className="w-6 h-6" />
              <span className="absolute -top-10 right-0 bg-popover text-popover-foreground text-xs font-semibold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg border border-border">
                Save Draft
              </span>
            </>
          )}
        </button>
      </div>
    )}
    
    {/* Confirmation Dialog for switching tabs with unsaved data */}
    <AlertDialog open={showSwitchConfirm} onOpenChange={setShowSwitchConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved data in the current form. Switching tabs will clear this information. 
            Do you want to continue without saving?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={cancelModeSwitch}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmModeSwitch}>
            Continue Without Saving
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </div>
  );
};

export default ComprehensiveCustomerForm;