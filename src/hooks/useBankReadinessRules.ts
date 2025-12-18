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

// UAE Bank profiles with specific criteria
interface BankProfile {
  name: string;
  code: string;
  type: 'conventional' | 'islamic';
  tier: 'tier1' | 'tier2' | 'tier3' | 'digital';
  
  // Preferences
  preferredJurisdictions: ('mainland' | 'freezone' | 'both')[];
  preferredBusinessModels: string[];
  preferredActivities: string[]; // keywords
  avoidActivities: string[]; // keywords to avoid
  
  // Requirements
  minMonthlyTurnover: string; // range key
  acceptsNonResidents: boolean;
  acceptsHighRiskNationalities: boolean;
  
  // Risk tolerance
  riskTolerance: 'low' | 'medium' | 'high';
  
  // Specific strengths
  strengths: string[];
  weaknesses: string[];
  
  // Processing
  processingSpeed: 'fast' | 'medium' | 'slow';
  typicalApprovalDays: number;
  
  // Special conditions
  specialConditions?: string[];
}

const UAE_BANKS: BankProfile[] = [
  // Tier 1 - Major Banks
  {
    name: 'Emirates NBD',
    code: 'ENBD',
    type: 'conventional',
    tier: 'tier1',
    preferredJurisdictions: ['mainland', 'freezone'],
    preferredBusinessModels: ['service', 'consulting', 'tech'],
    preferredActivities: ['consultancy', 'it services', 'marketing', 'management'],
    avoidActivities: ['crypto', 'forex', 'money exchange', 'gambling'],
    minMonthlyTurnover: 'AED 50,000 - 100,000',
    acceptsNonResidents: false,
    acceptsHighRiskNationalities: false,
    riskTolerance: 'low',
    strengths: ['Large branch network', 'Digital banking', 'Fast processing', 'Good for SMEs'],
    weaknesses: ['Strict KYC', 'Conservative on trading'],
    processingSpeed: 'fast',
    typicalApprovalDays: 7,
  },
  {
    name: 'First Abu Dhabi Bank (FAB)',
    code: 'FAB',
    type: 'conventional',
    tier: 'tier1',
    preferredJurisdictions: ['mainland', 'freezone'],
    preferredBusinessModels: ['trading', 'service', 'consulting'],
    preferredActivities: ['import export', 'wholesale', 'corporate services'],
    avoidActivities: ['crypto', 'gambling', 'weapons'],
    minMonthlyTurnover: 'AED 100,000 - 500,000',
    acceptsNonResidents: true,
    acceptsHighRiskNationalities: false,
    riskTolerance: 'medium',
    strengths: ['Largest UAE bank', 'International connections', 'Trade finance', 'High volume support'],
    weaknesses: ['Slower processing', 'Higher requirements'],
    processingSpeed: 'medium',
    typicalApprovalDays: 14,
  },
  {
    name: 'Abu Dhabi Commercial Bank (ADCB)',
    code: 'ADCB',
    type: 'conventional',
    tier: 'tier1',
    preferredJurisdictions: ['mainland', 'both'],
    preferredBusinessModels: ['service', 'consulting', 'tech'],
    preferredActivities: ['professional services', 'healthcare', 'education'],
    avoidActivities: ['crypto', 'forex', 'money services'],
    minMonthlyTurnover: 'AED 50,000 - 100,000',
    acceptsNonResidents: false,
    acceptsHighRiskNationalities: false,
    riskTolerance: 'low',
    strengths: ['Good SME packages', 'Competitive rates', 'Abu Dhabi presence'],
    weaknesses: ['Limited freezone support', 'Conservative'],
    processingSpeed: 'fast',
    typicalApprovalDays: 10,
  },
  {
    name: 'Mashreq Bank',
    code: 'MASHREQ',
    type: 'conventional',
    tier: 'tier1',
    preferredJurisdictions: ['mainland', 'freezone'],
    preferredBusinessModels: ['tech', 'service', 'consulting'],
    preferredActivities: ['technology', 'e-commerce', 'startups', 'digital'],
    avoidActivities: ['crypto', 'gambling'],
    minMonthlyTurnover: 'Below AED 50,000',
    acceptsNonResidents: false,
    acceptsHighRiskNationalities: false,
    riskTolerance: 'low',
    strengths: ['Startup friendly', 'Digital-first', 'Quick onboarding', 'NeoBiz account'],
    weaknesses: ['Limited for trading', 'Lower limits initially'],
    processingSpeed: 'fast',
    typicalApprovalDays: 5,
    specialConditions: ['NeoBiz for startups with low turnover'],
  },
  
  // Tier 2 - Medium Banks with Higher Risk Tolerance
  {
    name: 'RAKBank',
    code: 'RAKBANK',
    type: 'conventional',
    tier: 'tier2',
    preferredJurisdictions: ['freezone', 'mainland'],
    preferredBusinessModels: ['trading', 'service', 'other'],
    preferredActivities: ['general trading', 'import export', 'construction', 'real estate'],
    avoidActivities: ['gambling', 'weapons'],
    minMonthlyTurnover: 'Below AED 50,000',
    acceptsNonResidents: true,
    acceptsHighRiskNationalities: true,
    riskTolerance: 'high',
    strengths: ['High risk tolerance', 'Freezone expertise', 'Flexible requirements', 'Trading company friendly'],
    weaknesses: ['Higher fees', 'More documentation required'],
    processingSpeed: 'medium',
    typicalApprovalDays: 14,
    specialConditions: ['Best for rejected applicants', 'Case-by-case assessment'],
  },
  {
    name: 'Commercial Bank of Dubai (CBD)',
    code: 'CBD',
    type: 'conventional',
    tier: 'tier2',
    preferredJurisdictions: ['mainland', 'freezone'],
    preferredBusinessModels: ['trading', 'service'],
    preferredActivities: ['trading', 'retail', 'wholesale', 'manufacturing'],
    avoidActivities: ['crypto', 'forex'],
    minMonthlyTurnover: 'AED 50,000 - 100,000',
    acceptsNonResidents: true,
    acceptsHighRiskNationalities: false,
    riskTolerance: 'medium',
    strengths: ['Trading company experience', 'Patient processing', 'Good for importers'],
    weaknesses: ['Slower decisions', 'More scrutiny on high volumes'],
    processingSpeed: 'slow',
    typicalApprovalDays: 21,
  },
  {
    name: 'Dubai Islamic Bank (DIB)',
    code: 'DIB',
    type: 'islamic',
    tier: 'tier2',
    preferredJurisdictions: ['mainland', 'freezone'],
    preferredBusinessModels: ['service', 'trading', 'consulting'],
    preferredActivities: ['halal trading', 'food', 'retail', 'services'],
    avoidActivities: ['alcohol', 'pork', 'gambling', 'conventional finance', 'entertainment'],
    minMonthlyTurnover: 'AED 50,000 - 100,000',
    acceptsNonResidents: false,
    acceptsHighRiskNationalities: false,
    riskTolerance: 'medium',
    strengths: ['Sharia compliant', 'Good for Muslim clients', 'Ethical banking'],
    weaknesses: ['Activity restrictions', 'Sharia board approval needed'],
    processingSpeed: 'medium',
    typicalApprovalDays: 14,
    specialConditions: ['Business must be Sharia compliant'],
  },
  {
    name: 'Emirates Islamic Bank',
    code: 'EIB',
    type: 'islamic',
    tier: 'tier2',
    preferredJurisdictions: ['mainland'],
    preferredBusinessModels: ['service', 'consulting'],
    preferredActivities: ['professional services', 'education', 'healthcare'],
    avoidActivities: ['alcohol', 'pork', 'gambling', 'entertainment', 'trading'],
    minMonthlyTurnover: 'AED 50,000 - 100,000',
    acceptsNonResidents: false,
    acceptsHighRiskNationalities: false,
    riskTolerance: 'low',
    strengths: ['ENBD backing', 'Sharia compliant'],
    weaknesses: ['Limited trading support', 'Strict activity review'],
    processingSpeed: 'medium',
    typicalApprovalDays: 14,
  },
  
  // Tier 3 - Smaller Banks / Niche
  {
    name: 'Ajman Bank',
    code: 'AJMAN',
    type: 'islamic',
    tier: 'tier3',
    preferredJurisdictions: ['mainland', 'freezone'],
    preferredBusinessModels: ['trading', 'service', 'other'],
    preferredActivities: ['general trading', 'retail', 'services'],
    avoidActivities: ['alcohol', 'pork', 'gambling'],
    minMonthlyTurnover: 'Below AED 50,000',
    acceptsNonResidents: true,
    acceptsHighRiskNationalities: true,
    riskTolerance: 'high',
    strengths: ['Personal service', 'Flexible', 'Considers complex cases', 'Lower requirements'],
    weaknesses: ['Smaller network', 'Limited digital banking'],
    processingSpeed: 'medium',
    typicalApprovalDays: 14,
    specialConditions: ['Good fallback for difficult cases'],
  },
  {
    name: 'Sharjah Islamic Bank (SIB)',
    code: 'SIB',
    type: 'islamic',
    tier: 'tier3',
    preferredJurisdictions: ['mainland'],
    preferredBusinessModels: ['service', 'trading'],
    preferredActivities: ['retail', 'services', 'manufacturing'],
    avoidActivities: ['alcohol', 'pork', 'gambling', 'entertainment'],
    minMonthlyTurnover: 'AED 50,000 - 100,000',
    acceptsNonResidents: false,
    acceptsHighRiskNationalities: false,
    riskTolerance: 'medium',
    strengths: ['Sharjah focus', 'Good for local businesses'],
    weaknesses: ['Limited Dubai presence', 'Conservative'],
    processingSpeed: 'medium',
    typicalApprovalDays: 14,
  },
  {
    name: 'National Bank of Fujairah (NBF)',
    code: 'NBF',
    type: 'conventional',
    tier: 'tier3',
    preferredJurisdictions: ['freezone', 'mainland'],
    preferredBusinessModels: ['trading', 'service'],
    preferredActivities: ['trading', 'shipping', 'logistics'],
    avoidActivities: ['crypto', 'gambling'],
    minMonthlyTurnover: 'AED 100,000 - 500,000',
    acceptsNonResidents: true,
    acceptsHighRiskNationalities: false,
    riskTolerance: 'medium',
    strengths: ['Trade finance', 'Northern Emirates focus', 'Flexible'],
    weaknesses: ['Limited Dubai branches', 'Less digital'],
    processingSpeed: 'medium',
    typicalApprovalDays: 14,
  },
  
  // International Banks
  {
    name: 'HSBC',
    code: 'HSBC',
    type: 'conventional',
    tier: 'tier1',
    preferredJurisdictions: ['freezone', 'mainland'],
    preferredBusinessModels: ['trading', 'consulting', 'tech'],
    preferredActivities: ['international trade', 'corporate services', 'consulting'],
    avoidActivities: ['crypto', 'gambling', 'money services'],
    minMonthlyTurnover: 'AED 500,000 - 1,000,000',
    acceptsNonResidents: true,
    acceptsHighRiskNationalities: false,
    riskTolerance: 'low',
    strengths: ['International network', 'Trade finance', 'Multi-currency', 'Global presence'],
    weaknesses: ['High requirements', 'Strict compliance', 'Expensive'],
    processingSpeed: 'slow',
    typicalApprovalDays: 30,
    specialConditions: ['Best for international businesses', 'Higher turnover required'],
  },
  {
    name: 'Standard Chartered',
    code: 'SCB',
    type: 'conventional',
    tier: 'tier1',
    preferredJurisdictions: ['freezone', 'mainland'],
    preferredBusinessModels: ['consulting', 'tech', 'service'],
    preferredActivities: ['corporate services', 'consulting', 'technology'],
    avoidActivities: ['trading', 'crypto', 'money services', 'real estate'],
    minMonthlyTurnover: 'AED 500,000 - 1,000,000',
    acceptsNonResidents: false,
    acceptsHighRiskNationalities: false,
    riskTolerance: 'low',
    strengths: ['International reputation', 'Good for corporates'],
    weaknesses: ['Very strict KYC', 'Long processing', 'High rejection rate'],
    processingSpeed: 'slow',
    typicalApprovalDays: 45,
  },
  {
    name: 'Citibank',
    code: 'CITI',
    type: 'conventional',
    tier: 'tier1',
    preferredJurisdictions: ['freezone'],
    preferredBusinessModels: ['consulting', 'tech'],
    preferredActivities: ['multinational operations', 'corporate treasury'],
    avoidActivities: ['trading', 'retail', 'crypto'],
    minMonthlyTurnover: 'Above AED 5,000,000',
    acceptsNonResidents: false,
    acceptsHighRiskNationalities: false,
    riskTolerance: 'low',
    strengths: ['Global treasury', 'Multi-currency', 'Corporate focus'],
    weaknesses: ['Only large corporates', 'Very strict', 'Limited SME support'],
    processingSpeed: 'slow',
    typicalApprovalDays: 60,
    specialConditions: ['Only suitable for large corporates'],
  },
  
  // Digital Banks
  {
    name: 'Wio Bank',
    code: 'WIO',
    type: 'conventional',
    tier: 'digital',
    preferredJurisdictions: ['mainland', 'freezone'],
    preferredBusinessModels: ['tech', 'service', 'consulting'],
    preferredActivities: ['technology', 'e-commerce', 'digital services', 'startups'],
    avoidActivities: ['crypto', 'gambling', 'trading'],
    minMonthlyTurnover: 'Below AED 50,000',
    acceptsNonResidents: false,
    acceptsHighRiskNationalities: false,
    riskTolerance: 'low',
    strengths: ['100% digital', 'Fast onboarding', 'Modern interface', 'Startup friendly'],
    weaknesses: ['No branches', 'Limited services', 'New bank'],
    processingSpeed: 'fast',
    typicalApprovalDays: 3,
    specialConditions: ['Best for tech startups', 'Instant account opening for eligible'],
  },
  {
    name: 'Liv by Emirates NBD',
    code: 'LIV',
    type: 'conventional',
    tier: 'digital',
    preferredJurisdictions: ['mainland'],
    preferredBusinessModels: ['service', 'consulting'],
    preferredActivities: ['freelance', 'consulting', 'small business'],
    avoidActivities: ['trading', 'crypto'],
    minMonthlyTurnover: 'Below AED 50,000',
    acceptsNonResidents: false,
    acceptsHighRiskNationalities: false,
    riskTolerance: 'low',
    strengths: ['Digital-first', 'Young professionals', 'Easy setup'],
    weaknesses: ['Limited business features', 'Personal focus'],
    processingSpeed: 'fast',
    typicalApprovalDays: 2,
    specialConditions: ['Best for freelancers and solopreneurs'],
  },
];

