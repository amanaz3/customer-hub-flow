import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in';
  value: string | string[] | boolean | number;
}

interface RuleAction {
  type: 'multiply_price' | 'add_fee' | 'set_price' | 'set_flag' | 'require_document' | 'block' | 'show_warning' | 'set_processing_time' | 'recommend_bank' | 'skip_step' | 'show_step' | 'set_next_step' | 'apply_discount';
  value?: number | string | boolean;
  // Some rules store document id as `target` instead of `value`
  target?: string;
  message?: string;
  processingDays?: number;
  banks?: string[];
  stepKey?: string;
  // Discount-specific
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
}

interface WebflowRule {
  id: string;
  name: string;
  type: 'eligibility' | 'pricing' | 'document' | 'workflow' | 'cascade';
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  isActive: boolean;
}

interface RuleContext {
  nationality?: string;
  emirate?: string;
  locationType?: string;
  activityCode?: string;
  activityRiskLevel?: string;
  planCode?: string;
  jurisdictionType?: string;
  promoCode?: string;
}

export interface RuleEngineResult {
  priceMultiplier: number;
  additionalFees: number;
  flags: Record<string, boolean>;
  requiredDocuments: string[];
  warnings: string[];
  blocked: boolean;
  blockMessage?: string;
  appliedRules: string[];
  processingTimeDays: number | null;
  recommendedBanks: string[];
  // Step flow control
  skippedSteps: string[];
  visibleSteps: string[];
  nextStep?: string;
  // Promo code discount
  promoDiscount: number;
  promoDiscountType: 'percentage' | 'fixed' | null;
  appliedPromoCode: string | null;
}

