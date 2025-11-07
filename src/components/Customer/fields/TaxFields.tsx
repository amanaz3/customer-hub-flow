import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface TaxFieldsProps {
  form: UseFormReturn<any>;
}

export const TaxFields: React.FC<TaxFieldsProps> = ({ form }) => {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="tax_year_period"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tax Year Period</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g., 2023-2024" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="trade_license_number"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Trade License Number</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="company_incorporation_date"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Company Incorporation Date</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
