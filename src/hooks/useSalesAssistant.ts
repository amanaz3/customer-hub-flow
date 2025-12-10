import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SalesAssistantResponse {
  suggestedReplies?: string[];
  suggestedQuestions?: string[];
  alerts?: Array<{ type: string; label: string; severity: string }>;
  nextStage?: string;
  toneAdvice?: string;
  emotionDetected?: string;
  objectionType?: string;
  responseScript?: string;
  followUpQuestion?: string;
  summary?: string;
  error?: string;
}

interface UseSalesAssistantOptions {
  customerId?: string;
  productId?: string;
  callType?: 'inbound' | 'outbound' | 'follow_up';
  customerSegment?: string;
}

export const useSalesAssistant = (options: UseSalesAssistantOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SalesAssistantResponse | null>(null);
  const { toast } = useToast();

  const getSuggestions = useCallback(async (
    transcript: string[],
    currentStage?: string,
    customerEmotion?: string
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sales-assistant', {
        body: {
          action: 'get_suggestions',
          customerId: options.customerId,
          productId: options.productId,
          callType: options.callType || 'outbound',
          customerSegment: options.customerSegment,
          transcript,
          currentStage,
          customerEmotion,
        },
      });

      if (error) throw error;
      
      if (data.error) {
        toast({
          title: 'AI Error',
          description: data.error,
          variant: 'destructive',
        });
        return null;
      }

      setSuggestions(data);
      return data;
    } catch (error) {
      console.error('Error getting suggestions:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI suggestions',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [options.customerId, options.productId, options.callType, options.customerSegment, toast]);

  const handleObjection = useCallback(async (
    objectionText: string,
    customerEmotion?: string
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sales-assistant', {
        body: {
          action: 'handle_objection',
          customerId: options.customerId,
          productId: options.productId,
          callType: options.callType || 'outbound',
          customerSegment: options.customerSegment,
          objectionText,
          customerEmotion,
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error handling objection:', error);
      toast({
        title: 'Error',
        description: 'Failed to get objection handling advice',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [options.customerId, options.productId, options.callType, options.customerSegment, toast]);

  const getPricing = useCallback(async (customerEmotion?: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sales-assistant', {
        body: {
          action: 'get_pricing',
          customerId: options.customerId,
          productId: options.productId,
          callType: options.callType || 'outbound',
          customerSegment: options.customerSegment,
          customerEmotion,
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting pricing:', error);
      toast({
        title: 'Error',
        description: 'Failed to get pricing guidance',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [options.customerId, options.productId, options.callType, options.customerSegment, toast]);

  const analyzeCall = useCallback(async (transcript: string[]) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sales-assistant', {
        body: {
          action: 'analyze_call',
          customerId: options.customerId,
          productId: options.productId,
          callType: options.callType || 'outbound',
          transcript,
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error analyzing call:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze call',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [options.customerId, options.productId, options.callType, toast]);

  return {
    isLoading,
    suggestions,
    getSuggestions,
    handleObjection,
    getPricing,
    analyzeCall,
  };
};
