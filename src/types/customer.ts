
export interface Customer {
  id: string;
  name: string;
  email: string;
  mobile: string;
  company: string;
  leadSource: string;
  licenseType: string;
  status: string;
  amount: number;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  documents?: Document[];
  comments?: Comment[];
  statusHistory?: StatusChange[];
  preferred_bank?: string;
  annual_turnover?: number;
  jurisdiction?: string;
  customer_notes?: string;
}

export interface StatusChange {
  id: string;
  customer_id: string;
  previous_status: string;
  new_status: string;
  changed_by: string;
  changed_by_role: string;
  comment?: string;
  created_at: string;
}

export interface Document {
  id: string;
  customer_id: string;
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
  content: string;
  author: string;
  timestamp: string;
}

// Type aliases for compatibility
export type Status = string;
export type CustomerStatus = string;
export type LeadSource = 'Website' | 'Referral' | 'Social Media' | 'Other';
export type LicenseType = 'Mainland' | 'Freezone' | 'Offshore';
