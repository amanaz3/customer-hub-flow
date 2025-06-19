
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useCustomer } from '@/contexts/CustomerContext';
import { LeadSource, LicenseType } from '@/types/customer';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sanitizeInput, rateLimiter } from '@/utils/security';

const formSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .refine((val) => /^[a-zA-Z\s\-'\.]+$/.test(val), "Name contains invalid characters"),
  mobile: z.string()
    .min(10, "Enter a valid phone number")
    .max(20, "Phone number too long")
    .refine((val) => /^[\+]?[0-9\s\-\(\)]+$/.test(val), "Invalid phone number format"),
  company: z.string()
    .min(1, "Company name is required")
    .max(200, "Company name too long"),
  email: z.string()
    .email("Enter a valid email address")
    .max(254, "Email address too long"),
  leadSource: z.enum(['Website', 'Referral', 'Social Media', 'Other']),
  licenseType: z.enum(['Mainland', 'Freezone', 'Offshore']),
  amount: z.string().refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num > 0 && num <= 10000000;
  }, {
    message: "Amount must be a positive number less than 10,000,000",
  }),
  anySuitableBank: z.boolean().default(false),
  preferredBank1: z.string().optional(),
  preferredBank2: z.string().optional(),
  preferredBank3: z.string().optional(),
  annualTurnover: z.string().optional(),
  jurisdiction: z.enum(['Mainland', 'Freezone']),
  customerNotes: z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof formSchema>;

interface CustomerFormProps {
  onSubmit: (data: CustomerFormValues) => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ onSubmit }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      mobile: '',
      company: '',
      email: '',
      leadSource: 'Website',
      licenseType: 'Mainland',
      amount: '',
      anySuitableBank: false,
      preferredBank1: '',
      preferredBank2: '',
      preferredBank3: '',
      annualTurnover: '',
      jurisdiction: 'Mainland',
      customerNotes: '',
    },
  });

  const watchAnySuitableBank = form.watch('anySuitableBank');

  const handleSubmit = async (data: CustomerFormValues) => {
    // Rate limiting check
    const clientIP = 'user-session';
    if (!rateLimiter.canAttempt(clientIP, 10, 60000)) {
      toast({
        title: "Too Many Requests",
        description: "Please wait before submitting again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Sanitize inputs
      const sanitizedData = {
        ...data,
        name: sanitizeInput(data.name.trim()),
        company: sanitizeInput(data.company.trim()),
        email: data.email.toLowerCase().trim(),
        mobile: data.mobile.replace(/\s/g, ''),
        customerNotes: data.customerNotes ? sanitizeInput(data.customerNotes.trim()) : '',
        preferredBank1: data.preferredBank1 ? sanitizeInput(data.preferredBank1.trim()) : '',
        preferredBank2: data.preferredBank2 ? sanitizeInput(data.preferredBank2.trim()) : '',
        preferredBank3: data.preferredBank3 ? sanitizeInput(data.preferredBank3.trim()) : '',
      };
      
      await onSubmit(sanitizedData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create customer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="John Doe" 
                    {...field} 
                    disabled={isSubmitting}
                    maxLength={100}
                  />
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
                <FormLabel>Mobile</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="+971 50 123 4567" 
                    {...field} 
                    disabled={isSubmitting}
                    maxLength={20}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="ABC Corp" 
                    {...field} 
                    disabled={isSubmitting}
                    maxLength={200}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="john@example.com" 
                    type="email" 
                    {...field} 
                    disabled={isSubmitting}
                    maxLength={254}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="licenseType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>License Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select license type" />
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
            name="jurisdiction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jurisdiction</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select jurisdiction" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Mainland">Mainland</SelectItem>
                    <SelectItem value="Freezone">Freezone</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="leadSource"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lead Source</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select lead source" />
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
          
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (AED)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="50000" 
                    {...field} 
                    disabled={isSubmitting}
                    maxLength={10}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="annualTurnover"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Annual Turnover (AED)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="1000000" 
                    {...field} 
                    disabled={isSubmitting}
                    maxLength={15}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Preferred Banks Section */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="anySuitableBank"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Any Suitable Bank</FormLabel>
                </div>
              </FormItem>
            )}
          />

          {!watchAnySuitableBank && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Preferred Banks</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="preferredBank1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Preference</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter bank name" 
                          {...field} 
                          disabled={isSubmitting}
                          maxLength={100}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="preferredBank2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Second Preference</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter bank name" 
                          {...field} 
                          disabled={isSubmitting}
                          maxLength={100}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="preferredBank3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Third Preference</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter bank name" 
                          {...field} 
                          disabled={isSubmitting}
                          maxLength={100}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}
        </div>
        
        <FormField
          control={form.control}
          name="customerNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Mention any specific queries or requirements here..."
                  {...field} 
                  disabled={isSubmitting}
                  rows={4}
                  maxLength={1000}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button 
            type="button" 
            variant="outline" 
            className="mr-2"
            onClick={() => navigate('/customers')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Customer'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CustomerForm;
