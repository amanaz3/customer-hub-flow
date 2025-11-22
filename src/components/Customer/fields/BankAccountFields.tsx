import React, { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Info, Calculator, Sparkles, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BankAccountFieldsProps {
  form: UseFormReturn<any>;
}

interface RiskCalculation {
  level: 'low' | 'medium' | 'high';
  factors: string[];
  formula: string;
}

interface AIRiskAssessment {
  risk_level: 'low' | 'medium' | 'high';
  risk_score: number;
  key_risk_factors: Array<{
    factor: string;
    impact: 'low' | 'medium' | 'high';
    explanation: string;
  }>;
  mitigating_factors?: string[];
  recommendations?: string[];
  reasoning: string;
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
  const [aiAssessment, setAiAssessment] = useState<AIRiskAssessment | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isManuallyOverridden, setIsManuallyOverridden] = useState(false);
  const [originalAiRecommendation, setOriginalAiRecommendation] = useState<'low' | 'medium' | 'high' | null>(null);
  const { toast } = useToast();

  const businessType = form.watch('mainland_or_freezone');
  const signatoryType = form.watch('signatory_type');
  const natureOfBusiness = form.watch('nature_of_business');
  const annualTurnover = form.watch('annual_turnover');
  const numberOfShareholders = form.watch('no_of_shareholders');
  const currentRiskLevel = form.watch('risk_level');

  useEffect(() => {
    // Auto-calculate risk when fields change
    if (businessType || signatoryType) {
      const calculation = calculateRiskLevel(businessType, signatoryType, natureOfBusiness);
      setRiskCalculation(calculation);
      
      // Auto-fill risk level if not manually set and no AI assessment
      const currentRisk = form.getValues('risk_level');
      if (!currentRisk && !aiAssessment) {
        form.setValue('risk_level', calculation.level);
      }
    }
  }, [businessType, signatoryType, natureOfBusiness, form, aiAssessment]);

  // Track manual overrides
  useEffect(() => {
    if (originalAiRecommendation && currentRiskLevel && currentRiskLevel !== originalAiRecommendation) {
      setIsManuallyOverridden(true);
    } else if (originalAiRecommendation && currentRiskLevel === originalAiRecommendation) {
      setIsManuallyOverridden(false);
    }
  }, [currentRiskLevel, originalAiRecommendation]);

  const analyzeWithAI = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-bank-account-risk', {
        body: {
          businessType,
          signatoryType,
          natureOfBusiness,
          annualTurnover,
          numberOfShareholders
        }
      });

      if (error) throw error;

      setAiAssessment(data);
      setOriginalAiRecommendation(data.risk_level);
      
      // Auto-apply AI recommendation (can be overridden)
      form.setValue('risk_level', data.risk_level);
      setIsManuallyOverridden(false);
      
      toast({
        title: "AI Risk Assessment Complete",
        description: `Recommended Risk Level: ${data.risk_level.toUpperCase()} (Score: ${data.risk_score}/100)`,
      });
    } catch (error: any) {
      console.error('Error analyzing risk:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze risk with AI",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetToAiRecommendation = () => {
    if (originalAiRecommendation) {
      form.setValue('risk_level', originalAiRecommendation);
      setIsManuallyOverridden(false);
      toast({
        title: "Reset to AI Recommendation",
        description: `Risk level reset to ${originalAiRecommendation.toUpperCase()}`,
      });
    }
  };

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="risk_level"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-2 flex-wrap">
              <FormLabel className="text-destructive">Risk Level *</FormLabel>
              {riskCalculation && (
                <>
                  <Badge 
                    variant="outline" 
                    className="gap-1 text-xs"
                  >
                    <Calculator className="h-3 w-3" />
                    Rule-based
                  </Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-md p-4 max-h-96 overflow-y-auto">
                        <div className="space-y-4">
                          {/* Rule-based Assessment */}
                          <div className="pb-3 border-b">
                            <div className="flex items-center gap-2 mb-2">
                              <Calculator className="h-4 w-4 text-primary" />
                              <p className="font-semibold">Rule-Based Assessment</p>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <p className="text-xs font-medium mb-1">Formula:</p>
                                <pre className="text-xs whitespace-pre-wrap bg-muted p-2 rounded">
                                  {riskCalculation.formula}
                                </pre>
                              </div>
                              <div>
                                <p className="text-xs font-medium mb-1">Applied to This Application:</p>
                                <ul className="text-xs space-y-1">
                                  {riskCalculation.factors.map((factor, idx) => (
                                    <li key={idx} className="flex items-start gap-1">
                                      <span className="text-primary">•</span>
                                      <span>{factor}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="pt-2">
                                <p className="text-xs font-semibold">
                                  Result: 
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
                              </div>
                            </div>
                          </div>

                          {/* AI Assessment */}
                          {aiAssessment && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <p className="font-semibold">AI Risk Assessment</p>
                              </div>
                              <div className="space-y-3">
                                {/* Score Classification */}
                                <div className="bg-muted p-3 rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium">Risk Score</span>
                                    <Badge 
                                      variant={
                                        aiAssessment.risk_level === 'high' ? 'destructive' : 
                                        aiAssessment.risk_level === 'medium' ? 'default' : 
                                        'secondary'
                                      }
                                      className="font-semibold"
                                    >
                                      {aiAssessment.risk_level.toUpperCase()}
                                    </Badge>
                                  </div>
                                  
                                  {/* Score Bar */}
                                  <div className="relative h-8 bg-background rounded overflow-hidden border">
                                    <div 
                                      className={`absolute left-0 top-0 h-full transition-all ${
                                        aiAssessment.risk_level === 'high' ? 'bg-destructive' :
                                        aiAssessment.risk_level === 'medium' ? 'bg-yellow-500' :
                                        'bg-green-500'
                                      }`}
                                      style={{ width: `${aiAssessment.risk_score}%` }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="text-sm font-bold mix-blend-difference text-white">
                                        {aiAssessment.risk_score}/100
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Classification Ranges */}
                                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                                    <span>Low (0-33)</span>
                                    <span>Medium (34-66)</span>
                                    <span>High (67-100)</span>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-xs font-medium mb-1">Key Risk Factors:</p>
                                  <ul className="text-xs space-y-1">
                                    {aiAssessment.key_risk_factors.map((factor, idx) => (
                                      <li key={idx} className="bg-muted p-2 rounded">
                                        <div className="font-medium">{factor.factor}</div>
                                        <div className="text-muted-foreground">{factor.explanation}</div>
                                        <Badge 
                                          variant={
                                            factor.impact === 'high' ? 'destructive' : 
                                            factor.impact === 'medium' ? 'default' : 
                                            'secondary'
                                          }
                                          className="mt-1 text-xs"
                                        >
                                          {factor.impact} impact
                                        </Badge>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                {aiAssessment.mitigating_factors && aiAssessment.mitigating_factors.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium mb-1">Mitigating Factors:</p>
                                    <ul className="text-xs space-y-1">
                                      {aiAssessment.mitigating_factors.map((factor, idx) => (
                                        <li key={idx} className="flex items-start gap-1">
                                          <span className="text-green-600">✓</span>
                                          <span>{factor}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {aiAssessment.recommendations && aiAssessment.recommendations.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium mb-1">Recommendations:</p>
                                    <ul className="text-xs space-y-1">
                                      {aiAssessment.recommendations.map((rec, idx) => (
                                        <li key={idx} className="flex items-start gap-1">
                                          <span className="text-primary">→</span>
                                          <span>{rec}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                <div className="bg-muted p-2 rounded">
                                  <p className="text-xs font-medium mb-1">AI Reasoning:</p>
                                  <p className="text-xs text-muted-foreground">{aiAssessment.reasoning}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Hybrid Override Notice */}
                          {isManuallyOverridden && originalAiRecommendation && (
                            <div className="border-t pt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="destructive" className="text-xs">
                                  Manual Override
                                </Badge>
                              </div>
                              <div className="bg-destructive/10 border border-destructive/20 p-3 rounded space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-muted-foreground">AI Recommended:</span>
                                  <Badge variant="outline" className="font-semibold">
                                    {originalAiRecommendation.toUpperCase()}
                                  </Badge>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-muted-foreground">Current Selection:</span>
                                  <Badge 
                                    variant={
                                      currentRiskLevel === 'high' ? 'destructive' : 
                                      currentRiskLevel === 'medium' ? 'default' : 
                                      'secondary'
                                    }
                                    className="font-semibold"
                                  >
                                    {currentRiskLevel?.toUpperCase()}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Admin has manually overridden AI recommendation. This decision will be logged for audit purposes.
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground">
                              {isManuallyOverridden ? (
                                <span className="text-destructive font-medium">
                                  ⚠️ Manual Override Active - Current selection ({currentRiskLevel?.toUpperCase()}) differs from AI recommendation ({originalAiRecommendation?.toUpperCase()})
                                </span>
                              ) : (
                                "You can override the assessment by manually selecting a different risk level."
                              )}
                            </p>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
              {aiAssessment && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Sparkles className="h-3 w-3" />
                  AI Assessed
                </Badge>
              )}
              {isManuallyOverridden && originalAiRecommendation && (
                <>
                  <Badge variant="destructive" className="gap-1 text-xs">
                    ⚠️ Manually Overridden
                  </Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={resetToAiRecommendation}
                    className="h-7 text-xs gap-1 text-primary hover:text-primary"
                  >
                    ↺ Reset to AI ({originalAiRecommendation.toUpperCase()})
                  </Button>
                </>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={analyzeWithAI}
                disabled={isAnalyzing || !businessType || !signatoryType}
                className="ml-auto h-7 text-xs gap-1"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3" />
                    AI Risk Analysis
                  </>
                )}
              </Button>
            </div>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className={isManuallyOverridden ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <span>Low</span>
                    {originalAiRecommendation === 'low' && (
                      <Badge variant="secondary" className="text-xs">AI Recommended</Badge>
                    )}
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <span>Medium</span>
                    {originalAiRecommendation === 'medium' && (
                      <Badge variant="secondary" className="text-xs">AI Recommended</Badge>
                    )}
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <span>High</span>
                    {originalAiRecommendation === 'high' && (
                      <Badge variant="secondary" className="text-xs">AI Recommended</Badge>
                    )}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {isManuallyOverridden && (
              <p className="text-xs text-destructive font-medium mt-1">
                ⚠️ You have overridden the AI recommendation ({originalAiRecommendation?.toUpperCase()})
              </p>
            )}
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
