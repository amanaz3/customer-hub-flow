import React from 'react';
import { useWebflow } from '@/contexts/WebflowContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, Sparkles, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 5500,
    description: 'Company formation essentials',
    features: [
      'Trade License',
      'Immigration Card',
      'Establishment Card',
      '1 Visa Quota',
      'Basic Support',
    ],
    banking: false,
    bookkeeping: false,
    vat: false,
  },
  {
    id: 'business',
    name: 'Business',
    price: 8500,
    description: 'Formation + Banking assistance',
    popular: true,
    features: [
      'Everything in Starter',
      '3 Visa Quota',
      'Bank Account Assistance',
      'PRO Services',
      'Priority Support',
    ],
    banking: true,
    bookkeeping: false,
    vat: false,
  },
  {
    id: 'complete',
    name: 'Complete',
    price: 14500,
    description: 'Full service package',
    features: [
      'Everything in Business',
      '5 Visa Quota',
      'Bookkeeping (Monthly)',
      'VAT Registration & Filing',
      'Dedicated Account Manager',
    ],
    banking: true,
    bookkeeping: true,
    vat: true,
  },
];

export const PlanPricingStep: React.FC = () => {
  const { state, updateState } = useWebflow();

  const handleSelectPlan = (plan: typeof plans[0]) => {
    updateState({
      selectedPlan: plan.id,
      includesBanking: plan.banking,
      includesBookkeeping: plan.bookkeeping,
      includesVat: plan.vat,
    });
  };

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
                state.selectedPlan === plan.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              {plan.popular && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              )}
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <div>
                  <span className="text-3xl font-bold">AED {plan.price.toLocaleString()}</span>
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
                    state.selectedPlan === plan.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {state.selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
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
