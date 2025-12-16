import React from 'react';
import { useWebflow } from '@/contexts/WebflowContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin, Info, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const emirates = [
  { code: 'DXB', name: 'Dubai' },
  { code: 'AUH', name: 'Abu Dhabi' },
  { code: 'SHJ', name: 'Sharjah' },
  { code: 'AJM', name: 'Ajman' },
  { code: 'RAK', name: 'Ras Al Khaimah' },
  { code: 'FUJ', name: 'Fujairah' },
  { code: 'UAQ', name: 'Umm Al Quwain' },
];

const locationTypes = [
  {
    id: 'mainland',
    title: 'Mainland',
    description: 'Trade anywhere in UAE, requires local sponsor for some nationalities',
  },
  {
    id: 'freezone',
    title: 'Freezone',
    description: '100% foreign ownership, tax benefits, limited to freezone activities',
  },
  {
    id: 'offshore',
    title: 'Offshore',
    description: 'For international business, cannot trade within UAE',
  },
];

const legalForms = [
  { id: 'llc', name: 'LLC (Limited Liability Company)', available: ['mainland', 'freezone'] },
  { id: 'sole_establishment', name: 'Sole Establishment', available: ['mainland'] },
  { id: 'branch', name: 'Branch Office', available: ['mainland', 'freezone', 'offshore'] },
];

export const JurisdictionStep: React.FC = () => {
  const { state, updateState } = useWebflow();

  const availableLegalForms = legalForms.filter(
    form => !state.locationType || form.available.includes(state.locationType)
  );

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
                <SelectItem key={emirate.code} value={emirate.code}>
                  {emirate.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Location Type</Label>
          <div className="grid gap-3">
            {locationTypes.map(type => (
              <button
                key={type.id}
                onClick={() => updateState({ 
                  locationType: type.id as 'mainland' | 'freezone' | 'offshore',
                  legalForm: null 
                })}
                className={cn(
                  "p-4 rounded-lg border-2 text-left transition-all",
                  state.locationType === type.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <h4 className="font-medium">{type.title}</h4>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {state.locationType && (
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
                  <SelectItem key={form.id} value={form.id}>
                    {form.name}
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
