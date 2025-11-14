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
    { title: 'Service Selection', desc: 'Choose service and amount' },
    { title: 'Service Details', desc: 'Additional requirements' },
    { title: 'Confirmation', desc: 'Review and submit' }
  ];

  return (
    <div className="w-full flex flex-col items-center">
      {/* Progress indicator */}
      <div className="mb-8 bg-card rounded-lg p-6 border border-border w-full shadow-sm">
        <div className="flex items-center justify-between mb-5">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div 
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    currentStep >= step 
                      ? 'border-primary bg-primary text-primary-foreground' 
                      : 'border-muted-foreground/30 bg-background text-muted-foreground'
                  }`}
                  aria-current={currentStep === step ? 'step' : undefined}
                  aria-label={`Step ${step}: ${stepLabels[step - 1].title}`}
                >
                  {currentStep > step ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-medium">{step}</span>
                  )}
                </div>
              </div>
              {step < 3 && (
                <div className={`flex-1 h-0.5 mx-3 transition-all ${
                  currentStep > step ? 'bg-primary' : 'bg-border'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-start">
          {stepLabels.map((label, index) => (
            <div key={index} className="flex-1 flex flex-col items-center text-center px-2">
              <div className={`font-medium text-xs transition-all ${
                currentStep >= index + 1 ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {label.title}
              </div>
              <div className={`text-xs mt-1 transition-all ${
                currentStep >= index + 1 ? 'text-muted-foreground' : 'text-muted-foreground/60'
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
          className="space-y-6 w-full"
        >
          <Card 
            className="border border-border bg-card shadow-sm"
          >
            <CardHeader className="border-b border-border pb-4 bg-muted/30">
              <CardTitle className="text-lg font-semibold text-foreground">
                {currentStep === 1 && 'Service Selection'}
                {currentStep === 2 && 'Service Details'}
                {currentStep === 3 && 'Confirmation'}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {currentStep === 1 && 'Select the service and specify the application amount'}
                {currentStep === 2 && 'Provide additional details specific to the selected service'}
                {currentStep === 3 && 'Review all information before submitting'}
              </p>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Step 1: Service Selection */}
              {currentStep === 1 && (
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
                            {products?.map((product: any) => (
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
                            step="0.01"
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Step 2: Service Details */}
              {currentStep === 2 && (
                <>
                  {renderProductFields()}
                </>
              )}

              {/* Step 3: Confirmation */}
              {currentStep === 3 && (
                <>
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
                </>
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1 || isSubmitting}
              className="min-w-[130px] h-11"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex flex-col items-center gap-1">
              <div className="text-sm font-medium text-muted-foreground">
                Step {currentStep} of 3
              </div>
            </div>

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={async () => {
                  // Validate only fields in the current step
                  let fieldsToValidate: (keyof FormData)[] = [];
                  
                  if (currentStep === 1) {
                    fieldsToValidate = ['product_id', 'amount'];
                  }
                  
                  const isValid = fieldsToValidate.length === 0 || await form.trigger(fieldsToValidate);
                  if (isValid) {
                    setCurrentStep(prev => Math.min(3, prev + 1));
                  } else {
                    toast({
                      title: "Validation Error",
                      description: "Please fill in all required fields before proceeding",
                      variant: "destructive",
                    });
                  }
                }}
                className="min-w-[130px] h-11"
              >
                Next Step
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="min-w-[130px] h-11"
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
