import { z } from 'zod';

export interface FormField {
  id: string;
  fieldType: string;
  label: string;
  placeholder?: string;
  required: boolean;
  requiredAtStage?: string[]; // Stages when this field is required
  conditionalGroup?: string; // Group ID for "at least one required" logic
  options?: string[];
  helperText?: string;
  renderInForm?: boolean; // If false, field is validation-only (not rendered in UI)
}

export interface FormSection {
  id: string;
  sectionTitle: string;
  fields: FormField[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: { fieldId: string; message: string }[];
  conditionalGroupErrors: { group: string; message: string }[];
}

/**
 * Validates form data based on the current stage and conditional requirements
 */
export const validateFormAtStage = (
  sections: FormSection[],
  formData: Record<string, any>,
  currentStage: string
): ValidationResult => {
  const errors: { fieldId: string; message: string }[] = [];
  const conditionalGroups: Record<string, { fields: FormField[]; filled: number }> = {};

  // Collect all fields
  const allFields = sections.flatMap((section) => section.fields);

  // Check individual field requirements
  allFields.forEach((field) => {
    const isRequiredAtThisStage = field.requiredAtStage?.includes(currentStage);
    const value = formData[field.id];
    const isEmpty = value === undefined || value === null || value === '';

    // Track conditional groups
    if (field.conditionalGroup) {
      if (!conditionalGroups[field.conditionalGroup]) {
        conditionalGroups[field.conditionalGroup] = { fields: [], filled: 0 };
      }
      conditionalGroups[field.conditionalGroup].fields.push(field);
      if (!isEmpty) {
        conditionalGroups[field.conditionalGroup].filled++;
      }
    }

    // Validate field if required at this stage
    if (isRequiredAtThisStage && isEmpty && !field.conditionalGroup) {
      errors.push({
        fieldId: field.id,
        message: `${field.label} is required at ${currentStage} stage`,
      });
    }

    // Type-specific validation
    if (!isEmpty) {
      if (field.fieldType === 'email') {
        const emailSchema = z.string().email();
        const result = emailSchema.safeParse(value);
        if (!result.success) {
          errors.push({
            fieldId: field.id,
            message: `${field.label} must be a valid email address`,
          });
        }
      }

      if (field.fieldType === 'number') {
        const numberSchema = z.number().or(z.string().regex(/^\d+$/));
        const result = numberSchema.safeParse(value);
        if (!result.success) {
          errors.push({
            fieldId: field.id,
            message: `${field.label} must be a valid number`,
          });
        }
      }
    }
  });

  // Check conditional groups (at least one field in group must be filled)
  const conditionalGroupErrors: { group: string; message: string }[] = [];
  Object.entries(conditionalGroups).forEach(([groupName, groupData]) => {
    // Check if any field in this group is required at current stage
    const isGroupRequiredAtStage = groupData.fields.some((field) =>
      field.requiredAtStage?.includes(currentStage)
    );

    if (isGroupRequiredAtStage && groupData.filled === 0) {
      conditionalGroupErrors.push({
        group: groupName,
        message: `At least one field from '${groupName}' group is required at ${currentStage} stage`,
      });
    }
  });

  return {
    isValid: errors.length === 0 && conditionalGroupErrors.length === 0,
    errors,
    conditionalGroupErrors,
  };
};

/**
 * Get fields required at a specific stage
 */
export const getRequiredFieldsAtStage = (
  sections: FormSection[],
  stage: string
): FormField[] => {
  const allFields = sections.flatMap((section) => section.fields);
  return allFields.filter((field) => field.requiredAtStage?.includes(stage));
};

/**
 * Get all stages where a field is required
 */
export const getFieldRequiredStages = (field: FormField): string[] => {
  return field.requiredAtStage || [];
};

/**
 * Check if form is ready for stage transition
 */
export const canTransitionToStage = (
  sections: FormSection[],
  formData: Record<string, any>,
  fromStage: string,
  toStage: string
): { canTransition: boolean; errors: string[] } => {
  // Validate that all requirements for the "from" stage are met
  const validation = validateFormAtStage(sections, formData, fromStage);
  
  if (!validation.isValid) {
    return {
      canTransition: false,
      errors: [
        ...validation.errors.map((e) => e.message),
        ...validation.conditionalGroupErrors.map((e) => e.message),
      ],
    };
  }

  return { canTransition: true, errors: [] };
};

/**
 * Get completion percentage for current stage
 */
export const getStageCompletionPercentage = (
  sections: FormSection[],
  formData: Record<string, any>,
  currentStage: string
): number => {
  const requiredFields = getRequiredFieldsAtStage(sections, currentStage);
  
  if (requiredFields.length === 0) return 100;

  const filledFields = requiredFields.filter((field) => {
    const value = formData[field.id];
    return value !== undefined && value !== null && value !== '';
  });

  return Math.round((filledFields.length / requiredFields.length) * 100);
};
