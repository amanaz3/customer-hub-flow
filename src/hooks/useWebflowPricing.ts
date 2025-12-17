import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWebflowRuleEngine } from './useWebflowRuleEngine';

export interface PricingPlan {
  id: string;
  plan_code: string;
  plan_name: string;
  description: string | null;
  base_price: number;
  features: string[];
  included_services: string[];
  jurisdiction_pricing: Record<string, number>;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface ActivityPricing {
  activity_code: string;
  activity_name: string;
  price_modifier: number;
  risk_level: string;
  requires_approval: boolean;
  enhanced_due_diligence: boolean;
  edd_requirements: string[];
}

export interface PriceBreakdown {
  basePlanPrice: number;
  jurisdictionFee: number;
  activityModifier: number;
  ruleAdjustments: number;
  totalPrice: number;
  planName: string;
  jurisdictionName: string;
  activityName: string;
  appliedRules: string[];
  warnings: string[];
}

export function useWebflowPricing(
  selectedPlan: string,
  emirate: string,
  locationType: string | null,
  activityCode: string
) {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [activities, setActivities] = useState<ActivityPricing[]>([]);
  const [loading, setLoading] = useState(true);

  // Get current activity for rule engine context
  const currentActivity = activities.find(a => a.activity_code === activityCode);

  // Use the rule engine with current context
  const ruleEngine = useWebflowRuleEngine({
    emirate,
    locationType: locationType || undefined,
    activityCode,
    activityRiskLevel: currentActivity?.risk_level,
    planCode: selectedPlan,
    jurisdictionType: locationType || undefined,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const [plansRes, activitiesRes] = await Promise.all([
        supabase
          .from('webflow_pricing')
          .select('*')
          .eq('is_active', true)
          .order('sort_order'),
        supabase
          .from('webflow_activities')
          .select('activity_code, activity_name, price_modifier, risk_level, requires_approval, enhanced_due_diligence, edd_requirements')
          .eq('is_active', true)
      ]);

      if (plansRes.data) {
        setPlans(plansRes.data.map(p => ({
          id: p.id,
          plan_code: p.plan_code,
          plan_name: p.plan_name,
          description: p.description,
          base_price: Number(p.base_price) || 0,
          features: Array.isArray(p.features) ? (p.features as string[]) : [],
          included_services: Array.isArray(p.included_services) ? (p.included_services as string[]) : [],
          jurisdiction_pricing: (p.jurisdiction_pricing as Record<string, number>) || {},
          is_popular: p.is_popular || false,
          is_active: p.is_active || false,
          sort_order: p.sort_order || 0,
        })));
      }

      if (activitiesRes.data) {
        setActivities(activitiesRes.data.map(a => ({
          activity_code: a.activity_code,
          activity_name: a.activity_name,
          price_modifier: Number(a.price_modifier) || 0,
          risk_level: a.risk_level || 'low',
          requires_approval: a.requires_approval || false,
          enhanced_due_diligence: a.enhanced_due_diligence || false,
          edd_requirements: Array.isArray(a.edd_requirements) ? (a.edd_requirements as string[]) : [],
        })));
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const priceBreakdown = useMemo<PriceBreakdown | null>(() => {
    if (!selectedPlan) return null;

    const plan = plans.find(p => p.plan_code === selectedPlan);
    if (!plan) return null;

    const jurisdictionKey = emirate && locationType 
      ? `${emirate.toLowerCase().replace(/\s+/g, '_')}_${locationType}`
      : '';
    
    const jurisdictionFee = plan.jurisdiction_pricing[jurisdictionKey] || 0;
    
    const activity = activities.find(a => a.activity_code === activityCode);
    const staticActivityModifier = activity?.price_modifier || 0;

    // Calculate base price before rule adjustments
    const baseTotal = plan.base_price + jurisdictionFee + staticActivityModifier;
    
    // Apply rule engine multiplier and additional fees
    const afterMultiplier = baseTotal * ruleEngine.priceMultiplier;
    const ruleAdjustments = (afterMultiplier - baseTotal) + ruleEngine.additionalFees;
    const finalTotal = afterMultiplier + ruleEngine.additionalFees;

    const jurisdictionLabel = emirate && locationType 
      ? `${emirate} ${locationType.charAt(0).toUpperCase() + locationType.slice(1)}`
      : 'Not selected';

    return {
      basePlanPrice: plan.base_price,
      jurisdictionFee,
      activityModifier: staticActivityModifier,
      ruleAdjustments,
      totalPrice: finalTotal,
      planName: plan.plan_name,
      jurisdictionName: jurisdictionLabel,
      activityName: activity?.activity_name || 'Not selected',
      appliedRules: ruleEngine.appliedRules,
      warnings: ruleEngine.warnings,
    };
  }, [selectedPlan, emirate, locationType, activityCode, plans, activities, ruleEngine]);

  const selectedActivity = useMemo(() => {
    return activities.find(a => a.activity_code === activityCode);
  }, [activityCode, activities]);

  return {
    plans,
    activities,
    priceBreakdown,
    selectedActivity,
    loading: loading || ruleEngine.loading,
    ruleEngine,
  };
}
