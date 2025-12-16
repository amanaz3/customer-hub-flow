import React from 'react';
import { useWebflow } from '@/contexts/WebflowContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Globe, AlertTriangle, Info } from 'lucide-react';

const countries = [
  { code: 'AE', name: 'United Arab Emirates', eligible: true },
  { code: 'SA', name: 'Saudi Arabia', eligible: true },
  { code: 'IN', name: 'India', eligible: true },
  { code: 'PK', name: 'Pakistan', eligible: true },
  { code: 'GB', name: 'United Kingdom', eligible: true },
  { code: 'US', name: 'United States', eligible: true },
  { code: 'DE', name: 'Germany', eligible: true },
  { code: 'FR', name: 'France', eligible: true },
  { code: 'CN', name: 'China', eligible: true },
  { code: 'RU', name: 'Russia', eligible: true, restricted: true },
  { code: 'IR', name: 'Iran', eligible: false },
  { code: 'KP', name: 'North Korea', eligible: false },
  { code: 'SY', name: 'Syria', eligible: false },
];

export const CountryStep: React.FC = () => {
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
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Globe className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Where are you from?</CardTitle>
        <CardDescription className="text-base">
          Select your country of citizenship to check eligibility for UAE company formation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Select value={state.nationality} onValueChange={handleCountryChange}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Select your nationality" />
          </SelectTrigger>
          <SelectContent>
            {countries.map(country => (
              <SelectItem key={country.code} value={country.code}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedCountry && !selectedCountry.eligible && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Unfortunately, citizens of {selectedCountry.name} are currently not eligible for company formation in the UAE due to regulatory restrictions.
            </AlertDescription>
          </Alert>
        )}

        {selectedCountry?.restricted && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Citizens of {selectedCountry.name} may face additional requirements. Our team will guide you through the process.
            </AlertDescription>
          </Alert>
        )}

        {selectedCountry?.eligible && !selectedCountry.restricted && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Great! Citizens of {selectedCountry.name} are eligible for UAE company formation.
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground text-center">
          <p>This information helps us determine which freezones and legal structures are available to you.</p>
        </div>
      </CardContent>
    </Card>
  );
};
