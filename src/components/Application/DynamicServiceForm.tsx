import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ServiceFee {
  id: string;
  product_id: string | null;
  fee_type: 'fixed' | 'percentage';
  service_charge: number;
  amount: number;
  currency: string;
}

// Normalize different config shapes into a single renderable structure
function normalizeConfig(raw: any): FormConfig {
  if (!raw) return { sections: [], documents: [] } as any;

  // If already in expected shape
  if (Array.isArray(raw.sections) && raw.sections.every((s: any) => Array.isArray(s.fields))) {
    // Map fields if they use fieldType/id instead of type/name
    const mappedSections = raw.sections.map((sec: any) => ({
      title: sec.sectionTitle || sec.title || 'Section',
      description: sec.description,
      fields: (sec.fields || []).map((f: any) => ({
        name: f.name || f.id || (f.label ? f.label.toLowerCase().replace(/\s+/g, '_') : 'field'),
        label: f.label || f.name || f.id || 'Field',
        type: f.type || f.fieldType || 'text',
        required: Boolean(f.required),
        placeholder: f.placeholder,
        options: Array.isArray(f.options)
          ? f.options.map((o: any) => typeof o === 'string' ? { value: o, label: o } : o)
          : undefined,
        requiredAtStages: f.requiredAtStages || f.requiredAtStage || [],
        description: f.helperText || f.description,
        min: f.min !== undefined ? Number(f.min) : undefined,
        max: f.max !== undefined ? Number(f.max) : undefined,
        step: f.step !== undefined ? Number(f.step) : undefined,
        conditionalDisplay: f.conditionalDisplay,
        isServiceChargeField: f.isServiceChargeField || f.name === 'service_charge' || f.label?.toLowerCase().includes('service charge'),
      }))
    }));

    // Documents could be either documents[] or requiredDocuments.categories[]
    let documents: any[] | undefined = undefined;
    if (Array.isArray(raw.documents)) {
      documents = raw.documents;
    } else if (raw.requiredDocuments?.categories) {
      documents = raw.requiredDocuments.categories.map((cat: any) => ({
        category: cat.name,
        documents: (cat.documents || []).map((d: any) => ({
          name: d.name,
          required: Boolean(d.isMandatory),
          requiredAtStages: d.requiredAtStages || [],
        }))
      }));
    }

    return { sections: mappedSections, documents } as FormConfig;
  }

  // Fallback empty
  return { sections: [], documents: [] } as FormConfig;
}


interface FormField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  requiredAtStages?: string[];
  description?: string;
  // Number validation
  min?: number;
  max?: number;
  step?: number;
  // Conditional display
  conditionalDisplay?: {
    dependsOn: string;
    showWhen: string[];
  };
  // Service charge auto-populate flag
  isServiceChargeField?: boolean;
  // If false, field is validation-only (not rendered in UI)
  renderInForm?: boolean;
}

interface FormSection {
  title: string;
  description?: string;
  fields: FormField[];
}

interface DocumentCategory {
  category: string;
  documents: Array<{
    name: string;
    required: boolean;
    requiredAtStages?: string[];
  }>;
}

interface FormConfig {
  sections: FormSection[];
  documents?: DocumentCategory[];
}

interface DynamicServiceFormProps {
  productId?: string;
  productName?: string;
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
  showDocuments?: boolean;
  showSubmitButton?: boolean;
  showCancelButton?: boolean;
  formData?: any;
  onFieldChange?: (fieldKey: string, value: any) => void;
  onFieldLabelsLoaded?: (labelMap: Record<string, string>) => void;
}

// Percentage Service Charge UI Component
interface PercentageServiceChargeUIProps {
  serviceFee: ServiceFee;
  register: any;
  watch: any;
  setValue: any;
  errors: any;
  onFieldChange?: (fieldKey: string, value: any) => void;
}

