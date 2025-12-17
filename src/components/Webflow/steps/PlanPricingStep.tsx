import React from 'react';
import { useWebflow } from '@/contexts/WebflowContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, Sparkles, HelpCircle, Loader2, Calculator, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWebflowPricing } from '@/hooks/useWebflowPricing';

// Fallback plans if database is empty
const fallbackPlans = [
  {
    id: 'starter',
    plan_code: 'starter',
    plan_name: 'Starter',
    base_price: 5500,
    description: 'Company formation essentials',
    features: ['Trade License', 'Immigration Card', 'Establishment Card', '1 Visa Quota', 'Basic Support'],
    included_services: [] as string[],
    jurisdiction_pricing: {} as Record<string, number>,
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
    jurisdiction_pricing: {} as Record<string, number>,
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
    jurisdiction_pricing: {} as Record<string, number>,
    is_popular: false,
    is_active: true,
    sort_order: 3,
  },
];

export const PlanPricingStep: React.FC = () => {
  const { state, updateState } = useWebflow();
  const { plans: dbPlans, priceBreakdown, selectedActivity, loading, ruleEngine } = useWebflowPricing(
    state.selectedPlan,
    state.emirate,
    state.locationType,
    state.activityCode
  );

  const plans = dbPlans.length > 0 ? dbPlans : fallbackPlans;

  const handleSelectPlan = (plan: typeof plans[0]) => {
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
    <div className="space-y-6">
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

      {/* Price Breakdown Card */}
      {priceBreakdown && (
        <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Price Breakdown</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Base Plan ({priceBreakdown.planName})</span>
                <span className="font-medium">AED {priceBreakdown.basePlanPrice.toLocaleString()}</span>
              </div>
              
              {priceBreakdown.jurisdictionFee > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Jurisdiction Fee ({priceBreakdown.jurisdictionName})</span>
                  <span className="font-medium text-amber-600">+AED {priceBreakdown.jurisdictionFee.toLocaleString()}</span>
                </div>
              )}
              
              {priceBreakdown.activityModifier > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Activity Add-on ({priceBreakdown.activityName})</span>
                  <span className="font-medium text-amber-600">+AED {priceBreakdown.activityModifier.toLocaleString()}</span>
                </div>
              )}

              {/* Dynamic Rule Adjustments */}
              {priceBreakdown.ruleAdjustments !== 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    Rule Adjustments
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3 h-3 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="font-medium mb-1">Applied Rules:</p>
                          <ul className="text-xs space-y-1">
                            {priceBreakdown.appliedRules.map((rule, i) => (
                              <li key={i}>• {rule}</li>
                            ))}
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                  <span className={cn(
                    "font-medium",
                    priceBreakdown.ruleAdjustments > 0 ? "text-amber-600" : "text-green-600"
                  )}>
                    {priceBreakdown.ruleAdjustments > 0 ? '+' : ''}AED {priceBreakdown.ruleAdjustments.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Applied Rules Badges */}
              {priceBreakdown.appliedRules.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {priceBreakdown.appliedRules.map((rule, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {rule}
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">Total Estimated Cost</span>
                  <span className="font-bold text-xl text-primary">AED {priceBreakdown.totalPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* Rule Engine Warnings */}
              {priceBreakdown.warnings.length > 0 && (
                <div className="mt-4 space-y-2">
                  {priceBreakdown.warnings.map((warning, i) => (
                    <div key={i} className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-amber-800 dark:text-amber-200">{warning}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedActivity?.enhanced_due_diligence && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Enhanced Due Diligence Required</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Your selected activity requires additional compliance documentation.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