// High-risk activity keywords
const HIGH_RISK_ACTIVITY_KEYWORDS = [
  'crypto', 'cryptocurrency', 'bitcoin', 'forex', 'foreign exchange', 
  'money exchange', 'money transfer', 'remittance', 'gambling', 'casino',
  'tobacco', 'weapons', 'arms', 'ammunition', 'adult', 'escort'
];

const MEDIUM_RISK_ACTIVITY_KEYWORDS = [
  'real estate', 'property', 'construction', 'import export', 'general trading',
  'gold', 'precious metals', 'jewelry', 'used cars', 'automobile trading'
];

// Deterministic rule-based risk assessment engine
export function useBankReadinessRules() {
  
  const assessRisk = (input: BankReadinessCaseInput): RiskAssessmentResult => {
    let score = 0;
    const flags: string[] = [];
    
    // 1. Nationality risk assessment (0-25 points)
    if (HIGH_RISK_NATIONALITIES.includes(input.applicant_nationality)) {
      score += 25;
      flags.push(`High-risk nationality: ${input.applicant_nationality} - Most banks will decline`);
    } else if (MEDIUM_RISK_NATIONALITIES.includes(input.applicant_nationality)) {
      score += 15;
      flags.push(`Medium-risk nationality: ${input.applicant_nationality} - Enhanced due diligence required`);
    }
    
    // 2. UAE residency (0-12 points)
    if (!input.uae_residency) {
      score += 12;
      flags.push('Non-UAE resident - Limited bank options available');
    }
    
    // 3. Jurisdiction risk (0-5 points)
    if (input.company_jurisdiction === 'freezone') {
      score += 3;
      flags.push('Freezone company - Some mainland-focused banks may have restrictions');
    }
    
    // 4. Business model risk (0-15 points)
    if (input.business_model === 'trading') {
      score += 12;
      flags.push('Trading business - Higher scrutiny on source of goods and payments');
    } else if (input.business_model === 'other') {
      score += 10;
      flags.push('Unspecified business model - Banks prefer clear categorization');
    }
    
    // 5. License activity risk (0-20 points)
    const activityLower = input.license_activity.toLowerCase();
    
    if (HIGH_RISK_ACTIVITY_KEYWORDS.some(keyword => activityLower.includes(keyword))) {
      score += 20;
      flags.push('High-risk business activity - Many banks will not accept');
    } else if (MEDIUM_RISK_ACTIVITY_KEYWORDS.some(keyword => activityLower.includes(keyword))) {
      score += 10;
      flags.push('Medium-risk activity - Additional documentation likely required');
    }
    
    // 6. Monthly inflow assessment (0-10 points)
    if (input.expected_monthly_inflow === 'Above AED 5,000,000') {
      score += 5;
      flags.push('High transaction volumes - Enhanced monitoring will apply');
    } else if (input.expected_monthly_inflow === 'Below AED 50,000') {
      score += 4;
      flags.push('Low transaction volume - May limit Tier 1 bank options');
    }
    
    // 7. Source of funds risk (0-12 points)
    const highRiskSources = ['Gift', 'Other', 'Loan/Financing'];
    const mediumRiskSources = ['Inheritance', 'Sale of Property'];
    
    if (highRiskSources.includes(input.source_of_funds)) {
      score += 12;
      flags.push(`Source of funds (${input.source_of_funds}) requires strong documentation`);
    } else if (mediumRiskSources.includes(input.source_of_funds)) {
      score += 6;
      flags.push(`Source of funds (${input.source_of_funds}) may need supporting evidence`);
    }
    
    // 8. Incoming payment countries (0-25 points)
    const highRiskPaymentCountries = input.incoming_payment_countries.filter(c => HIGH_RISK_COUNTRIES.includes(c));
    const mediumRiskPaymentCountries = input.incoming_payment_countries.filter(c => MEDIUM_RISK_COUNTRIES.includes(c));
    
    if (highRiskPaymentCountries.length > 0) {
      score += 25;
      flags.push(`Payments from sanctioned/high-risk countries: ${highRiskPaymentCountries.join(', ')}`);
    } else if (mediumRiskPaymentCountries.length > 0) {
      score += 12;
      flags.push(`Payments from elevated-risk countries: ${mediumRiskPaymentCountries.join(', ')}`);
    }
    
    // 9. Previous rejection (0-18 points)
    if (input.previous_rejection) {
      score += 18;
      flags.push('Previous bank rejection - Will need to address concerns proactively');
    }
    
    // Determine category
    let category: 'low' | 'medium' | 'high';
    if (score <= 25) {
      category = 'low';
    } else if (score <= 55) {
      category = 'medium';
    } else {
      category = 'high';
    }
    
    // Get bank recommendations using detailed matching
    const recommendedBanks = getRecommendedBanks(input, score, category);
    const banksToAvoid = getBanksToAvoid(input, score, category);
    
    return {
      score: Math.min(score, 100),
      category,
      flags,
      recommendedBanks,
      banksToAvoid
    };
  };
  
  const calculateBankFitScore = (bank: BankProfile, input: BankReadinessCaseInput, riskCategory: 'low' | 'medium' | 'high'): number => {
    let fitScore = 50; // Base score
    
    // Jurisdiction match (+15 or -20)
    if (bank.preferredJurisdictions.includes(input.company_jurisdiction) || 
        bank.preferredJurisdictions.includes('both')) {
      fitScore += 15;
    } else {
      fitScore -= 20;
    }
    
    // Business model match (+15 or -10)
    if (bank.preferredBusinessModels.includes(input.business_model)) {
      fitScore += 15;
    } else if (bank.preferredBusinessModels.includes('other')) {
      fitScore += 5;
    } else {
      fitScore -= 10;
    }
    
    // Activity match (+15) or avoid (-30)
    const activityLower = input.license_activity.toLowerCase();
    if (bank.avoidActivities.some(avoid => activityLower.includes(avoid))) {
      fitScore -= 30;
    } else if (bank.preferredActivities.some(pref => activityLower.includes(pref))) {
      fitScore += 15;
    }
    
    // Non-resident handling (+10 or -25)
    if (!input.uae_residency) {
      if (bank.acceptsNonResidents) {
        fitScore += 10;
      } else {
        fitScore -= 25;
      }
    }
    
    // High-risk nationality handling (+15 or -30)
    if (HIGH_RISK_NATIONALITIES.includes(input.applicant_nationality)) {
      if (bank.acceptsHighRiskNationalities) {
        fitScore += 15;
      } else {
        fitScore -= 30;
      }
    }
    
    // Risk tolerance alignment (+20 or -15)
    if (riskCategory === 'high') {
      if (bank.riskTolerance === 'high') {
        fitScore += 20;
      } else if (bank.riskTolerance === 'low') {
        fitScore -= 15;
      }
    } else if (riskCategory === 'low') {
      if (bank.riskTolerance === 'low' || bank.riskTolerance === 'medium') {
        fitScore += 10;
      }
    }
    
    // Turnover match
    const turnoverRanks: Record<string, number> = {
      'Below AED 50,000': 1,
      'AED 50,000 - 100,000': 2,
      'AED 100,000 - 500,000': 3,
      'AED 500,000 - 1,000,000': 4,
      'AED 1,000,000 - 5,000,000': 5,
      'Above AED 5,000,000': 6
    };
    
    const inputRank = turnoverRanks[input.expected_monthly_inflow] || 2;
    const bankMinRank = turnoverRanks[bank.minMonthlyTurnover] || 2;
    
    if (inputRank >= bankMinRank) {
      fitScore += 10;
    } else {
      fitScore -= 15;
    }
    
    // Previous rejection - favor high tolerance banks
    if (input.previous_rejection && bank.riskTolerance === 'high') {
      fitScore += 15;
    }
    
    return Math.max(0, Math.min(100, fitScore));
  };
  
  const getRecommendedBanks = (
    input: BankReadinessCaseInput, 
    score: number, 
    category: 'low' | 'medium' | 'high'
  ): BankRecommendation[] => {
    const recommendations: BankRecommendation[] = [];
    
    for (const bank of UAE_BANKS) {
      const fitScore = calculateBankFitScore(bank, input, category);
      
      // Only recommend if fit score is reasonable
      if (fitScore >= 40) {
        const reasonTags: string[] = [];
        
        // Add relevant strength tags
        if (bank.preferredJurisdictions.includes(input.company_jurisdiction)) {
          reasonTags.push(`Good for ${input.company_jurisdiction}`);
        }
        if (bank.preferredBusinessModels.includes(input.business_model)) {
          reasonTags.push(`${input.business_model} expertise`);
        }
        if (!input.uae_residency && bank.acceptsNonResidents) {
          reasonTags.push('Accepts non-residents');
        }
        if (input.previous_rejection && bank.riskTolerance === 'high') {
          reasonTags.push('Considers rejected applicants');
        }
        if (bank.processingSpeed === 'fast') {
          reasonTags.push(`Fast processing (~${bank.typicalApprovalDays} days)`);
        }
        if (category === 'high' && bank.riskTolerance === 'high') {
          reasonTags.push('High risk tolerance');
        }
        
        // Add top 2 bank strengths
        reasonTags.push(...bank.strengths.slice(0, 2));
        
        // Add special conditions if applicable
        if (bank.specialConditions) {
          reasonTags.push(...bank.specialConditions.slice(0, 1));
        }
        
        recommendations.push({
          bank_name: bank.name,
          reason_tags: [...new Set(reasonTags)].slice(0, 5), // Unique tags, max 5
          fit_score: fitScore
        });
      }
    }
    
    // Sort by fit score and return top recommendations
    return recommendations
      .sort((a, b) => b.fit_score - a.fit_score)
      .slice(0, 6);
  };
  
  const getBanksToAvoid = (
    input: BankReadinessCaseInput, 
    score: number, 
    category: 'low' | 'medium' | 'high'
  ): BankAvoidance[] => {
    const avoid: BankAvoidance[] = [];
    
    for (const bank of UAE_BANKS) {
      const fitScore = calculateBankFitScore(bank, input, category);
      const reasonTags: string[] = [];
      
      // Check for strong mismatches
      const activityLower = input.license_activity.toLowerCase();
      
      if (bank.avoidActivities.some(a => activityLower.includes(a))) {
        reasonTags.push('Activity type not accepted');
      }
      
      if (!input.uae_residency && !bank.acceptsNonResidents) {
        reasonTags.push('Does not accept non-residents');
      }
      
      if (HIGH_RISK_NATIONALITIES.includes(input.applicant_nationality) && !bank.acceptsHighRiskNationalities) {
        reasonTags.push('Nationality restrictions apply');
      }
      
      if (category === 'high' && bank.riskTolerance === 'low') {
        reasonTags.push('Low risk tolerance - likely to reject');
      }
      
      if (bank.type === 'islamic') {
        const nonSharia = ['alcohol', 'pork', 'gambling', 'entertainment', 'conventional finance'];
        if (nonSharia.some(ns => activityLower.includes(ns))) {
          reasonTags.push('Not Sharia compliant');
        }
      }
      
      // Add bank weaknesses if they apply
      for (const weakness of bank.weaknesses) {
        if (weakness.toLowerCase().includes('trading') && input.business_model === 'trading') {
          reasonTags.push(weakness);
        }
        if (weakness.toLowerCase().includes('strict') && category === 'high') {
          reasonTags.push(weakness);
        }
      }
      
      // Only add to avoid list if there are strong reasons AND fit score is low
      if (reasonTags.length >= 2 && fitScore < 40) {
        avoid.push({
          bank_name: bank.name,
          reason_tags: [...new Set(reasonTags)].slice(0, 4)
        });
      }
    }
    
    return avoid.slice(0, 5);
  };
  
  const getRequiredDocuments = (input: BankReadinessCaseInput, category: 'low' | 'medium' | 'high'): string[] => {
    const docs = [
      'Valid Trade License (not expired)',
      'Memorandum of Association (MOA)',
      'Articles of Association (AOA) if applicable',
      'Share Certificate',
      'Passport copies of all shareholders (valid 6+ months)',
      'Emirates ID copies (if UAE resident)',
      'Proof of residence (utility bill / tenancy contract)',
    ];
    
    if (input.company_jurisdiction === 'freezone') {
      docs.push('Establishment Card / License from Free Zone Authority');
    }
    
    if (category === 'medium' || category === 'high') {
      docs.push('Personal bank statements (6 months)');
      docs.push('Company bank statements if existing business');
      docs.push('Signed Source of Funds Declaration');
      docs.push('Detailed Business Plan with projections');
    }
    
    if (category === 'high') {
      docs.push('Audited financial statements (if available)');
      docs.push('Reference letter from current/previous bank');
      docs.push('CV/Resume of all shareholders');
      docs.push('Explanation letter addressing risk factors');
    }
    
    if (input.business_model === 'trading') {
      docs.push('Supplier contracts/invoices (sample)');
      docs.push('Customer contracts/purchase orders (sample)');
      docs.push('Import/Export documentation if applicable');
    }
    
    if (HIGH_RISK_NATIONALITIES.includes(input.applicant_nationality)) {
      docs.push('Police Clearance Certificate from home country');
      docs.push('Additional identity verification documents');
    }
    
    if (input.previous_rejection) {
      docs.push('Previous rejection letter (if available)');
      docs.push('Letter explaining changes made since rejection');
    }
    
    return docs;
  };
  
  const getHelpfulDocuments = (input: BankReadinessCaseInput, category: 'low' | 'medium' | 'high'): string[] => {
    const docs = [
      'Company profile / presentation deck',
      'Website and social media links',
      'Client testimonials or references',
      'Professional photos of office/warehouse (if applicable)'
    ];
    
    if (category === 'medium' || category === 'high') {
      docs.push('Tax registration certificate (if registered)');
      docs.push('VAT certificate (if applicable)');
      docs.push('Previous tax returns from home country');
      docs.push('Personal investment portfolio statements');
      docs.push('Property ownership documents');
    }
    
    if (input.business_model === 'trading') {
      docs.push('Product catalog / samples photos');
      docs.push('Warehouse lease agreement');
      docs.push('Logistics/shipping agreements');
    }
    
    if (input.business_model === 'tech' || input.business_model === 'service') {
      docs.push('Active contracts with clients');
      docs.push('Portfolio of completed projects');
    }
    
    return docs;
  };
  
  const getInterviewGuidance = (input: BankReadinessCaseInput, category: 'low' | 'medium' | 'high'): string[] => {
    const guidance = [
      'Arrive 10-15 minutes early with all original documents',
      'Dress professionally - first impressions matter',
      'Be prepared to clearly explain your business model in 2-3 sentences',
      'Know your expected monthly transaction volumes (incoming and outgoing)',
      'Be honest - inconsistencies will raise red flags'
    ];
    
    if (category === 'medium' || category === 'high') {
      guidance.push('Prepare to explain your source of initial capital in detail');
      guidance.push('Have a clear explanation for any gaps in employment or business history');
      guidance.push('Be ready to discuss your main clients and suppliers by name');
      guidance.push('Explain why you chose UAE for your business');
    }
    
    if (input.previous_rejection) {
      guidance.push('Be upfront about the previous rejection - hiding it will be discovered');
      guidance.push('Clearly explain what has changed since the rejection');
      guidance.push('Show documentation of improvements made');
    }
    
    if (input.business_model === 'trading') {
      guidance.push('Be prepared to explain your supply chain in detail');
      guidance.push('Know the origin countries of your products');
      guidance.push('Explain your payment terms with suppliers and customers');
    }
    
    if (HIGH_RISK_COUNTRIES.some(c => input.incoming_payment_countries.includes(c))) {
      guidance.push('Prepare detailed explanation for international payment flows');
      guidance.push('Have compliance documentation ready for scrutiny');
      guidance.push('Consider whether you can initially avoid high-risk corridors');
    }
    
    if (!input.uae_residency) {
      guidance.push('Explain your plans for UAE presence and residency');
      guidance.push('Clarify who will operate the account day-to-day');
    }
    
    return guidance;
  };
  
  return {
    assessRisk,
    getRequiredDocuments,
    getHelpfulDocuments,
    getInterviewGuidance,
    UAE_BANKS // Export for reference
  };
}
