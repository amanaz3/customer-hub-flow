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

interface FormField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  requiredAtStages?: string[];
  description?: string;
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
}

const DynamicServiceForm: React.FC<DynamicServiceFormProps> = ({
  productId,
  productName = 'Company Formation',
  onSubmit,
  onCancel,
  showDocuments = true,
  showSubmitButton = true,
  showCancelButton = true,
  formData,
  onFieldChange
}) => {
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    fetchFormConfiguration();
  }, [productId, productName]);

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
        .single();

      if (error) throw error;

      if (data?.form_config) {
        setFormConfig(data.form_config as unknown as FormConfig);
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

  const renderField = (field: FormField, sectionIndex: number) => {
    const fieldKey = `section_${sectionIndex}_${field.name}`;
    
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
          <div key={fieldKey} className="space-y-2">
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
              {...register(fieldKey, { 
                required: field.required,
                onChange: (e) => handleChange(e.target.value)
              })}
            />
            {errors[fieldKey] && (
              <p className="text-sm text-destructive">This field is required</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={fieldKey} className="space-y-2">
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
          <div key={fieldKey} className="space-y-2">
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
          <div key={fieldKey} className="space-y-2">
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!formConfig) {
    return (
      <Card>
        <CardContent className="py-10">
          <p className="text-center text-muted-foreground">
            No form configuration available for this product.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {showSubmitButton && (
        <Card>
          <CardHeader>
            <CardTitle>{productName} Application</CardTitle>
            <CardDescription>
              Please fill out all required fields to submit your application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
          {formConfig.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">{section.title}</h3>
                {section.description && (
                  <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {section.fields.map((field) => renderField(field, sectionIndex))}
              </div>

              {sectionIndex < formConfig.sections.length - 1 && (
                <Separator className="my-6" />
              )}
            </div>
          ))}

          {showDocuments && formConfig.documents && formConfig.documents.length > 0 && (
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold">Required Documents</h3>
              <div className="space-y-3">
                {formConfig.documents.map((docCategory, index) => (
                  <div key={index} className="space-y-2">
                    <h4 className="font-medium text-sm">{docCategory.category}</h4>
                    <ul className="space-y-1 pl-4">
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

      {!showSubmitButton && formConfig && (
        <div className="space-y-8">
          {formConfig.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">{section.title}</h3>
                {section.description && (
                  <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {section.fields.map((field) => renderField(field, sectionIndex))}
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