export function useWebflowRuleEngine(context: RuleContext) {
  const [rules, setRules] = useState<WebflowRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRules = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('webflow_configurations')
        .select('config_data')
        .eq('is_active', true)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('[useWebflowRuleEngine] Failed to load rules:', error);
        setRules([]);
        setLoading(false);
        return;
      }

      if (data?.config_data) {
        const configData = data.config_data as { rules?: any[] };
        const fetchedRules = (configData.rules || []).map((r: any) => ({
          id: r.id,
          name: r.rule_name || r.name,
          type: r.rule_type || r.type,
          conditions: r.conditions || [],
          actions: r.actions || [],
          priority: r.priority || 0,
          isActive: r.is_active !== undefined ? r.is_active : (r.isActive !== undefined ? r.isActive : true),
        }));
        // Sort by priority (lower number = higher priority)
        setRules(fetchedRules.sort((a, b) => (a.priority || 0) - (b.priority || 0)));
      } else {
        setRules([]);
      }
      setLoading(false);
    };

    fetchRules();
  }, []);

  const evaluateCondition = (condition: RuleCondition, ctx: RuleContext): boolean => {
    const fieldValue = getFieldValue(condition.field, ctx)?.toLowerCase();
    const conditionValue = typeof condition.value === 'string' 
      ? condition.value.toLowerCase() 
      : condition.value;
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'not_equals':
        return fieldValue !== conditionValue;
      case 'contains':
        return typeof fieldValue === 'string' && typeof conditionValue === 'string' && fieldValue.includes(conditionValue);
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.map(v => v.toLowerCase()).includes(fieldValue as string);
      case 'not_in':
        return Array.isArray(conditionValue) && !conditionValue.map(v => v.toLowerCase()).includes(fieldValue as string);
      default:
        return false;
    }
  };

  const getFieldValue = (field: string, ctx: RuleContext): string | undefined => {
    const fieldMap: Record<string, string | undefined> = {
      // Country/Nationality
      'country': ctx.nationality,
      'nationality': ctx.nationality,
      // Emirate
      'emirate': ctx.emirate,
      // Jurisdiction/Location Type
      'jurisdiction.type': ctx.locationType,
      'jurisdiction_type': ctx.locationType,
      'location_type': ctx.locationType,
      'locationType': ctx.locationType,
      'license_type': ctx.locationType,
      // Activity
      'activity.code': ctx.activityCode,
      'activity_code': ctx.activityCode,
      'activity.risk_level': ctx.activityRiskLevel,
      'activityRiskLevel': ctx.activityRiskLevel,
      'risk_level': ctx.activityRiskLevel,
      // Plan
      'plan': ctx.planCode,
      'plan_code': ctx.planCode,
      // Promo Code
      'promo_code': ctx.promoCode,
      'promoCode': ctx.promoCode,
    };
    return fieldMap[field];
  };

  const result = useMemo<RuleEngineResult>(() => {
    const engineResult: RuleEngineResult = {
      priceMultiplier: 1,
      additionalFees: 0,
      flags: {},
      requiredDocuments: [],
      warnings: [],
      blocked: false,
      appliedRules: [],
      processingTimeDays: null,
      recommendedBanks: [],
      skippedSteps: [],
      visibleSteps: [],
      nextStep: undefined,
      promoDiscount: 0,
      promoDiscountType: null,
      appliedPromoCode: null,
    };

    if (loading) return engineResult;

    for (const rule of rules) {
      if (!rule.isActive) continue;

      // Check if ALL conditions match
      const allConditionsMatch = rule.conditions.every(cond => 
        evaluateCondition(cond, context)
      );

      if (allConditionsMatch) {
        engineResult.appliedRules.push(rule.name);

        // Apply all actions
        for (const action of rule.actions) {
          switch (action.type) {
            case 'multiply_price':
              engineResult.priceMultiplier *= (action.value as number) || 1;
              break;
            case 'add_fee':
            case 'set_price': // Treat set_price as add_fee for compatibility
              engineResult.additionalFees += (action.value as number) || 0;
              break;
            case 'set_flag':
              if (action.message) {
                engineResult.flags[action.message] = action.value as boolean;
              }
              break;
            case 'require_document': {
              const doc = action.target || (typeof action.value === 'string' ? action.value : undefined);
              if (doc) {
                engineResult.requiredDocuments.push(doc);
              }
              break;
            }
            case 'show_warning':
              if (action.message) {
                engineResult.warnings.push(action.message);
              }
              break;
            case 'block':
              engineResult.blocked = true;
              engineResult.blockMessage = action.message || 'Selection not allowed';
              break;
            case 'set_processing_time':
              const days = action.processingDays ?? (action.value as number);
              if (days !== undefined && days !== null) {
                // Use the longest processing time if multiple rules set it
                engineResult.processingTimeDays = engineResult.processingTimeDays 
                  ? Math.max(engineResult.processingTimeDays, days)
                  : days;
              }
              break;
            case 'recommend_bank':
              if (action.banks && action.banks.length > 0) {
                // Add banks without duplicates
                action.banks.forEach(bank => {
                  if (!engineResult.recommendedBanks.includes(bank)) {
                    engineResult.recommendedBanks.push(bank);
                  }
                });
              }
              break;
            case 'skip_step':
              if (action.stepKey && !engineResult.skippedSteps.includes(action.stepKey)) {
                engineResult.skippedSteps.push(action.stepKey);
              }
              break;
            case 'show_step':
              if (action.stepKey && !engineResult.visibleSteps.includes(action.stepKey)) {
                engineResult.visibleSteps.push(action.stepKey);
              }
              break;
            case 'set_next_step':
              if (action.stepKey) {
                engineResult.nextStep = action.stepKey;
              }
              break;
            case 'apply_discount':
              if (action.discountValue && action.discountType) {
                engineResult.promoDiscount = action.discountValue;
                engineResult.promoDiscountType = action.discountType;
                engineResult.appliedPromoCode = context.promoCode || null;
              }
              break;
          }
        }
      }
    }

    return engineResult;
  }, [rules, context, loading]);

  return {
    ...result,
    loading,
    rules,
  };
}
