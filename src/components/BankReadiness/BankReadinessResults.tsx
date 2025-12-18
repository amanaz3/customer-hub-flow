import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  ArrowLeft,
  Plus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Building2,
  FileText,
  MessageSquare,
  Sparkles,
  Loader2,
  Target,
  Shield,
  ThumbsUp,
  ThumbsDown,
  History
} from 'lucide-react';
import { BankReadinessCaseInput, RiskAssessmentResult } from '@/types/bankReadiness';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBankReadinessCases } from '@/hooks/useBankReadinessCases';
import { useOutcomeAnalytics } from '@/hooks/useOutcomeAnalytics';
import SmartBankInsights from './SmartBankInsights';

interface BankReadinessResultsProps {
  input: BankReadinessCaseInput;
  result: RiskAssessmentResult;
  requiredDocuments: string[];
  helpfulDocuments: string[];
  interviewGuidance: string[];
  onBack: () => void;
  onStartNew: () => void;
}

const BankReadinessResults: React.FC<BankReadinessResultsProps> = ({
  input,
  result,
  requiredDocuments,
  helpfulDocuments,
  interviewGuidance,
  onBack,
  onStartNew
}) => {
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [improvementSteps, setImprovementSteps] = useState<string[] | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Get historical case data for smart insights
  const { cases } = useBankReadinessCases();
  const { getSimilarCaseStats, getBankSuccessRate } = useOutcomeAnalytics(cases, {
    applicant_nationality: input.applicant_nationality,
    license_activity: input.license_activity,
    risk_category: result.category,
    company_jurisdiction: input.company_jurisdiction,
  });

  const getRiskColor = (category: 'low' | 'medium' | 'high') => {
    switch (category) {
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'medium': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    }
  };

  const getRiskBadgeVariant = (category: 'low' | 'medium' | 'high') => {
    switch (category) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
    }
  };

  const bestBank = result.recommendedBanks[0];

  const requestAIExplanation = async () => {
    if (result.category === 'low' && !aiExplanation) {
      toast.info('AI explanation is typically for medium/high risk cases');
    }

    setIsLoadingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-bank-readiness', {
        body: { input, ruleResult: result }
      });

      if (error) throw error;

      setAiExplanation(data.explanation);
      setImprovementSteps(data.improvementSteps);
      toast.success('AI analysis complete');
    } catch (error) {
      console.error('AI analysis error:', error);
      toast.error('Failed to get AI explanation');
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Edit Case
          </Button>
          <h2 className="text-2xl font-bold">Assessment Results</h2>
        </div>
        <Button onClick={onStartNew} className="gap-2">
          <Plus className="h-4 w-4" />
          New Case
        </Button>
      </div>

      {/* Risk Snapshot */}
      <Card className={getRiskColor(result.category)}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Risk Snapshot
            </CardTitle>
            <Badge variant={getRiskBadgeVariant(result.category)} className="text-lg px-4 py-1">
              {result.category.toUpperCase()} RISK
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Risk Score</span>
                <span className="text-2xl font-bold">{result.score}/100</span>
              </div>
              <Progress value={result.score} className="h-3" />
            </div>
          </div>

          {result.flags.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Risk Flags ({result.flags.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.flags.map((flag, index) => (
                  <Badge key={index} variant="outline" className="bg-background">
                    {flag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="routing" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="routing" className="gap-2">
            <Building2 className="h-4 w-4" />
            Bank Routing
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <History className="h-4 w-4" />
            Smart Insights
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="interview" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Interview Prep
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Sparkles className="h-4 w-4" />
            AI Analysis
          </TabsTrigger>
        </TabsList>

        {/* Bank Routing Tab */}
        <TabsContent value="routing" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recommended Banks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <ThumbsUp className="h-5 w-5" />
                  Recommended Banks
                </CardTitle>
                <CardDescription>Banks suitable for this profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.recommendedBanks.map((bank, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${index === 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{bank.bank_name}</span>
                      <Badge variant="outline">{bank.fit_score}% fit</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {bank.reason_tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Banks to Avoid */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <ThumbsDown className="h-5 w-5" />
                  Banks to Avoid
                </CardTitle>
                <CardDescription>Banks likely to reject or have issues</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.banksToAvoid.length > 0 ? (
                  result.banksToAvoid.map((bank, index) => (
                    <div key={index} className="p-3 rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="font-medium">{bank.bank_name}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {bank.reason_tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs text-red-600">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No specific banks to avoid for this profile.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Best Bank Summary */}
          {bestBank && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Best Bank to Apply
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{bestBank.bank_name}</h3>
                    <p className="text-muted-foreground">
                      {bestBank.reason_tags.join(' • ')}
                    </p>
                  </div>
                  <Badge className="text-lg px-4 py-2">{bestBank.fit_score}% Match</Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Smart Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <SmartBankInsights
            similarStats={getSimilarCaseStats}
            getBankSuccessRate={getBankSuccessRate}
            recommendedBanks={result.recommendedBanks}
          />
          
          {!getSimilarCaseStats && (
            <Card>
              <CardContent className="py-8 text-center">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Similar Cases Yet</h3>
                <p className="text-muted-foreground text-sm">
                  As you record outcomes, this section will show historical success rates 
                  for similar profiles to help guide bank selection.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Required Documents
                </CardTitle>
                <CardDescription>Must-have documents for application</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {requiredDocuments.map((doc, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-600" />
                  Helpful Documents
                </CardTitle>
                <CardDescription>Additional documents that strengthen the case</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {helpfulDocuments.map((doc, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-amber-600 flex-shrink-0" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Interview Prep Tab */}
        <TabsContent value="interview">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Interview Guidance
              </CardTitle>
              <CardDescription>Preparation tips for bank interview</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {interviewGuidance.map((tip, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-primary">{index + 1}</span>
                    </div>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Analysis Tab */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI-Powered Analysis
              </CardTitle>
              <CardDescription>
                Deep analysis and improvement recommendations (invoked for Medium/High risk or on request)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!aiExplanation && !isLoadingAI && (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Get AI-powered explanation of the risk assessment and actionable improvement steps.
                  </p>
                  <Button onClick={requestAIExplanation} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Request AI Explanation
                  </Button>
                </div>
              )}

              {isLoadingAI && (
                <div className="text-center py-8">
                  <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
                  <p className="text-muted-foreground">Analyzing case with AI...</p>
                </div>
              )}

              {aiExplanation && (
                <Accordion type="single" collapsible defaultValue="explanation">
                  <AccordionItem value="explanation">
                    <AccordionTrigger>Plain-Language Explanation</AccordionTrigger>
                    <AccordionContent>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        {aiExplanation}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {improvementSteps && improvementSteps.length > 0 && (
                    <AccordionItem value="improvements">
                      <AccordionTrigger>Steps to Improve Acceptance</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {improvementSteps.map((step, index) => (
                            <li key={index} className="flex items-start gap-3">
                              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-medium text-primary">{index + 1}</span>
                              </div>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Final Disclaimer */}
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Reminder:</strong> This assessment is guidance only. Final decision rests with the bank.
              Recommendations are based on general criteria and individual bank policies may differ.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankReadinessResults;
