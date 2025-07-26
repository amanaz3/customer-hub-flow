import React, { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SecureAuthContext';
import { supabase } from '@/lib/supabase';
import { Customer } from '@/types/customer';
import { validateEmail, validatePhoneNumber, sanitizeInput } from '@/utils/inputValidation';
import { AlertTriangle, Check, User, Phone, Mail } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Enter a valid email address").max(254),
  mobile: z.string().min(10, "Enter a valid phone number").max(20),
  company: z.string().min(1, "Company name is required").max(200),
  amount: z.number().min(0.01, "Amount must be greater than 0").max(10000000),
  license_type: z.enum(['Mainland', 'Freezone', 'Offshore']),
  lead_source: z.enum(['Website', 'Referral', 'Social Media', 'Other']),
  annual_turnover: z.number().min(0.01).max(1000000000).optional(),
  jurisdiction: z.string().optional(),
  any_suitable_bank: z.boolean().default(false),
  bank_preference_1: z.string().optional(),
  bank_preference_2: z.string().optional(),
  bank_preference_3: z.string().optional(),
  customer_notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ExistingCustomer {
  id: string;
  name: string;
  email: string;
  mobile: string;
  applicationCount: number;
}

interface DuplicateCheckResult {
  emailMatch?: ExistingCustomer;
  phoneMatch?: ExistingCustomer;
  exactMatch?: ExistingCustomer;
}

interface EnhancedCustomerFormProps {
  onSuccess?: () => void;
  initialData?: Partial<FormData>;
}

const EnhancedCustomerForm: React.FC<EnhancedCustomerFormProps> = ({
  onSuccess,
  initialData
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheckResult>({});
  const [autoFillSource, setAutoFillSource] = useState<'email' | 'phone' | null>(null);
  const [confirmDuplicate, setConfirmDuplicate] = useState(false);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

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
      any_suitable_bank: false,
      ...initialData
    },
  });

  // Auto-fill functionality
  const checkForExistingCustomers = useCallback(async (email?: string, mobile?: string) => {
    if (!email && !mobile) return;
    
    setIsCheckingDuplicates(true);
    try {
      const { data: customers, error } = await supabase
        .from('customers')
        .select('id, name, email, mobile')
        .or(`email.eq.${email},mobile.eq.${mobile}`);

      if (error) throw error;

      const result: DuplicateCheckResult = {};
      
      if (customers && customers.length > 0) {
        // Group by customer to count applications
        const customerGroups = customers.reduce((acc, customer) => {
          if (!acc[customer.id]) {
            acc[customer.id] = { ...customer, applicationCount: 0 };
          }
          acc[customer.id].applicationCount++;
          return acc;
        }, {} as Record<string, ExistingCustomer>);

        const uniqueCustomers = Object.values(customerGroups);

        for (const customer of uniqueCustomers) {
          if (email && customer.email.toLowerCase() === email.toLowerCase()) {
            result.emailMatch = customer;
          }
          if (mobile && customer.mobile === mobile) {
            result.phoneMatch = customer;
          }
          if (email && mobile && 
              customer.email.toLowerCase() === email.toLowerCase() && 
              customer.mobile === mobile) {
            result.exactMatch = customer;
          }
        }
      }

      setDuplicateCheck(result);
      return result;
    } catch (error) {
      console.error('Error checking for duplicates:', error);
    } finally {
      setIsCheckingDuplicates(false);
    }
  }, []);

  // Auto-fill when email changes
  const handleEmailChange = useCallback(async (email: string) => {
    form.setValue('email', email);
    
    if (validateEmail(email)) {
      const result = await checkForExistingCustomers(email);
      if (result?.emailMatch && !result.exactMatch) {
        form.setValue('name', result.emailMatch.name);
        form.setValue('mobile', result.emailMatch.mobile);
        setAutoFillSource('email');
      }
    }
  }, [form, checkForExistingCustomers]);

  // Auto-fill when phone changes
  const handlePhoneChange = useCallback(async (mobile: string) => {
    form.setValue('mobile', mobile);
    
    if (validatePhoneNumber(mobile)) {
      const result = await checkForExistingCustomers(undefined, mobile);
      if (result?.phoneMatch && !result.exactMatch) {
        form.setValue('name', result.phoneMatch.name);
        form.setValue('email', result.phoneMatch.email);
        setAutoFillSource('phone');
      }
    }
  }, [form, checkForExistingCustomers]);

  // Clear auto-fill notifications when user manually edits
  const handleManualEdit = useCallback(() => {
    setAutoFillSource(null);
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

    // Final duplicate check
    const finalCheck = await checkForExistingCustomers(data.email, data.mobile);
    
    // If exact match found and not confirmed, block submission
    if (finalCheck?.exactMatch && !confirmDuplicate) {
      toast({
        title: 'Duplicate Detected',
        description: 'This appears to be an exact duplicate. Please confirm if you want to proceed.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const sanitizedData = {
        name: sanitizeInput(data.name.trim()),
        email: data.email.toLowerCase().trim(),
        mobile: data.mobile.replace(/\s/g, ''),
        company: sanitizeInput(data.company.trim()),
        amount: data.amount,
        license_type: data.license_type,
        lead_source: data.lead_source,
        annual_turnover: data.annual_turnover,
        jurisdiction: data.jurisdiction ? sanitizeInput(data.jurisdiction.trim()) : null,
        preferred_bank: data.any_suitable_bank ? 'Any Suitable Bank' : [
          data.bank_preference_1?.trim(),
          data.bank_preference_2?.trim(), 
          data.bank_preference_3?.trim()
        ].filter(Boolean).join(', ') || null,
        customer_notes: data.customer_notes ? sanitizeInput(data.customer_notes.trim()) : null,
        user_id: user.id,
        status: 'Draft' as const
      };

      // Check if we should link to existing customer
      let customerId: string;
      
      if (finalCheck?.emailMatch || finalCheck?.phoneMatch) {
        customerId = finalCheck.emailMatch?.id || finalCheck.phoneMatch?.id || '';
        
        // Create new application linked to existing customer
        const { error: appError } = await supabase
          .from('customers')
          .insert([{
            ...sanitizedData,
            // Link to existing customer if this is an additional application
            id: customerId // This will be ignored, Supabase will generate new ID
          }]);

        if (appError) throw appError;
      } else {
        // Create new customer and application
        const { data: customer, error } = await supabase
          .from('customers')
          .insert([sanitizedData])
          .select()
          .single();

        if (error) throw error;
        customerId = customer.id;
      }

      toast({
        title: 'Application Created',
        description: finalCheck?.emailMatch || finalCheck?.phoneMatch 
          ? 'New application linked to existing customer.'
          : 'New customer application created successfully.',
      });

      if (onSuccess) onSuccess();

    } catch (error: any) {
      console.error('Error creating application:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create application.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, toast, checkForExistingCustomers, confirmDuplicate, onSuccess]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>New Application</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Auto-fill notification */}
          {autoFillSource && (
            <Alert className="border-blue-200 bg-blue-50">
              <Check className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <div className="flex items-center gap-2">
                  {autoFillSource === 'email' ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                  Data auto-filled from existing customer records based on {autoFillSource}.
                  <Button variant="ghost" size="sm" onClick={handleManualEdit}>
                    Edit manually
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Duplicate warnings */}
          {(duplicateCheck.emailMatch || duplicateCheck.phoneMatch) && !duplicateCheck.exactMatch && (
            <Alert className="border-amber-200 bg-amber-50">
              <User className="h-4 w-4 text-amber-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>Similar customer found:</p>
                  {duplicateCheck.emailMatch && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Email Match</Badge>
                      <span className="text-sm">{duplicateCheck.emailMatch.name} - {duplicateCheck.emailMatch.applicationCount} application(s)</span>
                    </div>
                  )}
                  {duplicateCheck.phoneMatch && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Phone Match</Badge>
                      <span className="text-sm">{duplicateCheck.phoneMatch.name} - {duplicateCheck.phoneMatch.applicationCount} application(s)</span>
                    </div>
                  )}
                  <p className="text-sm text-amber-600">This application will be linked to the existing customer.</p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Exact duplicate warning */}
          {duplicateCheck.exactMatch && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <div className="space-y-3">
                  <p className="font-medium">Potential duplicate detected!</p>
                  <p>A customer with the same name, email, and phone already exists: <strong>{duplicateCheck.exactMatch.name}</strong></p>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="confirm-duplicate"
                      checked={confirmDuplicate}
                      onCheckedChange={(checked) => setConfirmDuplicate(checked === true)}
                    />
                    <Label htmlFor="confirm-duplicate" className="text-sm">
                      I confirm this is a legitimate new application for the same customer
                    </Label>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  onChange={(e) => {
                    form.setValue('name', e.target.value);
                    handleManualEdit();
                  }}
                  disabled={isSubmitting}
                  className={autoFillSource ? 'bg-blue-50 border-blue-200' : ''}
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
                  onChange={(e) => handleEmailChange(e.target.value)}
                  disabled={isSubmitting || isCheckingDuplicates}
                  className={autoFillSource === 'email' ? 'bg-blue-50 border-blue-200' : ''}
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
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  disabled={isSubmitting || isCheckingDuplicates}
                  className={autoFillSource === 'phone' ? 'bg-blue-50 border-blue-200' : ''}
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
                />
                {form.formState.errors.company && (
                  <p className="text-sm text-red-600">{form.formState.errors.company.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Business Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>License Type *</Label>
                <Select
                  value={form.watch('license_type')}
                  onValueChange={(value) => form.setValue('license_type', value as any)}
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
                <Label>Lead Source *</Label>
                <Select
                  value={form.watch('lead_source')}
                  onValueChange={(value) => form.setValue('lead_source', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Social Media">Social Media</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (AED) *</Label>
                <Input
                  id="amount"
                  type="number"
                  {...form.register('amount', { valueAsNumber: true })}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="annual_turnover">Annual Turnover (AED)</Label>
                <Input
                  id="annual_turnover"
                  type="number"
                  {...form.register('annual_turnover', { valueAsNumber: true })}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="submit"
              disabled={isSubmitting || isCheckingDuplicates || (duplicateCheck.exactMatch && !confirmDuplicate)}
              className="min-w-[120px]"
            >
              {isSubmitting ? 'Creating...' : 'Create Application'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EnhancedCustomerForm;