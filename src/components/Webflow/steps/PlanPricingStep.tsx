import React, { useEffect, useState } from 'react';
import { useWebflow } from '@/contexts/WebflowContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, Sparkles, HelpCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface PricingPlan {
  id: string;
  plan_code: string;
  plan_name: string;
  description: string | null;
  base_price: number;
  features: string[];
  included_services: string[];
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
}

// Fallback plans if database is empty
const fallbackPlans: PricingPlan[] = [
  {
    id: 'starter',
    plan_code: 'starter',
    plan_name: 'Starter',
    base_price: 5500,
    description: 'Company formation essentials',
    features: ['Trade License', 'Immigration Card', 'Establishment Card', '1 Visa Quota', 'Basic Support'],
    included_services: [],
    is_popular: false,
    is_active: true,
    sort_order: 1,
  },
  {
    id: 'business',
    plan_code: 'business',
    plan_name: 'Business',
    base_price: 8500,
    description: 'Formation + Banking assistance',
    features: ['Everything in Starter', '3 Visa Quota', 'Bank Account Assistance', 'PRO Services', 'Priority Support'],
    included_services: ['banking'],
    is_popular: true,
    is_active: true,
    sort_order: 2,
  },
  {
    id: 'complete',
    plan_code: 'complete',
    plan_name: 'Complete',
    base_price: 14500,
    description: 'Full service package',
    features: ['Everything in Business', '5 Visa Quota', 'Bookkeeping (Monthly)', 'VAT Registration & Filing', 'Dedicated Account Manager'],
    included_services: ['banking', 'bookkeeping', 'vat'],
    is_popular: false,
    is_active: true,
    sort_order: 3,
  },
];

export const PlanPricingStep: React.FC = () => {
  const { state, updateState } = useWebflow();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('webflow_pricing')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error || !data || data.length === 0) {
        // Use fallback plans if no data
        setPlans(fallbackPlans);
      } else {
        setPlans(data.map(p => ({
          id: p.id,
          plan_code: p.plan_code,
          plan_name: p.plan_name,
          description: p.description,
          base_price: p.base_price,
          features: Array.isArray(p.features) ? (p.features as string[]) : [],
          included_services: Array.isArray(p.included_services) ? (p.included_services as string[]) : [],
          is_popular: p.is_popular,
          is_active: p.is_active,
          sort_order: p.sort_order,
        })));
      }
      setLoading(false);
    };

    fetchPlans();
  }, []);

  const handleSelectPlan = (plan: PricingPlan) => {
    const services = plan.included_services || [];
    updateState({
      selectedPlan: plan.plan_code,
      includesBanking: services.includes('banking'),
      includesBookkeeping: services.includes('bookkeeping'),
      includesVat: services.includes('vat'),
    });
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center pb-2">
        <div className="flex items-center justify-center gap-2">
          <CardTitle className="text-2xl">Choose Your Plan</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Select the package that suits your business needs.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription className="text-base">
          Select the package that best fits your business needs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map(plan => (
            <button
              key={plan.id}
              onClick={() => handleSelectPlan(plan)}
              className={cn(
                "relative p-6 rounded-xl border-2 text-left transition-all",
                state.selectedPlan === plan.plan_code
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              {plan.is_popular && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              )}
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{plan.plan_name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <div>
                  <span className="text-3xl font-bold">AED {plan.base_price.toLocaleString()}</span>
                  <span className="text-muted-foreground text-sm"> /year</span>
                </div>

                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4 border-t">
                  <div className={cn(
                    "w-full py-2 rounded-lg text-center font-medium transition-all",
                    state.selectedPlan === plan.plan_code
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {state.selectedPlan === plan.plan_code ? 'Selected' : 'Select Plan'}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">All plans include:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <span>• Government fees</span>
            <span>• Legal documentation</span>
            <span>• MOA preparation</span>
            <span>• Office address</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
