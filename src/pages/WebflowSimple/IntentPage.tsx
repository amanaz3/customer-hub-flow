import React from 'react';
import { useWebflow } from '@/contexts/WebflowContext';
import { SimpleStepLayout } from '@/components/WebflowSimple/SimpleStepLayout';
import { Briefcase, Building2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const intents = [
  {
    id: 'new',
    title: 'Start Fresh',
    subtitle: 'Starting a New Business',
    description: 'I want to register a new company in the UAE from scratch',
    icon: Briefcase,
    emoji: '🚀',
  },
  {
    id: 'existing',
    title: 'Already Running',
    subtitle: 'Managing an Existing Business',
    description: 'I already have a company and need banking, bookkeeping, or VAT services',
    icon: Building2,
    emoji: '📊',
  },
];

export const IntentPage: React.FC = () => {
  const { state, updateState } = useWebflow();

  return (
    <SimpleStepLayout
      step={2}
      title="What brings you here?"
      subtitle="Help us understand your business journey"
      nextPath="/webflow-simple/jurisdiction"
      prevPath="/webflow-simple/country"
      backgroundVariant="secondary"
    >
      <div className="space-y-4">
        {intents.map(intent => {
          const Icon = intent.icon;
          const isSelected = state.businessIntent === intent.id;

          return (
            <button
              key={intent.id}
              onClick={() => updateState({ businessIntent: intent.id as 'new' | 'existing' })}
              className={cn(
                "w-full p-6 rounded-xl border-2 text-left transition-all duration-300 group",
                isSelected
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-[1.02]"
                  : "border-border hover:border-primary/50 hover:bg-muted/50 hover:scale-[1.01]"
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all",
                  isSelected ? "bg-primary/20 scale-110" : "bg-muted group-hover:bg-primary/10"
                )}>
                  {intent.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-semibold">{intent.title}</h3>
                    {isSelected && <Sparkles className="w-4 h-4 text-primary animate-pulse" />}
                  </div>
                  <p className="text-sm text-primary font-medium mb-2">{intent.subtitle}</p>
                  <p className="text-muted-foreground">{intent.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </SimpleStepLayout>
  );
};
