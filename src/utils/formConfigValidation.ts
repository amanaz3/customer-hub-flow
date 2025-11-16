import { z } from 'zod';

// Zod schemas for validation
const FormFieldSchema = z.object({
  id: z.string(),
  fieldType: z.enum(['text', 'number', 'email', 'tel', 'textarea', 'select', 'date', 'checkbox', 'radio']),
  label: z.string().min(1, 'Field label is required'),
  placeholder: z.string().optional(),
  required: z.boolean(),
  requiredAtStage: z.array(z.enum(['draft', 'submitted', 'review', 'approval', 'completed'])).optional(),
  conditionalGroup: z.string().optional(),
  options: z.array(z.string()).optional(),
  helperText: z.string().optional(),
});

const FormSectionSchema = z.object({
  id: z.string(),
  sectionTitle: z.string().min(1, 'Section title is required'),
  fields: z.array(FormFieldSchema),
});

const DocumentItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Document name is required'),
  description: z.string().optional(),
  isMandatory: z.boolean(),
  acceptedFileTypes: z.array(z.string()).min(1, 'At least one file type is required'),
});

const DocumentCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  documents: z.array(DocumentItemSchema),
});

const FormConfigSchema = z.object({
  sections: z.array(FormSectionSchema),
  requiredDocuments: z.object({
    categories: z.array(DocumentCategorySchema),
  }).optional(),
});

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data?: any;
}

/**
 * Validate imported JSON configuration
 */
export const validateFormConfigJSON = (jsonData: any): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Parse and validate structure
    const result = FormConfigSchema.safeParse(jsonData);

    if (!result.success) {
      result.error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors.push(`${path}: ${err.message}`);
      });
      return { isValid: false, errors, warnings };
    }

    const config = result.data;

    // Additional validation checks
    
    // Check for duplicate field IDs
    const allFieldIds = config.sections.flatMap((section) => section.fields.map((f) => f.id));
    const duplicateFieldIds = allFieldIds.filter((id, index) => allFieldIds.indexOf(id) !== index);
    if (duplicateFieldIds.length > 0) {
      errors.push(`Duplicate field IDs found: ${duplicateFieldIds.join(', ')}`);
    }

    // Check for duplicate section IDs
    const sectionIds = config.sections.map((s) => s.id);
    const duplicateSectionIds = sectionIds.filter((id, index) => sectionIds.indexOf(id) !== index);
    if (duplicateSectionIds.length > 0) {
      errors.push(`Duplicate section IDs found: ${duplicateSectionIds.join(', ')}`);
    }

    // Validate select/radio fields have options
    config.sections.forEach((section, sIdx) => {
      section.fields.forEach((field, fIdx) => {
        if ((field.fieldType === 'select' || field.fieldType === 'radio') && (!field.options || field.options.length === 0)) {
          warnings.push(`Section "${section.sectionTitle}" - Field "${field.label}": Select/Radio fields should have options`);
        }
      });
    });

    // Validate document categories
    if (config.requiredDocuments) {
      const categoryIds = config.requiredDocuments.categories.map((c) => c.id);
      const duplicateCategoryIds = categoryIds.filter((id, index) => categoryIds.indexOf(id) !== index);
      if (duplicateCategoryIds.length > 0) {
        errors.push(`Duplicate document category IDs found: ${duplicateCategoryIds.join(', ')}`);
      }

      // Check for duplicate document IDs within categories
      config.requiredDocuments.categories.forEach((category) => {
        const docIds = category.documents.map((d) => d.id);
        const duplicateDocIds = docIds.filter((id, index) => docIds.indexOf(id) !== index);
        if (duplicateDocIds.length > 0) {
          errors.push(`Duplicate document IDs in category "${category.name}": ${duplicateDocIds.join(', ')}`);
        }

        // Validate file types
        category.documents.forEach((doc) => {
          const validFileTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx', '.txt'];
          const invalidTypes = doc.acceptedFileTypes.filter(
            (type) => !validFileTypes.includes(type.toLowerCase())
          );
          if (invalidTypes.length > 0) {
            warnings.push(
              `Document "${doc.name}" has uncommon file types: ${invalidTypes.join(', ')}`
            );
          }
        });
      });
    }

    // Warnings for empty sections
    config.sections.forEach((section) => {
      if (section.fields.length === 0) {
        warnings.push(`Section "${section.sectionTitle}" has no fields`);
      }
    });

    if (errors.length > 0) {
      return { isValid: false, errors, warnings };
    }

    return { isValid: true, errors: [], warnings, data: config };
  } catch (error) {
    return {
      isValid: false,
      errors: [`JSON parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings,
    };
  }
};

/**
 * Generate a sample JSON configuration for export
 */
export const generateSampleFormConfig = () => {
  return {
    sections: [
      {
        id: 'section-1',
        sectionTitle: 'Basic Information',
        fields: [
          {
            id: 'field-1',
            fieldType: 'text',
            label: 'Full Name',
            placeholder: 'Enter your full name',
            required: true,
            requiredAtStage: ['draft', 'submitted'],
            helperText: 'Please enter your legal name as it appears on official documents',
          },
          {
            id: 'field-2',
            fieldType: 'email',
            label: 'Email Address',
            placeholder: 'your.email@example.com',
            required: true,
            requiredAtStage: ['draft'],
            conditionalGroup: 'contact-info',
          },
          {
            id: 'field-3',
            fieldType: 'tel',
            label: 'Phone Number',
            placeholder: '+971 XX XXX XXXX',
            required: false,
            requiredAtStage: ['submitted'],
            conditionalGroup: 'contact-info',
          },
        ],
      },
    ],
    requiredDocuments: {
      categories: [
        {
          id: 'category-1',
          name: 'Identity Documents',
          description: 'Required identification documents',
          documents: [
            {
              id: 'doc-1',
              name: 'Passport Copy',
              description: 'Clear copy of passport bio page',
              isMandatory: true,
              acceptedFileTypes: ['.pdf', '.jpg', '.png'],
            },
            {
              id: 'doc-2',
              name: 'Emirates ID',
              description: 'Both sides of Emirates ID',
              isMandatory: true,
              acceptedFileTypes: ['.pdf', '.jpg', '.png'],
            },
          ],
        },
      ],
    },
  };
};

/**
 * Export configuration to JSON string
 */
export const exportFormConfigToJSON = (config: any): string => {
  return JSON.stringify(config, null, 2);
};
