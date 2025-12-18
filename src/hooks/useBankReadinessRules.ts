import { 
  BankReadinessCaseInput, 
  RiskAssessmentResult, 
  BankRecommendation, 
  BankAvoidance,
  HIGH_RISK_NATIONALITIES,
  MEDIUM_RISK_NATIONALITIES,
  HIGH_RISK_COUNTRIES,
  MEDIUM_RISK_COUNTRIES
} from '@/types/bankReadiness';

// Deterministic rule-based risk assessment engine
export function useBankReadinessRules() {
  
  const assessRisk = (input: BankReadinessCaseInput): RiskAssessmentResult => {
    let score = 0;
    const flags: string[] = [];
    
    // 1. Nationality risk assessment (0-20 points)
    if (HIGH_RISK_NATIONALITIES.includes(input.applicant_nationality)) {
      score += 20;
      flags.push(`High-risk nationality: ${input.applicant_nationality}`);
    } else if (MEDIUM_RISK_NATIONALITIES.includes(input.applicant_nationality)) {
      score += 12;
      flags.push(`Medium-risk nationality: ${input.applicant_nationality}`);
    }
    
    // 2. UAE residency (0-10 points)
    if (!input.uae_residency) {
      score += 10;
      flags.push('Non-UAE resident');
    }
    
    // 3. Jurisdiction risk (0-5 points)
    if (input.company_jurisdiction === 'freezone') {
      score += 2;
      // Freezones are generally fine but some banks prefer mainland
    }
    
    // 4. Business model risk (0-15 points)
    if (input.business_model === 'trading') {
      score += 10;
      flags.push('Trading business model - higher scrutiny expected');
    } else if (input.business_model === 'other') {
      score += 8;
      flags.push('Unspecified business model');
    }
    
    // 5. License activity risk (0-15 points based on keywords)
    const highRiskActivities = ['crypto', 'forex', 'money exchange', 'gambling', 'tobacco', 'weapons'];
    const mediumRiskActivities = ['real estate', 'construction', 'import export', 'general trading'];
    
    const activityLower = input.license_activity.toLowerCase();
    if (highRiskActivities.some(a => activityLower.includes(a))) {
      score += 15;
      flags.push('High-risk business activity detected');
    } else if (mediumRiskActivities.some(a => activityLower.includes(a))) {
      score += 8;
      flags.push('Medium-risk business activity');
    }
    
    // 6. Monthly inflow risk (0-10 points)
    if (input.expected_monthly_inflow === 'Above AED 5,000,000') {
      score += 5;
      flags.push('High transaction volumes - enhanced due diligence required');
    } else if (input.expected_monthly_inflow === 'Below AED 50,000') {
      score += 3;
      flags.push('Low transaction volume may limit bank options');
    }
    
    // 7. Source of funds risk (0-10 points)
    const highRiskSources = ['Gift', 'Other', 'Loan/Financing'];
    if (highRiskSources.includes(input.source_of_funds)) {
      score += 8;
      flags.push(`Source of funds requires documentation: ${input.source_of_funds}`);
    }
    
    // 8. Incoming payment countries (0-20 points)
    const hasHighRiskCountry = input.incoming_payment_countries.some(c => HIGH_RISK_COUNTRIES.includes(c));
    const hasMediumRiskCountry = input.incoming_payment_countries.some(c => MEDIUM_RISK_COUNTRIES.includes(c));
    
    if (hasHighRiskCountry) {
      score += 20;
      flags.push('Incoming payments from high-risk countries');
    } else if (hasMediumRiskCountry) {
      score += 10;
      flags.push('Incoming payments from medium-risk countries');
    }
    
    // 9. Previous rejection (0-15 points)
    if (input.previous_rejection) {
      score += 15;
      flags.push('Previous bank rejection on record');
    }
    
    // Determine category
    let category: 'low' | 'medium' | 'high';
    if (score <= 20) {
      category = 'low';
    } else if (score <= 50) {
      category = 'medium';
    } else {
      category = 'high';
    }
    
    // Get bank recommendations
    const recommendedBanks = getRecommendedBanks(input, score, category);
    const banksToAvoid = getBanksToAvoid(input, score, category);
    
    return {
      score: Math.min(score, 100), // Cap at 100
      category,
      flags,
      recommendedBanks,
      banksToAvoid
    };
  };
  
  const getRecommendedBanks = (
    input: BankReadinessCaseInput, 
    score: number, 
    category: 'low' | 'medium' | 'high'
  ): BankRecommendation[] => {
    const banks: BankRecommendation[] = [];
    
    // Low risk - most banks are suitable
    if (category === 'low') {
      banks.push({
        bank_name: 'Emirates NBD',
        reason_tags: ['Low risk profile', 'Fast processing', 'Wide branch network'],
        fit_score: 95
      });
      banks.push({
        bank_name: 'ADCB',
        reason_tags: ['Business-friendly', 'Good for SMEs', 'Competitive rates'],
        fit_score: 90
      });
      banks.push({
        bank_name: 'Mashreq Bank',
        reason_tags: ['Digital banking', 'Quick onboarding', 'Good for startups'],
        fit_score: 88
      });
    }
    
    // Medium risk - select banks with higher risk tolerance
    if (category === 'medium') {
      banks.push({
        bank_name: 'RAKBank',
        reason_tags: ['Higher risk tolerance', 'Freezone expertise', 'Flexible requirements'],
        fit_score: 80
      });
      banks.push({
        bank_name: 'Commercial Bank of Dubai',
        reason_tags: ['Trading company experience', 'Good for importers', 'Patient processing'],
        fit_score: 75
      });
      banks.push({
        bank_name: 'First Abu Dhabi Bank',
        reason_tags: ['Large corporate focus', 'International connections', 'Higher volumes'],
        fit_score: 70
      });
    }
    
    // High risk - banks with specialized risk assessment
    if (category === 'high') {
      banks.push({
        bank_name: 'RAKBank',
        reason_tags: ['Known for higher risk tolerance', 'Case-by-case assessment'],
        fit_score: 60
      });
      banks.push({
        bank_name: 'Ajman Bank',
        reason_tags: ['Smaller bank', 'May consider complex cases', 'Personal service'],
        fit_score: 50
      });
    }
    
    // Special cases based on jurisdiction
    if (input.company_jurisdiction === 'freezone') {
      banks.push({
        bank_name: 'HSBC',
        reason_tags: ['Freezone expertise', 'International banking', 'Trade finance'],
        fit_score: category === 'low' ? 85 : 65
      });
    }
    
    // Sort by fit score
    return banks.sort((a, b) => b.fit_score - a.fit_score);
  };
  
  const getBanksToAvoid = (
    input: BankReadinessCaseInput, 
    score: number, 
    category: 'low' | 'medium' | 'high'
  ): BankAvoidance[] => {
    const avoid: BankAvoidance[] = [];
    
    // High risk profiles should avoid strict banks
    if (category === 'high') {
      avoid.push({
        bank_name: 'Standard Chartered',
        reason_tags: ['Very strict compliance', 'Long processing', 'High rejection rate for complex cases']
      });
      avoid.push({
        bank_name: 'Citibank',
        reason_tags: ['Corporate focus only', 'Strict KYC', 'Not suitable for new businesses']
      });
    }
    
    // Medium risk
    if (category === 'medium') {
      avoid.push({
        bank_name: 'Standard Chartered',
        reason_tags: ['Conservative risk appetite', 'Lengthy due diligence']
      });
    }
    
    // Trading businesses
    if (input.business_model === 'trading') {
      avoid.push({
        bank_name: 'Emirates Islamic',
        reason_tags: ['Limited trading account support', 'Sharia compliance requirements']
      });
    }
    
    // High-risk nationalities
    if (HIGH_RISK_NATIONALITIES.includes(input.applicant_nationality)) {
      avoid.push({
        bank_name: 'Most international banks',
        reason_tags: ['Sanctions concerns', 'Compliance restrictions', 'Enhanced due diligence required']
      });
    }
    
    return avoid;
  };
  
  const getRequiredDocuments = (input: BankReadinessCaseInput, category: 'low' | 'medium' | 'high'): string[] => {
    const docs = [
      'Trade License copy',
      'Passport copies of all shareholders',
      'Emirates ID (if UAE resident)',
      'Proof of address',
      'Company MOA/AOA',
      'Share certificate'
    ];
    
    if (category === 'medium' || category === 'high') {
      docs.push('Bank statements (6 months)');
      docs.push('Source of funds declaration');
      docs.push('Business plan');
    }
    
    if (category === 'high') {
      docs.push('Audited financial statements');
      docs.push('Reference letter from existing bank');
      docs.push('CV of shareholders');
    }
    
    if (input.business_model === 'trading') {
      docs.push('Supplier contracts');
      docs.push('Customer contracts');
    }
    
    return docs;
  };
  
  const getHelpfulDocuments = (input: BankReadinessCaseInput, category: 'low' | 'medium' | 'high'): string[] => {
    const docs = [
      'Business profile/presentation',
      'Website link',
      'Client testimonials/references'
    ];
    
    if (category === 'medium' || category === 'high') {
      docs.push('Explanation letter for any concerns');
      docs.push('Previous tax returns');
      docs.push('Existing banking relationship proof');
    }
    
    if (input.previous_rejection) {
      docs.push('Explanation letter for previous rejection');
      docs.push('Steps taken to address rejection reasons');
    }
    
    return docs;
  };
  
  const getInterviewGuidance = (input: BankReadinessCaseInput, category: 'low' | 'medium' | 'high'): string[] => {
    const guidance = [
      'Be prepared to explain your business model clearly',
      'Have all documents organized and accessible',
      'Know your expected transaction volumes'
    ];
    
    if (category === 'medium' || category === 'high') {
      guidance.push('Prepare to explain source of funds in detail');
      guidance.push('Be ready to discuss your client base');
      guidance.push('Have a clear explanation for any red flags');
    }
    
    if (input.previous_rejection) {
      guidance.push('Be upfront about previous rejection');
      guidance.push('Explain what has changed since then');
    }
    
    if (HIGH_RISK_COUNTRIES.some(c => input.incoming_payment_countries.includes(c))) {
      guidance.push('Be prepared to explain international payment flows');
      guidance.push('Have compliance documentation ready');
    }
    
    return guidance;
  };
  
  return {
    assessRisk,
    getRequiredDocuments,
    getHelpfulDocuments,
    getInterviewGuidance
  };
}
