import React, { useMemo } from 'react';
import { useWebflow } from '@/contexts/WebflowContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin, Info, HelpCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWebflowData, getUniqueEmirates, getJurisdictionTypes, getLegalFormsForType } from '@/hooks/useWebflowData';

// Display names for location types
const LOCATION_TYPE_INFO: Record<string, { title: string; description: string }> = {
  mainland: {
    title: 'Mainland',
    description: 'Trade anywhere in UAE, requires local sponsor for some nationalities',
  },
  freezone: {
    title: 'Freezone',
    description: '100% foreign ownership, tax benefits, limited to freezone activities',
  },
  offshore: {
    title: 'Offshore',
    description: 'For international business, cannot trade within UAE',
  },
};

// Display names for legal forms
const LEGAL_FORM_NAMES: Record<string, string> = {
  llc: 'LLC (Limited Liability Company)',
  sole_establishment: 'Sole Establishment',
  branch: 'Branch Office',
  fz_llc: 'Freezone LLC',
  fz_establishment: 'Freezone Establishment',
};

export const JurisdictionStep: React.FC = () => {
  const { state, updateState } = useWebflow();
  const { jurisdictions, loading } = useWebflowData();

  // Derive data from DB jurisdictions
  const emirates = useMemo(() => getUniqueEmirates(jurisdictions), [jurisdictions]);
  const locationTypes = useMemo(() => getJurisdictionTypes(jurisdictions), [jurisdictions]);
  const availableLegalForms = useMemo(() => {
    if (!state.locationType) return [];
    return getLegalFormsForType(jurisdictions, state.locationType);
  }, [jurisdictions, state.locationType]);

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
          <MapPin className="w-6 h-6 text-primary" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <CardTitle className="text-2xl">Where will your business be based?</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Select your emirate and legal form to see eligible services.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription className="text-base">
          Choose your emirate, location type, and legal structure
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Emirate</Label>
          <Select value={state.emirate} onValueChange={(v) => updateState({ emirate: v })}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Select an emirate" />
            </SelectTrigger>
            <SelectContent>
              {emirates.map(emirate => (
                <SelectItem key={emirate} value={emirate}>
                  {emirate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Location Type</Label>
          <div className="grid gap-3">
            {locationTypes.map(type => {
              const info = LOCATION_TYPE_INFO[type] || { title: type, description: '' };
              return (
                <button
                  key={type}
                  onClick={() => updateState({ 
                    locationType: type as 'mainland' | 'freezone' | 'offshore',
                    legalForm: null 
                  })}
                  className={cn(
                    "p-4 rounded-lg border-2 text-left transition-all",
                    state.locationType === type
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <h4 className="font-medium">{info.title}</h4>
                  <p className="text-sm text-muted-foreground">{info.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {state.locationType && availableLegalForms.length > 0 && (
          <div className="space-y-2">
            <Label>Legal Form</Label>
            <Select 
              value={state.legalForm || ''} 
              onValueChange={(v) => updateState({ legalForm: v as 'llc' | 'sole_establishment' | 'branch' })}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select legal form" />
              </SelectTrigger>
              <SelectContent>
                {availableLegalForms.map(form => (
                  <SelectItem key={form} value={form}>
                    {LEGAL_FORM_NAMES[form] || form}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {state.locationType === 'offshore' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Offshore companies cannot conduct business within the UAE but are ideal for international trading and holding structures.
            </AlertDescription>
          </Alert>
        )}

        {/* Validation helper */}
        {(!state.emirate || !state.locationType || !state.legalForm) && (
          <div className="text-sm text-muted-foreground text-center p-3 bg-muted/50 rounded-lg">
            Please complete all selections: 
            {!state.emirate && <span className="text-amber-600"> Emirate</span>}
            {!state.locationType && <span className="text-amber-600"> Location Type</span>}
            {!state.legalForm && <span className="text-amber-600"> Legal Form</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
