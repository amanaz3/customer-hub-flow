import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BankReadinessCaseInput, RiskAssessmentResult, BankRecommendation, BankAvoidance } from '@/types/bankReadiness';

interface RuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'contains_any' | 'has_any' | 'greater_than' | 'less_than';
  value: string | number | boolean | string[];
}

interface RuleAction {
  type: 'add_score' | 'add_flag' | 'set_category' | 'recommend_bank' | 'avoid_bank';
  value?: number | string;
  message?: string;
  bank_code?: string;
  reason_tags?: string[];
}

interface BankReadinessRule {
  id: string;
  rule_name: string;
  rule_type: string;
  description: string | null;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  is_active: boolean;
}

interface BankProfile {
  id: string;
  bank_code: string;
  bank_name: string;
  preferred_jurisdictions: string[];
  preferred_business_models: string[];
  preferred_activities: string[];
  avoid_activities: string[];
  accepts_non_residents: boolean;
  accepts_high_risk_nationalities: boolean;
  risk_tolerance: string;
  min_monthly_turnover: string;
  processing_time_days: number;
  is_active: boolean;
}

// High-risk nationalities for bank fit scoring
const HIGH_RISK_NATIONALITIES = [
  'Iran', 'Syria', 'North Korea', 'Russia', 'Belarus', 'Myanmar', 'Cuba', 'Venezuela'
];

