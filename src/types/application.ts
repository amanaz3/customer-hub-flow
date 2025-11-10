// Application Management Types

export type ApplicationStatus = 
  | 'draft' 
  | 'submitted' 
  | 'returned'
  | 'paid'
  | 'completed'
  | 'rejected'
  | 'need more info'
  // Legacy statuses (for existing applications only)
  | 'under_review' 
  | 'approved';

export const NewApplicationStatuses = [
  'draft',
  'submitted',
  'returned',
  'paid',
  'completed',
  'rejected'
] as const;

export type ApplicationType = 
  | 'bank_account' 
  | 'license' 
  | 'visa' 
  | 'other';

export type SubmissionSource = 
  | 'web_form' 
  | 'api' 
  | 'admin' 
  | 'partner';

export interface Application {
  id: string;
  reference_number: number;
  customer_id: string;
  application_type: ApplicationType;
  submission_source: SubmissionSource;
  status: ApplicationStatus;
  application_data: ApplicationData;
  created_at: string;
  updated_at: string;
  
  // Relations
  customer?: {
    id: string;
    name: string;
    email: string;
    mobile: string;
    company: string;
    license_type?: string;
  };
  documents?: ApplicationDocument[];
  messages?: ApplicationMessage[];
  owners?: ApplicationOwner[];
}

export interface ApplicationData {
  license_type?: string;
  lead_source?: string;
  amount?: number;
  preferred_bank?: string;
  preferred_bank_2?: string;
  preferred_bank_3?: string;
  any_suitable_bank?: boolean;
  annual_turnover?: number;
  jurisdiction?: string;
  customer_notes?: string;
  product_id?: string;
  user_id?: string;
  nationality?: string;
  proposed_activity?: string;
  completed_at?: string;
  
  // Business Bank Account specific fields
  mainland_or_freezone?: 'mainland' | 'freezone';
  number_of_shareholders?: number;
  signatory_type?: 'single' | 'joint';
  business_activity_details?: string;
  minimum_balance_range?: '0-10k' | '10k-100k' | '100k-150k' | '150k-250k' | 'above-250k';
}

export interface ApplicationDocument {
  id: string;
  application_id: string;
  document_type: string;
  file_path?: string;
  is_uploaded: boolean;
  created_at: string;
}

export interface ApplicationMessage {
  id: string;
  application_id: string;
  sender_id: string;
  sender_type: 'user' | 'admin' | 'system';
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ApplicationOwner {
  id: string;
  application_id: string;
  name: string;
  passport_number?: string;
  nationality?: string;
  ownership_percentage?: number;
  created_at: string;
}

export interface CreateApplicationInput {
  customer_id: string;
  application_type: ApplicationType;
  submission_source?: SubmissionSource;
  status?: ApplicationStatus;
  application_data: ApplicationData;
}

export interface UpdateApplicationInput {
  application_type?: ApplicationType;
  status?: ApplicationStatus;
  application_data?: Partial<ApplicationData>;
}
