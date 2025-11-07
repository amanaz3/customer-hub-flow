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

      // Create customer
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
          annual_turnover: data.annual_turnover,
          jurisdiction: data.jurisdiction,
          customer_notes: data.customer_notes,
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

  return (
    <div className="max-w-4xl mx-auto py-6">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                currentStep >= step ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-background text-muted-foreground'
              }`}>
                {currentStep > step ? <Check className="w-5 h-5" /> : step}
              </div>
              {step < 3 && (
                <div className={`flex-1 h-0.5 mx-2 transition-colors ${
                  currentStep > step ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm">
          <span className={currentStep >= 1 ? 'text-foreground' : 'text-muted-foreground'}>Customer Info</span>
          <span className={currentStep >= 2 ? 'text-foreground' : 'text-muted-foreground'}>Service Selection</span>
          <span className={currentStep >= 3 ? 'text-foreground' : 'text-muted-foreground'}>Service Details</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {currentStep === 1 && 'Customer Information'}
                {currentStep === 2 && 'Service Selection'}
                {currentStep === 3 && 'Service Details'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Step 1: Customer Information */}
              {currentStep === 1 && (
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

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1 || isSubmitting}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={async () => {
                  const isValid = await form.trigger();
                  if (isValid) {
                    setCurrentStep(prev => Math.min(3, prev + 1));
                  }
                }}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Customer'}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};

export default SimplifiedCustomerForm;
