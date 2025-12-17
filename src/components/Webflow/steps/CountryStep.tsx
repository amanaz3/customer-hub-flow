import React from 'react';
import { useWebflow } from '@/contexts/WebflowContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Globe, AlertTriangle, Info, HelpCircle, Loader2 } from 'lucide-react';
import { useWebflowData, isCountryEligible, countryRequiresEDD } from '@/hooks/useWebflowData';

export const CountryStep: React.FC = () => {
  const { state, updateState } = useWebflow();
  const { countries, loading } = useWebflowData();

  const selectedCountry = countries.find(c => c.country_code === state.nationality);
  const eligible = isCountryEligible(selectedCountry);
  const requiresEDD = countryRequiresEDD(selectedCountry);

  const handleCountryChange = (code: string) => {
    const country = countries.find(c => c.country_code === code);
    updateState({
      nationality: code,
      isEligible: isCountryEligible(country),
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
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Globe className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Where are you from?</CardTitle>
        <CardDescription className="text-base">
          Select your country of citizenship to check eligibility for UAE company formation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Country of Citizenship</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>We need your nationality to show available services in UAE.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Select value={state.nationality} onValueChange={handleCountryChange}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select your nationality" />
            </SelectTrigger>
            <SelectContent>
              {countries.map(country => (
                <SelectItem key={country.country_code} value={country.country_code}>
                  {country.country_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCountry && !eligible && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {selectedCountry.block_reason || 
                `Unfortunately, citizens of ${selectedCountry.country_name} are currently not eligible for company formation in the UAE due to regulatory restrictions.`}
            </AlertDescription>
          </Alert>
        )}

        {selectedCountry && eligible && requiresEDD && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Citizens of {selectedCountry.country_name} may face additional requirements (Enhanced Due Diligence). Our team will guide you through the process.
            </AlertDescription>
          </Alert>
        )}

        {selectedCountry && eligible && !requiresEDD && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Great! Citizens of {selectedCountry.country_name} are eligible for UAE company formation.
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
