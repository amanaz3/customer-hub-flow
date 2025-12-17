import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in';
  value: string | string[];
}

interface RuleAction {
  type: 'multiply_price' | 'add_fee' | 'set_flag' | 'require_document' | 'block' | 'show_warning' | 'set_processing_time';
  value?: number | string | boolean;
  message?: string;
  processingDays?: number;
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
}

interface RuleEngineResult {
  priceMultiplier: number;
  additionalFees: number;
  flags: Record<string, boolean>;
  requiredDocuments: string[];
  warnings: string[];
  blocked: boolean;
  blockMessage?: string;
  appliedRules: string[];
  processingTimeDays: number | null;
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
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (data?.config_data) {
        const configData = data.config_data as { rules?: WebflowRule[] };
        const fetchedRules = configData.rules || [];
        // Sort by priority (higher priority first)
        setRules(fetchedRules.sort((a, b) => (b.priority || 0) - (a.priority || 0)));
      }
      setLoading(false);
    };

    fetchRules();
  }, []);

  const evaluateCondition = (condition: RuleCondition, ctx: RuleContext): boolean => {
    const fieldValue = getFieldValue(condition.field, ctx);
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(condition.value as string);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue as string);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue as string);
      default:
        return false;
    }
  };

  const getFieldValue = (field: string, ctx: RuleContext): string | undefined => {
    const fieldMap: Record<string, string | undefined> = {
      'country': ctx.nationality,
      'nationality': ctx.nationality,
      'emirate': ctx.emirate,
      'jurisdiction.type': ctx.locationType,
      'jurisdiction_type': ctx.locationType,
      'location_type': ctx.locationType,
      'activity.code': ctx.activityCode,
      'activity_code': ctx.activityCode,
      'activity.risk_level': ctx.activityRiskLevel,
      'risk_level': ctx.activityRiskLevel,
      'plan': ctx.planCode,
      'plan_code': ctx.planCode,
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
              engineResult.additionalFees += (action.value as number) || 0;
              break;
            case 'set_flag':
              if (action.message) {
                engineResult.flags[action.message] = action.value as boolean;
              }
              break;
            case 'require_document':
              if (action.value) {
                engineResult.requiredDocuments.push(action.value as string);
              }
              break;
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