const PercentageServiceChargeUI: React.FC<PercentageServiceChargeUIProps> = ({
  serviceFee,
  register,
  watch,
  setValue,
  errors,
  onFieldChange
}) => {
  const dealAmountKey = 'service_charge_deal_amount';
  const rateKey = 'service_charge_rate';
  const calculatedKey = 'service_charge_calculated';
  
  const dealAmount = watch(dealAmountKey) || 0;
  const finalAmount = (Number(dealAmount) * serviceFee.service_charge) / 100;

  // Save rate on mount
  React.useEffect(() => {
    setValue(rateKey, serviceFee.service_charge);
    onFieldChange?.(rateKey, serviceFee.service_charge);
  }, [serviceFee.service_charge, setValue, onFieldChange]);

  // Save calculated amount when deal amount changes
  React.useEffect(() => {
    if (Number(dealAmount) > 0) {
      setValue(calculatedKey, finalAmount);
      onFieldChange?.(calculatedKey, finalAmount);
    }
  }, [dealAmount, finalAmount, setValue, onFieldChange]);

  const handleDealAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue(dealAmountKey, value);
    onFieldChange?.(dealAmountKey, value);
  };

  return (
    <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
      {/* Service Charge Rate - Show First */}
      <div className="space-y-1.5">
        <Label className="text-muted-foreground">Service Charge Rate</Label>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <span className="text-lg font-semibold text-primary">
            {serviceFee.service_charge}%
          </span>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 ml-auto">
            Pre-configured
          </Badge>
        </div>
      </div>
      
      {/* Deal Amount Input */}
      <div className="space-y-1.5">
        <Label htmlFor={dealAmountKey}>
          Deal Amount ({serviceFee.currency})
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input
          id={dealAmountKey}
          type="number"
          min={0}
          placeholder="Enter deal/loan amount"
          {...register(dealAmountKey, { 
            required: 'Deal amount is required',
            min: { value: 0, message: 'Amount must be positive' },
            onChange: handleDealAmountChange
          })}
        />
        {errors[dealAmountKey] && (
          <p className="text-sm text-destructive">
            {errors[dealAmountKey]?.message as string}
          </p>
        )}
      </div>
      
      {/* Final Amount (Calculated) - Only show when deal amount entered */}
      {Number(dealAmount) > 0 && (
        <div className="space-y-1.5">
          <Label className="text-muted-foreground">Calculated Service Charge</Label>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <span className="text-lg font-semibold text-green-600 dark:text-green-400">
              {serviceFee.currency} {finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 ml-auto">
              Auto-calculated
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
};

const DynamicServiceForm: React.FC<DynamicServiceFormProps> = ({
  productId,
  productName = 'Company Formation',
  onSubmit,
  onCancel,
  showDocuments = true,
  showSubmitButton = true,
  showCancelButton = true,
  formData,
  onFieldChange,
  onFieldLabelsLoaded
}) => {
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [serviceFee, setServiceFee] = useState<ServiceFee | null>(null);
  const { toast } = useToast();
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    fetchFormConfiguration();
    if (productId) {
      fetchServiceFee(productId);
    }
  }, [productId, productName]);

  // Fetch service fee for the product
  const fetchServiceFee = async (prodId: string) => {
    try {
      const { data, error } = await supabase
        .from('service_fees')
        .select('*')
        .eq('product_id', prodId)
        .maybeSingle();

      if (!error && data) {
        console.log('Service fee loaded for product:', { productId: prodId, feeType: data.fee_type, amount: data.service_charge });
        setServiceFee(data as ServiceFee);
      } else {
        console.log('No service fee configured for product:', prodId);
        setServiceFee(null);
      }
    } catch (error) {
      console.error('Error fetching service fee:', error);
      setServiceFee(null);
    }
  };

  // Sync form data from parent
  useEffect(() => {
    if (formData && formConfig) {
      formConfig.sections.forEach((section, sectionIndex) => {
        section.fields.forEach((field) => {
          const fieldKey = `section_${sectionIndex}_${field.name}`;
          if (formData[fieldKey] !== undefined) {
            setValue(fieldKey, formData[fieldKey]);
          }
        });
      });
    }
  }, [formData, formConfig, setValue]);

  // Save service fee info to application data when loaded
  useEffect(() => {
    if (serviceFee && onFieldChange) {
      // Always save service fee metadata
      onFieldChange('service_fee_type', serviceFee.fee_type);
      onFieldChange('service_fee_currency', serviceFee.currency);
      
      if (serviceFee.fee_type === 'fixed') {
        // For fixed type, save the fixed amount
        onFieldChange('service_charge_fixed_amount', serviceFee.service_charge);
      }
      // For percentage type, the rate/calculated values are saved by PercentageServiceChargeUI
    }
  }, [serviceFee, onFieldChange]);

  // Auto-populate service charge field when service fee is loaded
  useEffect(() => {
    if (serviceFee && formConfig) {
      formConfig.sections.forEach((section, sectionIndex) => {
        section.fields.forEach((field) => {
          // Check if this is a service charge field
          const isServiceChargeField = 
            field.isServiceChargeField || 
            field.name === 'service_charge' || 
            field.name === 'serviceCharge' ||
            field.label?.toLowerCase().includes('service charge');
          
          if (isServiceChargeField) {
            const fieldKey = `section_${sectionIndex}_${field.name}`;
            // Only set if not already set by parent form data
            if (!formData?.[fieldKey]) {
              const chargeValue = serviceFee.service_charge;
              setValue(fieldKey, chargeValue);
              onFieldChange?.(fieldKey, chargeValue);
            }
          }
        });
      });
    }
  }, [serviceFee, formConfig, formData, setValue, onFieldChange]);

  const fetchFormConfiguration = async () => {
    try {
      setLoading(true);
      
      // First get the product ID if not provided
      let queryProductId = productId;
      
      if (!queryProductId) {
        const { data: products, error: productError } = await supabase
          .from('products')
          .select('id')
          .eq('name', productName)
          .single();
        
        if (productError) throw productError;
        queryProductId = products?.id;
      }

      if (!queryProductId) {
        throw new Error('Product not found');
      }

      // Fetch the form configuration
      const { data, error } = await supabase
        .from('service_form_configurations')
        .select('form_config')
        .eq('product_id', queryProductId)
        .maybeSingle();

      if (error) throw error;

      if (data?.form_config) {
        const normalized = normalizeConfig(data.form_config as unknown as any);
        setFormConfig(normalized);
        
        // Build field label map and notify parent
        if (onFieldLabelsLoaded) {
          const labelMap: Record<string, string> = {};
          normalized.sections.forEach((section, sectionIndex) => {
            section.fields.forEach((field) => {
              const fieldKey = `section_${sectionIndex}_${field.name}`;
              labelMap[fieldKey] = field.label;
            });
          });
          onFieldLabelsLoaded(labelMap);
        }
      } else {
        toast({
          title: "No Configuration",
          description: "No form configuration found for this product.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching form configuration:', error);
      toast({
        title: "Error",
        description: "Failed to load form configuration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (data: any) => {
    console.log('Form submitted:', data);
    
    if (onSubmit) {
      onSubmit(data);
    } else {
      toast({
        title: "Form Submitted",
        description: "Your application has been submitted successfully.",
      });
    }
  };

  // Check if a field should be shown based on conditional display rules
  const shouldShowField = (field: FormField, sectionIndex: number): boolean => {
    if (!field.conditionalDisplay) return true;

    const { dependsOn, showWhen } = field.conditionalDisplay;
    
    // Find the dependent field across all sections
    let dependentFieldValue: any = null;
    formConfig?.sections.forEach((section, idx) => {
      section.fields.forEach((f) => {
        const fieldKey = `section_${idx}_${f.name}`;
        // Match by field name, field ID, or label slug
        const labelSlug = f.label.toLowerCase().replace(/\s+/g, '-');
        if (f.name === dependsOn || fieldKey === dependsOn || labelSlug === dependsOn) {
          dependentFieldValue = watch(fieldKey);
        }
      });
    });

    // Show field if dependent field's value is in showWhen array
    return showWhen && showWhen.includes(dependentFieldValue);
  };

  const renderField = (field: FormField, sectionIndex: number) => {
    const fieldKey = `section_${sectionIndex}_${field.name}`;
    
    // Check if this is a service charge field with auto-populated value
    const isServiceChargeField = 
      field.isServiceChargeField || 
      field.name === 'service_charge' || 
      field.name === 'serviceCharge' ||
      field.label?.toLowerCase().includes('service charge') ||
      field.label?.toLowerCase().includes('servicecharge');
    
    // Show service charge as read-only display instead of input field
    if (isServiceChargeField && serviceFee) {
      // For percentage type: show Rate, Deal Amount input, and calculated Final Amount
      if (serviceFee.fee_type === 'percentage') {
        const dealAmountKey = `${fieldKey}_deal_amount`;
        const dealAmount = watch(dealAmountKey) || 0;
        const finalAmount = (Number(dealAmount) * serviceFee.service_charge) / 100;
        
        return (
          <div key={fieldKey} className="col-span-2 space-y-4">
            {/* Service Charge Rate - Show First */}
            <div className="space-y-1.5">
              <Label className="text-muted-foreground">Service Charge Rate</Label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-lg font-semibold text-primary">
                  {serviceFee.service_charge}%
                </span>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 ml-auto">
                  Pre-configured
                </Badge>
              </div>
            </div>
            
            {/* Deal Amount Input */}
            <div className="space-y-1.5">
              <Label htmlFor={dealAmountKey}>
                Deal Amount ({serviceFee.currency})
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id={dealAmountKey}
                type="number"
                min={0}
                placeholder="Enter deal/loan amount"
                {...register(dealAmountKey, { 
                  required: 'Deal amount is required',
                  min: { value: 0, message: 'Amount must be positive' },
                  onChange: (e) => {
                    setValue(dealAmountKey, e.target.value);
                    onFieldChange?.(dealAmountKey, e.target.value);
                  }
                })}
              />
              {errors[dealAmountKey] && (
                <p className="text-sm text-destructive">
                  {errors[dealAmountKey]?.message as string}
                </p>
              )}
            </div>
            
            {/* Final Amount (Calculated) - Only show when deal amount entered */}
            {Number(dealAmount) > 0 && (
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">Calculated Service Charge</Label>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {serviceFee.currency} {finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 ml-auto">
                    Auto-calculated
                  </Badge>
                </div>
              </div>
            )}
          </div>
        );
      }
      
      // For fixed type: show read-only display
      return (
        <div key={fieldKey} className="space-y-1.5">
          <Label className="text-muted-foreground">{field.label}</Label>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex-1">
              <span className="text-lg font-semibold text-foreground">
                {serviceFee.currency} {serviceFee.service_charge.toLocaleString()}
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Fixed service charge
              </p>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              Pre-configured
            </Badge>
          </div>
        </div>
      );
    }
    
    // Notify parent of changes if callback is provided
    const handleChange = (value: any) => {
      setValue(fieldKey, value);
      if (onFieldChange) {
        onFieldChange(fieldKey, value);
      }
    };
    
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
        return (
          <div key={fieldKey} className="space-y-1.5">
            <Label htmlFor={fieldKey}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <Input
              id={fieldKey}
              type={field.type}
              placeholder={field.placeholder}
              min={field.type === 'number' && field.min !== undefined ? field.min : undefined}
              max={field.type === 'number' && field.max !== undefined ? field.max : undefined}
              step={field.type === 'number' && field.step !== undefined ? field.step : undefined}
              {...register(fieldKey, { 
                required: field.required ? 'This field is required' : false,
                onChange: (e) => handleChange(e.target.value),
                ...(field.type === 'number' && field.min !== undefined ? {
                  min: {
                    value: field.min,
                    message: `Value must be at least ${field.min}`
                  }
                } : {}),
                ...(field.type === 'number' && field.max !== undefined ? {
                  max: {
                    value: field.max,
                    message: `Value must be at most ${field.max}`
                  }
                } : {}),
              })}
            />
            {errors[fieldKey] && (
              <p className="text-sm text-destructive">
                {errors[fieldKey]?.message as string || 'This field is required'}
              </p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={fieldKey} className="space-y-1.5">
            <Label htmlFor={fieldKey}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <Textarea
              id={fieldKey}
              placeholder={field.placeholder}
              {...register(fieldKey, { 
                required: field.required,
                onChange: (e) => handleChange(e.target.value)
              })}
              rows={4}
            />
            {errors[fieldKey] && (
              <p className="text-sm text-destructive">This field is required</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={fieldKey} className="space-y-1.5">
            <Label htmlFor={fieldKey}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <Select 
              onValueChange={(value) => {
                setValue(fieldKey, value);
                handleChange(value);
              }}
              defaultValue={formData?.[fieldKey]}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors[fieldKey] && (
              <p className="text-sm text-destructive">This field is required</p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={fieldKey} className="flex items-center space-x-2">
            <Checkbox
              id={fieldKey}
              {...register(fieldKey, { required: field.required })}
            />
            <Label htmlFor={fieldKey} className="cursor-pointer">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
          </div>
        );

      case 'radio':
        return (
          <div key={fieldKey} className="space-y-1.5">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`${fieldKey}_${option.value}`}
                    value={option.value}
                    {...register(fieldKey, { required: field.required })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor={`${fieldKey}_${option.value}`} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
            {errors[fieldKey] && (
              <p className="text-sm text-destructive">This field is required</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!formConfig || !formConfig.sections || formConfig.sections.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">
              No form configuration available for this service.
            </p>
            <p className="text-sm text-muted-foreground">
              Please configure the form fields in Service Form Configuration first.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/service-form-configuration', '_blank')}
            >
              Configure Form
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {showSubmitButton && (
        <Card>
          <CardHeader>
            <CardTitle>{productName} Application</CardTitle>
            <CardDescription>
              Please fill out all required fields to submit your application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
          {formConfig.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-3">
              <div>
                <h3 className="text-base font-semibold">{section.title}</h3>
                {section.description && (
                  <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                )}
              </div>
              
              {/* Inject percentage service charge UI at start of payment sections - APPLIES TO ALL SERVICES */}
              {serviceFee?.fee_type === 'percentage' && 
               section.title.toLowerCase().includes('payment') && (
                <div className="col-span-full">
                  <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-950 rounded text-xs text-blue-600 dark:text-blue-400">
                    Service Fee Type: {serviceFee.fee_type} | Section: {section.title}
                  </div>
                  <PercentageServiceChargeUI 
                    serviceFee={serviceFee} 
                    register={register}
                    watch={watch}
                    setValue={setValue}
                    errors={errors}
                    onFieldChange={onFieldChange}
                  />
                </div>
              )}
              
              {/* Debug: Show if service fee exists but conditions not met */}
              {serviceFee && section.title.toLowerCase().includes('payment') && serviceFee.fee_type !== 'percentage' && (
                <div className="col-span-full mb-4 p-3 bg-yellow-50 dark:bg-yellow-950 rounded text-xs text-yellow-700 dark:text-yellow-400">
                  ℹ️ Service fee configured as '{serviceFee.fee_type}' (showing fixed charge instead of percentage)
                </div>
              )}
              
              {!serviceFee && section.title.toLowerCase().includes('payment') && (
                <div className="col-span-full mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded text-xs text-gray-600 dark:text-gray-400">
                  ℹ️ No service fee configured for this product in service_fees table
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {section.fields
                  .filter((field) => field.renderInForm !== false) // Skip validation-only fields
                  .filter((field) => shouldShowField(field, sectionIndex))
                  .map((field) => renderField(field, sectionIndex))}
              </div>

              {sectionIndex < formConfig.sections.length - 1 && (
                <Separator className="my-6" />
              )}
            </div>
          ))}

          {showDocuments && formConfig.documents && formConfig.documents.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <h3 className="text-base font-semibold">Required Documents</h3>
              <div className="space-y-2">
                {formConfig.documents.map((docCategory, index) => (
                  <div key={index} className="space-y-1.5">
                    <h4 className="font-medium text-sm">{docCategory.category}</h4>
                    <ul className="space-y-0.5 pl-4">
                      {docCategory.documents.map((doc, docIndex) => (
                        <li key={docIndex} className="text-sm flex items-center gap-2">
                          <span className="text-muted-foreground">•</span>
                          {doc.name}
                          {doc.required && (
                            <Badge variant="outline" className="text-xs">Required</Badge>
                          )}
                          {doc.requiredAtStages && doc.requiredAtStages.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              (at: {doc.requiredAtStages.join(', ')})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {!showSubmitButton && formConfig && formConfig.sections.length > 0 && (
        <div className="space-y-4">
          {formConfig.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-3">
              <div>
                <h3 className="text-base font-semibold">{section.title}</h3>
                {section.description && (
                  <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                )}
              </div>
              
              {/* Inject percentage service charge UI at start of payment sections - APPLIES TO ALL SERVICES */}
              {serviceFee?.fee_type === 'percentage' && 
               section.title.toLowerCase().includes('payment') && (
                <div className="col-span-full">
                  <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-950 rounded text-xs text-blue-600 dark:text-blue-400">
                    Service Fee Type: {serviceFee.fee_type} | Section: {section.title}
                  </div>
                  <PercentageServiceChargeUI 
                    serviceFee={serviceFee} 
                    register={register}
                    watch={watch}
                    setValue={setValue}
                    errors={errors}
                    onFieldChange={onFieldChange}
                  />
                </div>
              )}
              
              {/* Debug: Show if service fee exists but conditions not met */}
              {serviceFee && section.title.toLowerCase().includes('payment') && serviceFee.fee_type !== 'percentage' && (
                <div className="col-span-full mb-4 p-3 bg-yellow-50 dark:bg-yellow-950 rounded text-xs text-yellow-700 dark:text-yellow-400">
                  ℹ️ Service fee configured as '{serviceFee.fee_type}' (showing fixed charge instead of percentage)
                </div>
              )}
              
              {!serviceFee && section.title.toLowerCase().includes('payment') && (
                <div className="col-span-full mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded text-xs text-gray-600 dark:text-gray-400">
                  ℹ️ No service fee configured for this product in service_fees table
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {section.fields
                  .filter((field) => field.renderInForm !== false) // Skip validation-only fields
                  .filter((field) => shouldShowField(field, sectionIndex))
                  .map((field) => renderField(field, sectionIndex))}
              </div>

              {sectionIndex < formConfig.sections.length - 1 && (
                <Separator className="my-6" />
              )}
            </div>
          ))}
        </div>
      )}

      {(showSubmitButton || showCancelButton) && (
        <div className="flex justify-end gap-4">
          {showCancelButton && onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          {showSubmitButton && (
            <Button type="submit" disabled={isSubmitting} onClick={handleSubmit(handleFormSubmit)}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default DynamicServiceForm;
