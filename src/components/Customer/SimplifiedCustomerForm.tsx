import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useQuery } from '@tanstack/react-query';
import { ApplicationService } from '@/services/applicationService';
import { ChevronLeft, ChevronRight, Check, Save, ArrowLeft, ArrowRight, User, Mail, Phone, Globe, Building2, X, FileText, Calendar, ChevronUp, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { cn, truncateCustomerName } from '@/lib/utils';
import { CustomerTypeSelector } from './CustomerTypeSelector';
import { ExistingCustomerSelector } from './ExistingCustomerSelector';
import { ProcessSummarySidebar } from './ProcessSummarySidebar';
import { UnifiedProgressHeader } from './UnifiedProgressHeader';
import { TabbedCustomerProgressHeader } from './TabbedCustomerProgressHeader';
import { ValidationIcon } from './ValidationIcon';
import { HomeFinanceFields } from './fields/HomeFinanceFields';
import { BankAccountFields } from './fields/BankAccountFields';
import { GoAMLFields } from './fields/GoAMLFields';
import { BookkeepingFields } from './fields/BookkeepingFields';
import { VATFields } from './fields/VATFields';
import { TaxFields } from './fields/TaxFields';
import DynamicServiceForm from '@/components/Application/DynamicServiceForm';
import { ValidationErrorAccordion } from './ValidationErrorAccordion';

const formSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s\-'.]+$/, "Name can only contain letters, spaces, hyphens, apostrophes, and periods"),
  email: z.string()
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .max(255, "Email must be less than 255 characters")
    .refine((val) => {
      // Strict email validation pattern
      const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;
      
      // Must match pattern
      if (!emailRegex.test(val)) {
        return false;
      }
      
      // Cannot have consecutive dots
      if (val.includes('..')) {
        return false;
      }
      
      // Cannot start or end with dot before @
      const localPart = val.split('@')[0];
      if (localPart.startsWith('.') || localPart.endsWith('.')) {
        return false;
      }
      
      // Domain part validation
      const domainPart = val.split('@')[1];
      if (!domainPart || domainPart.startsWith('.') || domainPart.endsWith('.') || domainPart.startsWith('-') || domainPart.endsWith('-')) {
        return false;
      }
      
      return true;
    }, "Enter a valid email address (e.g., user@example.com)"),
  mobile: z.string()
    .trim()
    .min(1, "Mobile number is required")
    .transform((val) => {
      // Sanitize: remove all spaces, hyphens, and parentheses
      const cleaned = val.replace(/[\s\-()]/g, '');
      // Extract only the numeric part after +971, 971, or 0 prefix
      const withoutPrefix = cleaned.replace(/^\+?971/, '').replace(/^0/, '').replace(/\D/g, '');
      // Enforce exactly 9 digits by slicing
      const sanitized = withoutPrefix.slice(0, 9);
      // Return with standard +971 prefix
      return '+971 ' + sanitized;
    })
    .refine((val) => {
      // After transformation, validate the result
      const cleaned = val.replace(/[\s\-()]/g, '');
      const withoutPrefix = cleaned.replace(/^\+?971/, '');
      
      // Must be exactly 9 digits
      return /^[0-9]{9}$/.test(withoutPrefix);
    }, "Enter a valid UAE mobile number: numeric only, exactly 9 digits after +971"),
  customer_type: z.enum(['individual', 'company']).default('individual'),
  company: z.string().optional(),
  license_type: z.enum(['Mainland', 'Freezone', 'Offshore']),
  lead_source: z.enum(['Website', 'Referral', 'Social Media', 'Other']).default('Referral'),
  product_id: z.string().min(1, "Please select a product/service"),
  
  // Optional fields
  annual_turnover: z.number().optional(),
  jurisdiction: z.string().optional(),
  nationality: z.string().optional(),
  proposed_activity: z.string().optional(),
  customer_notes: z.string().optional(),
  no_of_shareholders: z.number().min(1).max(10).default(1),
  
  // Product-specific fields (all optional)
  risk_level: z.enum(['low', 'medium', 'high']).optional(),
  risk_calculation_type: z.enum(['manual', 'rule', 'ai', 'hybrid']).optional(),
  risk_score: z.number().min(0).max(100).optional(),
  mainland_or_freezone: z.enum(['mainland', 'freezone']).optional(),
  signatory_type: z.enum(['single', 'joint']).optional(),
  uae_residency_status: z.enum(['Resident', 'Non-Resident']).optional(),
  salary_range: z.string().optional(),
  company_incorporation_date: z.string().optional(),
  vat_registered: z.boolean().optional(),
  trade_license_number: z.string().optional(),
  nature_of_business: z.string().optional(),
  monthly_gross_salary: z.number().optional(),
  property_value: z.number().optional(),
  vat_registration_type: z.string().optional(),
  tax_year_period: z.string().optional(),
}).refine((data) => {
  if (data.customer_type === 'company' && !data.company) {
    return false;
  }
  return true;
}, {
  message: "Company name is required when type is company",
  path: ["company"],
});

type FormData = z.infer<typeof formSchema>;

interface SimplifiedCustomerFormProps {
  onSuccess?: () => void;
  onProductChange?: (productName: string | null) => void;
  onEmailChange?: (email: string) => void;
  onNameChange?: (name: string) => void;
  onMobileChange?: (mobile: string) => void;
  onCompanyChange?: (company: string) => void;
  companyMode?: boolean;
  selectedCustomerId?: string | null;
  onModeChange?: (mode: boolean) => void;
  onCancel?: () => void;
  onCustomerSelect?: (customerId: string | null) => void;
  onStepChange?: (step: number) => void;
  onCustomerIdChange?: (customerId: string | null) => void;
  onDocumentsChange?: (documents: Array<{
    category: string;
    documents: Array<{ name: string; required: boolean; requiredAtStages?: string[] }>;
  }>) => void;
  onFormStateChange?: (state: {
    currentStep: number;
    completedSteps: Set<number>;
    isSubmitting: boolean;
    canProgressToNextStep: () => Promise<boolean>;
    saveApplicationAtStep: (step: number) => Promise<void>;
    saveDraft: () => Promise<void>;
    showCancelDialog: () => void;
  }) => void;
  hideCustomerTypeSelector?: boolean;
  resumeApplicationId?: string;
  onRuleEngineContextChange?: (context: Record<string, any>) => void;
  prefillMobile?: string;
}

