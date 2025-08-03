import { Customer, Document, StatusChange } from '@/types/customer';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export class DataValidator {
  // Validate customer data consistency
  static validateCustomer(customer: Customer): ValidationError[] {
    const errors: ValidationError[] = [];

    // Basic field validation
    if (!customer.name?.trim()) {
      errors.push({
        field: 'name',
        message: 'Customer name is required',
        severity: 'error'
      });
    }

    if (!customer.email?.trim() || !this.isValidEmail(customer.email)) {
      errors.push({
        field: 'email',
        message: 'Valid email address is required',
        severity: 'error'
      });
    }

    if (!customer.mobile?.trim()) {
      errors.push({
        field: 'mobile',
        message: 'Mobile number is required',
        severity: 'error'
      });
    }

    if (!customer.company?.trim()) {
      errors.push({
        field: 'company',
        message: 'Company name is required',
        severity: 'error'
      });
    }

    if (customer.amount <= 0) {
      errors.push({
        field: 'amount',
        message: 'Amount must be greater than zero',
        severity: 'error'
      });
    }

    // Status-specific validation
    if (customer.status !== 'Draft') {
      const mandatoryDocs = customer.documents?.filter(doc => doc.is_mandatory) || [];
      const missingDocs = mandatoryDocs.filter(doc => !doc.is_uploaded);
      
      if (missingDocs.length > 0) {
        errors.push({
          field: 'documents',
          message: `Cannot change status from Draft: Missing mandatory documents - ${missingDocs.map(d => d.name).join(', ')}`,
          severity: 'error'
        });
      }
    }

    return errors;
  }

  // Validate status transition
  static validateStatusTransition(
    currentStatus: string, 
    newStatus: string, 
    customer: Customer
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Define valid status transitions
    const validTransitions: Record<string, string[]> = {
      'Draft': ['Submitted', 'Rejected'],
      'Submitted': ['Returned', 'Sent to Bank', 'Rejected', 'Need More Info'],
      'Returned': ['Submitted', 'Rejected'],
      'Sent to Bank': ['Complete', 'Returned', 'Need More Info'],
      'Need More Info': ['Submitted', 'Rejected'],
      'Complete': ['Paid'],
      'Rejected': [],
      'Paid': []
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      errors.push({
        field: 'status',
        message: `Invalid status transition from ${currentStatus} to ${newStatus}`,
        severity: 'error'
      });
    }

    // Additional validation for specific transitions
    if (newStatus === 'Submitted' && currentStatus === 'Draft') {
      const mandatoryDocs = customer.documents?.filter(doc => doc.is_mandatory) || [];
      const missingDocs = mandatoryDocs.filter(doc => !doc.is_uploaded);
      
      if (missingDocs.length > 0) {
        errors.push({
          field: 'documents',
          message: `Cannot submit application: Missing mandatory documents - ${missingDocs.map(d => d.name).join(', ')}`,
          severity: 'error'
        });
      }
    }

    return errors;
  }

  // Validate document consistency
  static validateDocuments(documents: Document[], licenseType: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for required documents based on license type
    const requiredDocs = this.getRequiredDocuments(licenseType);
    
    requiredDocs.forEach(requiredDoc => {
      const exists = documents.some(doc => 
        doc.name === requiredDoc.name && doc.category === requiredDoc.category
      );
      
      if (!exists) {
        errors.push({
          field: 'documents',
          message: `Missing required document: ${requiredDoc.name}`,
          severity: 'error'
        });
      }
    });

    // Check for duplicate documents
    const docNames = documents.map(doc => doc.name);
    const duplicates = docNames.filter((name, index) => docNames.indexOf(name) !== index);
    
    if (duplicates.length > 0) {
      errors.push({
        field: 'documents',
        message: `Duplicate documents found: ${[...new Set(duplicates)].join(', ')}`,
        severity: 'warning'
      });
    }

    return errors;
  }

  // Validate data relationships
  static validateDataRelationships(customer: Customer): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check status history consistency
    if (customer.statusHistory && customer.statusHistory.length > 0) {
      const latestStatusChange = customer.statusHistory[0];
      
      if (latestStatusChange.new_status !== customer.status) {
        errors.push({
          field: 'status',
          message: 'Current status does not match latest status history entry',
          severity: 'warning'
        });
      }

      // Check for sequential status changes
      for (let i = 1; i < customer.statusHistory.length; i++) {
        const current = customer.statusHistory[i];
        const previous = customer.statusHistory[i - 1];
        
        if (current.new_status !== previous.previous_status) {
          errors.push({
            field: 'statusHistory',
            message: 'Status history chain is broken',
            severity: 'warning'
          });
          break;
        }
      }
    }

    // Check document-license type consistency
    if (customer.documents) {
      customer.documents.forEach(doc => {
        if (doc.requires_license_type && doc.requires_license_type !== customer.licenseType) {
          errors.push({
            field: 'documents',
            message: `Document "${doc.name}" requires ${doc.requires_license_type} license but customer has ${customer.licenseType}`,
            severity: 'warning'
          });
        }
      });
    }

    return errors;
  }

  // Helper methods
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static getRequiredDocuments(licenseType: string) {
    const baseDocs = [
      { name: 'Passport Copy', category: 'mandatory' },
      { name: 'Emirates ID Copy', category: 'mandatory' },
      { name: 'Trade License Copy', category: 'mandatory' },
      { name: 'Memorandum of Association (MOA)', category: 'mandatory' },
      { name: 'Bank Statements (Last 6 months)', category: 'mandatory' }
    ];

    if (licenseType === 'Freezone') {
      baseDocs.push(
        { name: 'Freezone License Copy', category: 'freezone' },
        { name: 'Lease Agreement (Freezone)', category: 'freezone' }
      );
    }

    return baseDocs;
  }

  // Comprehensive validation
  static validateAll(customer: Customer): ValidationError[] {
    const errors: ValidationError[] = [];

    errors.push(...this.validateCustomer(customer));
    
    if (customer.documents) {
      errors.push(...this.validateDocuments(customer.documents, customer.licenseType));
    }
    
    errors.push(...this.validateDataRelationships(customer));

    return errors;
  }
}