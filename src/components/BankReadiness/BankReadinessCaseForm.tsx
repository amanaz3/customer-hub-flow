import React from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, User, Building, Banknote, Globe, AlertCircle, X } from 'lucide-react';
import {
  BankReadinessCaseInput,
  NATIONALITIES,
  SOURCE_OF_FUNDS_OPTIONS,
  MONTHLY_INFLOW_RANGES,
  COUNTRIES
} from '@/types/bankReadiness';

interface BankReadinessCaseFormProps {
  initialData: BankReadinessCaseInput | null;
  onSubmit: (data: BankReadinessCaseInput) => void;
  onCancel: () => void;
}

const BankReadinessCaseForm: React.FC<BankReadinessCaseFormProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BankReadinessCaseInput>({
    defaultValues: initialData || {
      applicant_nationality: '',
      uae_residency: false,
      company_jurisdiction: 'mainland',
      license_activity: '',
      business_model: 'service',
      expected_monthly_inflow: '',
      source_of_funds: '',
      source_of_funds_notes: '',
      incoming_payment_countries: [],
      previous_rejection: false,
      previous_rejection_notes: ''
    }
  });

  const watchedCountries = watch('incoming_payment_countries') || [];
  const watchPreviousRejection = watch('previous_rejection');
  const watchSourceOfFunds = watch('source_of_funds');

  const handleCountryToggle = (country: string) => {
    const current = watchedCountries || [];
    if (current.includes(country)) {
      setValue('incoming_payment_countries', current.filter(c => c !== country));
    } else {
      setValue('incoming_payment_countries', [...current, country]);
    }
  };

  const removeCountry = (country: string) => {
    setValue('incoming_payment_countries', watchedCountries.filter(c => c !== country));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button type="button" variant="outline" onClick={onCancel} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">New Case Assessment</h2>
      </div>

      {/* Section 1: Applicant Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Applicant Information
          </CardTitle>
          <CardDescription>Basic details about the applicant</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="applicant_nationality">Nationality *</Label>
            <Select
              value={watch('applicant_nationality')}
              onValueChange={(value) => setValue('applicant_nationality', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select nationality" />
              </SelectTrigger>
              <SelectContent>
                {NATIONALITIES.map((nat) => (
                  <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>UAE Residency Status *</Label>
            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  {...register('uae_residency')}
                  value="true"
                  onChange={() => setValue('uae_residency', true)}
                  checked={watch('uae_residency') === true}
                  className="h-4 w-4"
                />
                <span>Yes, UAE Resident</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  {...register('uae_residency')}
                  value="false"
                  onChange={() => setValue('uae_residency', false)}
                  checked={watch('uae_residency') === false}
                  className="h-4 w-4"
                />
                <span>No, Non-Resident</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            Company Information
          </CardTitle>
          <CardDescription>Details about the UAE company</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Company Jurisdiction *</Label>
            <Select
              value={watch('company_jurisdiction')}
              onValueChange={(value: 'mainland' | 'freezone') => setValue('company_jurisdiction', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select jurisdiction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mainland">Mainland (DED)</SelectItem>
                <SelectItem value="freezone">Free Zone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="license_activity">License Activity *</Label>
            <Input
              id="license_activity"
              {...register('license_activity', { required: true })}
              placeholder="e.g., IT Consultancy, General Trading"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Business Model *</Label>
            <Select
              value={watch('business_model')}
              onValueChange={(value: 'service' | 'trading' | 'consulting' | 'tech' | 'other') => setValue('business_model', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select business model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="service">Service Business</SelectItem>
                <SelectItem value="trading">Trading Business</SelectItem>
                <SelectItem value="consulting">Consulting</SelectItem>
                <SelectItem value="tech">Technology</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Financial Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" />
            Financial Information
          </CardTitle>
          <CardDescription>Expected transaction volumes and funding sources</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Expected Monthly Inflow *</Label>
            <Select
              value={watch('expected_monthly_inflow')}
              onValueChange={(value) => setValue('expected_monthly_inflow', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                {MONTHLY_INFLOW_RANGES.map((range) => (
                  <SelectItem key={range} value={range}>{range}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Source of Funds *</Label>
            <Select
              value={watch('source_of_funds')}
              onValueChange={(value) => setValue('source_of_funds', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_OF_FUNDS_OPTIONS.map((source) => (
                  <SelectItem key={source} value={source}>{source}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(watchSourceOfFunds === 'Other' || watchSourceOfFunds === 'Gift') && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="source_of_funds_notes">Source of Funds Details</Label>
              <Textarea
                id="source_of_funds_notes"
                {...register('source_of_funds_notes')}
                placeholder="Please provide additional details about the source of funds..."
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 4: International Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            International Payments
          </CardTitle>
          <CardDescription>Countries from which payments will be received</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected countries */}
          {watchedCountries.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {watchedCountries.map((country) => (
                <Badge key={country} variant="secondary" className="gap-1 pr-1">
                  {country}
                  <button
                    type="button"
                    onClick={() => removeCountry(country)}
                    className="ml-1 hover:bg-destructive/20 rounded p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Country selection grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {COUNTRIES.map((country) => (
              <label
                key={country}
                className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                  watchedCountries.includes(country)
                    ? 'bg-primary/10 border-primary'
                    : 'hover:bg-muted'
                }`}
              >
                <Checkbox
                  checked={watchedCountries.includes(country)}
                  onCheckedChange={() => handleCountryToggle(country)}
                />
                <span className="text-sm">{country}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Previous Rejection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Previous Bank Application
          </CardTitle>
          <CardDescription>History of bank account applications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Label>Has the applicant been rejected by a bank before?</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="true"
                  onChange={() => setValue('previous_rejection', true)}
                  checked={watchPreviousRejection === true}
                  className="h-4 w-4"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="false"
                  onChange={() => setValue('previous_rejection', false)}
                  checked={watchPreviousRejection === false}
                  className="h-4 w-4"
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {watchPreviousRejection && (
            <div className="space-y-2">
              <Label htmlFor="previous_rejection_notes">Rejection Details</Label>
              <Textarea
                id="previous_rejection_notes"
                {...register('previous_rejection_notes')}
                placeholder="Which bank rejected? What was the reason given?"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="gap-2">
          Assess Readiness
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

export default BankReadinessCaseForm;
