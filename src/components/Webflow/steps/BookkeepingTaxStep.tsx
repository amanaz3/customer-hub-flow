import React from 'react';
import { useWebflow } from '@/contexts/WebflowContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, Info, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const frequencies = [
  {
    id: 'monthly',
    title: 'Monthly',
    description: 'Books updated every month, ideal for active businesses',
    recommended: true,
  },
  {
    id: 'quarterly',
    title: 'Quarterly',
    description: 'Books updated every 3 months, suitable for smaller operations',
    recommended: false,
  },
];

const accountingSystems = [
  { id: 'none', name: "I don't have one yet" },
  { id: 'quickbooks', name: 'QuickBooks' },
  { id: 'xero', name: 'Xero' },
  { id: 'zoho', name: 'Zoho Books' },
  { id: 'sage', name: 'Sage' },
  { id: 'other', name: 'Other' },
];

export const BookkeepingTaxStep: React.FC = () => {
  const { state, updateState } = useWebflow();

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Calculator className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Bookkeeping & Tax Setup</CardTitle>
        <CardDescription className="text-base">
          Configure your accounting preferences and tax compliance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {state.includesBookkeeping ? (
          <>
            <div className="space-y-3">
              <Label>Bookkeeping Frequency *</Label>
              <div className="grid md:grid-cols-2 gap-4">
                {frequencies.map(freq => (
                  <button
                    key={freq.id}
                    onClick={() => updateState({ accountingFrequency: freq.id as 'monthly' | 'quarterly' })}
                    className={cn(
                      "relative p-4 rounded-lg border-2 text-left transition-all",
                      state.accountingFrequency === freq.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {freq.recommended && (
                      <span className="absolute -top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                        Recommended
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{freq.title}</span>
                      {state.accountingFrequency === freq.id && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{freq.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Current Accounting System</Label>
              <Select value={state.accountingSystem} onValueChange={(v) => updateState({ accountingSystem: v })}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select your accounting system" />
                </SelectTrigger>
                <SelectContent>
                  {accountingSystems.map(system => (
                    <SelectItem key={system.id} value={system.id}>
                      {system.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                We can work with any system or help you set up a new one
              </p>
            </div>
          </>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Bookkeeping services were not included in your selected plan. You can upgrade later if needed.
            </AlertDescription>
          </Alert>
        )}

        {state.includesVat ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tax Registration Number (if available)</Label>
              <Input
                value={state.taxRegistrationNumber}
                onChange={(e) => updateState({ taxRegistrationNumber: e.target.value })}
                placeholder="100XXXXXXXXX"
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank if not yet registered. We'll help you register for VAT.
              </p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">VAT Compliance Next Steps:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  VAT registration (if turnover exceeds AED 375,000)
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  Quarterly VAT return filing
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  Invoice compliance review
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              VAT services were not included in your selected plan. Contact us if you need VAT registration assistance.
            </AlertDescription>
          </Alert>
        )}

        {!state.includesBookkeeping && !state.includesVat && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Your plan doesn't include bookkeeping or VAT services.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              You can skip this step or upgrade your plan to add these services.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
