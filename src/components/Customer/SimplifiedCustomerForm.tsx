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
import { ChevronLeft, ChevronRight, Check, Save, ArrowLeft, ArrowRight, User, Mail, Phone, Globe, Building2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { CustomerTypeSelector } from './CustomerTypeSelector';
import { ExistingCustomerSelector } from './ExistingCustomerSelector';
import { ProcessSummarySidebar } from './ProcessSummarySidebar';
import { UnifiedProgressHeader } from './UnifiedProgressHeader';
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
  mobile: z.string().optional().or(z.literal('')),
  whatsapp: z.string().optional().or(z.literal('')),
  customer_type: z.enum(['individual', 'company']).optional(),
  country_of_residence: z.string().min(1, "Country of residence is required"),
  company: z.string().optional(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  license_type: z.enum(['Mainland', 'Freezone', 'Offshore']),
  lead_source: z.enum(['Website', 'Referral', 'Social Media', 'Other']).optional(),
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
  // Require at least email OR mobile
  if (!data.email && !data.mobile) {
    return false;
  }
  return true;
}, {
  message: "Please provide either email or mobile number",
  path: ["mobile"],
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [accordionOpen, setAccordionOpen] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      mobile: '',
      whatsapp: '',
      customer_type: undefined,
      country_of_residence: '',
      company: '',
      amount: 0,
      license_type: 'Mainland',
      lead_source: undefined,
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
        const hasContact = (value.email && !errors.email) || (value.mobile && !errors.mobile);
        const countryValid = value.country_of_residence && !errors.country_of_residence;
        const companyValid = companyMode ? selectedCustomerId : true;
        
        if (nameValid && hasContact && countryValid && companyValid) {
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
        
        if (productValid && amountValid && licenseValid) {
          setTimeout(() => setCurrentStep(3), 500);
        }
      }
      
      // Step 3: Service details - optional fields, don't auto-progress
      // User should click Next when ready to review
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
    const hasContact = (values.email && !errors.email) || (values.mobile && !errors.mobile);
    const countryValid = values.country_of_residence && !errors.country_of_residence;
    
    if (!nameValid || !hasContact || !countryValid) {
      toast({
        title: "Cannot Save Draft",
        description: "Please provide: Name, Country, and at least Email or Mobile",
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
      const hasContact = (values.email && !errors.email) || (values.mobile && !errors.mobile);
      const countryValid = values.country_of_residence && !errors.country_of_residence;
      const companyValid = companyMode ? selectedCustomerId : true;
      
      return nameValid && hasContact && countryValid && companyValid;
    }

    if (currentStep === 2) {
      const productValid = values.product_id && !errors.product_id;
      const amountValid = values.amount && values.amount > 0 && !errors.amount;
      const licenseValid = values.license_type && !errors.license_type;
      
      return productValid && amountValid && licenseValid;
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
    { title: 'Quick Info', desc: 'Basic details' },
    { title: 'Service', desc: 'Select service' },
    { title: 'Details', desc: 'Additional info' },
    { title: 'Submit', desc: 'Review & send' }
  ];

  return (
    <div className="w-full">
      <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            className="w-full"
          >
            {/* Unified Progress Header */}
            <UnifiedProgressHeader
              currentStep={currentStep}
              totalSteps={4}
              customerName={form.watch('name')}
              customerEmail={form.watch('email')}
              customerMobile={form.watch('mobile')}
              customerWhatsapp={form.watch('whatsapp')}
              customerCountry={form.watch('country_of_residence')}
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

            <Card 
              className="-mt-px border-t-0 border-x border-b border-border bg-card shadow-sm rounded-t-none rounded-b-lg max-w-2xl mx-auto"
            >
            <CardContent className="p-4 sm:p-6 space-y-5">
              {/* Customer Information Summary Accordion - Show after step 1 */}
              {currentStep > 1 && form.watch('name') && (
                <div className="sticky z-[100] bg-card -mx-4 sm:-mx-6 px-4 sm:px-6 pt-3 pb-4 mb-8 border-b border-border shadow-sm" style={{ top: 'var(--unified-header-h, 160px)' }}>
                  <div className="flex justify-center">
                  <Accordion 
                    type="single" 
                    collapsible 
                    className={`bg-card transition-all duration-300 ${accordionOpen === 'customer-info' ? 'w-1/2' : 'w-1/4'}`}
                    value={accordionOpen}
                    onValueChange={setAccordionOpen}
                  >
                    <AccordionItem value="customer-info" className="border rounded-lg">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{form.watch('name')}</span>
                      </div>
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
                        {form.watch('country_of_residence') && (
                          <div className="flex items-start gap-2">
                            <Globe className="h-4 w-4 text-primary mt-0.5" />
                            <div>
                              <span className="text-muted-foreground block text-xs">Country</span>
                              <span className="font-medium">{form.watch('country_of_residence')}</span>
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
                <div key="step-1" className="animate-fade-in space-y-4">
                  
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
                      {/* Quick Lead Capture - Step 1 */}
                      <div className="space-y-3 pt-2">
                        <p className="text-xs text-muted-foreground">Provide at least one contact method (Mobile or Email)</p>
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
                                <FormLabel className="text-xs font-medium text-muted-foreground">Mobile</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    onChange={(e) => {
                                      field.onChange(e);
                                      onMobileChange?.(e.target.value);
                                    }}
                                    placeholder="+971 50 123 4567"
                                    className="h-10 text-sm"
                                  />
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
                                <FormLabel className="text-xs font-medium text-muted-foreground">Email</FormLabel>
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

                          {/* WhatsApp */}
                          <FormField
                            control={form.control}
                            name="whatsapp"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-muted-foreground">WhatsApp</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field}
                                    placeholder="+971 50 123 4567"
                                    className="h-10 text-sm"
                                  />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />

                          {/* Country */}
                          <FormField
                            control={form.control}
                            name="country_of_residence"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium">Country *</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field}
                                    placeholder="UAE"
                                    className="h-10 text-sm"
                                  />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />

                          {/* Lead Source - Optional */}
                          <FormField
                            control={form.control}
                            name="lead_source"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-muted-foreground">Source</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-10 text-sm">
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent position="popper" sideOffset={6} className="z-[200] bg-card border border-border shadow-xl pointer-events-auto">
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

                          {/* Customer Type - Optional */}
                          <FormField
                            control={form.control}
                            name="customer_type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-muted-foreground">Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-10 text-sm">
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent position="popper" sideOffset={6} className="z-[200] bg-card border border-border shadow-xl pointer-events-auto">
                                    <SelectItem value="individual">Individual</SelectItem>
                                    <SelectItem value="company">Company</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />

                          {/* Company Name - Conditional */}
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
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Service Selection */}
              {currentStep === 2 && (
                <div key="step-2" className="animate-fade-in space-y-4">
                  
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
                            <SelectTrigger className="h-12 text-sm border-2 border-border/60 bg-background/50 backdrop-blur-sm rounded-lg
                              focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background
                              hover:border-primary/50 hover:bg-background/80
                              transition-all duration-300">
                              <SelectValue placeholder="🎯 Choose a service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent position="popper" sideOffset={8} className="z-[200] bg-card border border-border shadow-xl rounded-md pointer-events-auto">
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
                  {/* Service-specific fields based on selected product */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                      <div className="w-1 h-6 bg-primary rounded-full" />
                      <h3 className="text-sm font-bold text-foreground tracking-tight">Service-Specific Details</h3>
                    </div>
                    {renderProductFields()}
                    
                    {!renderProductFields() && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="text-sm">No additional details required for this service.</p>
                        <p className="text-xs mt-1">Click Next to proceed to confirmation.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation & Preview */}
              {currentStep === 4 && (
                <div key="step-4" className="animate-fade-in space-y-4">
                  
                  <div className="space-y-6">
                    {/* Customer Information Preview */}
                    <div className="rounded-lg border border-border bg-gradient-to-br from-primary/5 to-transparent p-4">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                        <div className="w-1 h-6 bg-primary rounded-full" />
                        <h4 className="font-semibold text-foreground">Customer Information</h4>
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
                        {form.watch('whatsapp') && (
                          <div className="flex justify-between py-1">
                            <dt className="text-muted-foreground">WhatsApp:</dt>
                            <dd className="font-medium text-foreground">{form.watch('whatsapp')}</dd>
                          </div>
                        )}
                        <div className="flex justify-between py-1">
                          <dt className="text-muted-foreground">Customer Type:</dt>
                          <dd className="font-medium text-foreground capitalize">{form.watch('customer_type')}</dd>
                        </div>
                        <div className="flex justify-between py-1">
                          <dt className="text-muted-foreground">Country of Residence:</dt>
                          <dd className="font-medium text-foreground">{form.watch('country_of_residence')}</dd>
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
                        <h4 className="font-semibold text-foreground">Service Information</h4>
                      </div>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between py-1">
                          <dt className="text-muted-foreground">Service:</dt>
                          <dd className="font-medium text-foreground">{selectedProductName}</dd>
                        </div>
                        <div className="flex justify-between py-1">
                          <dt className="text-muted-foreground">Amount:</dt>
                          <dd className="font-medium text-foreground text-lg">AED {form.watch('amount')?.toLocaleString()}</dd>
                        </div>
                        {form.watch('lead_source') && (
                          <div className="flex justify-between py-1">
                            <dt className="text-muted-foreground">Lead Source:</dt>
                            <dd className="font-medium text-foreground">{form.watch('lead_source')}</dd>
                          </div>
                        )}
                      </dl>
                    </div>

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

                    {/* Submit Button */}
                    <div className="pt-4 border-t border-border">
                      <Button
                        type="submit"
                        size="lg"
                        disabled={isSubmitting}
                        className="w-full h-12 text-base font-semibold"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="animate-pulse">Submitting...</span>
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-5 w-5" />
                            Submit Application
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        By submitting, you confirm that all information provided is accurate.
                      </p>
                    </div>
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
            className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 bg-background border-2 border-border"
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
                setSidebarCollapsed(true);
              } else {
                toast({
                  title: "Cannot Progress",
                  description: "Please complete all mandatory fields before proceeding",
                  variant: "destructive",
                });
              }
            }}
            disabled={isSubmitting}
            className="h-12 w-12 rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 bg-primary text-primary-foreground"
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
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 active:scale-95 bg-success hover:bg-success/90 text-success-foreground"
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

      {/* Right Sidebar - Process Summary (Fixed Position) */}
      <div className="hidden lg:block">
        <ProcessSummarySidebar
          currentStep={currentStep}
          formData={{
            name: form.watch('name'),
            email: form.watch('email'),
            mobile: form.watch('mobile'),
            product_id: form.watch('product_id'),
            amount: form.watch('amount'),
            license_type: form.watch('license_type'),
          }}
          productName={selectedProductName}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={setSidebarCollapsed}
        />
      </div>
    </div>
  );
};

export default SimplifiedCustomerForm;
