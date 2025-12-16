import React from 'react';
import { useWebflow } from '@/contexts/WebflowContext';
import { SimpleStepLayout } from '@/components/WebflowSimple/SimpleStepLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, Check, Info, Calendar, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';

const frequencies = [
  {
    id: 'monthly',
    title: 'Monthly',
    description: 'Books updated every month',
    emoji: '📅',
    recommended: true,
  },
  {
    id: 'quarterly',
    title: 'Quarterly',
    description: 'Books updated every 3 months',
    emoji: '📊',
    recommended: false,
  },
];

const accountingSystems = [
  { id: 'none', name: "I don't have one yet", emoji: '🆕' },
  { id: 'quickbooks', name: 'QuickBooks', emoji: '📗' },
  { id: 'xero', name: 'Xero', emoji: '📘' },
  { id: 'zoho', name: 'Zoho Books', emoji: '📙' },
  { id: 'sage', name: 'Sage', emoji: '📕' },
  { id: 'other', name: 'Other', emoji: '📓' },
];

export const BookkeepingPage: React.FC = () => {
  const { state, updateState } = useWebflow();

  return (
    <SimpleStepLayout
      step={8}
      title="Bookkeeping Setup"
      subtitle="Configure your accounting preferences"
      nextPath="/webflow-simple/dashboard"
      prevPath="/webflow-simple/details"
      backgroundVariant="gradient"
    >
      <div className="space-y-6">
        {state.includesBookkeeping ? (
          <>
            {/* Frequency Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Bookkeeping Frequency *
              </Label>
              <div className="grid md:grid-cols-2 gap-3">
                {frequencies.map(freq => (
                  <button
                    key={freq.id}
                    onClick={() => updateState({ accountingFrequency: freq.id as 'monthly' | 'quarterly' })}
                    className={cn(
                      "relative p-5 rounded-xl border-2 text-left transition-all",
                      state.accountingFrequency === freq.id
                        ? "border-primary bg-primary/5 scale-[1.02]"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {freq.recommended && (
                      <span className="absolute -top-2 right-3 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{freq.emoji}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{freq.title}</span>
                          {state.accountingFrequency === freq.id && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{freq.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Accounting System */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Current Accounting System
              </Label>
              <Select value={state.accountingSystem} onValueChange={(v) => updateState({ accountingSystem: v })}>
                <SelectTrigger className="h-14 border-2">
                  <SelectValue placeholder="Select your accounting system" />
                </SelectTrigger>
                <SelectContent>
                  {accountingSystems.map(system => (
                    <SelectItem key={system.id} value={system.id} className="py-3">
                      <span className="flex items-center gap-2">
                        <span>{system.emoji}</span>
                        {system.name}
                      </span>
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
          <Alert className="bg-muted/50">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Bookkeeping services were not included in your plan. You can upgrade later if needed.
            </AlertDescription>
          </Alert>
        )}

        {state.includesVat ? (
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Tax Registration Number (if available)</Label>
              <Input
                value={state.taxRegistrationNumber}
                onChange={(e) => updateState({ taxRegistrationNumber: e.target.value })}
                placeholder="100XXXXXXXXX"
                className="h-14 border-2"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank if not yet registered. We'll help you register for VAT.
              </p>
            </div>

            <div className="p-5 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                VAT Compliance Included
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  VAT registration (if turnover exceeds AED 375,000)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Quarterly VAT return filing
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Invoice compliance review
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <Alert className="bg-muted/50">
            <Info className="h-4 w-4" />
            <AlertDescription>
              VAT services were not included. Contact us if you need VAT registration assistance.
            </AlertDescription>
          </Alert>
        )}

        {!state.includesBookkeeping && !state.includesVat && (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-2">
              Your plan doesn't include bookkeeping or VAT services.
            </p>
            <p className="text-sm text-muted-foreground">
              You can proceed to your dashboard or upgrade later.
            </p>
          </div>
        )}
      </div>
    </SimpleStepLayout>
  );
};