export function useBankReadinessRuleEngine() {
  const [rules, setRules] = useState<BankReadinessRule[]>([]);
  const [bankProfiles, setBankProfiles] = useState<BankProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch rules and bank profiles in parallel
      const [rulesResult, banksResult] = await Promise.all([
        supabase
          .from('bank_readiness_rules')
          .select('*')
          .eq('is_active', true)
          .order('priority', { ascending: true }),
        supabase
          .from('bank_profiles')
          .select('*')
          .eq('is_active', true)
      ]);

      if (rulesResult.error) {
        console.error('[BankReadinessRuleEngine] Failed to load rules:', rulesResult.error);
      } else {
        const parsedRules = (rulesResult.data || []).map(r => ({
          id: r.id,
          rule_name: r.rule_name,
          rule_type: r.rule_type,
          description: r.description,
          conditions: (Array.isArray(r.conditions) ? r.conditions : []) as unknown as RuleCondition[],
          actions: (Array.isArray(r.actions) ? r.actions : []) as unknown as RuleAction[],
          priority: r.priority,
          is_active: r.is_active
        }));
        setRules(parsedRules);
      }

      if (banksResult.error) {
        console.error('[BankReadinessRuleEngine] Failed to load bank profiles:', banksResult.error);
      } else {
        setBankProfiles(banksResult.data || []);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const evaluateCondition = (condition: RuleCondition, input: BankReadinessCaseInput): boolean => {
    const fieldValue = getFieldValue(condition.field, input);
    const conditionValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return fieldValue === conditionValue;
      
      case 'not_equals':
        return fieldValue !== conditionValue;
      
      case 'in':
        if (Array.isArray(conditionValue)) {
          return conditionValue.includes(fieldValue as string);
        }
        return false;
      
      case 'not_in':
        if (Array.isArray(conditionValue)) {
          return !conditionValue.includes(fieldValue as string);
        }
        return true;
      
      case 'contains':
        if (typeof fieldValue === 'string' && typeof conditionValue === 'string') {
          return fieldValue.toLowerCase().includes(conditionValue.toLowerCase());
        }
        return false;
      
      case 'contains_any':
        if (typeof fieldValue === 'string' && Array.isArray(conditionValue)) {
          const lowerField = fieldValue.toLowerCase();
          return conditionValue.some(v => lowerField.includes(v.toLowerCase()));
        }
        return false;
      
      case 'has_any':
        if (Array.isArray(fieldValue) && Array.isArray(conditionValue)) {
          return fieldValue.some(fv => conditionValue.includes(fv));
        }
        return false;
      
      case 'greater_than':
        return Number(fieldValue) > Number(conditionValue);
      
      case 'less_than':
        return Number(fieldValue) < Number(conditionValue);
      
      default:
        return false;
    }
  };

  const getFieldValue = (field: string, input: BankReadinessCaseInput): string | boolean | string[] | undefined => {
    const fieldMap: Record<string, string | boolean | string[] | undefined> = {
      'applicant_nationality': input.applicant_nationality,
      'uae_residency': input.uae_residency,
      'company_jurisdiction': input.company_jurisdiction,
      'license_activity': input.license_activity,
      'business_model': input.business_model,
      'expected_monthly_inflow': input.expected_monthly_inflow,
      'source_of_funds': input.source_of_funds,
      'incoming_payment_countries': input.incoming_payment_countries,
      'previous_rejection': input.previous_rejection,
    };
    return fieldMap[field];
  };

  const calculateBankFitScore = (
    bank: BankProfile, 
    input: BankReadinessCaseInput, 
    riskCategory: 'low' | 'medium' | 'high'
  ): number => {
    let fitScore = 50;

    // Jurisdiction match
    if (bank.preferred_jurisdictions.includes(input.company_jurisdiction) || 
        bank.preferred_jurisdictions.includes('both')) {
      fitScore += 15;
    } else {
      fitScore -= 20;
    }

    // Business model match
    if (bank.preferred_business_models.includes(input.business_model)) {
      fitScore += 15;
    } else if (bank.preferred_business_models.includes('other')) {
      fitScore += 5;
    } else {
      fitScore -= 10;
    }

    // Activity match
    const activityLower = input.license_activity.toLowerCase();
    if (bank.avoid_activities.some(avoid => activityLower.includes(avoid))) {
      fitScore -= 30;
    } else if (bank.preferred_activities.some(pref => activityLower.includes(pref))) {
      fitScore += 15;
    }

    // Non-resident handling
    if (!input.uae_residency) {
      if (bank.accepts_non_residents) {
        fitScore += 10;
      } else {
        fitScore -= 25;
      }
    }

    // High-risk nationality handling
    if (HIGH_RISK_NATIONALITIES.includes(input.applicant_nationality)) {
      if (bank.accepts_high_risk_nationalities) {
        fitScore += 15;
      } else {
        fitScore -= 30;
      }
    }

    // Risk tolerance alignment
    if (riskCategory === 'high') {
      if (bank.risk_tolerance === 'high') {
        fitScore += 20;
      } else if (bank.risk_tolerance === 'low') {
        fitScore -= 15;
      }
    } else if (riskCategory === 'low') {
      if (bank.risk_tolerance === 'low' || bank.risk_tolerance === 'medium') {
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
    const bankMinRank = turnoverRanks[bank.min_monthly_turnover] || 2;

    if (inputRank >= bankMinRank) {
      fitScore += 10;
    } else {
      fitScore -= 15;
    }

    // Previous rejection - favor high tolerance banks
    if (input.previous_rejection && bank.risk_tolerance === 'high') {
      fitScore += 15;
    }

    return Math.max(0, Math.min(100, fitScore));
  };

  const assessRisk = (input: BankReadinessCaseInput): RiskAssessmentResult => {
    let score = 0;
    const flags: string[] = [];

    // Evaluate all active rules
    for (const rule of rules) {
      // Check if ALL conditions match
      const allConditionsMatch = rule.conditions.every(condition => 
        evaluateCondition(condition, input)
      );

      if (allConditionsMatch) {
        // Apply all actions
        for (const action of rule.actions) {
          switch (action.type) {
            case 'add_score':
              score += action.value as number;
              break;
            case 'add_flag':
              if (action.message) {
                flags.push(action.message);
              }
              break;
          }
        }
      }
    }

    // Determine risk category
    let category: 'low' | 'medium' | 'high';
    if (score <= 25) {
      category = 'low';
    } else if (score <= 55) {
      category = 'medium';
    } else {
      category = 'high';
    }

    // Calculate bank recommendations using bank profiles
    const bankScores = bankProfiles.map(bank => ({
      bank,
      fitScore: calculateBankFitScore(bank, input, category)
    }));

    // Sort by fit score descending
    bankScores.sort((a, b) => b.fitScore - a.fitScore);

    // Get recommended banks (fit score >= 50)
    const recommendedBanks: BankRecommendation[] = bankScores
      .filter(bs => bs.fitScore >= 50)
      .slice(0, 5)
      .map(bs => {
        const reasonTags: string[] = [];
        if (bs.bank.preferred_jurisdictions.includes(input.company_jurisdiction)) {
          reasonTags.push('Jurisdiction match');
        }
        if (bs.bank.preferred_business_models.includes(input.business_model)) {
          reasonTags.push('Business model fit');
        }
        if (!input.uae_residency && bs.bank.accepts_non_residents) {
          reasonTags.push('Accepts non-residents');
        }
        if (bs.bank.risk_tolerance === 'high') {
          reasonTags.push('High risk tolerance');
        }
        return {
          bank_name: bs.bank.bank_name,
          reason_tags: reasonTags.length > 0 ? reasonTags : ['General fit'],
          fit_score: bs.fitScore
        };
      });

    // Get banks to avoid (fit score < 30)
    const banksToAvoid: BankAvoidance[] = bankScores
      .filter(bs => bs.fitScore < 30)
      .slice(0, 3)
      .map(bs => {
        const reasonTags: string[] = [];
        if (!bs.bank.preferred_jurisdictions.includes(input.company_jurisdiction)) {
          reasonTags.push('Jurisdiction mismatch');
        }
        if (!input.uae_residency && !bs.bank.accepts_non_residents) {
          reasonTags.push('No non-resident support');
        }
        if (HIGH_RISK_NATIONALITIES.includes(input.applicant_nationality) && !bs.bank.accepts_high_risk_nationalities) {
          reasonTags.push('Nationality restrictions');
        }
        return {
          bank_name: bs.bank.bank_name,
          reason_tags: reasonTags.length > 0 ? reasonTags : ['Low compatibility']
        };
      });

    return {
      score: Math.min(score, 100),
      category,
      flags,
      recommendedBanks,
      banksToAvoid
    };
  };

  return {
    assessRisk,
    loading,
    rules,
    bankProfiles
  };
}
