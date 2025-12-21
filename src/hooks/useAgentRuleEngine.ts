import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWebflowRuleEngine } from './useWebflowRuleEngine';

interface UseAgentRuleEngineOptions {
  // Rule context for evaluation
  nationality?: string;
  emirate?: string;
  locationType?: string;
  activityRiskLevel?: string;
  planCode?: string;
}

interface AgentRuleEngineResult {
  // Admin master switch status
  isFeatureEnabled: boolean;
  // Agent's personal toggle preference
  isAgentEnabled: boolean;
  // Combined: feature enabled AND agent has it on
  isActive: boolean;
  // Loading state
  loading: boolean;
  // Toggle agent preference
  toggleAgentPreference: () => void;
  // Rule engine results (only populated when isActive)
  ruleResult: {
    priceMultiplier: number;
    additionalFees: number;
    requiredDocuments: string[];
    warnings: string[];
    blocked: boolean;
    blockMessage?: string;
    processingTimeDays: number | null;
    recommendedBanks: string[];
    appliedRules: string[];
  } | null;
}

const AGENT_PREFERENCE_KEY = 'agent_rule_engine_enabled';

export function useAgentRuleEngine(options: UseAgentRuleEngineOptions = {}): AgentRuleEngineResult {
  const [isFeatureEnabled, setIsFeatureEnabled] = useState(false);
  const [isAgentEnabled, setIsAgentEnabled] = useState(() => {
    // Load agent preference from localStorage
    const stored = localStorage.getItem(AGENT_PREFERENCE_KEY);
    return stored === null ? true : stored === 'true'; // Default to true
  });
  const [loading, setLoading] = useState(true);

  // Fetch admin master switch status
  useEffect(() => {
    const fetchFeatureFlag = async () => {
      try {
        const { data, error } = await supabase
          .from('feature_flags')
          .select('is_enabled')
          .eq('feature_key', 'agent_rule_engine')
          .single();

        if (error) {
          console.error('Error fetching agent_rule_engine flag:', error);
          setIsFeatureEnabled(false);
        } else {
          setIsFeatureEnabled(data?.is_enabled ?? false);
        }
      } catch (err) {
        console.error('Failed to fetch feature flag:', err);
        setIsFeatureEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatureFlag();
  }, []);

  // Separate effect for realtime subscription with unique channel name
  const channelRef = useRef<any>(null);
  
  useEffect(() => {
    // Clean up existing subscription if any
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Create a unique channel name to avoid conflicts
    const uniqueChannelName = `feature_flags_changes-${Math.random().toString(36).substring(7)}`;
    
    const channel = supabase
      .channel(uniqueChannelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'feature_flags',
          filter: 'feature_key=eq.agent_rule_engine'
        },
        (payload) => {
          setIsFeatureEnabled((payload.new as any).is_enabled ?? false);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  // Toggle agent preference
  const toggleAgentPreference = useCallback(() => {
    setIsAgentEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem(AGENT_PREFERENCE_KEY, String(newValue));
      return newValue;
    });
  }, []);

  // Combined active state
  const isActive = isFeatureEnabled && isAgentEnabled;

  // Use the rule engine only when active
  const ruleEngineResult = useWebflowRuleEngine(
    isActive ? {
      nationality: options.nationality,
      emirate: options.emirate,
      locationType: options.locationType,
      activityRiskLevel: options.activityRiskLevel,
      planCode: options.planCode,
    } : {}
  );

  return {
    isFeatureEnabled,
    isAgentEnabled,
    isActive,
    loading: loading || (isActive && ruleEngineResult.loading),
    toggleAgentPreference,
    ruleResult: isActive ? {
      priceMultiplier: ruleEngineResult.priceMultiplier,
      additionalFees: ruleEngineResult.additionalFees,
      requiredDocuments: ruleEngineResult.requiredDocuments,
      warnings: ruleEngineResult.warnings,
      blocked: ruleEngineResult.blocked,
      blockMessage: ruleEngineResult.blockMessage,
      processingTimeDays: ruleEngineResult.processingTimeDays,
      recommendedBanks: ruleEngineResult.recommendedBanks,
      appliedRules: ruleEngineResult.appliedRules,
    } : null,
  };
}
