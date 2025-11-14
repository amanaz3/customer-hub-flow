import { useState } from 'react';
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
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { CustomerTypeSelector } from './CustomerTypeSelector';
import { ExistingCustomerSelector } from './ExistingCustomerSelector';
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
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      mobile: '',
      customer_type: 'individual',
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
            className="border border-border bg-card shadow-[0_2px_12px_-3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)] transition-shadow duration-300"
          >
            {currentStep !== 1 && (
              <CardHeader className="border-b border-border pb-3 sm:pb-4 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent px-4 sm:px-6 py-3 sm:py-4">
                <CardTitle className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                  {currentStep === 2 && 'Service Selection'}
                  {currentStep === 3 && 'Service Details'}
                  {currentStep === 4 && 'Confirmation'}
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 font-medium">
                  {currentStep === 2 && 'Select the service and specify the application amount'}
                  {currentStep === 3 && 'Provide additional details specific to the selected service'}
                  {currentStep === 4 && 'Review all information before submitting'}
                </p>
              </CardHeader>
            )}
            <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* Step 1: Customer Selection */}
              {currentStep === 1 && (
                <div key="step-1" className="animate-fade-in space-y-4">
                  <div className="transform transition-all duration-300 hover:scale-[1.01]">
                    <CustomerTypeSelector
                      value={companyMode ? 'existing' : 'new'}
                      onChange={(value) => {
                        const newMode = value === 'existing';
                        onModeChange?.(newMode);
                        if (!newMode) {
                          onCustomerSelect?.(null);
                        }
                      }}
                    />
                  </div>
                  
                  {/* Tab-Style Wizard - Positioned after customer selector */}
                  <div className="w-full">
                    <div className="flex items-center border-b border-border bg-card rounded-t-lg shadow-sm">
                      {stepLabels.map((label, index) => {
                        const stepNumber = index + 1;
                        const isActive = currentStep === stepNumber;
                        const isCompleted = currentStep > stepNumber;
                        const isLast = index === stepLabels.length - 1;
                        
                        return (
                          <div
                            key={stepNumber}
                            className={`flex-1 relative transition-all duration-300 ${
                              isActive 
                                ? 'bg-primary text-primary-foreground' 
                                : isCompleted 
                                ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                                : 'bg-muted/30 text-muted-foreground'
                            } ${!isLast ? 'mr-4' : ''}`}
                            style={{
                              clipPath: !isLast 
                                ? 'polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%, 16px 50%)' 
                                : index > 0 
                                ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 16px 50%)'
                                : 'polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)'
                            }}
                          >
                            <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 sm:py-3">
                              <div className={`flex-shrink-0 flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 ${
                                isActive 
                                  ? 'bg-primary-foreground text-primary ring-2 ring-primary-foreground/30' 
                                  : isCompleted 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-background text-muted-foreground'
                              }`}>
                                {isCompleted ? (
                                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                                ) : (
                                  stepNumber
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`font-semibold text-xs sm:text-sm truncate transition-all duration-300 ${
                                  isActive ? 'scale-105' : 'scale-100'
                                }`}>
                                  {label.title}
                                </div>
                              </div>
                            </div>
                            {isActive && (
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-foreground animate-[slide-in-right_0.5s_ease-out]" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {companyMode && user && (
                    <div className="transform transition-all duration-300 hover:scale-[1.01]">
                      <ExistingCustomerSelector
                        userId={user.id}
                        value={selectedCustomerId || ''}
                        onChange={(value) => onCustomerSelect?.(value)}
                      />
                    </div>
                  )}
                  
                  {/* Show basic info fields for new customers only */}
                  {!companyMode && (
                    <>
                      {/* Basic Info Section */}
                      <div className="space-y-3 pt-3">
                        <div className="rounded-lg border-2 border-border bg-gradient-to-br from-blue-50/50 via-blue-50/30 to-transparent dark:from-blue-950/20 dark:via-blue-950/10 dark:to-transparent p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
                          <div className="flex items-center gap-2 mb-3 group">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <h3 className="text-sm font-bold text-foreground tracking-tight">Basic Info</h3>
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
                                    <FormLabel className="text-xs font-semibold text-foreground/90 ml-1">Full Name *</FormLabel>
                                    <FormControl>
                                      <div className="relative group">
                                        <Input 
                                          {...field} 
                                          onChange={(e) => {
                                            field.onChange(e);
                                            onNameChange?.(e.target.value);
                                          }}
                                          placeholder="John Doe"
                                          className="h-11 text-sm pl-10 pr-11 border-2 border-border/60 bg-background/50 backdrop-blur-sm rounded-lg
                                            focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background focus:scale-[1.01] 
                                            hover:border-primary/50 hover:bg-background/80
                                            transition-all duration-300 
                                            placeholder:text-muted-foreground/50"
                                        />
                                        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                                    <FormLabel className="text-xs font-semibold text-foreground/90 ml-1">Mobile Number *</FormLabel>
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
                                    <FormLabel className="text-xs font-semibold text-foreground/90 ml-1">Email Address *</FormLabel>
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
                                      <FormLabel className="text-xs font-semibold text-foreground/90 ml-1">Company Name *</FormLabel>
                                      <FormControl>
                                        <div className="relative group">
                                          <Input 
                                            {...field} 
                                            onChange={(e) => {
                                              field.onChange(e);
                                              onCompanyChange?.(e.target.value);
                                            }}
                                            placeholder="ABC Trading LLC"
                                            className="h-11 text-sm pl-10 pr-11 border-2 border-border/60 bg-background/50 backdrop-blur-sm rounded-lg
                                              focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background focus:scale-[1.01]
                                              hover:border-primary/50 hover:bg-background/80
                                              transition-all duration-300
                                              placeholder:text-muted-foreground/50"
                                          />
                                          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        <div className="rounded-lg border-2 border-border bg-gradient-to-br from-purple-50/50 via-purple-50/30 to-transparent dark:from-purple-950/20 dark:via-purple-950/10 dark:to-transparent p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
                          <div className="flex items-center gap-2 mb-3 group">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            <h3 className="text-sm font-bold text-foreground tracking-tight">Channel Info</h3>
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
                    </>
                  )}
                </div>
              )}

              {/* Step 2: Service Selection */}
              {currentStep === 2 && (
                <div key="step-2" className="animate-fade-in space-y-4">
                  {/* Tab-Style Wizard */}
                  <div className="w-full">
                    <div className="flex items-center border-b border-border bg-card rounded-t-lg shadow-sm">
                      {stepLabels.map((label, index) => {
                        const stepNumber = index + 1;
                        const isActive = currentStep === stepNumber;
                        const isCompleted = currentStep > stepNumber;
                        const isLast = index === stepLabels.length - 1;
                        
                        return (
                          <div
                            key={stepNumber}
                            className={`flex-1 relative transition-all duration-300 ${
                              isActive 
                                ? 'bg-primary text-primary-foreground' 
                                : isCompleted 
                                ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                                : 'bg-muted/30 text-muted-foreground'
                            } ${!isLast ? 'mr-4' : ''}`}
                            style={{
                              clipPath: !isLast 
                                ? 'polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%, 16px 50%)' 
                                : index > 0 
                                ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 16px 50%)'
                                : 'polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)'
                            }}
                          >
                            <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 sm:py-3">
                              <div className={`flex-shrink-0 flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 ${
                                isActive 
                                  ? 'bg-primary-foreground text-primary ring-2 ring-primary-foreground/30' 
                                  : isCompleted 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-background text-muted-foreground'
                              }`}>
                                {isCompleted ? (
                                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                                ) : (
                                  stepNumber
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`font-semibold text-xs sm:text-sm truncate transition-all duration-300 ${
                                  isActive ? 'scale-105' : 'scale-100'
                                }`}>
                                  {label.title}
                                </div>
                              </div>
                            </div>
                            {isActive && (
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-foreground animate-[slide-in-right_0.5s_ease-out]" />
                            )}
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
                    <div className="flex items-center border-b border-border bg-card rounded-t-lg shadow-sm">
                      {stepLabels.map((label, index) => {
                        const stepNumber = index + 1;
                        const isActive = currentStep === stepNumber;
                        const isCompleted = currentStep > stepNumber;
                        const isLast = index === stepLabels.length - 1;
                        
                        return (
                          <div
                            key={stepNumber}
                            className={`flex-1 relative transition-all duration-300 ${
                              isActive 
                                ? 'bg-primary text-primary-foreground' 
                                : isCompleted 
                                ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                                : 'bg-muted/30 text-muted-foreground'
                            } ${!isLast ? 'mr-4' : ''}`}
                            style={{
                              clipPath: !isLast 
                                ? 'polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%, 16px 50%)' 
                                : index > 0 
                                ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 16px 50%)'
                                : 'polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)'
                            }}
                          >
                            <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 sm:py-3">
                              <div className={`flex-shrink-0 flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 ${
                                isActive 
                                  ? 'bg-primary-foreground text-primary ring-2 ring-primary-foreground/30' 
                                  : isCompleted 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-background text-muted-foreground'
                              }`}>
                                {isCompleted ? (
                                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                                ) : (
                                  stepNumber
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`font-semibold text-xs sm:text-sm truncate transition-all duration-300 ${
                                  isActive ? 'scale-105' : 'scale-100'
                                }`}>
                                  {label.title}
                                </div>
                              </div>
                            </div>
                            {isActive && (
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-foreground animate-[slide-in-right_0.5s_ease-out]" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {renderProductFields()}
                </div>
              )}

              {/* Step 4: Confirmation */}
              {currentStep === 4 && (
                <div key="step-4" className="animate-fade-in space-y-4">
                  {/* Tab-Style Wizard */}
                  <div className="w-full">
                    <div className="flex items-center border-b border-border bg-card rounded-t-lg shadow-sm">
                      {stepLabels.map((label, index) => {
                        const stepNumber = index + 1;
                        const isActive = currentStep === stepNumber;
                        const isCompleted = currentStep > stepNumber;
                        const isLast = index === stepLabels.length - 1;
                        
                        return (
                          <div
                            key={stepNumber}
                            className={`flex-1 relative transition-all duration-300 ${
                              isActive 
                                ? 'bg-primary text-primary-foreground' 
                                : isCompleted 
                                ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                                : 'bg-muted/30 text-muted-foreground'
                            } ${!isLast ? 'mr-4' : ''}`}
                            style={{
                              clipPath: !isLast 
                                ? 'polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%, 16px 50%)' 
                                : index > 0 
                                ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 16px 50%)'
                                : 'polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)'
                            }}
                          >
                            <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 sm:py-3">
                              <div className={`flex-shrink-0 flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 ${
                                isActive 
                                  ? 'bg-primary-foreground text-primary ring-2 ring-primary-foreground/30' 
                                  : isCompleted 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-background text-muted-foreground'
                              }`}>
                                {isCompleted ? (
                                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                                ) : (
                                  stepNumber
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`font-semibold text-xs sm:text-sm truncate transition-all duration-300 ${
                                  isActive ? 'scale-105' : 'scale-100'
                                }`}>
                                  {label.title}
                                </div>
                              </div>
                            </div>
                            {isActive && (
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-foreground animate-[slide-in-right_0.5s_ease-out]" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="rounded-lg bg-muted/30 p-4">
                      <h4 className="font-semibold text-foreground mb-3">Customer Information</h4>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Name:</dt>
                          <dd className="font-medium text-foreground">{form.watch('name')}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Email:</dt>
                          <dd className="font-medium text-foreground">{form.watch('email')}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Mobile:</dt>
                          <dd className="font-medium text-foreground">{form.watch('mobile')}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Customer Type:</dt>
                          <dd className="font-medium text-foreground capitalize">{form.watch('customer_type')}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Country of Residence:</dt>
                          <dd className="font-medium text-foreground">{form.watch('country_of_residence')}</dd>
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

                    <div className="rounded-lg bg-muted/30 p-4">
                      <h4 className="font-semibold text-foreground mb-3">Service Information</h4>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Service:</dt>
                          <dd className="font-medium text-foreground">{selectedProductName}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Amount:</dt>
                          <dd className="font-medium text-foreground">AED {form.watch('amount')?.toLocaleString()}</dd>
                        </div>
                      </dl>
                    </div>

                    <FormField
                      control={form.control}
                      name="customer_notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field}
                              rows={4}
                              placeholder="Add any additional information or special requirements"
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

          {/* Enhanced Navigation Buttons */}
          <div className="flex justify-between items-center py-3 sm:py-4 px-4 sm:px-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1 || isSubmitting}
              className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm hover:bg-muted/50 hover:shadow-sm hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Back</span>
            </Button>

            <div className="flex flex-col items-center gap-0.5">
              <div className="text-xs sm:text-sm font-bold text-foreground">
                Step <span className="text-primary">{currentStep}</span> of 4
              </div>
            </div>

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
                disabled={isSubmitting}
                className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary hover:shadow-lg hover:shadow-primary/20 hover:scale-105 active:scale-95 transition-all duration-300"
              >
                <span className="hidden sm:inline">Next Step</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 hover:shadow-lg hover:shadow-green-500/20 hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-pulse">Creating...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Create Application</span>
                    <span className="sm:hidden">Create</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};

export default SimplifiedCustomerForm;
