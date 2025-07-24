// Separated Customer and Application data for better architecture and CRM integration

export interface Customer {
  id: string;
  name: string;
  email: string;
  mobile: string;
  company: string;
  created_at?: string;
  updated_at?: string;
}

export interface Application {
  id: string;
  customer_id: string;
  leadSource: string;
  licenseType: string;
  status: string;
  amount: number;
  user_id?: string;
  preferred_bank?: string;
  annual_turnover?: number;
  jurisdiction?: string;
  customer_notes?: string;
  created_at?: string;
  updated_at?: string;
  documents?: Document[];
  comments?: Comment[];
  statusHistory?: StatusChange[];
  // Include customer data for convenience in UI
  customer?: Customer;
}

export interface StatusChange {
  id: string;
  application_id: string; // Changed from customer_id to application_id
  previous_status: string;
  new_status: string;
  changed_by: string;
  changed_by_role: string;
  comment?: string;
  created_at: string;
}

export interface Document {
  id: string;
  application_id: string; // Changed from customer_id to application_id
  name: string;
  is_mandatory: boolean;
  is_uploaded: boolean;
  category: string;
  requires_license_type?: string;
  file_path?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Comment {
  id: string;
  application_id: string; // Changed from customer_id to application_id
  content: string;
  author: string;
  timestamp: string;
}

// Type aliases for compatibility
export type Status = string;
export type CustomerStatus = string;
export type LeadSource = 'Website' | 'Referral' | 'Social Media' | 'Other';
export type LicenseType = 'Mainland' | 'Freezone' | 'Offshore';

// Legacy interface for backward compatibility during migration
export interface LegacyCustomer extends Customer {
  leadSource: string;
  licenseType: string;
  status: string;
  amount: number;
  user_id?: string;
  documents?: Document[];
  comments?: Comment[];
  statusHistory?: StatusChange[];
  preferred_bank?: string;
  annual_turnover?: number;
  jurisdiction?: string;
  customer_notes?: string;
}