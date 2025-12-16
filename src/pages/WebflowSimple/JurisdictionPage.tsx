import React from 'react';
import { useWebflow } from '@/contexts/WebflowContext';
import { SimpleStepLayout } from '@/components/WebflowSimple/SimpleStepLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Building, Warehouse, Globe2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const emirates = [
  { code: 'DXB', name: 'Dubai', popular: true },
  { code: 'AUH', name: 'Abu Dhabi', popular: true },
  { code: 'SHJ', name: 'Sharjah', popular: false },
  { code: 'AJM', name: 'Ajman', popular: false },
  { code: 'RAK', name: 'Ras Al Khaimah', popular: false },
  { code: 'FUJ', name: 'Fujairah', popular: false },
  { code: 'UAQ', name: 'Umm Al Quwain', popular: false },
];

const locationTypes = [
  {
    id: 'mainland',
    title: 'Mainland',
    icon: Building,
    description: 'Trade anywhere in UAE',
    benefits: ['Full UAE market access', 'Government contracts eligible', 'No restrictions on clients'],
  },
  {
    id: 'freezone',
    title: 'Freezone',
    icon: Warehouse,
    description: '100% foreign ownership',
    benefits: ['100% ownership', 'Tax benefits', '0% import/export duty'],
  },
  {
    id: 'offshore',
    title: 'Offshore',
    icon: Globe2,
    description: 'International business',
    benefits: ['International trading', 'Asset protection', 'No UAE trading'],
  },
];

const legalForms = [
  { id: 'llc', name: 'LLC (Limited Liability Company)', available: ['mainland', 'freezone'] },
  { id: 'sole_establishment', name: 'Sole Establishment', available: ['mainland'] },
  { id: 'branch', name: 'Branch Office', available: ['mainland', 'freezone', 'offshore'] },
];

export const JurisdictionPage: React.FC = () => {
  const { state, updateState } = useWebflow();

  const availableLegalForms = legalForms.filter(
    form => !state.locationType || form.available.includes(state.locationType)
  );

  return (
    <SimpleStepLayout
      step={3}
      title="Where will you operate?"
      subtitle="Choose your business location and legal structure"
      nextPath="/webflow-simple/activity"
      prevPath="/webflow-simple/intent"
      backgroundVariant="accent"
    >
      <div className="space-y-8">
        {/* Emirate Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Select Emirate
          </label>
          <Select value={state.emirate} onValueChange={(v) => updateState({ emirate: v })}>
            <SelectTrigger className="h-14 text-lg border-2">
              <SelectValue placeholder="Choose an emirate" />
            </SelectTrigger>
            <SelectContent>
              {emirates.map(emirate => (
                <SelectItem key={emirate.code} value={emirate.code} className="py-3">
                  <span className="flex items-center gap-2">
                    {emirate.name}
                    {emirate.popular && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Popular
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location Type */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Location Type</label>
          <div className="grid gap-3">
            {locationTypes.map(type => {
              const Icon = type.icon;
              const isSelected = state.locationType === type.id;

              return (
                <button
                  key={type.id}
                  onClick={() => updateState({ 
                    locationType: type.id as 'mainland' | 'freezone' | 'offshore',
                    legalForm: null 
                  })}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{type.title}</h4>
                        {isSelected && <Check className="w-4 h-4 text-primary" />}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{type.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {type.benefits.map((b, i) => (
                          <span key={i} className="text-xs bg-muted px-2 py-1 rounded-full">
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legal Form */}
        {state.locationType && (
          <div className="space-y-3 animate-fade-in">
            <label className="text-sm font-medium">Legal Structure</label>
            <Select 
              value={state.legalForm || ''} 
              onValueChange={(v) => updateState({ legalForm: v as 'llc' | 'sole_establishment' | 'branch' })}
            >
              <SelectTrigger className="h-14 text-lg border-2">
                <SelectValue placeholder="Select legal form" />
              </SelectTrigger>
              <SelectContent>
                {availableLegalForms.map(form => (
                  <SelectItem key={form.id} value={form.id} className="py-3">
                    {form.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </SimpleStepLayout>
  );
};
