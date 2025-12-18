import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WebflowPromoCodeConfig } from './useWebflowConfig';

export interface PromoValidationResult {
  isValid: boolean;
  promoCode: WebflowPromoCodeConfig | null;
  error: string | null;
  discountAmount: number;
  discountType: 'percentage' | 'fixed' | null;
}

export function usePromoCodeValidation() {
  const [validating, setValidating] = useState(false);

  const validatePromoCode = useCallback(async (
    code: string,
    orderTotal: number,
    planCode?: string,
    jurisdictionCode?: string
  ): Promise<PromoValidationResult> => {
    if (!code.trim()) {
      return { isValid: false, promoCode: null, error: null, discountAmount: 0, discountType: null };
    }

    setValidating(true);
    
    try {
      // Fetch promo codes from webflow config
      const { data, error } = await supabase
        .from('webflow_configurations')
        .select('config_data')
        .eq('is_active', true)
        .single();

      if (error) {
        return { isValid: false, promoCode: null, error: 'Failed to load promo codes', discountAmount: 0, discountType: null };
      }

      const configData = data?.config_data as { promoCodes?: WebflowPromoCodeConfig[] };
      const promoCodes = configData?.promoCodes || [];

      // Find matching promo code (case-insensitive)
      const promo = promoCodes.find(
        p => p.code.toUpperCase() === code.toUpperCase() && p.is_active
      );

      if (!promo) {
        return { isValid: false, promoCode: null, error: 'Invalid promo code', discountAmount: 0, discountType: null };
      }

      // Check if expired
      if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
        return { isValid: false, promoCode: promo, error: 'Promo code has expired', discountAmount: 0, discountType: null };
      }

      // Check if not yet active
      if (promo.valid_from && new Date(promo.valid_from) > new Date()) {
        return { isValid: false, promoCode: promo, error: 'Promo code is not yet active', discountAmount: 0, discountType: null };
      }

      // Check max uses
      if (promo.max_uses && promo.current_uses >= promo.max_uses) {
        return { isValid: false, promoCode: promo, error: 'Promo code has reached maximum uses', discountAmount: 0, discountType: null };
      }

      // Check min order value
      if (promo.min_order_value && orderTotal < promo.min_order_value) {
        return { 
          isValid: false, 
          promoCode: promo, 
          error: `Minimum order value is AED ${promo.min_order_value}`, 
          discountAmount: 0, 
          discountType: null 
        };
      }

      // Check plan restrictions
      if (promo.applies_to_plans?.length > 0 && planCode) {
        if (!promo.applies_to_plans.includes(planCode)) {
          return { isValid: false, promoCode: promo, error: 'Promo code not valid for selected plan', discountAmount: 0, discountType: null };
        }
      }

      // Check jurisdiction restrictions
      if (promo.applies_to_jurisdictions?.length > 0 && jurisdictionCode) {
        if (!promo.applies_to_jurisdictions.includes(jurisdictionCode)) {
          return { isValid: false, promoCode: promo, error: 'Promo code not valid for selected jurisdiction', discountAmount: 0, discountType: null };
        }
      }

      // Calculate discount
      const discountAmount = promo.discount_type === 'percentage'
        ? (orderTotal * promo.discount_value) / 100
        : promo.discount_value;

      return {
        isValid: true,
        promoCode: promo,
        error: null,
        discountAmount,
        discountType: promo.discount_type
      };
    } catch (err) {
      console.error('Error validating promo code:', err);
      return { isValid: false, promoCode: null, error: 'Validation error', discountAmount: 0, discountType: null };
    } finally {
      setValidating(false);
    }
  }, []);

  return {
    validatePromoCode,
    validating
  };
}
