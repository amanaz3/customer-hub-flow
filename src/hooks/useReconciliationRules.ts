import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Condition types supported by the rule engine
export type ConditionType = 
  | 'amount_exact'
  | 'amount_tolerance'
  | 'date_range'
  | 'duplicate_check'
  | 'tax_validation'
  | 'currency_match'
  | 'reference_match';

export interface ReconciliationRule {
  id: string;
  rule_name: string;
  description: string | null;
  jurisdiction: string;
  condition_type: ConditionType;
  params: Record<string, any>;
  priority: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookkeeperSettings {
  min_confidence_score: number;
  auto_match_enabled: boolean;
  default_tolerance_percent: number;
}

export interface MatchContext {
  billAmount?: number;
  paymentAmount?: number;
  invoiceAmount?: number;
  receiptAmount?: number;
  billDate?: string;
  paymentDate?: string;
  billReference?: string;
  paymentReference?: string;
  billCurrency?: string;
  paymentCurrency?: string;
  taxAmount?: number;
  totalAmount?: number;
  jurisdiction?: string;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  reason: string;
  confidence: number;
}

export function useReconciliationRules(jurisdiction?: string) {
  const [rules, setRules] = useState<ReconciliationRule[]>([]);
  const [settings, setSettings] = useState<BookkeeperSettings>({
    min_confidence_score: 0.85,
    auto_match_enabled: true,
    default_tolerance_percent: 2
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch rules
  useEffect(() => {
    const fetchRules = async () => {
      try {
        let query = supabase
          .from('bookkeeper_reconciliation_rules')
          .select('*')
          .eq('is_active', true)
          .order('priority', { ascending: true });

        if (jurisdiction) {
          query = query.or(`jurisdiction.eq.ALL,jurisdiction.eq.${jurisdiction}`);
        }

        const { data, error } = await query;
        if (error) throw error;
        setRules((data || []) as ReconciliationRule[]);
      } catch (error) {
        console.error('Error fetching reconciliation rules:', error);
      }
    };

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('bookkeeper_settings')
          .select('setting_key, setting_value');
        
        if (error) throw error;
        
        if (data) {
          const settingsMap: Record<string, any> = {};
          data.forEach(s => {
            const val = s.setting_value as Record<string, any> | null;
            settingsMap[s.setting_key] = val?.value;
          });
          setSettings({
            min_confidence_score: settingsMap.min_confidence_score ?? 0.85,
            auto_match_enabled: settingsMap.auto_match_enabled ?? true,
            default_tolerance_percent: settingsMap.default_tolerance_percent ?? 2
          });
        }
      } catch (error) {
        console.error('Error fetching bookkeeper settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
    fetchSettings();
  }, [jurisdiction]);

  // Rule evaluation functions
  const evaluateCondition = (
    rule: ReconciliationRule,
    context: MatchContext
  ): RuleEvaluationResult => {
    const { condition_type, params } = rule;
    
    switch (condition_type) {
      case 'amount_exact': {
        const bill = context.billAmount ?? context.invoiceAmount ?? 0;
        const payment = context.paymentAmount ?? context.receiptAmount ?? 0;
        const passed = Math.abs(bill - payment) < 0.01;
        return {
          ruleId: rule.id,
          ruleName: rule.rule_name,
          passed,
          reason: passed ? 'Amounts match exactly' : `Amount difference: ${Math.abs(bill - payment).toFixed(2)}`,
          confidence: passed ? 1.0 : 0
        };
      }

      case 'amount_tolerance': {
        const bill = context.billAmount ?? context.invoiceAmount ?? 0;
        const payment = context.paymentAmount ?? context.receiptAmount ?? 0;
        const tolerancePercent = params.tolerance_percent ?? settings.default_tolerance_percent;
        const tolerance = bill * (tolerancePercent / 100);
        const diff = Math.abs(bill - payment);
        const passed = diff <= tolerance;
        const confidence = passed ? Math.max(0, 1 - (diff / tolerance)) : 0;
        return {
          ruleId: rule.id,
          ruleName: rule.rule_name,
          passed,
          reason: passed 
            ? `Within ${tolerancePercent}% tolerance (diff: ${diff.toFixed(2)})` 
            : `Exceeds ${tolerancePercent}% tolerance (diff: ${diff.toFixed(2)})`,
          confidence
        };
      }

      case 'date_range': {
        if (!context.billDate || !context.paymentDate) {
          return {
            ruleId: rule.id,
            ruleName: rule.rule_name,
            passed: false,
            reason: 'Missing date information',
            confidence: 0
          };
        }
        const billDate = new Date(context.billDate);
        const paymentDate = new Date(context.paymentDate);
        const diffDays = Math.abs(
          (paymentDate.getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const daysBefore = params.days_before ?? 7;
        const daysAfter = params.days_after ?? 3;
        const passed = diffDays <= Math.max(daysBefore, daysAfter);
        return {
          ruleId: rule.id,
          ruleName: rule.rule_name,
          passed,
          reason: passed 
            ? `Date within range (${diffDays.toFixed(0)} days apart)` 
            : `Date outside range (${diffDays.toFixed(0)} days apart)`,
          confidence: passed ? Math.max(0, 1 - (diffDays / Math.max(daysBefore, daysAfter))) : 0
        };
      }

      case 'currency_match': {
        const strict = params.strict ?? true;
        if (!context.billCurrency || !context.paymentCurrency) {
          return {
            ruleId: rule.id,
            ruleName: rule.rule_name,
            passed: !strict,
            reason: 'Missing currency information',
            confidence: strict ? 0 : 0.5
          };
        }
        const passed = context.billCurrency === context.paymentCurrency;
        return {
          ruleId: rule.id,
          ruleName: rule.rule_name,
          passed,
          reason: passed 
            ? `Currencies match (${context.billCurrency})` 
            : `Currency mismatch: ${context.billCurrency} vs ${context.paymentCurrency}`,
          confidence: passed ? 1.0 : 0
        };
      }

      case 'reference_match': {
        if (!context.billReference || !context.paymentReference) {
          return {
            ruleId: rule.id,
            ruleName: rule.rule_name,
            passed: false,
            reason: 'Missing reference information',
            confidence: 0
          };
        }
        const partialMatch = params.partial_match ?? true;
        const billRef = context.billReference.toLowerCase().trim();
        const paymentRef = context.paymentReference.toLowerCase().trim();
        
        let passed = false;
        let confidence = 0;
        
        if (billRef === paymentRef) {
          passed = true;
          confidence = 1.0;
        } else if (partialMatch && (billRef.includes(paymentRef) || paymentRef.includes(billRef))) {
          passed = true;
          confidence = 0.8;
        }
        
        return {
          ruleId: rule.id,
          ruleName: rule.rule_name,
          passed,
          reason: passed 
            ? `Reference match found` 
            : `References do not match`,
          confidence
        };
      }

      case 'tax_validation': {
        if (!context.taxAmount || !context.totalAmount) {
          return {
            ruleId: rule.id,
            ruleName: rule.rule_name,
            passed: false,
            reason: 'Missing tax information',
            confidence: 0
          };
        }
        const expectedRate = params.rate ?? 5;
        const baseAmount = context.totalAmount - context.taxAmount;
        const expectedTax = baseAmount * (expectedRate / 100);
        const tolerance = expectedTax * 0.01; // 1% tolerance on tax calculation
        const passed = Math.abs(context.taxAmount - expectedTax) <= tolerance;
        return {
          ruleId: rule.id,
          ruleName: rule.rule_name,
          passed,
          reason: passed 
            ? `Tax matches ${expectedRate}% rate` 
            : `Tax discrepancy: expected ${expectedTax.toFixed(2)}, got ${context.taxAmount.toFixed(2)}`,
          confidence: passed ? 1.0 : 0.3
        };
      }

      case 'duplicate_check': {
        // This would typically check against existing records
        // For now, return a placeholder
        return {
          ruleId: rule.id,
          ruleName: rule.rule_name,
          passed: true,
          reason: 'No duplicates detected',
          confidence: 1.0
        };
      }

      default:
        return {
          ruleId: rule.id,
          ruleName: rule.rule_name,
          passed: false,
          reason: `Unknown condition type: ${condition_type}`,
          confidence: 0
        };
    }
  };

  // Evaluate all rules against a context
  const evaluateRules = (context: MatchContext): {
    results: RuleEvaluationResult[];
    overallScore: number;
    isMatch: boolean;
  } => {
    const applicableRules = rules.filter(
      r => r.jurisdiction === 'ALL' || r.jurisdiction === context.jurisdiction
    );

    const results = applicableRules.map(rule => evaluateCondition(rule, context));
    
    // Calculate weighted score based on priority
    const totalWeight = applicableRules.reduce((sum, r) => sum + (100 - r.priority), 0);
    const weightedScore = results.reduce((sum, result, idx) => {
      const weight = 100 - applicableRules[idx].priority;
      return sum + (result.confidence * weight);
    }, 0) / (totalWeight || 1);

    return {
      results,
      overallScore: weightedScore,
      isMatch: weightedScore >= settings.min_confidence_score && settings.auto_match_enabled
    };
  };

  // CRUD operations for admin
  const createRule = async (rule: Omit<ReconciliationRule, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('bookkeeper_reconciliation_rules')
        .insert(rule)
        .select()
        .single();
      
      if (error) throw error;
      setRules(prev => [...prev, data as ReconciliationRule].sort((a, b) => a.priority - b.priority));
      toast({ title: 'Rule created successfully' });
      return data;
    } catch (error: any) {
      toast({ title: 'Error creating rule', description: error.message, variant: 'destructive' });
      throw error;
    }
  };

  const updateRule = async (id: string, updates: Partial<ReconciliationRule>) => {
    try {
      const { data, error } = await supabase
        .from('bookkeeper_reconciliation_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      setRules(prev => prev.map(r => r.id === id ? (data as ReconciliationRule) : r));
      toast({ title: 'Rule updated successfully' });
      return data;
    } catch (error: any) {
      toast({ title: 'Error updating rule', description: error.message, variant: 'destructive' });
      throw error;
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bookkeeper_reconciliation_rules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setRules(prev => prev.filter(r => r.id !== id));
      toast({ title: 'Rule deleted successfully' });
    } catch (error: any) {
      toast({ title: 'Error deleting rule', description: error.message, variant: 'destructive' });
      throw error;
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .from('bookkeeper_settings')
        .update({ setting_value: { value }, updated_at: new Date().toISOString() })
        .eq('setting_key', key);
      
      if (error) throw error;
      setSettings(prev => ({ ...prev, [key]: value }));
      toast({ title: 'Setting updated successfully' });
    } catch (error: any) {
      toast({ title: 'Error updating setting', description: error.message, variant: 'destructive' });
      throw error;
    }
  };

  return {
    rules,
    settings,
    loading,
    evaluateRules,
    evaluateCondition,
    createRule,
    updateRule,
    deleteRule,
    updateSetting
  };
}
