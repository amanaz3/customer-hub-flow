// Bank Readiness & Routing Assistant Types

export interface BankReadinessCase {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  
  // Input fields
  applicant_nationality: string;
  uae_residency: boolean;
  company_jurisdiction: 'mainland' | 'freezone';
  license_activity: string;
  business_model: 'service' | 'trading' | 'consulting' | 'tech' | 'other';
  expected_monthly_inflow: string;
  source_of_funds: string;
  source_of_funds_notes?: string;
  incoming_payment_countries: string[];
  previous_rejection: boolean;
  previous_rejection_notes?: string;
  
  // Assessment results
  risk_score?: number;
  risk_category?: 'low' | 'medium' | 'high';
  risk_flags?: string[];
  recommended_banks?: BankRecommendation[];
  banks_to_avoid?: BankAvoidance[];
  ai_explanation?: string;
  improvement_steps?: string[];
  best_bank?: string;
  best_bank_reason?: string;
  interview_guidance?: string[];
  required_documents?: string[];
  helpful_documents?: string[];
  
  status: 'draft' | 'assessed' | 'completed';
}

export interface BankRecommendation {
  bank_name: string;
  reason_tags: string[];
  fit_score: number;
}

export interface BankAvoidance {
  bank_name: string;
  reason_tags: string[];
}

export interface RiskAssessmentResult {
  score: number;
  category: 'low' | 'medium' | 'high';
  flags: string[];
  recommendedBanks: BankRecommendation[];
  banksToAvoid: BankAvoidance[];
}

export interface BankReadinessCaseInput {
  applicant_nationality: string;
  uae_residency: boolean;
  company_jurisdiction: 'mainland' | 'freezone';
  license_activity: string;
  business_model: 'service' | 'trading' | 'consulting' | 'tech' | 'other';
  expected_monthly_inflow: string;
  source_of_funds: string;
  source_of_funds_notes?: string;
  incoming_payment_countries: string[];
  previous_rejection: boolean;
  previous_rejection_notes?: string;
}

// Common nationalities for dropdown
export const NATIONALITIES = [
  'UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman',
  'India', 'Pakistan', 'Bangladesh', 'Philippines', 'Sri Lanka', 'Nepal',
  'UK', 'USA', 'Canada', 'Australia', 'Germany', 'France', 'Italy', 'Spain',
  'China', 'Japan', 'South Korea', 'Singapore', 'Malaysia', 'Thailand',
  'Russia', 'Ukraine', 'Iran', 'Iraq', 'Syria', 'Lebanon', 'Jordan', 'Egypt',
  'Nigeria', 'South Africa', 'Kenya',
  'Other'
];

// High-risk nationalities (for rule engine)
export const HIGH_RISK_NATIONALITIES = [
  'Iran', 'Syria', 'North Korea', 'Russia', 'Belarus', 'Myanmar', 'Cuba', 'Venezuela'
];

// Medium-risk nationalities
export const MEDIUM_RISK_NATIONALITIES = [
  'Iraq', 'Afghanistan', 'Yemen', 'Libya', 'Sudan', 'Somalia', 'Pakistan', 'Nigeria'
];

// Source of funds options
export const SOURCE_OF_FUNDS_OPTIONS = [
  'Business Revenue',
  'Investment Returns',
  'Salary/Employment',
  'Sale of Property',
  'Inheritance',
  'Loan/Financing',
  'Savings',
  'Gift',
  'Other'
];

// Monthly inflow ranges
export const MONTHLY_INFLOW_RANGES = [
  'Below AED 50,000',
  'AED 50,000 - 100,000',
  'AED 100,000 - 500,000',
  'AED 500,000 - 1,000,000',
  'AED 1,000,000 - 5,000,000',
  'Above AED 5,000,000'
];

// Countries list for multi-select
export const COUNTRIES = [
  'UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman',
  'India', 'Pakistan', 'Bangladesh', 'China', 'Japan', 'South Korea',
  'UK', 'USA', 'Canada', 'Australia', 'Germany', 'France', 'Italy',
  'Russia', 'Iran', 'Iraq', 'Syria', 'North Korea',
  'Nigeria', 'South Africa', 'Kenya', 'Egypt',
  'Singapore', 'Hong Kong', 'Malaysia', 'Thailand',
  'Brazil', 'Mexico', 'Argentina',
  'Other'
];

// High-risk countries for incoming payments
export const HIGH_RISK_COUNTRIES = [
  'Iran', 'Syria', 'North Korea', 'Russia', 'Belarus', 'Cuba', 'Venezuela', 'Myanmar'
];

// Medium-risk countries
export const MEDIUM_RISK_COUNTRIES = [
  'Iraq', 'Afghanistan', 'Yemen', 'Libya', 'Sudan', 'Somalia', 'Nigeria', 'Pakistan'
];
