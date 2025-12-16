import React from 'react';
import { useWebflow } from '@/contexts/WebflowContext';
import { SimpleStepLayout } from '@/components/WebflowSimple/SimpleStepLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Globe, AlertTriangle, Sparkles } from 'lucide-react';

const countries = [
  { code: 'AE', name: 'United Arab Emirates', eligible: true },
  { code: 'SA', name: 'Saudi Arabia', eligible: true },
  { code: 'GB', name: 'United Kingdom', eligible: true },
  { code: 'US', name: 'United States', eligible: true },
  { code: 'IN', name: 'India', eligible: true },
  { code: 'PK', name: 'Pakistan', eligible: true },
  { code: 'EG', name: 'Egypt', eligible: true },
  { code: 'JO', name: 'Jordan', eligible: true },
  { code: 'LB', name: 'Lebanon', eligible: true },
  { code: 'SY', name: 'Syria', eligible: false },
  { code: 'IR', name: 'Iran', eligible: false },
  { code: 'KP', name: 'North Korea', eligible: false },
];

export const CountryPage: React.FC = () => {
  const { state, updateState } = useWebflow();

  const selectedCountry = countries.find(c => c.code === state.nationality);

  const handleCountryChange = (code: string) => {
    const country = countries.find(c => c.code === code);
    updateState({
      nationality: code,
      isEligible: country?.eligible ?? false,
    });
  };

  return (
    <SimpleStepLayout
      step={1}
      title="Where are you from?"
      subtitle="We'll tailor your business setup based on your nationality"
      nextPath="/webflow-simple/intent"
      showPrev={false}
      backgroundVariant="gradient"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
            <Globe className="w-10 h-10 text-primary" />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground/80">
            Country of Citizenship
          </label>
          <Select value={state.nationality} onValueChange={handleCountryChange}>
            <SelectTrigger className="h-14 text-lg border-2 hover:border-primary/50 transition-colors">
              <SelectValue placeholder="Select your nationality" />
            </SelectTrigger>
            <SelectContent>
              {countries.map(country => (
                <SelectItem key={country.code} value={country.code} className="py-3">
                  <span className="flex items-center gap-2">
                    {country.name}
                    {!country.eligible && (
                      <span className="text-xs text-destructive">(Restricted)</span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCountry && !selectedCountry.eligible && (
          <Alert variant="destructive" className="animate-fade-in">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Unfortunately, we cannot process applications from {selectedCountry.name} due to regulatory restrictions.
            </AlertDescription>
          </Alert>
        )}

        {selectedCountry?.eligible && (
          <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl animate-fade-in">
            <Sparkles className="w-5 h-5 text-primary" />
            <p className="text-sm text-muted-foreground">
              Great! Citizens of {selectedCountry.name} can set up a business in UAE.
            </p>
          </div>
        )}
      </div>
    </SimpleStepLayout>
  );
};
