import React, { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Info, Calculator } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BankAccountFieldsProps {
  form: UseFormReturn<any>;
}

interface RiskCalculation {
  level: 'low' | 'medium' | 'high';
  factors: string[];
  formula: string;
}

const calculateRiskLevel = (
  businessType?: string,
  signatoryType?: string,
  natureOfBusiness?: string
): RiskCalculation => {
  const factors: string[] = [];
  let score = 0;

  // Business Type Assessment (0-2 points)
  if (businessType === 'freezone') {
    factors.push('Freezone (+1 risk point)');
    score += 1;
  } else if (businessType === 'mainland') {
    factors.push('Mainland (+0 risk points)');
  }

  // Signatory Type Assessment (0-2 points)
  if (signatoryType === 'joint') {
    factors.push('Joint Signatory (+2 risk points)');
    score += 2;
  } else if (signatoryType === 'single') {
    factors.push('Single Signatory (+0 risk points)');
  }

  // Nature of Business Assessment (0-1 points)
  if (natureOfBusiness && natureOfBusiness.length > 0) {
    // Check for high-risk keywords
    const highRiskKeywords = ['crypto', 'cryptocurrency', 'trading', 'forex', 'investment', 'money transfer', 'remittance'];
    const hasHighRiskActivity = highRiskKeywords.some(keyword => 
      natureOfBusiness.toLowerCase().includes(keyword)
    );
    
    if (hasHighRiskActivity) {
      factors.push('High-risk business activity (+1 risk point)');
      score += 1;
    } else {
      factors.push('Standard business activity (+0 risk points)');
    }
  }

  // Determine risk level based on score
  let level: 'low' | 'medium' | 'high';
  if (score === 0) {
    level = 'low';
  } else if (score <= 2) {
    level = 'medium';
  } else {
    level = 'high';
  }

  const formula = `Risk Score: ${score}/5 points\n\nRisk Levels:\n• Low: 0 points\n• Medium: 1-2 points\n• High: 3+ points\n\nFactors:\n• Freezone: +1 point\n• Joint Signatory: +2 points\n• High-risk activity: +1 point`;

  return { level, factors, formula };
};

export const BankAccountFields: React.FC<BankAccountFieldsProps> = ({ form }) => {
  const [riskCalculation, setRiskCalculation] = useState<RiskCalculation | null>(null);

  const businessType = form.watch('mainland_or_freezone');
  const signatoryType = form.watch('signatory_type');
  const natureOfBusiness = form.watch('nature_of_business');

  useEffect(() => {
    // Auto-calculate risk when fields change
    if (businessType || signatoryType) {
      const calculation = calculateRiskLevel(businessType, signatoryType, natureOfBusiness);
      setRiskCalculation(calculation);
      
      // Auto-fill risk level if not manually set
      const currentRisk = form.getValues('risk_level');
      if (!currentRisk) {
        form.setValue('risk_level', calculation.level);
      }
    }
  }, [businessType, signatoryType, natureOfBusiness, form]);

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="risk_level"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-2">
              <FormLabel className="text-destructive">Risk Level *</FormLabel>
              {riskCalculation && (
                <>
                  <Badge 
                    variant="outline" 
                    className="gap-1 text-xs"
                  >
                    <Calculator className="h-3 w-3" />
                    Auto-calculated
                  </Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-sm p-4">
                        <div className="space-y-3">
                          <div>
                            <p className="font-semibold mb-1">Risk Calculation Formula:</p>
                            <pre className="text-xs whitespace-pre-wrap bg-muted p-2 rounded">
                              {riskCalculation.formula}
                            </pre>
                          </div>
                          <div>
                            <p className="font-semibold mb-1">Applied to This Application:</p>
                            <ul className="text-xs space-y-1">
                              {riskCalculation.factors.map((factor, idx) => (
                                <li key={idx} className="flex items-start gap-1">
                                  <span className="text-primary">•</span>
                                  <span>{factor}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="pt-2 border-t">
                            <p className="text-xs font-semibold">
                              Calculated Risk: 
                              <Badge 
                                variant={
                                  riskCalculation.level === 'high' ? 'destructive' : 
                                  riskCalculation.level === 'medium' ? 'default' : 
                                  'secondary'
                                }
                                className="ml-2"
                              >
                                {riskCalculation.level.toUpperCase()}
                              </Badge>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              You can override this by selecting a different risk level.
                            </p>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
            </div>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="mainland_or_freezone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Business Type</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="mainland">Mainland</SelectItem>
                <SelectItem value="freezone">Freezone</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="signatory_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Signatory Type</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="single">Single Signatory</SelectItem>
                <SelectItem value="joint">Joint Signatory</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="nature_of_business"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nature of Business</FormLabel>
            <FormControl>
              <Textarea {...field} rows={3} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
