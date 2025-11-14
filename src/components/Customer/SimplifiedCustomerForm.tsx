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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Customer } from '@/types/customer';

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
}

const SimplifiedCustomerForm: React.FC<SimplifiedCustomerFormProps> = ({
  onSuccess,
  onProductChange,
  onEmailChange,
  onNameChange,
  onMobileChange,
  onCompanyChange,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProductName, setSelectedProductName] = useState<string>('');
  const [companyMode, setCompanyMode] = useState<'new' | 'existing'>('new');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
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

  const handleExistingCustomerChange = (customerId: string | null, customer: Partial<Customer> | null) => {
    setSelectedCustomerId(customerId);
    if (customer) {
      form.setValue('name', customer.name || '');
      form.setValue('email', customer.email || '');
      form.setValue('mobile', customer.mobile || '');
      form.setValue('company', customer.company || '');
      if (customer.licenseType) {
        form.setValue('license_type', customer.licenseType as 'Mainland' | 'Freezone' | 'Offshore');
      }
      onNameChange?.(customer.name || '');
      onEmailChange?.(customer.email || '');
      onMobileChange?.(customer.mobile || '');
      onCompanyChange?.(customer.company || '');
    }
  };

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
    setSelectedProductName(product?.name || '');
    onProductChange?.(product?.name || null);
  };

  const getProductCategory = (productName: string): string => {
    const name = productName.toLowerCase();
    if (name.includes('goaml') || name.includes('aml')) return 'goaml';
    if (name.includes('home') && name.includes('finance')) return 'home_finance';
    if (name.includes('bank') && name.includes('account')) return 'bank_account';
    if (name.includes('bookkeeping') || name.includes('accounting')) return 'bookkeeping';
    if (name.includes('vat')) return 'vat';
    if (name.includes('tax')) return 'tax';
    return 'other';
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
      // Get the next reference number
      const { data: maxRef } = await supabase
        .from('customers')
        .select('reference_number')
        .order('reference_number', { ascending: false })
        .limit(1)
        .single();

      const nextRefNumber = (maxRef?.reference_number || 0) + 1;

      // Create customer - convert empty strings to null for optional fields
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert([{
          name: data.name,
          email: data.email,
          mobile: data.mobile,
          company: data.company,
          amount: data.amount,
          license_type: data.license_type,
          lead_source: data.lead_source,
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
    { title: 'Customer Info', desc: 'Basic contact details' },
    { title: 'Service Selection', desc: 'Choose product and amount' },
    { title: 'Service Details', desc: 'Additional requirements' }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-10 bg-gradient-to-br from-card to-card/50 rounded-2xl p-8 border-2 shadow-lg animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div 
                className={`flex items-center justify-center w-14 h-14 rounded-full border-3 transition-all duration-300 ${
                  currentStep >= step 
                    ? 'border-primary bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-elegant scale-110 animate-scale-in' 
                    : 'border-border bg-muted/50 text-muted-foreground'
                }`}
                aria-current={currentStep === step ? 'step' : undefined}
                aria-label={`Step ${step}: ${stepLabels[step - 1].title}`}
              >
                {currentStep > step ? (
                  <Check className="w-7 h-7 animate-scale-in" />
                ) : (
                  <span className="text-xl font-bold">{step}</span>
                )}
              </div>
              {step < 3 && (
                <div className={`flex-1 h-1.5 mx-4 rounded-full transition-all duration-300 ${
                  currentStep > step ? 'bg-gradient-to-r from-primary to-primary/60' : 'bg-border'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between">
          {stepLabels.map((label, index) => (
            <div key={index} className="flex-1 text-center px-3">
              <div className={`font-semibold text-base transition-all duration-200 ${
                currentStep >= index + 1 ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {label.title}
              </div>
              <div className={`text-sm mt-1.5 transition-all duration-200 ${
                currentStep >= index + 1 ? 'text-muted-foreground' : 'text-muted-foreground/50'
              }`}>
                {label.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="border-2 shadow-lg overflow-hidden animate-fade-in">
            <CardHeader className="bg-gradient-subtle border-b-2 pb-6">
              <CardTitle className="text-2xl font-bold">
                {currentStep === 1 && '👤 Customer Information'}
                {currentStep === 2 && '🎯 Service Selection'}
                {currentStep === 3 && '📝 Service Details'}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                {currentStep === 1 && 'Enter the customer contact details and company information'}
                {currentStep === 2 && 'Select the service and specify the application amount'}
                {currentStep === 3 && 'Provide additional details specific to the selected service'}
              </p>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              {/* Step 1: Customer Information */}
              {currentStep === 1 && (
                <>
                  <div className="space-y-5 pb-8 mb-8 border-b-2">
                    <div className="space-y-3">
                      <FormLabel className="text-lg font-semibold flex items-center gap-2">
                        🏢 Company Selection
                      </FormLabel>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Choose whether this is a new company or an application for an existing customer
                      </p>
                    </div>
                    <RadioGroup
                      value={companyMode}
                      onValueChange={(value: 'new' | 'existing') => setCompanyMode(value)}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      <label
                        htmlFor="new"
                        className={`flex items-start space-x-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 hover-scale ${
                          companyMode === 'new' 
                            ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-md' 
                            : 'border-border hover:border-primary/50 hover:shadow-sm'
                        }`}
                      >
                        <RadioGroupItem value="new" id="new" className="mt-1" />
                        <div className="space-y-1">
                          <div className="font-semibold text-base">New Company</div>
                          <div className="text-sm text-muted-foreground">First time customer registration</div>
                        </div>
                      </label>
                      <label
                        htmlFor="existing"
                        className={`flex items-start space-x-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 hover-scale ${
                          companyMode === 'existing' 
                            ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-md' 
                            : 'border-border hover:border-primary/50 hover:shadow-sm'
                        }`}
                      >
                        <RadioGroupItem value="existing" id="existing" className="mt-1" />
                        <div className="space-y-1">
                          <div className="font-semibold text-base">Existing Company</div>
                          <div className="text-sm text-muted-foreground">Additional service for current customer</div>
                        </div>
                      </label>
                    </RadioGroup>
                  </div>

                  {companyMode === 'existing' && user && (
                    <ExistingCustomerSelector
                      userId={user.id}
                      value={selectedCustomerId}
                      onChange={handleExistingCustomerChange}
                    />
                  )}

                  {companyMode === 'new' && (
                    <>
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Customer Name *</FormLabel>
                            <FormControl>
                              <Input {...field} onChange={(e) => {
                                field.onChange(e);
                                onNameChange?.(e.target.value);
                              }} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} onChange={(e) => {
                              field.onChange(e);
                              onEmailChange?.(e.target.value);
                            }} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mobile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile *</FormLabel>
                          <FormControl>
                            <Input {...field} onChange={(e) => {
                              field.onChange(e);
                              onMobileChange?.(e.target.value);
                            }} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input {...field} onChange={(e) => {
                            field.onChange(e);
                            onCompanyChange?.(e.target.value);
                          }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="license_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Mainland">Mainland</SelectItem>
                              <SelectItem value="Freezone">Freezone</SelectItem>
                              <SelectItem value="Offshore">Offshore</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lead_source"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lead Source *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Website">Website</SelectItem>
                              <SelectItem value="Referral">Referral</SelectItem>
                              <SelectItem value="Social Media">Social Media</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                      <FormField
                        control={form.control}
                        name="nationality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nationality</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </>
              )}

              {/* Step 2: Service Selection */}
              {currentStep === 2 && (
                <>
                  <FormField
                    control={form.control}
                    name="product_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Service *</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          handleProductChange(value);
                        }} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products?.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (AED) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customer_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Step 3: Service Details */}
              {currentStep === 3 && (
                <>
                  {renderProductFields()}
                  
                  {!selectedProductName && (
                    <div className="text-center py-8 text-muted-foreground">
                      Please select a service in the previous step to see relevant fields.
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Required fields hint */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-l-4 border-primary rounded-xl p-5 mb-6 animate-fade-in">
            <div className="flex items-start gap-3">
              <span className="text-xl">ℹ️</span>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Required Fields
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Fields marked with <span className="text-destructive font-semibold">*</span> must be completed before proceeding to the next step
                </p>
              </div>
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center gap-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1 || isSubmitting}
              className="min-w-[130px] h-12 text-base hover-scale shadow-sm"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Previous
            </Button>

            <div className="flex flex-col items-center gap-1">
              <div className="text-sm font-semibold text-foreground">
                Step {currentStep} of 3
              </div>
              <div className="flex gap-1">
                {[1, 2, 3].map((dot) => (
                  <div
                    key={dot}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      currentStep >= dot ? 'bg-primary scale-125' : 'bg-border'
                    }`}
                  />
                ))}
              </div>
            </div>

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={async () => {
                  // Validate only fields in the current step
                  let fieldsToValidate: (keyof FormData)[] = [];
                  
                  if (currentStep === 1) {
                    fieldsToValidate = ['name', 'email', 'mobile', 'company', 'license_type', 'lead_source'];
                  } else if (currentStep === 2) {
                    fieldsToValidate = ['product_id', 'amount'];
                  }
                  
                  const isValid = await form.trigger(fieldsToValidate);
                  if (isValid) {
                    setCurrentStep(prev => Math.min(3, prev + 1));
                  } else {
                    toast({
                      title: "⚠️ Validation Error",
                      description: "Please fill in all required fields before proceeding",
                      variant: "destructive",
                    });
                  }
                }}
                className="min-w-[130px] h-12 text-base bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover-scale"
              >
                Next Step
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="min-w-[130px] h-12 text-base bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md hover-scale"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-pulse">Creating...</span>
                  </>
                ) : (
                  <>
                    ✓ Create Application
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
