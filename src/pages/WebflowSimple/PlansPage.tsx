import React from 'react';
import { useWebflow } from '@/contexts/WebflowContext';
import { SimpleStepLayout } from '@/components/WebflowSimple/SimpleStepLayout';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Crown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 5500,
    description: 'Perfect for getting started',
    icon: Zap,
    color: 'from-blue-500 to-blue-600',
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
    description: 'Most popular choice',
    popular: true,
    icon: Sparkles,
    color: 'from-primary to-primary/80',
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
    description: 'Full service solution',
    icon: Crown,
    color: 'from-amber-500 to-amber-600',
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

export const PlansPage: React.FC = () => {
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
    <SimpleStepLayout
      step={5}
      title="Choose Your Plan"
      subtitle="Select the package that fits your business needs"
      nextPath="/webflow-simple/payment"
      prevPath="/webflow-simple/activity"
      backgroundVariant="primary"
    >
      <div className="space-y-6">
        <div className="grid gap-4">
          {plans.map(plan => {
            const Icon = plan.icon;
            const isSelected = state.selectedPlan === plan.id;

            return (
              <button
                key={plan.id}
                onClick={() => handleSelectPlan(plan)}
                className={cn(
                  "relative p-6 rounded-xl border-2 text-left transition-all duration-300",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-[1.02]"
                    : "border-border hover:border-primary/50 hover:scale-[1.01]"
                )}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 right-4 bg-gradient-to-r from-primary to-primary/80">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                )}
                
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
                    plan.color
                  )}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold">AED {plan.price.toLocaleString()}</span>
                        <p className="text-xs text-muted-foreground">/year</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="absolute inset-0 rounded-xl border-2 border-primary pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-4 bg-muted/50 rounded-xl">
          <p className="text-sm text-muted-foreground text-center">
            All plans include government fees, legal documentation, and office address
          </p>
        </div>
      </div>
    </SimpleStepLayout>
  );
};
