
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SecureAuthContext';
import { supabase } from '@/lib/supabase';
import { ProductionRateLimit } from '@/utils/productionRateLimit';
import FeatureAnalytics from '@/utils/featureAnalytics';
import ErrorTracker from '@/utils/errorTracking';
import PerformanceMonitor from '@/utils/performanceMonitoring';

interface CustomerFormData {
  name: string;
  email: string;
  mobile: string;
  company: string;
  amount: number;
  license_type: 'Mainland' | 'Freezone' | 'Offshore';
  lead_source: 'Website' | 'Referral' | 'Social Media' | 'Other';
  annual_turnover?: number;
  jurisdiction?: string;
  preferred_bank?: string;
  customer_notes?: string;
}

interface OptimizedCustomerFormProps {
  onSuccess?: () => void;
  initialData?: Partial<CustomerFormData>;
}

const OptimizedCustomerForm: React.FC<OptimizedCustomerFormProps> = ({
  onSuccess,
  initialData
}) => {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    mobile: '',
    company: '',
    amount: 0,
    license_type: 'Mainland',
    lead_source: 'Website',
    annual_turnover: undefined,
    jurisdiction: '',
    preferred_bank: '',
    customer_notes: '',
    ...initialData
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleInputChange = useCallback((field: keyof CustomerFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const validateForm = useCallback((): string[] => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) errors.push('Name is required');
    if (!formData.email.trim()) errors.push('Email is required');
    if (!formData.mobile.trim()) errors.push('Mobile is required');
    if (!formData.company.trim()) errors.push('Company is required');
    if (formData.amount <= 0) errors.push('Amount must be greater than 0');
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }
    
    return errors;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to create customers.',
        variant: 'destructive',
      });
      return;
    }

    // Rate limiting check
    const rateLimitResult = ProductionRateLimit.checkRateLimit(user.id, 'customerCreate');
    if (!rateLimitResult.allowed) {
      toast({
        title: 'Rate Limited',
        description: `Too many customer creation attempts. Please wait before trying again. (${rateLimitResult.remaining} remaining)`,
        variant: 'destructive',
      });
      return;
    }

    // Form validation
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      toast({
        title: 'Validation Error',
        description: validationErrors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    PerformanceMonitor.startTiming('customer-create');

    try {
      FeatureAnalytics.trackUserAction('customer_create_attempt', {
        license_type: formData.license_type,
        lead_source: formData.lead_source,
        amount: formData.amount
      }, user.id);

      const { data, error } = await supabase
        .from('customers')
        .insert([{
          ...formData,
          user_id: user.id,
          status: 'Draft' as const
        }])
        .select()
        .single();

      if (error) {
        console.error('Customer creation error:', error);
        ErrorTracker.captureError(error, {
          userId: user.id,
          userRole: user.profile?.role,
          page: 'customer_create',
          customerContext: {
            action: 'create',
            company: formData.company
          }
        });

        FeatureAnalytics.trackUserAction('customer_create_failed', {
          error: error.message
        }, user.id);

        toast({
          title: 'Error Creating Customer',
          description: error.message || 'Failed to create customer. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      PerformanceMonitor.endTiming('customer-create');
      
      FeatureAnalytics.trackUserAction('customer_create_success', {
        customer_id: data.id,
        license_type: formData.license_type,
        lead_source: formData.lead_source
      }, user.id);

      FeatureAnalytics.trackCustomerWorkflow('created', data.id, {
        license_type: formData.license_type,
        amount: formData.amount
      });

      toast({
        title: 'Customer Created',
        description: `${formData.name} has been successfully created.`,
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        mobile: '',
        company: '',
        amount: 0,
        license_type: 'Mainland',
        lead_source: 'Website',
        annual_turnover: undefined,
        jurisdiction: '',
        preferred_bank: '',
        customer_notes: ''
      });

      onSuccess?.();

    } catch (error) {
      console.error('Unexpected error:', error);
      ErrorTracker.captureError(error as Error, {
        userId: user.id,
        userRole: user.profile?.role,
        page: 'customer_create'
      });

      FeatureAnalytics.trackUserAction('customer_create_failed', {
        error: 'Unexpected error'
      }, user.id);

      toast({
        title: 'Unexpected Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, user, toast, validateForm, onSuccess]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Customer</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile *</Label>
              <Input
                id="mobile"
                value={formData.mobile}
                onChange={(e) => handleInputChange('mobile', e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_type">License Type *</Label>
              <Select
                value={formData.license_type}
                onValueChange={(value) => handleInputChange('license_type', value)}
                disabled={isSubmitting}
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
              <Label htmlFor="lead_source">Lead Source *</Label>
              <Select
                value={formData.lead_source}
                onValueChange={(value) => handleInputChange('lead_source', value)}
                disabled={isSubmitting}
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
              <Label htmlFor="annual_turnover">Annual Turnover</Label>
              <Input
                id="annual_turnover"
                type="number"
                min="0"
                value={formData.annual_turnover || ''}
                onChange={(e) => handleInputChange('annual_turnover', e.target.value ? parseFloat(e.target.value) : undefined)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jurisdiction">Jurisdiction</Label>
              <Input
                id="jurisdiction"
                value={formData.jurisdiction || ''}
                onChange={(e) => handleInputChange('jurisdiction', e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred_bank">Preferred Bank</Label>
              <Input
                id="preferred_bank"
                value={formData.preferred_bank || ''}
                onChange={(e) => handleInputChange('preferred_bank', e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_notes">Notes</Label>
            <Textarea
              id="customer_notes"
              value={formData.customer_notes || ''}
              onChange={(e) => handleInputChange('customer_notes', e.target.value)}
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? 'Creating...' : 'Create Customer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default OptimizedCustomerForm;