const SimplifiedCustomerForm: React.FC<SimplifiedCustomerFormProps> = ({
  onSuccess,
  onProductChange,
  onEmailChange,
  onNameChange,
  onMobileChange,
  onCompanyChange,
  companyMode = false,
  selectedCustomerId = null,
  onModeChange,
  onCustomerSelect,
  onCancel,
  onStepChange,
  onCustomerIdChange,
  onDocumentsChange,
  hideCustomerTypeSelector = false,
  resumeApplicationId,
  onRuleEngineContextChange,
  prefillMobile,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedProductName, setSelectedProductName] = useState<string>('');
  const [showModeChangeWarning, setShowModeChangeWarning] = useState(false);
  const [pendingMode, setPendingMode] = useState<'new' | 'existing' | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [processSidebarCollapsed, setProcessSidebarCollapsed] = useState(true);
  const [accordionOpen, setAccordionOpen] = useState<string | undefined>(undefined);
  const [step1AccordionOpen, setStep1AccordionOpen] = useState<string>('');
  const [selectedCustomerData, setSelectedCustomerData] = useState<any>(null);
  const [fieldLabelMap, setFieldLabelMap] = useState<Record<string, string>>({});
  const [ruleContextMapping, setRuleContextMapping] = useState<Record<string, string>>({});
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [step3FieldValues, setStep3FieldValues] = useState<Record<string, any>>({});
  const { toast } = useToast();
  const { user } = useAuth();

  // Keep process sidebar collapsed by default - user can manually expand if needed
  useEffect(() => {
    if (currentStep === 1) {
      setProcessSidebarCollapsed(true);
    }
  }, [currentStep]);

  // Function to dock/collapse process sidebar
  const handleDockAllSidebars = () => {
    setProcessSidebarCollapsed(!processSidebarCollapsed);
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      mobile: '+971 ',
      customer_type: 'company',
      company: '',
      license_type: 'Mainland',
      lead_source: 'Referral',
      product_id: '',
      no_of_shareholders: 1,
      annual_turnover: undefined,
      jurisdiction: '',
      nationality: '',
      proposed_activity: '',
      customer_notes: '',
      mainland_or_freezone: undefined,
      signatory_type: undefined,
      uae_residency_status: undefined,
      salary_range: '',
      company_incorporation_date: '',
      vat_registered: undefined,
      trade_license_number: '',
      nature_of_business: '',
      monthly_gross_salary: undefined,
      property_value: undefined,
      vat_registration_type: '',
      tax_year_period: '',
    },
  });

  // Prefill mobile from lookup sidebar
  useEffect(() => {
    if (prefillMobile && !companyMode) {
      form.setValue('mobile', prefillMobile);
      onMobileChange?.(prefillMobile);
    }
  }, [prefillMobile, companyMode, form, onMobileChange]);

  // Resume application from predraft - load existing data and navigate to correct step
  useEffect(() => {
    if (!resumeApplicationId) return;
    
    const loadResumeApplication = async () => {
      try {
        console.log('[SimplifiedCustomerForm] Loading resume application:', resumeApplicationId);
        
        const { data: app, error } = await supabase
          .from('account_applications')
          .select(`
            *,
            customer:customers(*)
          `)
          .eq('id', resumeApplicationId)
          .maybeSingle();
        
        if (error) throw error;
        if (!app) {
          toast({
            title: "Application Not Found",
            description: "Could not find the application to resume.",
            variant: "destructive",
          });
          return;
        }
        
        const appData = app.application_data as any || {};
        
        // Set application and customer IDs
        setApplicationId(app.id);
        if (app.customer_id) {
          setCustomerId(app.customer_id);
          onCustomerIdChange?.(app.customer_id);
        }
        
        // Populate form with saved data from step1
        if (appData.step1) {
          const step1 = appData.step1;
          form.setValue('name', step1.name || '');
          form.setValue('email', step1.email || '');
          form.setValue('mobile', step1.mobile || '+971 ');
          form.setValue('customer_type', step1.customer_type || 'company');
          form.setValue('company', step1.company || '');
          form.setValue('lead_source', step1.lead_source || 'Referral');
          
          // Notify parent about customer data
          onEmailChange?.(step1.email || '');
          onNameChange?.(step1.name || '');
          onMobileChange?.(step1.mobile || '');
          onCompanyChange?.(step1.company || '');
        }
        
        // Populate form with saved data from step2
        if (appData.step2) {
          const step2 = appData.step2;
          if (step2.product_id) {
            form.setValue('product_id', step2.product_id);
            // Fetch product name separately
            const { data: product } = await supabase
              .from('products')
              .select('name')
              .eq('id', step2.product_id)
              .maybeSingle();
            
            if (product) {
              setSelectedProductName(product.name);
              onProductChange?.(product.name);
              fetchDocumentsForProduct(step2.product_id);
            }
          }
          if (step2.license_type) {
            form.setValue('license_type', step2.license_type);
          }
        }
        
        // Load step3 dynamic fields if they exist
        if (appData.step3) {
          const step3Fields: Record<string, any> = {};
          Object.entries(appData.step3).forEach(([key, value]) => {
            if (key.startsWith('section_')) {
              step3Fields[key] = value;
              form.setValue(key as any, value);
            }
          });
          setStep3FieldValues(step3Fields);
          
          // Restore field labels if they were saved
          if (appData.step3.fieldLabels) {
            setFieldLabelMap(appData.step3.fieldLabels);
          }
        }
        
        // Determine which steps are completed and calculate next step
        const completedSet = new Set<number>();
        let nextStep = 1;
        
        if (appData.step1?.completed) {
          completedSet.add(1);
          nextStep = 2;
        }
        if (appData.step2?.completed) {
          completedSet.add(2);
          nextStep = 3;
        }
        if (appData.step3?.completed) {
          completedSet.add(3);
          nextStep = 4;
        }
        
        setCompletedSteps(completedSet);
        setCurrentStep(nextStep);
        onStepChange?.(nextStep);
        
        toast({
          title: "Application Resumed",
          description: `Continuing from Step ${nextStep}`,
        });
        
        console.log('[SimplifiedCustomerForm] Resumed at step:', nextStep, 'completed steps:', [...completedSet]);
      } catch (error) {
        console.error('[SimplifiedCustomerForm] Error loading resume application:', error);
        toast({
          title: "Error",
          description: "Failed to load application data.",
          variant: "destructive",
        });
      }
    };
    
    loadResumeApplication();
  }, [resumeApplicationId, form, toast, onCustomerIdChange, onEmailChange, onNameChange, onMobileChange, onCompanyChange, onProductChange, onStepChange]);

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Set default product to Business Bank Account and notify parent when in step 2
  useEffect(() => {
    if (products && !form.getValues('product_id')) {
      const businessBankAccount = products.find(p => 
        p.name.toLowerCase().includes('business bank account')
      );
      if (businessBankAccount) {
        form.setValue('product_id', businessBankAccount.id);
        setSelectedProductName(businessBankAccount.name);
        // If we're in step 2, notify parent about the selected product and fetch documents
        if (currentStep === 2) {
          onProductChange?.(businessBankAccount.name);
          // Fetch documents for default product
          fetchDocumentsForProduct(businessBankAccount.id);
        }
      }
    }
  }, [products, form, currentStep, onProductChange]);

  // When entering step 2, notify parent about already selected product and fetch documents
  useEffect(() => {
    if (currentStep === 2 && selectedProductName) {
      onProductChange?.(selectedProductName);
      const productId = form.getValues('product_id');
      if (productId) {
        fetchDocumentsForProduct(productId);
      }
    }
  }, [currentStep, selectedProductName, onProductChange]);

  // Notify parent about rule engine context changes for Step 3
  const formValues = form.watch();
  useEffect(() => {
    if (currentStep >= 2 && onRuleEngineContextChange) {
      // Extract rule engine context from form data
      const context: Record<string, any> = {};
      
      // Build reverse lookup: contextKey -> [labels that map to it]
      const contextKeyToLabels: Record<string, string[]> = {};
      Object.entries(ruleContextMapping).forEach(([label, contextKey]) => {
        if (!contextKeyToLabels[contextKey]) {
          contextKeyToLabels[contextKey] = [];
        }
        contextKeyToLabels[contextKey].push(label.toLowerCase());
      });
      
      // Search for fields that might be relevant for the rule engine
      Object.entries(formValues).forEach(([key, value]) => {
        if (!value) return;
        
        // Get the label for this field (use fieldLabelMap for dynamic fields)
        const label = fieldLabelMap[key] || key;
        const labelLower = label.toLowerCase();
        const keyLower = key.toLowerCase();
        const valueLower = String(value).toLowerCase();
        
        // First, check explicit ruleContextMapping (using field labels)
        const mappedContextKey = Object.entries(ruleContextMapping).find(
          ([mappedLabel]) => mappedLabel.toLowerCase() === labelLower
        )?.[1];
        
        if (mappedContextKey) {
          // Use explicit mapping - store the value directly
          context[mappedContextKey] = value;
        } else {
          // Fallback: License Type / Location Type mapping - check both key and label
          if (labelLower.includes('license') || labelLower.includes('location') || 
              keyLower.includes('license') || keyLower.includes('location')) {
            if (valueLower.includes('mainland')) {
              context.locationType = 'mainland';
            } else if (valueLower.includes('freezone') || valueLower.includes('free zone')) {
              context.locationType = 'freezone';
            }
          }
          
          // Fallback: Emirate / Jurisdiction mapping
          if (labelLower.includes('jurisdiction') || labelLower.includes('emirate') ||
              keyLower.includes('jurisdiction') || keyLower.includes('emirate')) {
            context.emirate = value;
          }
          
          // Fallback: Nationality
          if (labelLower.includes('nationality') || keyLower.includes('nationality')) {
            context.nationality = value;
          }
          
          // Fallback: Activity / Risk Level
          if (labelLower.includes('risk') || keyLower.includes('risk')) {
            context.activityRiskLevel = value;
          }
        }
      });
      
      // Also check dynamic section fields for value-based detection
      Object.entries(formValues).forEach(([key, value]) => {
        if (!key.startsWith('section_') || !value) return;
        
        const valueLower = String(value).toLowerCase();
        
        // Detect license type from values (only if not already set by mapping)
        if (!context.locationType) {
          if (valueLower === 'mainland' || valueLower === 'freezone') {
            context.locationType = valueLower;
          }
        }
        
        // Detect emirate from values (only if not already set by mapping)
        if (!context.emirate) {
          if (['dubai', 'abu dhabi', 'sharjah', 'ajman', 'rak', 'fujairah', 'umm al quwain'].some(
            e => valueLower.includes(e.toLowerCase())
          )) {
            context.emirate = value;
          }
        }
      });
      
      onRuleEngineContextChange(context);
    }
  }, [currentStep, JSON.stringify(formValues), fieldLabelMap, ruleContextMapping, onRuleEngineContextChange]);
  const fetchDocumentsForProduct = async (productId: string) => {
    try {
      const { data: configData } = await supabase
        .from('service_form_configurations')
        .select('form_config')
        .eq('product_id', productId)
        .maybeSingle();
      
      if (configData?.form_config) {
        const raw = configData.form_config as any;
        let documents: Array<{
          category: string;
          documents: Array<{ name: string; required: boolean; requiredAtStages?: string[] }>;
        }> = [];
        
        if (raw.requiredDocuments?.categories) {
          documents = raw.requiredDocuments.categories.map((cat: any) => ({
            category: cat.name,
            documents: (cat.documents || []).map((d: any) => ({
              name: d.name,
              required: Boolean(d.isMandatory),
              requiredAtStages: d.requiredAtStages || [],
            }))
          }));
        }
        
        // Load rule context mapping if available
        if (raw.ruleContextMapping) {
          setRuleContextMapping(raw.ruleContextMapping);
        } else {
          setRuleContextMapping({});
        }
        
        onDocumentsChange?.(documents);
      }
    } catch (error) {
      console.error('Error fetching documents config:', error);
    }
  };

  const handleProductChange = async (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (product) {
      setSelectedProductName(product.name);
      onProductChange?.(product.name);
      fetchDocumentsForProduct(productId);
    }
  };

  // Auto-save draft when progressing from step 1 to step 2
  const autoSaveDraft = async () => {
    if (!user?.id) return;

    const values = form.getValues();
    
    try {
      const customerData: any = {
        name: values.name,
        email: values.email || null,
        mobile: values.mobile,
        company: values.company || '',
        amount: 0,
        license_type: values.license_type || 'Mainland',
        lead_source: values.lead_source,
        user_id: user.id,
        product_id: values.product_id || null,
        annual_turnover: values.annual_turnover || null,
        jurisdiction: values.jurisdiction || null,
        customer_notes: values.customer_notes || null,
        status: 'Draft' as const,
        // reference_number will be auto-generated by database trigger
      };

      const { data: customer, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (!error && customer) {
        toast({
          title: "Auto-saved",
          description: `Draft automatically saved with reference #${customer.reference_number}`,
        });
      }
    } catch (error: any) {
      console.error('Error auto-saving draft:', error);
    }
  };

  // Save application data at each step to database
  const saveApplicationAtStep = async (stepNumber: number) => {
    if (!user?.id) {
      console.log('No user ID, skipping save');
      return;
    }

    const values = form.getValues();
    
    try {
      // Step 1: Create/update customer and application
      if (stepNumber === 1) {
        let currentCustomerId = customerId;
        
        // If using existing customer, use selected customer ID
        if (companyMode && selectedCustomerId) {
          currentCustomerId = selectedCustomerId;
          setCustomerId(selectedCustomerId);
          onCustomerIdChange?.(selectedCustomerId);
        } else {
          // Create or update customer
          if (!currentCustomerId) {
            const customerData: any = {
              name: values.name,
              email: values.email || null,
              mobile: values.mobile,
              company: values.company || '',
              amount: 0,
              license_type: values.license_type || 'Mainland',
              lead_source: values.lead_source,
              user_id: user.id,
              status: 'Draft' as const,
              // reference_number will be auto-generated by database trigger
            };

            const { data: customer, error: customerError } = await supabase
              .from('customers')
              .insert([customerData])
              .select()
              .single();

            if (customerError) throw customerError;
            
            currentCustomerId = customer.id;
            setCustomerId(customer.id);
            onCustomerIdChange?.(customer.id);
          } else {
            // Update existing customer
            const { error: updateError } = await supabase
              .from('customers')
              .update({
                name: values.name,
                email: values.email || null,
                mobile: values.mobile,
                company: values.company || '',
                license_type: values.license_type || 'Mainland',
                lead_source: values.lead_source,
                updated_at: new Date().toISOString(),
              })
              .eq('id', currentCustomerId);

            if (updateError) throw updateError;
          }
        }

        // Merge application data
        const applicationData = {
          step1: {
            name: values.name,
            email: values.email,
            mobile: values.mobile,
            customer_type: values.customer_type,
            company: values.company,
            lead_source: values.lead_source,
            existing_customer_mode: companyMode, // Track if using existing customer
            completed: true,
            completed_at: new Date().toISOString(),
          }
        };

        // Create or update application
        if (!applicationId) {
          // reference_number will be auto-generated by database trigger
          const { data: application, error: appError } = await supabase
            .from('account_applications')
            .insert([{
              customer_id: currentCustomerId,
              application_data: applicationData,
              status: 'predraft',
            } as any]) // reference_number auto-generated by trigger
            .select()
            .single();

          if (appError) throw appError;
          
          setApplicationId(application.id);
          
          // Silent save - no toast notification
        } else {
          // Update existing application
          const { error: updateError } = await supabase
            .from('account_applications')
            .update({
              application_data: applicationData,
              updated_at: new Date().toISOString(),
            })
            .eq('id', applicationId);

          if (updateError) throw updateError;
          
          // Silent save - no toast notification
        }
      }

      // Step 2: Update application with service selection
      if (stepNumber === 2 && applicationId) {
        // Get existing application data
        const { data: existingApp } = await supabase
          .from('account_applications')
          .select('application_data')
          .eq('id', applicationId)
          .single();

        const existingData = (existingApp?.application_data as Record<string, any>) || {};
        const mergedData = {
          ...existingData,
          step2: {
            product_id: values.product_id,
            license_type: values.license_type,
            completed: true,
            completed_at: new Date().toISOString(),
          }
        };

        const { error: updateError } = await supabase
          .from('account_applications')
          .update({
            application_data: mergedData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', applicationId);

        if (updateError) throw updateError;

        // Silent save - no toast notification
      }

      // Step 3: Update application with service details
      if (stepNumber === 3 && applicationId) {
        // Get existing application data
        const { data: existingApp } = await supabase
          .from('account_applications')
          .select('application_data')
          .eq('id', applicationId)
          .single();

        // Collect all service detail fields
        const serviceDetails: Record<string, any> = {};
        Object.entries(values).forEach(([key, value]) => {
          if (key.startsWith('section_')) {
            serviceDetails[key] = value;
          }
        });

        const existingData = (existingApp?.application_data as Record<string, any>) || {};
        const mergedData = {
          ...existingData,
          step3: {
            ...serviceDetails,
            fieldLabels: fieldLabelMap, // Store labels for preview display
            completed: true,
            completed_at: new Date().toISOString(),
          }
        };

        const { error: updateError } = await supabase
          .from('account_applications')
          .update({
            application_data: mergedData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', applicationId);

        if (updateError) throw updateError;

        // Create a message from form notes if they exist (when draft is saved at step 3)
        if (user?.id) {
          try {
            await ApplicationService.createMessageFromFormNotes(
              applicationId,
              mergedData,
              user.id
            );
          } catch (noteError) {
            console.error('Error creating message from notes:', noteError);
            // Don't block save if message creation fails
          }
        }

        // Silent save - no toast notification
      }

    } catch (error: any) {
      console.error('Error saving application at step:', error);
      toast({
        title: "Save Error",
        description: error.message || "Failed to save application data",
        variant: "destructive",
      });
    }
  };

  // Auto-progress removed - users must manually click Next to progress through steps
  
  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    // Also scroll the main content area if it exists
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }, [currentStep]);
  
  // Auto-switch to existing customer tab when a customer is selected
  useEffect(() => {
    if (selectedCustomerId && !companyMode) {
      onModeChange?.(true);
    }
  }, [selectedCustomerId, companyMode, onModeChange]);

  // Populate form with existing customer data when selected
  useEffect(() => {
    if (selectedCustomerData && companyMode) {
      form.setValue('name', selectedCustomerData.name || '');
      form.setValue('email', selectedCustomerData.email || '');
      // Ensure mobile starts with +971
      const mobile = selectedCustomerData.mobile || '';
      const formattedMobile = mobile.startsWith('+971') ? mobile : mobile ? `+971 ${mobile.replace(/^\+?971\s*/, '')}` : '+971 ';
      form.setValue('mobile', formattedMobile);
      form.setValue('customer_type', selectedCustomerData.company ? 'company' : 'individual');
      form.setValue('company', selectedCustomerData.company || '');
      form.setValue('product_id', selectedCustomerData.product_id || '');
      form.setValue('license_type', selectedCustomerData.license_type || 'Mainland');
      form.setValue('lead_source', selectedCustomerData.lead_source || 'Referral');
      form.setValue('annual_turnover', selectedCustomerData.annual_turnover || undefined);
      form.setValue('jurisdiction', selectedCustomerData.jurisdiction || '');
      form.setValue('customer_notes', selectedCustomerData.customer_notes || '');
      
      // Update selected product name for the sidebar
      const product = products?.find(p => p.id === selectedCustomerData.product_id);
      if (product) {
        setSelectedProductName(product.name);
        onProductChange?.(product.name);
      }
    }
  }, [selectedCustomerData, companyMode, form, products, onProductChange]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      if (!user?.id) {
        toast({
          title: "Error",
          description: "You must be logged in to create a customer",
          variant: "destructive",
        });
        return;
      }

      // Use existing customer ID or create new customer
      let finalCustomerId = customerId;
      
      if (!finalCustomerId) {
        // reference_number will be auto-generated by database trigger
        const customerData = {
          name: data.name,
          email: data.email,
          mobile: data.mobile,
          company: data.company || '',
          amount: 0,
          license_type: data.license_type,
          lead_source: data.lead_source,
          user_id: user.id,
          product_id: data.product_id,
          annual_turnover: data.annual_turnover,
          jurisdiction: data.jurisdiction,
          customer_notes: data.customer_notes,
          status: 'Submitted' as const,
        };

        const { data: customer, error } = await supabase
          .from('customers')
          .insert([customerData as any]) // reference_number auto-generated by trigger
          .select()
          .single();

        if (error) throw error;
        
        finalCustomerId = customer.id;
      } else {
        // Update existing customer to Submitted status
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            status: 'Submitted' as const,
            product_id: data.product_id,
            customer_notes: data.customer_notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', finalCustomerId);

        if (updateError) throw updateError;
      }

      // Merge step 4 data into application
      if (applicationId) {
        // Get existing application data
        const { data: existingApp } = await supabase
          .from('account_applications')
          .select('application_data')
          .eq('id', applicationId)
          .single();

        const existingData = (existingApp?.application_data as Record<string, any>) || {};
        const mergedData = {
          ...existingData,
          step4: {
            customer_notes: data.customer_notes,
            submitted: true,
            submitted_at: new Date().toISOString(),
          }
        };

        // Update application with merged data and submitted status
        const { error: updateError } = await supabase
          .from('account_applications')
          .update({
            application_data: mergedData,
            status: 'submitted',
            updated_at: new Date().toISOString(),
          })
          .eq('id', applicationId);

        if (updateError) throw updateError;

        // Create a message from form notes if they exist
        try {
          await ApplicationService.createMessageFromFormNotes(
            applicationId,
            mergedData,
            user.id
          );
        } catch (noteError) {
          console.error('Error creating message from notes:', noteError);
          // Don't block submission if message creation fails
        }
      }

      toast({
        title: "Success",
        description: "Application submitted successfully",
      });

      // Reset form and all states including sidebars
      form.reset();
      setApplicationId(null);
      setCustomerId(null);
      onCustomerSelect?.(null);
      setSelectedCustomerData(null);
      setCurrentStep(1);
      onStepChange?.(1);
      setProcessSidebarCollapsed(true);
      setSidebarCollapsed(true);
      setCompletedSteps(new Set());
      onSuccess?.();
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save draft function - can save at any step if mandatory fields are validated
  const saveDraft = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to save a draft",
        variant: "destructive",
      });
      return;
    }

    // Validate current step before saving
    const canProgress = await canProgressToNextStep();
    if (!canProgress) {
      toast({
        title: "Cannot Save Draft",
        description: "Please complete all mandatory fields in the current step correctly before saving",
        variant: "destructive",
      });
      return;
    }

    // Check if step 1 mandatory fields are valid
    const values = form.getValues();
    
    // Trigger validation first
    const isValid = await form.trigger(['name', 'email', 'mobile', 'customer_type', 'lead_source', 'company']);
    
    if (!isValid) {
      const errors = form.formState.errors;
      toast({
        title: "Cannot Save Draft",
        description: "Please ensure all mandatory fields are filled correctly: Name, Email, Mobile (UAE), Type, and Source",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // reference_number will be auto-generated by database trigger
      const customerData = {
        name: values.name,
        email: values.email || null,
        mobile: values.mobile,
        company: values.company || '',
        amount: 0,
        license_type: values.license_type || 'Mainland',
        lead_source: values.lead_source,
        user_id: user.id,
        product_id: values.product_id || null,
        annual_turnover: values.annual_turnover || null,
        jurisdiction: values.jurisdiction || null,
        customer_notes: values.customer_notes || null,
        status: 'Draft' as const,
      };

      const { data: customer, error } = await supabase
        .from('customers')
        .insert([customerData as any]) // reference_number auto-generated by trigger
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "✅ Draft Saved Successfully",
        description: `Application draft saved at Step ${currentStep} • Reference #${customer.reference_number}`,
        className: "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200",
      });

      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save draft. Please ensure all validated fields are correct.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndExit = async () => {
    // Save as draft and exit
    await saveDraft();
    setShowCancelDialog(false);
  };

  const handleExitWithoutSaving = () => {
    setShowCancelDialog(false);
    onCancel?.();
  };

  // Validate if current step has all mandatory fields valid
  const canProgressToNextStep = async () => {
    const collectedErrors: string[] = [];
    
    // For existing customer mode in step 1, only validate that a customer is selected
    // Skip validation of new customer fields (name, email, mobile)
    if (companyMode && currentStep === 1) {
      console.log('[canProgressToNextStep] Existing customer mode - checking selection:', { selectedCustomerId, selectedCustomerData });
      if (!selectedCustomerId && !selectedCustomerData) {
        collectedErrors.push('Please select an existing customer from the search');
        setValidationErrors(collectedErrors);
        return false;
      }
      setValidationErrors([]);
      return true;
    }

    const values = form.getValues();

    if (currentStep === 1) {
      // Trigger validation for step 1 fields
      const isValid = await form.trigger(['name', 'email', 'mobile', 'customer_type', 'lead_source', 'company']);
      
      const errors = form.formState.errors;
      
      // Collect specific error messages
      if (!values.name || values.name.length < 2) collectedErrors.push('Name must be at least 2 characters');
      if (errors.name) collectedErrors.push(errors.name.message || 'Invalid name');
      if (!values.email) collectedErrors.push('Email is required');
      if (errors.email) collectedErrors.push(errors.email.message || 'Invalid email');
      if (!values.mobile) collectedErrors.push('Mobile number is required');
      if (errors.mobile) collectedErrors.push(errors.mobile.message || 'Invalid mobile');
      if (!values.customer_type) collectedErrors.push('Customer type is required');
      if (!values.lead_source) collectedErrors.push('Lead source is required');
      if (values.customer_type === 'company' && !values.company) collectedErrors.push('Company name is required');
      
      if (collectedErrors.length > 0) {
        setValidationErrors(collectedErrors);
        return false;
      }
      
      setValidationErrors([]);
      return isValid;
    }

    if (currentStep === 2) {
      // Trigger validation for step 2 fields
      const isValid = await form.trigger(['product_id', 'license_type']);
      
      const errors = form.formState.errors;
      
      if (!values.product_id) collectedErrors.push('Please select a service/product');
      if (errors.product_id) collectedErrors.push(errors.product_id.message || 'Invalid product');
      if (!values.license_type) collectedErrors.push('Please select a license type');
      if (errors.license_type) collectedErrors.push(errors.license_type.message || 'Invalid license type');
      
      if (collectedErrors.length > 0) {
        setValidationErrors(collectedErrors);
        return false;
      }
      
      setValidationErrors([]);
      return isValid;
    }

    if (currentStep === 3) {
      // Validate Step 3 - Dynamic form fields
      if (!values.product_id) {
        setValidationErrors(['Please select a service in Step 2 before proceeding']);
        return false;
      }

      // Fetch form configuration to check required fields
      try {
        const { data: configData, error } = await supabase
          .from('service_form_configurations')
          .select('form_config')
          .eq('product_id', values.product_id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching form config:', error);
          setValidationErrors(['Unable to validate form. Please try again.']);
          return false;
        }

        if (!configData || !configData.form_config) {
          setValidationErrors([]);
          return true; // No configuration means no required fields
        }

        const config = configData.form_config as any;
        const sections = config.sections || [];
        
        const missingFields: string[] = [];

        // Check each section for required fields
        sections.forEach((section: any, sectionIndex: number) => {
          const fields = section.fields || [];
          
          fields.forEach((field: any) => {
            // Check if field is required
            if (field.required) {
              const fieldKey = `section_${sectionIndex}_${field.name || field.id}`;
              const fieldValue = values[fieldKey];
              const isEmpty = fieldValue === undefined || fieldValue === null || fieldValue === '';
              
              if (isEmpty) {
                const fieldLabel = field.label || field.name || field.id || 'Field';
                missingFields.push(`${fieldLabel} is required`);
              }
            }
          });
        });

        if (missingFields.length > 0) {
          setValidationErrors(missingFields);
          return false;
        }

        setValidationErrors([]);
        return true;
      } catch (error) {
        console.error('Error validating step 3:', error);
        setValidationErrors(['An error occurred during validation. Please try again.']);
        return false;
      }
    }

    return true; // Step 4 doesn't have mandatory fields
  };

  const renderProductFields = () => {
    const productCategory = products?.find(p => p.id === form.watch('product_id'))?.service_category_id;
    
    if (!productCategory) return null;

    const categoryMap: Record<string, JSX.Element> = {
      'home_finance': <HomeFinanceFields form={form} />,
      'bank_account': <BankAccountFields form={form} />,
      'goaml': <GoAMLFields form={form} />,
      'bookkeeping': <BookkeepingFields form={form} />,
      'vat': <VATFields form={form} />,
      'tax': <TaxFields form={form} />,
    };

    return categoryMap[productCategory] || null;
  };

  const renderCustomerAccordion = () => {
    if (!selectedCustomerData || !companyMode) return null;

    const isExpanded = step1AccordionOpen === 'customer-info';
    
    return (
      <Accordion 
        type="single" 
        collapsible 
        className={cn(
          "transition-all duration-300 ease-in-out mx-auto",
          isExpanded ? "w-full max-w-md" : "w-fit min-w-[200px] max-w-full"
        )}
        value={step1AccordionOpen}
        onValueChange={setStep1AccordionOpen}
      >
        <AccordionItem value="customer-info" className="border bg-card shadow-sm rounded-none">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            {step1AccordionOpen !== 'customer-info' && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{truncateCustomerName(selectedCustomerData.name, 15)}</span>
              </div>
            )}
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-muted-foreground block text-xs">Name</span>
                  <span className="font-medium break-words">{selectedCustomerData.name}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-muted-foreground block text-xs">Email</span>
                  <span className="font-medium break-all">{selectedCustomerData.email}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-muted-foreground block text-xs">Phone</span>
                  <span className="font-medium">{selectedCustomerData.mobile}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-muted-foreground block text-xs">Company</span>
                  <span className="font-medium break-words">{selectedCustomerData.company || 'N/A'}</span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  };

  const stepLabels = [
    { title: 'Quick Info', desc: 'Basic details' },
    { title: 'Service', desc: 'Select service' },
    { title: 'Details', desc: 'Additional info' },
    { title: 'Submit', desc: 'Review & send' }
  ];

  return (
    <div className="w-full relative">
      {/* Progress Header - Conditionally show full or stepper-only version */}
      {hideCustomerTypeSelector ? (
        <TabbedCustomerProgressHeader
          currentStep={currentStep}
          totalSteps={4}
          onStepClick={(step) => {
            if (step < currentStep) {
              setCurrentStep(step);
              onStepChange?.(step);
            }
          }}
        />
      ) : (
        <UnifiedProgressHeader
          currentStep={currentStep}
          totalSteps={4}
          customerName={form.watch('name')}
          customerEmail={form.watch('email')}
          customerMobile={form.watch('mobile')}
          selectedProduct={products?.find(p => p.id === form.watch('product_id'))?.name}
          customerType={companyMode ? 'existing' : 'new'}
          onCustomerTypeChange={(value) => {
            if (currentStep > 1) {
              setPendingMode(value);
              setShowModeChangeWarning(true);
              return;
            }
            
            const newMode = value === 'existing';
            onModeChange?.(newMode);
            if (!newMode) {
              onCustomerSelect?.(null);
            }
          }}
        />
      )}

      <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            className="w-full"
          >

            <Card 
              className="-mt-px border-t-0 border-x border-b border-border bg-card shadow-lg hover:shadow-xl transition-all duration-300 ease-out rounded-t-none rounded-b-2xl max-w-2xl mx-auto overflow-visible relative mt-8"
            >
            <CardContent className="p-5 sm:p-7 space-y-4 overflow-visible bg-gradient-to-b from-transparent to-muted/30 relative">
              {/* Customer Information Summary Accordion - Show after step 1 */}
              {currentStep > 1 && form.watch('name') && (
                <div className="sticky top-0 z-[90] bg-card/95 backdrop-blur-xl -mx-5 sm:-mx-7 px-5 sm:px-7 py-3 mb-4 border-b border-border/50 shadow-sm">
                  <div className="flex justify-center">
                  <Accordion 
                    type="single" 
                    collapsible 
                    className={cn(
                      "bg-card/70 backdrop-blur-sm rounded-none border border-border/60 shadow-sm transition-all duration-300 mx-auto",
                      accordionOpen === 'customer-info' ? "w-full max-w-md" : "w-1/2 max-w-[200px]"
                    )}
                    value={accordionOpen}
                    onValueChange={setAccordionOpen}
                  >
                    <AccordionItem value="customer-info" className="border-0">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      {accordionOpen !== 'customer-info' && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium truncate">{form.watch('name')}</span>
                        </div>
                      )}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-3 text-sm">
                        {form.watch('name') && (
                          <div className="flex items-start gap-3">
                            <User className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="text-muted-foreground block text-xs">Name</span>
                              <span className="font-medium break-words">{form.watch('name')}</span>
                            </div>
                          </div>
                        )}
                        {form.watch('email') && (
                          <div className="flex items-start gap-3">
                            <Mail className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="text-muted-foreground block text-xs">Email</span>
                              <span className="font-medium break-all">{form.watch('email')}</span>
                            </div>
                          </div>
                        )}
                        {form.watch('mobile') && (
                          <div className="flex items-start gap-3">
                            <Phone className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="text-muted-foreground block text-xs">Phone</span>
                              <span className="font-medium">{form.watch('mobile')}</span>
                            </div>
                          </div>
                        )}
                        {form.watch('company') && (
                          <div className="flex items-start gap-3">
                            <Building2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <span className="text-muted-foreground block text-xs">Company</span>
                              <span className="font-medium break-words">{form.watch('company')}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  </Accordion>
                  </div>
                </div>
              )}

              {/* Step 1: Customer Selection */}
              {currentStep === 1 && (
                <div key="step-1" className="animate-fade-in">
                  {/* Show selected customer - Accordion */}
                  {(() => {
                    console.log('[SimplifiedCustomerForm] Accordion render check:', { 
                      companyMode, 
                      selectedCustomerData, 
                      shouldRender: companyMode && selectedCustomerData 
                    });
                    return companyMode && selectedCustomerData && (
                      <div className="px-3 sm:px-4 pb-1 mb-1">
                        {renderCustomerAccordion()}
                      </div>
                    );
                  })()}

                  <div className="px-3 sm:px-4 pb-2 border-0">
                    <h3 className="text-lg text-foreground font-semibold mb-1 border-0">Customer Details</h3>
                    <p className="text-xs text-muted-foreground border-0">
                      {companyMode ? 'Select an existing customer' : "Enter the customer's basic information to get started."}
                    </p>
                  </div>
                  <div className="space-y-3 px-3 sm:px-4">
                  
                  {companyMode && user && (
                    <div className={`transform transition-all duration-300 relative z-[10000] ${companyMode ? 'opacity-100 scale-100' : 'opacity-40 scale-95 pointer-events-none'}`}>
                      <ExistingCustomerSelector
                        userId={user.id}
                        value={selectedCustomerId || ''}
                        onChange={(customerId, customer) => {
                          console.log('[SimplifiedCustomerForm] ExistingCustomerSelector onChange:', { customerId, customer, companyMode });
                          onCustomerSelect?.(customerId);
                          setSelectedCustomerData(customer);
                          console.log('[SimplifiedCustomerForm] After setSelectedCustomerData:', customer);
                          // Ensure mode is set to existing when customer is selected
                          if (customerId && !companyMode) {
                            onModeChange?.(true);
                          }
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Show basic info fields for new customers only */}
                  {!companyMode && (
                    <div className={`transition-all duration-300 ${!companyMode ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                      {/* Quick Lead Capture - Step 1 */}
                      <div className="space-y-3 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {/* Name */}
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium">Name *</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    onChange={(e) => {
                                      field.onChange(e);
                                      onNameChange?.(e.target.value);
                                    }}
                                    placeholder="John Doe"
                                    className="h-10 text-sm"
                                  />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />

                          {/* Mobile */}
                          <FormField
                            control={form.control}
                            name="mobile"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium">Mobile (UAE) *</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-foreground z-10 pointer-events-none">
                                      +971
                                    </span>
                                     <Input 
                                      type="tel"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      value={field.value.replace(/^\+?971\s*/, '')}
                                      onChange={(e) => {
                                        let value = e.target.value;
                                        // Remove all non-digit characters
                                        value = value.replace(/\D/g, '');
                                        // Limit to exactly 9 digits
                                        value = value.slice(0, 9);
                                        // Store with +971 prefix
                                        const formattedValue = '+971 ' + value;
                                        field.onChange(formattedValue);
                                        onMobileChange?.(formattedValue);
                                      }}
                                      placeholder="501234567"
                                      className="h-10 text-sm pl-16"
                                      maxLength={9}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />

                          {/* Email */}
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium">Email *</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    onChange={(e) => {
                                      field.onChange(e);
                                      onEmailChange?.(e.target.value);
                                    }}
                                    placeholder="john@example.com"
                                    type="email"
                                    className="h-10 text-sm"
                                  />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />

                          {/* Customer Type */}
                          <FormField
                            control={form.control}
                            name="customer_type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium">Type *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-10 text-sm">
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent position="popper" sideOffset={6} className="z-[200] bg-popover border border-border shadow-xl pointer-events-auto">
                                    <SelectItem value="individual">Individual</SelectItem>
                                    <SelectItem value="company">Company</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />

                          {/* Company Name - Conditional on customer_type */}
                          {form.watch('customer_type') === 'company' && (
                            <FormField
                              control={form.control}
                              name="company"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-medium">Company *</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      onChange={(e) => {
                                        field.onChange(e);
                                        onCompanyChange?.(e.target.value);
                                      }}
                                      placeholder="ABC Trading LLC"
                                      className="h-10 text-sm"
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          )}

                          {/* Lead Source */}
                          <FormField
                            control={form.control}
                            name="lead_source"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium">Source *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-10 text-sm">
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent position="popper" sideOffset={6} className="z-[200] bg-popover border border-border shadow-xl pointer-events-auto">
                                    <SelectItem value="Website">Website</SelectItem>
                                    <SelectItem value="Referral">Referral</SelectItem>
                                    <SelectItem value="Social Media">Social Media</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              )}

              {/* Step 2: Service Selection */}
              {currentStep === 2 && (
                <div key="step-2" className="animate-fade-in">
                  <CardHeader className="pt-0 pb-2 px-3 sm:px-4">
                    <CardTitle className="text-lg">Service Selection</CardTitle>
                    <CardDescription className="text-xs">
                      Choose the service you need and provide the required details.
                    </CardDescription>
                  </CardHeader>
                  <div className="space-y-3 px-3 sm:px-4">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 transform transition-all duration-300">
                  <FormField
                    control={form.control}
                    name="product_id"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2 relative">
                        <FormLabel className="text-xs font-semibold text-foreground/90 ml-1">Select Service *</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          handleProductChange(value);
                        }} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-sm border-2 border-border/60 bg-card/50 backdrop-blur-sm
                              focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-card
                              hover:border-primary/50 hover:bg-card/80
                              transition-all duration-300">
                              <SelectValue placeholder="🎯 Choose a service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent position="popper" sideOffset={8} className="z-[200] bg-popover border border-border shadow-xl pointer-events-auto">
                            {products?.map((product: any) => (
                              <SelectItem key={product.id} value={product.id} className="py-3">
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs mt-1.5 ml-1 font-medium" />
                      </FormItem>
                    )}
                  />
                   </div>
                  </div>
                </div>
              )}

              {/* Step 3: Service Details - Dynamic Form Configuration */}
              {currentStep === 3 && (
                <div key="step-3" className="animate-fade-in">
                  <CardHeader className="pb-2 px-3 sm:px-4">
                    <CardTitle className="text-lg">Service Details</CardTitle>
                    <CardDescription className="text-xs">
                      Complete the details specific to your selected service.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-4 space-y-3">
                    {form.watch('product_id') ? (
                      <DynamicServiceForm
                        productId={form.watch('product_id')}
                        showDocuments={false}
                        showSubmitButton={false}
                        showCancelButton={false}
                        formData={form.getValues()}
                        onFieldChange={(fieldKey, value) => {
                          form.setValue(fieldKey as any, value);
                          // Track step 3 fields in state for preview
                          if (fieldKey.startsWith('section_')) {
                            setStep3FieldValues(prev => ({ ...prev, [fieldKey]: value }));
                          }
                        }}
                        onFieldLabelsLoaded={(labelMap) => {
                          setFieldLabelMap(labelMap);
                        }}
                      />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">Please select a service in the previous step.</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setCurrentStep(2);
                            onStepChange?.(2);
                          }}
                          className="mt-4"
                        >
                          Go to Step 2
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </div>
              )}

              {/* Step 4: Confirmation & Preview */}
              {currentStep === 4 && (
                <div key="step-4" className="animate-fade-in">
                  <CardHeader className="pb-4 px-3 sm:px-6 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b">
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      Save as Draft
                    </CardTitle>
                    <CardDescription className="mt-2 space-y-1">
                      <p className="text-base font-semibold text-foreground">Review & Save as Draft</p>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        Please review all information carefully before saving your draft.
                      </p>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 py-6 space-y-6">
                    {/* Customer Information Preview */}
                    <div className="group border border-border/50 bg-gradient-to-br from-primary/[0.03] via-background to-background hover:shadow-lg hover:border-primary/30 transition-all duration-300 overflow-hidden">
                      <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-4 border-b border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <h4 className="font-bold text-foreground text-lg">Customer Information</h4>
                        </div>
                      </div>
                      <div className="p-5">
                        <dl className="space-y-3">
                          <div className="flex justify-between items-center py-2 px-3 hover:bg-muted/50 transition-colors">
                            <dt className="text-sm text-muted-foreground font-medium">Name</dt>
                            <dd className="font-semibold text-foreground text-sm">{form.watch('name')}</dd>
                          </div>
                          {form.watch('email') && (
                            <div className="flex justify-between items-center py-2 px-3 hover:bg-muted/50 transition-colors">
                              <dt className="text-sm text-muted-foreground font-medium">Email</dt>
                              <dd className="font-semibold text-foreground text-sm">{form.watch('email')}</dd>
                            </div>
                          )}
                          {form.watch('mobile') && (
                            <div className="flex justify-between items-center py-2 px-3 hover:bg-muted/50 transition-colors">
                              <dt className="text-sm text-muted-foreground font-medium">Mobile</dt>
                              <dd className="font-semibold text-foreground text-sm">{form.watch('mobile')}</dd>
                            </div>
                          )}
                          <div className="flex justify-between items-center py-2 px-3 hover:bg-muted/50 transition-colors">
                            <dt className="text-sm text-muted-foreground font-medium">Customer Type</dt>
                            <dd className="font-semibold text-foreground text-sm capitalize">{form.watch('customer_type') || 'Individual'}</dd>
                          </div>
                          {form.watch('customer_type') === 'company' && form.watch('company') && (
                            <div className="flex justify-between items-center py-2 px-3 hover:bg-muted/50 transition-colors">
                              <dt className="text-sm text-muted-foreground font-medium">Company</dt>
                              <dd className="font-semibold text-foreground text-sm">{form.watch('company')}</dd>
                            </div>
                          )}
                          <div className="flex justify-between items-center py-2 px-3 hover:bg-muted/50 transition-colors">
                            <dt className="text-sm text-muted-foreground font-medium">License Type</dt>
                            <dd className="font-semibold text-foreground text-sm">{form.watch('license_type')}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    {/* Service Information Preview */}
                    <div className="group border border-border/50 bg-gradient-to-br from-primary/[0.03] via-background to-background hover:shadow-lg hover:border-primary/30 transition-all duration-300 overflow-hidden">
                      <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-4 border-b border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <h4 className="font-bold text-foreground text-lg">Service Information</h4>
                        </div>
                      </div>
                      <div className="p-5">
                        <dl className="space-y-3">
                          <div className="flex justify-between items-center py-2 px-3 hover:bg-muted/50 transition-colors">
                            <dt className="text-sm text-muted-foreground font-medium">Service</dt>
                            <dd className="font-semibold text-foreground text-sm">{selectedProductName}</dd>
                          </div>
                          {form.watch('lead_source') && (
                            <div className="flex justify-between items-center py-2 px-3 hover:bg-muted/50 transition-colors">
                              <dt className="text-sm text-muted-foreground font-medium">Lead Source</dt>
                              <dd className="font-semibold text-foreground text-sm">{form.watch('lead_source')}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </div>

                    {/* Service Details Preview - From Step 3 Dynamic Form */}
                    {(() => {
                      // Use step3FieldValues state which tracks dynamic form fields
                      const serviceDetailsFields = Object.entries(step3FieldValues)
                        .filter(([key, value]) => key.startsWith('section_') && value !== undefined && value !== null && value !== '')
                        .map(([key, value]) => {
                          const label = fieldLabelMap[key] || (() => {
                            const parts = key.replace('section_', '').split('_');
                            const fieldName = parts.slice(1).join(' ');
                            return fieldName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                          })();
                          
                          return {
                            label,
                            value: typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value),
                            key
                          };
                        });

                      if (serviceDetailsFields.length > 0) {
                        return (
                          <div className="group border border-border/50 bg-gradient-to-br from-primary/[0.03] via-background to-background hover:shadow-lg hover:border-primary/30 transition-all duration-300 overflow-hidden">
                            <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-4 border-b border-border/50">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <h4 className="font-bold text-foreground text-lg">Service Details</h4>
                              </div>
                            </div>
                            <div className="p-5">
                              <dl className="space-y-3">
                                {serviceDetailsFields.map(({ label, value, key }) => (
                                  <div key={key} className="flex justify-between items-center py-2 px-3 hover:bg-muted/50 transition-colors gap-4">
                                    <dt className="text-sm text-muted-foreground font-medium">{label}</dt>
                                    <dd className="font-semibold text-foreground text-sm text-right">{value}</dd>
                                  </div>
                                ))}
                              </dl>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Additional Notes */}
                    <div className="border border-border/50 bg-gradient-to-br from-primary/[0.02] to-background p-5">
                      <FormField
                        control={form.control}
                        name="customer_notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-bold text-foreground flex items-center gap-2">
                              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Additional Notes (Optional)
                            </FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field}
                                rows={4}
                                placeholder="Add any additional information or special requirements..."
                                className="resize-none mt-2 bg-background border-border/50 focus-visible:border-primary focus-visible:ring-primary/20"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </div>
              )}
            </CardContent>
          </Card>

        </form>
      </Form>
      
      {/* Mode Change Warning Dialog */}
      <AlertDialog open={showModeChangeWarning} onOpenChange={setShowModeChangeWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch Customer Type?</AlertDialogTitle>
            <AlertDialogDescription>
              Your changes may not be saved. You will be returned to Step 1. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPendingMode(null);
              setShowModeChangeWarning(false);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (pendingMode) {
                const newMode = pendingMode === 'existing';
                setCurrentStep(1);
                onStepChange?.(1);
                onModeChange?.(newMode);
                if (!newMode) {
                  onCustomerSelect?.(null);
                }
                setPendingMode(null);
              }
              setShowModeChangeWarning(false);
            }}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Application?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Would you like to save your progress before leaving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleExitWithoutSaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Exit Without Saving
            </AlertDialogAction>
            <AlertDialogAction onClick={handleSaveAndExit}>
              Save & Exit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Left Sidebar - Process Summary (Shows from step 2 onwards) */}
      {currentStep >= 2 && (
        <div className="hidden lg:block">
          <ProcessSummarySidebar
            currentStep={currentStep}
            formData={form.getValues()}
            fieldLabelMap={fieldLabelMap}
            productName={selectedProductName}
            isCollapsed={processSidebarCollapsed}
            onToggleCollapse={setProcessSidebarCollapsed}
            selectedCustomerData={selectedCustomerData}
            companyMode={companyMode}
          />
        </div>
      )}

      {/* Action Buttons - Fixed sticky position */}
      <div className="fixed bottom-6 right-12 flex flex-col gap-2 z-[99999]">
        {/* Cancel Button */}
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => setShowCancelDialog(true)}
          disabled={isSubmitting}
          className="h-9 w-9 rounded-full shadow-[0_2px_12px_rgba(239,68,68,0.25)] hover:shadow-[0_4px_20px_rgba(239,68,68,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 border border-red-300 hover:border-red-400 bg-gradient-to-br from-red-50 via-red-100/80 to-red-50 backdrop-blur-sm hover:from-red-100 hover:via-red-200/80 hover:to-red-100 group relative overflow-hidden"
          title="Cancel and return"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-400/10 via-red-500/5 to-red-400/10 group-hover:from-red-400/20 group-hover:via-red-500/10 group-hover:to-red-400/20 transition-all duration-300" />
          <X className="h-3.5 w-3.5 text-red-600 group-hover:text-red-700 relative z-10 transition-colors duration-300" />
        </Button>

        {/* Previous Step Button */}
        {currentStep > 1 && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => {
              const prevStep = Math.max(1, currentStep - 1);
              setCurrentStep(prevStep);
              onStepChange?.(prevStep);
            }}
            disabled={isSubmitting}
            className="h-9 w-9 rounded-full shadow-[0_2px_12px_rgba(234,179,8,0.25)] hover:shadow-[0_4px_20px_rgba(234,179,8,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 border border-yellow-300 hover:border-yellow-400 bg-gradient-to-br from-yellow-50 via-yellow-100/80 to-yellow-50 backdrop-blur-sm hover:from-yellow-100 hover:via-yellow-200/80 hover:to-yellow-100 group relative overflow-hidden"
            title="Previous Step"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-yellow-500/5 to-yellow-400/10 group-hover:from-yellow-400/20 group-hover:via-yellow-500/10 group-hover:to-yellow-400/20 transition-all duration-300" />
            <ArrowLeft className="h-3.5 w-3.5 text-yellow-600 group-hover:text-yellow-700 relative z-10 transition-all duration-300 group-hover:translate-x-[-1px]" />
          </Button>
        )}

        {/* Save Current Step Button - Show in steps 1-3 */}
        {currentStep < 4 && (
          <Button
            type="button"
            size="icon"
            onClick={async () => {
              const canSave = await canProgressToNextStep();
              if (canSave) {
                await saveApplicationAtStep(currentStep);
                toast({
                  title: "Saved",
                  description: `Step ${currentStep} data saved successfully`,
                });
              } else {
                toast({
                  title: "Cannot Save",
                  description: "Please complete all mandatory fields correctly before saving",
                  variant: "destructive",
                });
              }
            }}
            disabled={isSubmitting}
            className="h-9 w-9 rounded-full shadow-[0_2px_12px_rgba(20,184,166,0.2)] hover:shadow-[0_4px_20px_rgba(20,184,166,0.35)] transition-all duration-300 hover:scale-105 active:scale-95 border border-teal-300 hover:border-teal-400 bg-gradient-to-br from-teal-50 via-teal-100/80 to-teal-50 backdrop-blur-sm hover:from-teal-100 hover:via-teal-200/80 hover:to-teal-100 group relative overflow-hidden"
            title="Save Current Step"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-400/10 via-teal-500/5 to-teal-400/10 group-hover:from-teal-400/20 group-hover:via-teal-500/10 group-hover:to-teal-400/20 transition-all duration-300" />
            <Save className="h-3.5 w-3.5 text-teal-600 group-hover:text-teal-700 relative z-10 transition-colors duration-300" />
          </Button>
        )}
        
        {currentStep < 4 && (
          <Button
            type="button"
            size="icon"
            onClick={async () => {
              const canProgress = await canProgressToNextStep();
              if (canProgress) {
                // Save application data at current step before progressing
                await saveApplicationAtStep(currentStep);
                const nextStep = Math.min(4, currentStep + 1);
                setCurrentStep(nextStep);
                onStepChange?.(nextStep);
                // Mark current step as completed
                setCompletedSteps(prev => new Set(prev).add(currentStep));
                // Don't collapse sidebar when progressing - let the step logic handle it
              } else {
                toast({
                  title: "Cannot Progress",
                  description: "Please complete all mandatory fields correctly before proceeding",
                  variant: "destructive",
                });
              }
            }}
            disabled={isSubmitting}
            className="h-10 w-10 rounded-full shadow-[0_4px_20px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_25px_rgba(99,102,241,0.45)] transition-all duration-300 hover:scale-105 active:scale-95 bg-gradient-to-br from-primary via-primary/90 to-primary/80 hover:from-primary hover:via-primary/95 hover:to-primary/85 text-primary-foreground border border-primary/20 hover:border-primary/30 group relative overflow-hidden ring-1 ring-primary/20 hover:ring-2 hover:ring-primary/30"
            title="Next Step"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent group-hover:from-white/20 transition-all duration-300" />
            <ArrowRight className="h-4 w-4 relative z-10 transition-all duration-300 group-hover:translate-x-[1px]" />
          </Button>
        )}
        
        {/* Save Draft Button - Show only in Step 4 when all 3 steps completed */}
        {currentStep === 4 && completedSteps.has(1) && completedSteps.has(2) && completedSteps.has(3) && (
          <Button
            type="button"
            size="icon"
            onClick={saveDraft}
            disabled={isSubmitting}
            className="h-9 w-9 rounded-full shadow-[0_2px_12px_rgba(34,197,94,0.15)] hover:shadow-[0_4px_20px_rgba(34,197,94,0.25)] transition-all duration-300 hover:scale-105 active:scale-95 border border-green-200/80 hover:border-green-400/80 bg-gradient-to-br from-white via-green-50/50 to-white backdrop-blur-sm hover:from-green-50 hover:via-green-100/50 hover:to-green-50 group relative overflow-hidden"
            title="Save Draft"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/0 via-green-500/0 to-green-400/0 group-hover:from-green-400/10 group-hover:via-green-500/5 group-hover:to-green-400/10 transition-all duration-300" />
            <Save className="h-4 w-4 text-green-600 group-hover:text-green-700 relative z-10 transition-colors duration-300" />
          </Button>
        )}
      </div>

      {/* Validation Error Accordion - Auto-dismissing */}
      <ValidationErrorAccordion 
        errors={validationErrors}
        autoDismissDelay={5000}
        onDismiss={() => setValidationErrors([])}
      />

    </div>
  );
};

export default SimplifiedCustomerForm;
