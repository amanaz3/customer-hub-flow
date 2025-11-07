import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HomeFinanceFieldsProps {
  form: UseFormReturn<any>;
}

export const HomeFinanceFields: React.FC<HomeFinanceFieldsProps> = ({ form }) => {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="uae_residency_status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>UAE Residency Status</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Resident">Resident</SelectItem>
                <SelectItem value="Non-Resident">Non-Resident</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="monthly_gross_salary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Gross Salary (AED)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field} 
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="property_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property Value (AED)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field} 
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="salary_range"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Salary Range</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="0-5000">AED 0 - 5,000</SelectItem>
                <SelectItem value="5000-10000">AED 5,000 - 10,000</SelectItem>
                <SelectItem value="10000-20000">AED 10,000 - 20,000</SelectItem>
                <SelectItem value="20000+">AED 20,000+</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
