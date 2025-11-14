import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SecureAuthContext';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { GoAMLFields } from './fields/GoAMLFields';
import { HomeFinanceFields } from './fields/HomeFinanceFields';
import { BankAccountFields } from './fields/BankAccountFields';
import { BookkeepingFields } from './fields/BookkeepingFields';
import { VATFields } from './fields/VATFields';
import { TaxFields } from './fields/TaxFields';
import { ExistingCustomerSelector } from './ExistingCustomerSelector';
import { CustomerTypeSelector } from './CustomerTypeSelector';

// Simplified form schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email address"),
  mobile: z.string().min(10, "Enter a valid phone number"),
  company: z.string().min(1, "Company name is required"),
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

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const handleProductChange = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    const productName = product?.name || '';
    setSelectedProductName(productName);
    onProductChange?.(productName);
  };

  const getProductCategory = (productName: string): string | null => {
    if (!productName) return null;
    const productLower = productName.toLowerCase();
    
    if (productLower.includes('aml') || productLower.includes('goaml')) {
      return 'goaml';
    }
    
    if ((productLower.includes('home') && productLower.includes('finance')) || 
        productLower.includes('mortgage')) {
      return 'home_finance';
    }
    
    if (productLower.includes('bank') && productLower.includes('account')) {
      return 'bank_account';
    }
    
    if (productLower.includes('bookkeeping') || productLower.includes('accounting')) {
      return 'bookkeeping';
    }
    
    if (productLower.includes('vat')) {
      return 'vat';
    }
    
    if (productLower.includes('tax')) {
      return 'tax';
    }
    
    return null;
  };

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a customer",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get next reference number
      const { data: maxRef } = await supabase
        .from('customers')
        .select('reference_number')
        .order('reference_number', { ascending: false })
        .limit(1)
        .single();

      const nextRefNumber = (maxRef?.reference_number || 0) + 1;

      // Create customer
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert([{
          name: data.name,
          email: data.email,
          mobile: data.mobile,
          company: data.company,
          license_type: data.license_type,
          lead_source: data.lead_source,
          amount: data.amount,
          no_of_shareholders: data.no_of_shareholders,
          annual_turnover: data.annual_turnover || null,
          jurisdiction: data.jurisdiction || null,
          nationality: data.nationality || null,
          proposed_activity: data.proposed_activity || null,
          customer_notes: data.customer_notes || null,
          product_id: data.product_id,
          status: 'Draft' as const,
          user_id: user.id,
          reference_number: nextRefNumber,
        }])
        .select()
        .single();

      if (customerError) throw customerError;
      if (!customerData) throw new Error('Failed to create customer');

      toast({
        title: "Success",
        description: "Customer and application created successfully",
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: "Error",
        description: "Failed to create customer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProductFields = () => {
    const category = getProductCategory(selectedProductName);
    
    switch (category) {
      case 'goaml':
        return <GoAMLFields form={form} />;
      case 'home_finance':
        return <HomeFinanceFields form={form} />;
      case 'bank_account':
        return <BankAccountFields form={form} />;
      case 'bookkeeping':
        return <BookkeepingFields form={form} />;
      case 'vat':
        return <VATFields form={form} />;
      case 'tax':
        return <TaxFields form={form} />;
      default:
        return null;
    }
  };

  const stepLabels = [
    { title: 'Customer Selection', desc: 'New or existing customer' },
    { title: 'Service Selection', desc: 'Choose service and amount' },
    { title: 'Service Details', desc: 'Additional requirements' },
    { title: 'Confirmation', desc: 'Review and submit' }
  ];

  return (
    <div className="w-full flex flex-col items-center">
      {/* Enhanced Progress indicator */}
      <div className="mb-4 sm:mb-6 bg-gradient-to-br from-card via-muted/30 to-primary/5 rounded-xl p-4 sm:p-5 border border-border/50 w-full shadow-[0_4px_16px_-2px_rgba(0,0,0,0.12)] backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1 group">
                <div 
                  className={`relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border-3 transition-all duration-500 ${
                    currentStep >= step 
                      ? 'border-primary bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground shadow-[0_4px_20px_rgba(59,130,246,0.5)]' 
                      : 'border-border/60 bg-gradient-to-br from-background to-muted/30 text-muted-foreground hover:border-primary/40 hover:scale-105'
                  } ${currentStep === step ? 'scale-[1.2] ring-4 ring-primary/30 animate-pulse shadow-[0_0_24px_rgba(59,130,246,0.6)]' : ''}`}
                  aria-current={currentStep === step ? 'step' : undefined}
                  aria-label={`Step ${step}: ${stepLabels[step - 1].title}`}
                >
                  {currentStep > step ? (
                    <>
                      <Check className="w-5 h-5 sm:w-6 sm:h-6 animate-scale-in font-bold stroke-[3]" />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent animate-[shimmer_1.5s_ease-in-out]" />
                    </>
                  ) : (
                    <span className="text-sm sm:text-base font-bold z-10">{step}</span>
                  )}
                  {currentStep === step && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/50 via-transparent to-transparent animate-[ping_1.5s_ease-in-out_infinite] opacity-75" />
                  )}
                </div>
              </div>
              {step < 4 && (
                <div className={`flex-1 h-2 mx-2 sm:mx-3 rounded-full transition-all duration-700 relative overflow-hidden ${
                  currentStep > step 
                    ? 'bg-gradient-to-r from-primary via-primary/80 to-primary/60 shadow-[0_2px_12px_rgba(59,130,246,0.4)]' 
                    : 'bg-gradient-to-r from-border/40 to-border/20'
                }`}>
                  {currentStep > step && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_ease-in-out_infinite]" />
                  )}
                  {currentStep === step && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/60 via-primary/40 to-transparent w-1/2 animate-[slide-in-right_0.8s_ease-out]" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="hidden sm:flex items-start">
          {stepLabels.map((label, index) => (
            <div key={index} className="flex-1 flex flex-col items-center text-center px-1 transition-all duration-300">
              <div className={`font-bold text-xs sm:text-sm transition-all duration-300 ${
                currentStep >= index + 1 
                  ? 'text-foreground scale-105' 
                  : 'text-muted-foreground scale-100'
              } ${currentStep === index + 1 ? 'text-primary' : ''}`}>
                {label.title}
              </div>
              <div className={`text-[10px] sm:text-xs mt-1 transition-all duration-300 ${
                currentStep >= index + 1 
                  ? 'text-muted-foreground opacity-100' 
                  : 'text-muted-foreground/60 opacity-70'
              }`}>
                {label.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(onSubmit)} 
          className="w-full"
        >
          <Card 
            className="border border-border bg-card shadow-[0_2px_12px_-3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)] transition-shadow duration-300"
          >
            <CardHeader className="border-b border-border pb-3 sm:pb-4 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent px-4 sm:px-6 py-3 sm:py-4">
              <CardTitle className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                {currentStep === 1 && 'Customer Selection'}
                {currentStep === 2 && 'Service Selection'}
                {currentStep === 3 && 'Service Details'}
                {currentStep === 4 && 'Confirmation'}
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 font-medium">
                {currentStep === 1 && 'Choose to create a new customer or select an existing one'}
                {currentStep === 2 && 'Select the service and specify the application amount'}
                {currentStep === 3 && 'Provide additional details specific to the selected service'}
                {currentStep === 4 && 'Review all information before submitting'}
              </p>
            </CardHeader>
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
                        <div className="rounded-lg border border-border/50 bg-gradient-to-br from-blue-50/50 via-blue-50/30 to-transparent dark:from-blue-950/20 dark:via-blue-950/10 dark:to-transparent p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
                          <div className="flex items-center gap-2 mb-3 group">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <h3 className="text-sm font-bold text-foreground tracking-tight">Basic Info</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
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
                                        className="h-11 text-sm pl-10 border-2 border-border/60 bg-background/50 backdrop-blur-sm rounded-lg
                                          focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background focus:scale-[1.01] 
                                          hover:border-primary/50 hover:bg-background/80
                                          transition-all duration-300 
                                          placeholder:text-muted-foreground/50"
                                      />
                                      <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                    </div>
                                  </FormControl>
                                  <FormMessage className="text-xs mt-1.5 ml-1 font-medium" />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="mobile"
                              render={({ field }) => (
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
                                        className="h-11 text-sm pl-10 border-2 border-border/60 bg-background/50 backdrop-blur-sm rounded-lg
                                          focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background focus:scale-[1.01]
                                          hover:border-primary/50 hover:bg-background/80
                                          transition-all duration-300
                                          placeholder:text-muted-foreground/50"
                                      />
                                      <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                      </svg>
                                    </div>
                                  </FormControl>
                                  <FormMessage className="text-xs mt-1.5 ml-1 font-medium" />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem className="md:col-span-2 relative">
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
                                        className="h-11 text-sm pl-10 border-2 border-border/60 bg-background/50 backdrop-blur-sm rounded-lg
                                          focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background focus:scale-[1.01]
                                          hover:border-primary/50 hover:bg-background/80
                                          transition-all duration-300
                                          placeholder:text-muted-foreground/50"
                                      />
                                      <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                  </FormControl>
                                  <FormMessage className="text-xs mt-1.5 ml-1 font-medium" />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Channel Info Section */}
                        <div className="rounded-lg border border-border/50 bg-gradient-to-br from-purple-50/50 via-purple-50/30 to-transparent dark:from-purple-950/20 dark:via-purple-950/10 dark:to-transparent p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
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
                                  <SelectContent>
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
                <div key="step-2" className="animate-fade-in">
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
                          <SelectContent>
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
                <div key="step-3" className="animate-fade-in">
                  {renderProductFields()}
                </div>
              )}

              {/* Step 4: Confirmation */}
              {currentStep === 4 && (
                <div key="step-4" className="animate-fade-in">
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
                          <dt className="text-muted-foreground">Company:</dt>
                          <dd className="font-medium text-foreground">{form.watch('company')}</dd>
                        </div>
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
                onClick={async () => {
                  // Validate only fields in the current step
                  let fieldsToValidate: (keyof FormData)[] = [];
                  
                  if (currentStep === 1) {
                    // Step 1: Customer Selection
                    if (companyMode && !selectedCustomerId) {
                      toast({
                        title: "Selection Required",
                        description: "Please select an existing customer to continue",
                        variant: "destructive",
                      });
                      return;
                    }
                    // Validate basic info fields for new customers
                    if (!companyMode) {
                      fieldsToValidate = ['name', 'mobile', 'email', 'lead_source'];
                    } else {
                      fieldsToValidate = [];
                    }
                  } else if (currentStep === 2) {
                    fieldsToValidate = ['product_id', 'amount'];
                  }
                  
                  const isValid = fieldsToValidate.length === 0 || await form.trigger(fieldsToValidate);
                  if (isValid) {
                    setCurrentStep(prev => Math.min(4, prev + 1));
                  } else {
                    toast({
                      title: "Validation Error",
                      description: "Please fill in all required fields before proceeding",
                      variant: "destructive",
                    });
                  }
                }}
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
