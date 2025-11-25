import { useState, useEffect } from 'react';
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
import { ChevronLeft, ChevronRight, Check, Save, ArrowLeft, ArrowRight, User, Mail, Phone, Globe, Building2, X, FileText, Calendar, ChevronUp, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { CustomerTypeSelector } from './CustomerTypeSelector';
import { ExistingCustomerSelector } from './ExistingCustomerSelector';
import { ProcessSummarySidebar } from './ProcessSummarySidebar';
import { UnifiedProgressHeader } from './UnifiedProgressHeader';
import { ValidationIcon } from './ValidationIcon';
import { HomeFinanceFields } from './fields/HomeFinanceFields';
import { BankAccountFields } from './fields/BankAccountFields';
import { GoAMLFields } from './fields/GoAMLFields';
import { BookkeepingFields } from './fields/BookkeepingFields';
import { VATFields } from './fields/VATFields';
import { TaxFields } from './fields/TaxFields';
import DynamicServiceForm from '@/components/Application/DynamicServiceForm';

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
    .max(20, "Mobile number is too long")
    .refine((val) => {
      // Remove all spaces, hyphens, and parentheses
      const cleaned = val.replace(/[\s\-()]/g, '');
      // Validate numeric only (after removing +971 prefix)
      const withoutPrefix = cleaned.replace(/^\+?971/, '').replace(/^0/, '');
      
      // Check if contains only digits
      if (!/^[0-9]+$/.test(withoutPrefix)) {
        return false;
      }
      
      // Validate exact length: must be exactly 9 digits after prefix
      if (withoutPrefix.length !== 9) {
        return false;
      }
      
      // Must start with +971 or 971 or 0, followed by exactly 9 digits
      return /^\+971[0-9]{9}$/.test(cleaned) || 
             /^971[0-9]{9}$/.test(cleaned) || 
             /^0[0-9]{9}$/.test(cleaned) ||
             /^[0-9]{9}$/.test(cleaned);
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
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Auto-expand process sidebar from step 2 onwards, collapse when going back to step 1
  useEffect(() => {
    if (currentStep >= 2) {
      setProcessSidebarCollapsed(false);
    } else if (currentStep === 1) {
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
        // If we're in step 2, notify parent about the selected product
        if (currentStep === 2) {
          onProductChange?.(businessBankAccount.name);
        }
      }
    }
  }, [products, form, currentStep, onProductChange]);

  // When entering step 2, notify parent about already selected product
  useEffect(() => {
    if (currentStep === 2 && selectedProductName) {
      onProductChange?.(selectedProductName);
    }
  }, [currentStep, selectedProductName, onProductChange]);

  const handleProductChange = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (product) {
      setSelectedProductName(product.name);
      onProductChange?.(product.name);
    }
  };

  // Auto-save draft when progressing from step 1 to step 2
  const autoSaveDraft = async () => {
    if (!user?.id) return;

    const values = form.getValues();
    
    try {
      // Get next reference number
      const { data: refData } = await supabase
        .from('customers')
        .select('reference_number')
        .order('reference_number', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const nextRefNumber = (refData?.reference_number || 0) + 1;

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
        reference_number: nextRefNumber,
        status: 'Draft' as const,
      };

      const { data: customer, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (!error) {
        toast({
          title: "Auto-saved",
          description: `Draft automatically saved with reference #${nextRefNumber}`,
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
            // Get next reference number
            const { data: refData } = await supabase
              .from('customers')
              .select('reference_number')
              .order('reference_number', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            const nextRefNumber = (refData?.reference_number || 0) + 1;

            const customerData = {
              name: values.name,
              email: values.email || null,
              mobile: values.mobile,
              company: values.company || '',
              amount: 0,
              license_type: values.license_type || 'Mainland',
              lead_source: values.lead_source,
              user_id: user.id,
              reference_number: nextRefNumber,
              status: 'Draft' as const,
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
            completed: true,
            completed_at: new Date().toISOString(),
          }
        };

        // Create or update application
        if (!applicationId) {
          // Get next application reference number
          const { data: appRefData } = await supabase
            .from('account_applications')
            .select('reference_number')
            .order('reference_number', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          const nextAppRefNumber = (appRefData?.reference_number || 0) + 1;

          const { data: application, error: appError } = await supabase
            .from('account_applications')
            .insert([{
              customer_id: currentCustomerId,
              application_data: applicationData,
              status: 'predraft',
              reference_number: nextAppRefNumber,
            }])
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

      // Validate risk_level for bank account applications
      const selectedProduct = products?.find(p => p.id === data.product_id);
      const isBankAccount = selectedProduct?.service_category_id === 'bank_account' || 
                           selectedProduct?.name?.toLowerCase().includes('bank account');
      
      if (isBankAccount && !data.risk_level) {
        toast({
          title: "Risk Level Required",
          description: "Please select a risk level for bank account applications before submitting.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Use existing customer ID or create new customer
      let finalCustomerId = customerId;
      
      if (!finalCustomerId) {
        // Get next reference number
        const { data: refData } = await supabase
          .from('customers')
          .select('reference_number')
          .order('reference_number', { ascending: false })
          .limit(1)
          .single();
        
        const nextRefNumber = (refData?.reference_number || 0) + 1;

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
          reference_number: nextRefNumber,
          status: 'Submitted' as const,
        };

        const { data: customer, error } = await supabase
          .from('customers')
          .insert([customerData])
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
      // Get next reference number
      const { data: refData } = await supabase
        .from('customers')
        .select('reference_number')
        .order('reference_number', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const nextRefNumber = (refData?.reference_number || 0) + 1;

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
        reference_number: nextRefNumber,
        status: 'Draft' as const,
      };

      const { data: customer, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Draft Saved",
        description: `Draft saved at Step ${currentStep} with reference #${nextRefNumber}`,
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
    // For existing customer mode, skip validation ONLY for steps 1 and 2
    // Step 3 (service details) must always be validated regardless of customer type
    if (companyMode && selectedCustomerId && currentStep <= 2) {
      return true;
    }

    const values = form.getValues();

    if (currentStep === 1) {
      // Trigger validation for step 1 fields
      const isValid = await form.trigger(['name', 'email', 'mobile', 'customer_type', 'lead_source', 'company']);
      
      if (!isValid) {
        return false;
      }
      
      const errors = form.formState.errors;
      const nameValid = values.name && values.name.length >= 2 && !errors.name;
      const emailValid = values.email && !errors.email;
      const mobileValid = values.mobile && !errors.mobile;
      const typeValid = values.customer_type && !errors.customer_type;
      const sourceValid = values.lead_source && !errors.lead_source;
      const companyValid = values.customer_type === 'company' ? (values.company && !errors.company) : true;
      
      return nameValid && emailValid && mobileValid && typeValid && sourceValid && companyValid;
    }

    if (currentStep === 2) {
      // Trigger validation for step 2 fields
      const isValid = await form.trigger(['product_id', 'license_type']);
      
      if (!isValid) {
        return false;
      }
      
      const errors = form.formState.errors;
      const productValid = values.product_id && !errors.product_id;
      const licenseValid = values.license_type && !errors.license_type;
      
      return productValid && licenseValid;
    }

    if (currentStep === 3) {
      // Validate Step 3 - Dynamic form fields
      if (!values.product_id) {
        toast({
          title: "Product Required",
          description: "Please select a service in Step 2 before proceeding",
          variant: "destructive",
        });
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
          toast({
            title: "Validation Error",
            description: "Unable to validate form. Please try again or contact support.",
            variant: "destructive",
          });
          return false; // Prevent progression if config can't be fetched
        }

        if (!configData || !configData.form_config) {
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
                missingFields.push(fieldLabel);
              }
            }
          });
        });

        if (missingFields.length > 0) {
          toast({
            title: "Required Fields Missing",
            description: `Please fill in: ${missingFields.join(', ')}`,
            variant: "destructive",
          });
          return false;
        }

        return true;
      } catch (error) {
        console.error('Error validating step 3:', error);
        toast({
          title: "Validation Error",
          description: "An error occurred during validation. Please try again.",
          variant: "destructive",
        });
        return false; // Prevent progression if validation encounters an error
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

    return (
      <Accordion 
        type="single" 
        collapsible 
        className="w-1/4 mx-auto"
        value={step1AccordionOpen}
        onValueChange={setStep1AccordionOpen}
      >
        <AccordionItem value="customer-info" className="border rounded-lg bg-white">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            {step1AccordionOpen !== 'customer-info' && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{selectedCustomerData.name}</span>
              </div>
            )}
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <span className="text-muted-foreground block text-xs">Name</span>
                  <span className="font-medium">{selectedCustomerData.name}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <span className="text-muted-foreground block text-xs">Email</span>
                  <span className="font-medium">{selectedCustomerData.email}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <span className="text-muted-foreground block text-xs">Phone</span>
                  <span className="font-medium">{selectedCustomerData.mobile}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <span className="text-muted-foreground block text-xs">Company</span>
                  <span className="font-medium">{selectedCustomerData.company || 'N/A'}</span>
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
      {/* Unified Progress Header - Outside form for proper sticky behavior */}
      <UnifiedProgressHeader
        currentStep={currentStep}
        totalSteps={4}
        customerName={form.watch('name')}
        customerEmail={form.watch('email')}
        customerMobile={form.watch('mobile')}
        selectedProduct={products?.find(p => p.id === form.watch('product_id'))?.name}
        customerType={companyMode ? 'existing' : 'new'}
        onCustomerTypeChange={(value) => {
          // Check if user is past step 1 and trying to switch customer type
          if (currentStep > 1) {
            setPendingMode(value);
            setShowModeChangeWarning(true);
            return;
          }
          
          // Proceed with change if on step 1
          const newMode = value === 'existing';
          onModeChange?.(newMode);
          if (!newMode) {
            onCustomerSelect?.(null);
          }
        }}
      />

      <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            className="w-full"
          >

            <Card 
              className="-mt-px border-t-0 border-x border-b border-slate-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300 ease-out rounded-t-none rounded-b-2xl max-w-2xl mx-auto overflow-visible relative mt-4"
            >
            <CardContent className="p-5 sm:p-7 space-y-4 overflow-visible bg-gradient-to-b from-transparent to-slate-50/30 relative">
              {/* Customer Information Summary Accordion - Show after step 1 */}
              {currentStep > 1 && form.watch('name') && (
                <div className="sticky z-[90] bg-white/95 backdrop-blur-xl -mx-5 sm:-mx-7 px-5 sm:px-7 pt-0 pb-0 mb-0 border-b border-slate-200/50 shadow-sm" style={{ top: 'var(--unified-header-h, 160px)' }}>
                  <div className="flex justify-center">
                  <Accordion 
                    type="single" 
                    collapsible 
                    className={`bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm transition-all duration-300 ${accordionOpen === 'customer-info' ? 'w-1/2' : 'w-1/4'}`}
                    value={accordionOpen}
                    onValueChange={setAccordionOpen}
                  >
                    <AccordionItem value="customer-info" className="border-0">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      {accordionOpen !== 'customer-info' && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{form.watch('name')}</span>
                        </div>
                      )}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {form.watch('name') && (
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 text-primary mt-0.5" />
                            <div>
                              <span className="text-muted-foreground block text-xs">Name</span>
                              <span className="font-medium">{form.watch('name')}</span>
                            </div>
                          </div>
                        )}
                        {form.watch('email') && (
                          <div className="flex items-start gap-2">
                            <Mail className="h-4 w-4 text-primary mt-0.5" />
                            <div>
                              <span className="text-muted-foreground block text-xs">Email</span>
                              <span className="font-medium">{form.watch('email')}</span>
                            </div>
                          </div>
                        )}
                        {form.watch('mobile') && (
                          <div className="flex items-start gap-2">
                            <Phone className="h-4 w-4 text-primary mt-0.5" />
                            <div>
                              <span className="text-muted-foreground block text-xs">Phone</span>
                              <span className="font-medium">{form.watch('mobile')}</span>
                            </div>
                          </div>
                        )}
                        {form.watch('company') && (
                          <div className="flex items-start gap-2">
                            <Building2 className="h-4 w-4 text-primary mt-0.5" />
                            <div>
                              <span className="text-muted-foreground block text-xs">Company</span>
                              <span className="font-medium">{form.watch('company')}</span>
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
                  {companyMode && selectedCustomerData && (
                    <div className="px-3 sm:px-4 pb-1 mb-1">
                      {renderCustomerAccordion()}
                    </div>
                  )}

                  <CardHeader className="pb-2 px-3 sm:px-4">
                    <CardTitle className="text-lg text-slate-900">Customer Details</CardTitle>
                    <CardDescription className="text-xs text-slate-600">
                      {companyMode ? 'Select an existing customer or provide new customer information.' : "Enter the customer's basic information to get started."}
                    </CardDescription>
                  </CardHeader>
                  <div className="space-y-3 px-3 sm:px-4">
                  
                  {companyMode && user && (
                    <div className={`transform transition-all duration-300 relative z-[10000] ${companyMode ? 'opacity-100 scale-100' : 'opacity-40 scale-95 pointer-events-none'}`}>
                      <ExistingCustomerSelector
                        userId={user.id}
                        value={selectedCustomerId || ''}
                        onChange={(customerId, customer) => {
                          onCustomerSelect?.(customerId);
                          setSelectedCustomerData(customer);
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
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-primary pointer-events-none">
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
                                  <SelectContent position="popper" sideOffset={6} className="z-[200] bg-white border border-border shadow-xl pointer-events-auto">
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
                                  <SelectContent position="popper" sideOffset={6} className="z-[200] bg-white border border-border shadow-xl pointer-events-auto">
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
                            <SelectTrigger className="h-12 text-sm border-2 border-border/60 bg-white/50 backdrop-blur-sm rounded-lg
                              focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-white
                              hover:border-primary/50 hover:bg-white/80
                              transition-all duration-300">
                              <SelectValue placeholder="🎯 Choose a service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent position="popper" sideOffset={8} className="z-[200] bg-white border border-border shadow-xl rounded-md pointer-events-auto">
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
                  <CardHeader className="pb-2 px-3 sm:px-4">
                    <CardTitle className="text-base">Review & Submit</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                      Please review all information carefully before submitting.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-4 space-y-4">
                    {/* Customer Information Preview */}
                    <div className="rounded-lg border border-border bg-gradient-to-br from-primary/5 to-transparent p-4">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                        <div className="w-1 h-6 bg-primary rounded-full" />
                        <h4 className="font-semibold text-foreground text-base">Customer Information</h4>
                      </div>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between py-1">
                          <dt className="text-muted-foreground">Name:</dt>
                          <dd className="font-medium text-foreground">{form.watch('name')}</dd>
                        </div>
                        {form.watch('email') && (
                          <div className="flex justify-between py-1">
                            <dt className="text-muted-foreground">Email:</dt>
                            <dd className="font-medium text-foreground">{form.watch('email')}</dd>
                          </div>
                        )}
                        {form.watch('mobile') && (
                          <div className="flex justify-between py-1">
                            <dt className="text-muted-foreground">Mobile:</dt>
                            <dd className="font-medium text-foreground">{form.watch('mobile')}</dd>
                          </div>
                        )}
                        <div className="flex justify-between py-1">
                          <dt className="text-muted-foreground">Customer Type:</dt>
                          <dd className="font-medium text-foreground capitalize">{form.watch('customer_type') || 'Individual'}</dd>
                        </div>
                        {form.watch('customer_type') === 'company' && form.watch('company') && (
                          <div className="flex justify-between py-1">
                            <dt className="text-muted-foreground">Company:</dt>
                            <dd className="font-medium text-foreground">{form.watch('company')}</dd>
                          </div>
                        )}
                        <div className="flex justify-between py-1">
                          <dt className="text-muted-foreground">License Type:</dt>
                          <dd className="font-medium text-foreground">{form.watch('license_type')}</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Service Information Preview */}
                    <div className="rounded-lg border border-border bg-gradient-to-br from-primary/5 to-transparent p-4">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                        <div className="w-1 h-6 bg-primary rounded-full" />
                        <h4 className="font-semibold text-foreground text-base">Service Information</h4>
                      </div>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between py-1">
                          <dt className="text-muted-foreground">Service:</dt>
                          <dd className="font-medium text-foreground">{selectedProductName}</dd>
                        </div>
                        {form.watch('lead_source') && (
                          <div className="flex justify-between py-1">
                            <dt className="text-muted-foreground">Lead Source:</dt>
                            <dd className="font-medium text-foreground">{form.watch('lead_source')}</dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    {/* Service Details Preview - From Step 3 Dynamic Form */}
                    {(() => {
                      const allFormValues = form.getValues();
                      const serviceDetailsFields = Object.entries(allFormValues)
                        .filter(([key, value]) => key.startsWith('section_') && value)
                        .map(([key, value]) => {
                          // Use stored label map if available, otherwise parse the key
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
                          <div className="rounded-lg border border-border bg-gradient-to-br from-primary/5 to-transparent p-4">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                              <div className="w-1 h-6 bg-primary rounded-full" />
                              <h4 className="font-semibold text-foreground text-base">Service Details</h4>
                            </div>
                            <dl className="space-y-2 text-sm">
                              {serviceDetailsFields.map(({ label, value, key }) => (
                                <div key={key} className="flex justify-between py-1 gap-4">
                                  <dt className="text-muted-foreground">{label}:</dt>
                                  <dd className="font-medium text-foreground text-right">{value}</dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Additional Notes */}
                    <FormField
                      control={form.control}
                      name="customer_notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold">Additional Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field}
                              rows={4}
                              placeholder="Add any additional information or special requirements..."
                              className="resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </div>
              )}
            </CardContent>
          </Card>

        </form>
      </Form>
      
      {/* Floating Action Buttons */}
      <div className={`fixed bottom-6 flex flex-col gap-3 z-[9999] transition-all duration-500 ease-out ${
        sidebarCollapsed ? 'right-[72px]' : 'right-[344px]'
      }`}>
        {/* Cancel Button */}
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => setShowCancelDialog(true)}
          disabled={isSubmitting}
          className="h-11 w-11 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 border border-border/60 hover:border-destructive/50 hover:bg-destructive/5 backdrop-blur-sm bg-white/95"
          title="Cancel and return"
        >
          <X className="h-4 w-4" />
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
            className="h-11 w-11 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 border border-border/60 hover:border-primary/50 hover:bg-primary/5 backdrop-blur-sm bg-white/95"
            title="Previous Step"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        
        {/* Next Step Button */}
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
            className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90 text-primary-foreground"
            title="Next Step"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
        )}
        
        {/* Save Draft Button - Show only in Step 4 when all 3 steps completed */}
        {currentStep === 4 && completedSteps.has(1) && completedSteps.has(2) && completedSteps.has(3) && (
          <Button
            type="button"
            size="icon"
            onClick={saveDraft}
            disabled={isSubmitting}
            className="h-11 w-11 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 border border-border/60 hover:border-success/50 hover:bg-success/5 backdrop-blur-sm bg-white/95"
            title="Save Draft"
          >
            <Save className="h-5 w-5" />
          </Button>
        )}
      </div>

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

    </div>
  );
};

export default SimplifiedCustomerForm;
