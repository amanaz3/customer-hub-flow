import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Check, Save, ArrowLeft, ArrowRight } from 'lucide-react';
import { CustomerTypeSelector } from './CustomerTypeSelector';
import { ExistingCustomerSelector } from './ExistingCustomerSelector';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ValidationIcon } from './ValidationIcon';
import { HomeFinanceFields } from './fields/HomeFinanceFields';
import { BankAccountFields } from './fields/BankAccountFields';
import { GoAMLFields } from './fields/GoAMLFields';
import { BookkeepingFields } from './fields/BookkeepingFields';
import { VATFields } from './fields/VATFields';
import { TaxFields } from './fields/TaxFields';

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address").optional().or(z.literal('')),
  mobile: z.string().min(10, "Enter a valid phone number"),
  customer_type: z.enum(['individual', 'company']),
  country_of_residence: z.string().min(1, "Country of residence is required"),
  company: z.string().optional(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  license_type: z.enum(['Mainland', 'Freezone', 'Offshore']),
  lead_source: z.enum(['Website', 'Referral', 'Social Media', 'Other']),
  product_id: z.string().min(1, "Please select a product/service"),
  
  // Optional fields
  annual_turnover: z.number().optional(),
  jurisdiction: z.string().optional(),
  nationality: z.string().optional(),
  proposed_activity: z.string().optional(),
  customer_notes: z.string().optional(),
  no_of_shareholders: z.number().min(1).max(10).default(1),
  
  // Product-specific fields (all optional)
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
  message: "Company name is required for company type",
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
  onCustomerSelect?: (customerId: string | null) => void;
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
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProductName, setSelectedProductName] = useState<string>('');
  const [showModeChangeWarning, setShowModeChangeWarning] = useState(false);
  const [pendingMode, setPendingMode] = useState<'new' | 'existing' | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      mobile: '',
      customer_type: 'company',
      country_of_residence: '',
      company: '',
      amount: 0,
      license_type: 'Mainland',
      lead_source: 'Website',
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
        amount: values.amount || 0,
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

  // Auto-progress to next step when all required fields are VALID
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (isSubmitting) return;
      
      const errors = form.formState.errors;
      
      // Step 1: Check basic info is VALID (not just filled)
      if (currentStep === 1) {
        const nameValid = value.name && value.name.length >= 2 && !errors.name;
        const mobileValid = value.mobile && value.mobile.length >= 10 && !errors.mobile;
        const countryValid = value.country_of_residence && !errors.country_of_residence;
        const leadSourceValid = value.lead_source && !errors.lead_source;
        const companyValid = companyMode ? selectedCustomerId : true;
        
        if (nameValid && mobileValid && countryValid && leadSourceValid && companyValid) {
          // Auto-save before progressing to step 2
          autoSaveDraft();
          setTimeout(() => setCurrentStep(2), 500);
        }
      }
      
      // Step 2: Check service selection is VALID
      if (currentStep === 2) {
        const productValid = value.product_id && !errors.product_id;
        const amountValid = value.amount && value.amount > 0 && !errors.amount;
        const licenseValid = value.license_type && !errors.license_type;
        const sourceValid = value.lead_source && !errors.lead_source;
        
        if (productValid && amountValid && licenseValid && sourceValid) {
          setTimeout(() => setCurrentStep(3), 500);
        }
      }
      
      // Step 3: Auto-progress to confirmation after brief delay
      // (Most fields here are optional)
      if (currentStep === 3 && value.product_id) {
        setTimeout(() => setCurrentStep(4), 1000);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [currentStep, form, companyMode, selectedCustomerId, isSubmitting, user]);
  
  // Auto-switch to existing customer tab when a customer is selected
  useEffect(() => {
    if (selectedCustomerId && !companyMode) {
      onModeChange?.(true);
    }
  }, [selectedCustomerId, companyMode, onModeChange]);

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
        amount: data.amount,
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

      toast({
        title: "Success",
        description: "Customer created successfully",
      });

      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating customer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create customer",
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

    // Check if step 1 mandatory fields are valid
    const values = form.getValues();
    const errors = form.formState.errors;
    
    const nameValid = values.name && values.name.length >= 2 && !errors.name;
    const mobileValid = values.mobile && values.mobile.length >= 10 && !errors.mobile;
    const countryValid = values.country_of_residence && !errors.country_of_residence;
    const leadSourceValid = values.lead_source && !errors.lead_source;
    
    if (!nameValid || !mobileValid || !countryValid || !leadSourceValid) {
      toast({
        title: "Cannot Save Draft",
        description: "Please complete all mandatory fields: Name, Mobile, Country of Residence, and Lead Source",
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
        amount: values.amount || 0,
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

  // Validate if current step has all mandatory fields valid
  const canProgressToNextStep = () => {
    const values = form.getValues();
    const errors = form.formState.errors;

    if (currentStep === 1) {
      const nameValid = values.name && values.name.length >= 2 && !errors.name;
      const mobileValid = values.mobile && values.mobile.length >= 10 && !errors.mobile;
      const countryValid = values.country_of_residence && !errors.country_of_residence;
      const leadSourceValid = values.lead_source && !errors.lead_source;
      const companyValid = companyMode ? selectedCustomerId : true;
      
      return nameValid && mobileValid && countryValid && leadSourceValid && companyValid;
    }

    if (currentStep === 2) {
      const productValid = values.product_id && !errors.product_id;
      const amountValid = values.amount && values.amount > 0 && !errors.amount;
      const licenseValid = values.license_type && !errors.license_type;
      const sourceValid = values.lead_source && !errors.lead_source;
      
      return productValid && amountValid && licenseValid && sourceValid;
    }

    return true; // Steps 3 and 4 don't have mandatory fields
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

  const stepLabels = [
    { title: 'Customer Selection', desc: 'Choose customer type' },
    { title: 'Service Selection', desc: 'Select service and amount' },
    { title: 'Service Details', desc: 'Additional requirements' },
    { title: 'Confirmation', desc: 'Review and submit' }
  ];

  return (
    <div className="w-full flex flex-col items-center">
      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(onSubmit)} 
          className="w-full"
        >
          <Card 
            className="border border-gray-200 bg-white text-black shadow-[0_2px_12px_-3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)] transition-shadow duration-300"
          >
            <CardHeader className="border-b border-gray-200 pb-2 sm:pb-3 bg-gradient-to-r from-blue-600/10 via-blue-600/5 to-transparent px-4 sm:px-6 py-2 sm:py-3">
              <CardTitle className="text-sm sm:text-base font-bold text-black tracking-tight">
                {currentStep === 1 && 'Customer Selection'}
                {currentStep === 2 && 'Service Selection'}
                {currentStep === 3 && 'Service Details'}
                {currentStep === 4 && 'Confirmation'}
              </CardTitle>
              <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5 font-medium">
                {currentStep === 1 && 'Choose customer type and provide customer information'}
                {currentStep === 2 && 'Select the service and specify the application amount'}
                {currentStep === 3 && 'Provide additional details specific to the selected service'}
                {currentStep === 4 && 'Review all information before submitting'}
              </p>
            </CardHeader>
            <CardContent className="p-5 sm:p-7 space-y-5 sm:space-y-6">
              {/* Customer Type Selector - Always Visible */}
              <div className="transform transition-all duration-300 hover:scale-[1.01] pb-2 border-b border-gray-200">
                <CustomerTypeSelector
                  value={companyMode ? 'existing' : 'new'}
                  onChange={(value) => {
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
              </div>

              {/* Step 1: Customer Selection */}
              {currentStep === 1 && (
                <div key="step-1" className="animate-fade-in space-y-4">
                  
                  {/* Tab-Style Wizard - Positioned after customer selector */}
                  <div className="w-full">
                    <div className="flex items-center bg-gray-50 shadow-sm rounded-lg overflow-hidden">
                      {stepLabels.map((label, index) => {
                        const stepNumber = index + 1;
                        const isActive = currentStep === stepNumber;
                        const isCompleted = currentStep > stepNumber;
                        const isLast = index === stepLabels.length - 1;
                        
                        return (
                          <div
                            key={stepNumber}
                            className={`flex-1 relative transition-all duration-500 ${
                              isActive 
                                ? 'bg-blue-600 text-white shadow-lg scale-105 z-10' 
                                : isCompleted 
                                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                                : 'bg-gray-100 text-gray-500'
                            } ${!isLast ? 'mr-3' : ''}`}
                            style={{
                              clipPath: index === 0
                                ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
                                : !isLast 
                                ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)' 
                                : 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 12px 50%)'
                            }}
                          >
                            {/* Highlight pulse effect for active step */}
                            {isActive && (
                              <div className="absolute inset-0 animate-pulse bg-blue-400/20"
                                style={{
                                  clipPath: index === 0
                                    ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
                                    : !isLast 
                                    ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)' 
                                    : 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 12px 50%)'
                                }}
                              />
                            )}
                            
                            <div className="flex items-center gap-2 px-3 py-2 relative z-10">
                              <div className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs transition-all duration-500 ${
                                isActive 
                                  ? 'bg-white text-blue-600 shadow-md animate-scale-in' 
                                  : isCompleted 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-white text-gray-500'
                              }`}>
                                {isCompleted ? (
                                  <Check className="w-4 h-4 stroke-[3] animate-fade-in" />
                                ) : (
                                  <span className={isActive ? 'animate-scale-in' : ''}>
                                    {stepNumber}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`font-semibold text-xs truncate transition-all duration-500 ${
                                  isActive ? 'scale-110 font-bold' : 'scale-100'
                                }`}>
                                  {label.title}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {companyMode && user && (
                    <div className={`transform transition-all duration-300 ${companyMode ? 'opacity-100 scale-100' : 'opacity-40 scale-95 pointer-events-none'}`}>
                      <ExistingCustomerSelector
                        userId={user.id}
                        value={selectedCustomerId || ''}
                        onChange={(customerId, customer) => {
                          onCustomerSelect?.(customerId);
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
                      {/* Basic Info Section */}
                      <div className="space-y-3 pt-3">
                        <div className="rounded-lg border-2 border-gray-300 bg-gradient-to-br from-gray-50 via-white to-gray-50 p-5 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.01]">
                          <div className="flex items-center gap-2 mb-4 group">
                            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <h3 className="text-base font-bold text-gray-900 tracking-tight">Basic Info</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => {
                                const fieldState = form.getFieldState('name');
                                const hasValue = field.value && field.value.length > 0;
                                const isValid = hasValue && !fieldState.error;
                                const isError = hasValue && !!fieldState.error;
                                
                                return (
                                  <FormItem className="relative">
                                    <FormLabel className="text-sm font-bold text-gray-900 ml-1 mb-2">Full Name *</FormLabel>
                                    <FormControl>
                                      <div className="relative group">
                                        <Input 
                                          {...field} 
                                          onChange={(e) => {
                                            field.onChange(e);
                                            onNameChange?.(e.target.value);
                                          }}
                                          placeholder="John Doe"
                                          className="h-12 text-base pl-11 pr-11 border-2 border-gray-300 bg-white rounded-lg
                                            focus:border-blue-600 focus:ring-4 focus:ring-blue-100 focus:scale-[1.01] 
                                            hover:border-gray-400
                                            transition-all duration-300 
                                            placeholder:text-gray-400 font-medium"
                                        />
                                        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <ValidationIcon isValid={isValid} isError={isError} show={hasValue} />
                                      </div>
                                    </FormControl>
                                    <FormMessage className="text-xs mt-1.5 ml-1 font-medium" />
                                  </FormItem>
                                );
                              }}
                            />

                            <FormField
                              control={form.control}
                              name="mobile"
                              render={({ field }) => {
                                const fieldState = form.getFieldState('mobile');
                                const hasValue = field.value && field.value.length > 0;
                                const isValid = hasValue && !fieldState.error;
                                const isError = hasValue && !!fieldState.error;
                                
                                return (
                                  <FormItem className="relative">
                                    <FormLabel className="text-xs font-semibold text-foreground/90 ml-1">Mobile Number /Whatsapp*</FormLabel>
                                    <FormControl>
                                      <div className="relative group">
                                        <Input 
                                          {...field} 
                                          onChange={(e) => {
                                            field.onChange(e);
                                            onMobileChange?.(e.target.value);
                                          }}
                                          placeholder="+971 50 123 4567"
                                          className="h-11 text-sm pl-10 pr-11 border-2 border-border/60 bg-background/50 backdrop-blur-sm rounded-lg
                                            focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background focus:scale-[1.01]
                                            hover:border-primary/50 hover:bg-background/80
                                            transition-all duration-300
                                            placeholder:text-muted-foreground/50"
                                        />
                                        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        <ValidationIcon isValid={isValid} isError={isError} show={hasValue} />
                                      </div>
                                    </FormControl>
                                    <FormMessage className="text-xs mt-1.5 ml-1 font-medium" />
                                  </FormItem>
                                );
                              }}
                            />

                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => {
                                const fieldState = form.getFieldState('email');
                                const hasValue = field.value && field.value.length > 0;
                                const isValid = hasValue && !fieldState.error;
                                const isError = hasValue && !!fieldState.error;
                                
                                return (
                                  <FormItem className="relative">
                                    <FormLabel className="text-xs font-semibold text-foreground/90 ml-1">Email Address (Optional)</FormLabel>
                                    <FormControl>
                                      <div className="relative group">
                                        <Input 
                                          type="email"
                                          {...field} 
                                          onChange={(e) => {
                                            field.onChange(e);
                                            onEmailChange?.(e.target.value);
                                          }}
                                          placeholder="john.doe@example.com"
                                          className="h-11 text-sm pl-10 pr-11 border-2 border-border/60 bg-background/50 backdrop-blur-sm rounded-lg
                                            focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background focus:scale-[1.01]
                                            hover:border-primary/50 hover:bg-background/80
                                            transition-all duration-300
                                            placeholder:text-muted-foreground/50"
                                        />
                                        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <ValidationIcon isValid={isValid} isError={isError} show={hasValue} />
                                      </div>
                                    </FormControl>
                                    <FormMessage className="text-xs mt-1.5 ml-1 font-medium" />
                                  </FormItem>
                                );
                              }}
                            />

                            {/* Customer Type Field */}
                            <FormField
                              control={form.control}
                              name="customer_type"
                              render={({ field }) => (
                                <FormItem className="relative">
                                  <FormLabel className="text-xs font-semibold text-foreground/90 ml-1">Customer Type *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="h-11 text-sm border-2 border-border/60 bg-background/50 backdrop-blur-sm rounded-lg
                                        focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background
                                        hover:border-primary/50 hover:bg-background/80
                                        transition-all duration-300">
                                        <SelectValue placeholder="Select customer type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="z-50 bg-background border-border shadow-lg">
                                      <SelectItem value="individual">👤 Individual</SelectItem>
                                      <SelectItem value="company">🏢 Company</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage className="text-xs mt-1.5 ml-1 font-medium" />
                                </FormItem>
                              )}
                            />

                            {/* Country of Residence Field */}
                            <FormField
                              control={form.control}
                              name="country_of_residence"
                              render={({ field }) => (
                                <FormItem className="relative">
                                  <FormLabel className="text-xs font-semibold text-foreground/90 ml-1">Country of Residence *</FormLabel>
                                  <FormControl>
                                    <div className="relative group">
                                      <Input 
                                        {...field}
                                        placeholder="United Arab Emirates"
                                        className="h-11 text-sm pl-10 border-2 border-border/60 bg-background/50 backdrop-blur-sm rounded-lg
                                          focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background focus:scale-[1.01]
                                          hover:border-primary/50 hover:bg-background/80
                                          transition-all duration-300
                                          placeholder:text-muted-foreground/50"
                                      />
                                      <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </div>
                                  </FormControl>
                                  <FormMessage className="text-xs mt-1.5 ml-1 font-medium" />
                                </FormItem>
                              )}
                            />

                            {/* Conditional Company Field - only show for company type */}
                            {form.watch('customer_type') === 'company' && (
                              <FormField
                                control={form.control}
                                name="company"
                                render={({ field }) => {
                                  const fieldState = form.getFieldState('company');
                                  const hasValue = field.value && field.value.length > 0;
                                  const isValid = hasValue && !fieldState.error;
                                  const isError = hasValue && !!fieldState.error;
                                  
                                  return (
                                    <FormItem className="md:col-span-2 relative animate-fade-in">
                                      <FormLabel className="text-sm font-bold text-gray-900 ml-1 mb-2">Company Name *</FormLabel>
                                      <FormControl>
                                        <div className="relative group">
                                          <Input 
                                            {...field} 
                                            onChange={(e) => {
                                              field.onChange(e);
                                              onCompanyChange?.(e.target.value);
                                            }}
                                            placeholder="ABC Trading LLC"
                                            className="h-12 text-base pl-11 pr-11 border-2 border-gray-300 bg-white rounded-lg font-medium
                                              focus:border-blue-600 focus:ring-4 focus:ring-blue-100 focus:scale-[1.01]
                                              hover:border-gray-400
                                              transition-all duration-300
                                              placeholder:text-gray-400"
                                          />
                                          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                          </svg>
                                          <ValidationIcon isValid={isValid} isError={isError} show={hasValue} />
                                        </div>
                                      </FormControl>
                                      <FormMessage className="text-xs mt-1.5 ml-1 font-medium" />
                                    </FormItem>
                                  );
                                }}
                              />
                            )}
                          </div>
                        </div>

                        {/* Channel Info Section */}
                        <div className="rounded-lg border-2 border-gray-300 bg-gradient-to-br from-gray-50 via-white to-gray-50 p-5 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.01]">
                          <div className="flex items-center gap-2 mb-4 group">
                            <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            <h3 className="text-base font-bold text-gray-900 tracking-tight">Channel Info</h3>
                          </div>
                          <FormField
                            control={form.control}
                            name="lead_source"
                            render={({ field }) => (
                              <FormItem className="relative">
                                <FormLabel className="text-xs font-semibold text-foreground/90 ml-1">Lead Source *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-11 text-sm border-2 border-border/60 bg-background/50 backdrop-blur-sm rounded-lg
                                      focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background
                                      hover:border-primary/50 hover:bg-background/80
                                      transition-all duration-300">
                                      <SelectValue placeholder="How did you find us?" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="z-50 bg-background border-border shadow-lg">
                                    <SelectItem value="Website">🌐 Website</SelectItem>
                                    <SelectItem value="Referral">🤝 Referral</SelectItem>
                                    <SelectItem value="Social Media">📱 Social Media</SelectItem>
                                    <SelectItem value="Other">📋 Other</SelectItem>
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
                </div>
              )}

              {/* Step 2: Service Selection */}
              {currentStep === 2 && (
                <div key="step-2" className="animate-fade-in space-y-4">
                  {/* Tab-Style Wizard */}
                  <div className="w-full">
                    <div className="flex items-center bg-card shadow-sm rounded-lg overflow-hidden">
                      {stepLabels.map((label, index) => {
                        const stepNumber = index + 1;
                        const isActive = currentStep === stepNumber;
                        const isCompleted = currentStep > stepNumber;
                        const isLast = index === stepLabels.length - 1;
                        
                        return (
                          <div
                            key={stepNumber}
                            className={`flex-1 relative transition-all duration-500 ${
                              isActive 
                                ? 'bg-primary text-primary-foreground shadow-lg scale-105 z-10' 
                                : isCompleted 
                                ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                                : 'bg-muted/30 text-muted-foreground'
                            } ${!isLast ? 'mr-3' : ''}`}
                            style={{
                              clipPath: !isLast 
                                ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)' 
                                : index > 0 
                                ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 12px 50%)'
                                : 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
                            }}
                          >
                            {/* Highlight pulse effect for active step */}
                            {isActive && (
                              <div className="absolute inset-0 animate-pulse bg-primary/20" 
                                style={{
                                  clipPath: !isLast 
                                    ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)' 
                                    : index > 0 
                                    ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 12px 50%)'
                                    : 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
                                }}
                              />
                            )}
                            
                            <div className="flex items-center gap-2 px-3 py-2 relative z-10">
                              <div className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs transition-all duration-500 ${
                                isActive 
                                  ? 'bg-primary-foreground text-primary shadow-md animate-scale-in' 
                                  : isCompleted 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-background text-muted-foreground'
                              }`}>
                                {isCompleted ? (
                                  <Check className="w-4 h-4 stroke-[3] animate-fade-in" />
                                ) : (
                                  <span className={isActive ? 'animate-scale-in' : ''}>
                                    {stepNumber}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`font-semibold text-xs truncate transition-all duration-500 ${
                                  isActive ? 'scale-110 font-bold' : 'scale-100'
                                }`}>
                                  {label.title}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 transform transition-all duration-300">
                  <FormField
                    control={form.control}
                    name="product_id"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2 relative">
                        <FormLabel className="text-sm font-bold text-gray-900 ml-1 mb-2">Select Service *</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          handleProductChange(value);
                        }} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 text-base border-2 border-gray-300 bg-white rounded-lg font-medium
                              focus:border-blue-600 focus:ring-4 focus:ring-blue-100
                              hover:border-gray-400
                              transition-all duration-300">
                              <SelectValue placeholder="🎯 Choose a service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="z-50 bg-background border-border shadow-lg">
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

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem className="relative">
                        <FormLabel className="text-xs font-semibold text-foreground/90 ml-1">Amount (AED) *</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input 
                              type="number" 
                              step="0.01"
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              className="h-11 text-sm pl-10 border-2 border-border/60 bg-background/50 backdrop-blur-sm rounded-lg
                                focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background focus:scale-[1.01]
                                hover:border-primary/50 hover:bg-background/80
                                transition-all duration-300
                                placeholder:text-muted-foreground/50"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs mt-1.5 ml-1 font-medium" />
                      </FormItem>
                    )}
                  />
                  </div>
                </div>
              )}

              {/* Step 3: Service Details */}
              {currentStep === 3 && (
                <div key="step-3" className="animate-fade-in space-y-4">
                  {/* Tab-Style Wizard */}
                  <div className="w-full">
                    <div className="flex items-center bg-card shadow-sm rounded-lg overflow-hidden">
                      {stepLabels.map((label, index) => {
                        const stepNumber = index + 1;
                        const isActive = currentStep === stepNumber;
                        const isCompleted = currentStep > stepNumber;
                        const isLast = index === stepLabels.length - 1;
                        
                        return (
                          <div
                            key={stepNumber}
                            className={`flex-1 relative transition-all duration-500 ${
                              isActive 
                                ? 'bg-primary text-primary-foreground shadow-lg scale-105 z-10' 
                                : isCompleted 
                                ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                                : 'bg-muted/30 text-muted-foreground'
                            } ${!isLast ? 'mr-3' : ''}`}
                            style={{
                              clipPath: !isLast 
                                ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)' 
                                : index > 0 
                                ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 12px 50%)'
                                : 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
                            }}
                          >
                            {/* Highlight pulse effect for active step */}
                            {isActive && (
                              <div className="absolute inset-0 animate-pulse bg-primary/20" 
                                style={{
                                  clipPath: !isLast 
                                    ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)' 
                                    : index > 0 
                                    ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 12px 50%)'
                                    : 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
                                }}
                              />
                            )}
                            
                            <div className="flex items-center gap-2 px-3 py-2 relative z-10">
                              <div className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs transition-all duration-500 ${
                                isActive 
                                  ? 'bg-primary-foreground text-primary shadow-md animate-scale-in' 
                                  : isCompleted 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-background text-muted-foreground'
                              }`}>
                                {isCompleted ? (
                                  <Check className="w-4 h-4 stroke-[3] animate-fade-in" />
                                ) : (
                                  <span className={isActive ? 'animate-scale-in' : ''}>
                                    {stepNumber}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`font-semibold text-xs truncate transition-all duration-500 ${
                                  isActive ? 'scale-110 font-bold' : 'scale-100'
                                }`}>
                                  {label.title}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Service Details Card */}
                  <div className="space-y-3 pt-3">
                    <div className="rounded-lg border-2 border-gray-300 bg-gradient-to-br from-gray-50 via-white to-gray-50 p-5 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.01]">
                      <div className="flex items-center gap-2 mb-4 group">
                        <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 tracking-tight">Service Details</h3>
                      </div>
                      {renderProductFields()}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {currentStep === 4 && (
                <div key="step-4" className="animate-fade-in space-y-4">
                  {/* Tab-Style Wizard */}
                  <div className="w-full">
                    <div className="flex items-center bg-card shadow-sm rounded-lg overflow-hidden">
                      {stepLabels.map((label, index) => {
                        const stepNumber = index + 1;
                        const isActive = currentStep === stepNumber;
                        const isCompleted = currentStep > stepNumber;
                        const isLast = index === stepLabels.length - 1;
                        
                        return (
                          <div
                            key={stepNumber}
                            className={`flex-1 relative transition-all duration-500 ${
                              isActive 
                                ? 'bg-primary text-primary-foreground shadow-lg scale-105 z-10' 
                                : isCompleted 
                                ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                                : 'bg-muted/30 text-muted-foreground'
                            } ${!isLast ? 'mr-3' : ''}`}
                            style={{
                              clipPath: !isLast 
                                ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)' 
                                : index > 0 
                                ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 12px 50%)'
                                : 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
                            }}
                          >
                            {/* Highlight pulse effect for active step */}
                            {isActive && (
                              <div className="absolute inset-0 animate-pulse bg-primary/20" 
                                style={{
                                  clipPath: !isLast 
                                    ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)' 
                                    : index > 0 
                                    ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 12px 50%)'
                                    : 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
                                }}
                              />
                            )}
                            
                            <div className="flex items-center gap-2 px-3 py-2 relative z-10">
                              <div className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs transition-all duration-500 ${
                                isActive 
                                  ? 'bg-primary-foreground text-primary shadow-md animate-scale-in' 
                                  : isCompleted 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-background text-muted-foreground'
                              }`}>
                                {isCompleted ? (
                                  <Check className="w-4 h-4 stroke-[3] animate-fade-in" />
                                ) : (
                                  <span className={isActive ? 'animate-scale-in' : ''}>
                                    {stepNumber}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`font-semibold text-xs truncate transition-all duration-500 ${
                                  isActive ? 'scale-110 font-bold' : 'scale-100'
                                }`}>
                                  {label.title}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="rounded-lg bg-blue-50 border-2 border-blue-200 p-5 shadow-sm">
                      <h4 className="font-bold text-gray-900 mb-4 text-base">Customer Information</h4>
                      <dl className="space-y-3 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-blue-100">
                          <dt className="text-gray-600 font-medium">Name:</dt>
                          <dd className="font-semibold text-gray-900">{form.watch('name')}</dd>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-blue-100">
                          <dt className="text-gray-600 font-medium">Email:</dt>
                          <dd className="font-semibold text-gray-900">{form.watch('email')}</dd>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-blue-100">
                          <dt className="text-gray-600 font-medium">Mobile:</dt>
                          <dd className="font-semibold text-gray-900">{form.watch('mobile')}</dd>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-blue-100">
                          <dt className="text-gray-600 font-medium">Customer Type:</dt>
                          <dd className="font-semibold text-gray-900 capitalize">{form.watch('customer_type')}</dd>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-blue-100">
                          <dt className="text-gray-600 font-medium">Country of Residence:</dt>
                          <dd className="font-semibold text-gray-900">{form.watch('country_of_residence')}</dd>
                        </div>
                        {form.watch('customer_type') === 'company' && form.watch('company') && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Company:</dt>
                            <dd className="font-medium text-foreground">{form.watch('company')}</dd>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">License Type:</dt>
                          <dd className="font-medium text-foreground">{form.watch('license_type')}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="rounded-lg bg-green-50 border-2 border-green-200 p-5 shadow-sm">
                      <h4 className="font-bold text-gray-900 mb-4 text-base">Service Information</h4>
                      <dl className="space-y-3 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-green-100">
                          <dt className="text-gray-600 font-medium">Service:</dt>
                          <dd className="font-semibold text-gray-900">{selectedProductName}</dd>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-green-100">
                          <dt className="text-gray-600 font-medium">Amount:</dt>
                          <dd className="font-semibold text-gray-900">AED {form.watch('amount')?.toLocaleString()}</dd>
                        </div>
                      </dl>
                    </div>

                    <FormField
                      control={form.control}
                      name="customer_notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-bold text-gray-900">Additional Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field}
                              rows={4}
                              placeholder="Add any additional information or special requirements"
                              className="border-2 border-gray-300 bg-white text-base font-medium focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </form>
      </Form>
      
      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        {/* Previous Step Button */}
        {currentStep > 1 && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={isSubmitting}
            className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 bg-white border-2 border-gray-300 hover:border-blue-600 text-gray-700 hover:text-blue-600"
            title="Previous Step"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        
        {/* Next Step Button */}
        {currentStep < 4 && (
          <Button
            type="button"
            size="icon"
            onClick={() => {
              if (canProgressToNextStep()) {
                setCurrentStep(prev => Math.min(4, prev + 1));
              } else {
                toast({
                  title: "Cannot Progress",
                  description: "Please complete all mandatory fields before proceeding",
                  variant: "destructive",
                });
              }
            }}
            disabled={isSubmitting}
            className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 bg-blue-600 hover:bg-blue-700 text-white"
            title="Next Step"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
        )}
        
        {/* Save Draft Button */}
        <Button
          type="button"
          size="icon"
          onClick={saveDraft}
          disabled={isSubmitting}
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 bg-blue-600 hover:bg-blue-700 text-white"
          title="Save Draft"
        >
          <Save className="h-6 w-6" />
        </Button>
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
    </div>
  );
};

export default SimplifiedCustomerForm;
