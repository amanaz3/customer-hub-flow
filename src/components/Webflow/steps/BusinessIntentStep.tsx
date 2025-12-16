import React from 'react';
import { useWebflow } from '@/contexts/WebflowContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Briefcase, Building2, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const intents = [
  {
    id: 'new',
    title: 'Starting a New Business',
    description: 'I want to register a new company in the UAE',
    icon: Briefcase,
  },
  {
    id: 'existing',
    title: 'Managing an Existing Business',
    description: 'I already have a company and need services like banking, bookkeeping, or VAT',
    icon: Building2,
  },
];

export const BusinessIntentStep: React.FC = () => {
  const { state, updateState } = useWebflow();

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center pb-2">
        <div className="flex items-center justify-center gap-2">
          <CardTitle className="text-2xl">What brings you here?</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>This helps us customize the process for your business type.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription className="text-base">
          Tell us about your business needs so we can guide you to the right services
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {intents.map(intent => {
          const Icon = intent.icon;
          const isSelected = state.businessIntent === intent.id;

          return (
            <button
              key={intent.id}
              onClick={() => updateState({ businessIntent: intent.id as 'new' | 'existing' })}
              className={cn(
                "w-full p-6 rounded-lg border-2 text-left transition-all",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{intent.title}</h3>
                  <p className="text-muted-foreground mt-1">{intent.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
};
