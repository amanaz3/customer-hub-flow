import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SecureAuthContext';

const companySchema = z.object({
  company: z.string().min(2, 'Company name must be at least 2 characters'),
  name: z.string().min(2, 'Contact name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  mobile: z.string().min(10, 'Phone number must be at least 10 digits'),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface CreateCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyCreated: (customer: any) => void;
}

export const CreateCompanyDialog: React.FC<CreateCompanyDialogProps> = ({
  open,
  onOpenChange,
  onCompanyCreated,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      company: '',
      name: '',
      email: '',
      mobile: '',
    },
  });

  const handleSubmit = async (data: CompanyFormData) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a company',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .insert([
          {
            company: data.company,
            name: data.name,
            email: data.email,
            mobile: data.mobile,
            user_id: user.id,
            status: 'Draft',
            amount: 0,
            license_type: 'Mainland',
            lead_source: 'Website',
          },
        ] as any)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Company created successfully',
      });

      onCompanyCreated(customer);
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating company:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create company',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Company</DialogTitle>
          <DialogDescription>
            Add a new company to your customer list. You'll be able to add more details later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company">Company Name *</Label>
            <Input
              id="company"
              {...form.register('company')}
              disabled={isSubmitting}
              placeholder="Enter company name"
            />
            {form.formState.errors.company && (
              <p className="text-sm text-destructive">{form.formState.errors.company.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Contact Person *</Label>
            <Input
              id="name"
              {...form.register('name')}
              disabled={isSubmitting}
              placeholder="Enter contact person name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...form.register('email')}
              disabled={isSubmitting}
              placeholder="Enter email address"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile *</Label>
            <Input
              id="mobile"
              {...form.register('mobile')}
              disabled={isSubmitting}
              placeholder="Enter mobile number"
            />
            {form.formState.errors.mobile && (
              <p className="text-sm text-destructive">{form.formState.errors.mobile.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Company'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
