import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Clock, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import BankReadinessCaseForm from '@/components/BankReadiness/BankReadinessCaseForm';
import BankReadinessResults from '@/components/BankReadiness/BankReadinessResults';
import { BankReadinessCaseInput, RiskAssessmentResult } from '@/types/bankReadiness';
import { useBankReadinessRules } from '@/hooks/useBankReadinessRules';

type ViewMode = 'list' | 'form' | 'results';

const BankReadiness = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentCase, setCurrentCase] = useState<BankReadinessCaseInput | null>(null);
  const [assessmentResult, setAssessmentResult] = useState<RiskAssessmentResult | null>(null);
  const { assessRisk, getRequiredDocuments, getHelpfulDocuments, getInterviewGuidance } = useBankReadinessRules();

  const handleCreateNew = () => {
    setCurrentCase(null);
    setAssessmentResult(null);
    setViewMode('form');
  };

  const handleFormSubmit = (data: BankReadinessCaseInput) => {
    setCurrentCase(data);
    const result = assessRisk(data);
    setAssessmentResult(result);
    setViewMode('results');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setCurrentCase(null);
    setAssessmentResult(null);
  };

  const handleBackToForm = () => {
    setViewMode('form');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            Bank Readiness Tool
          </h1>
          <p className="text-muted-foreground mt-1">
            Assess UAE business bank account readiness and get routing recommendations
          </p>
        </div>
        {viewMode === 'list' && (
          <Button onClick={handleCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Case
          </Button>
        )}
      </div>

      {/* Disclaimer */}
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Disclaimer:</strong> This tool provides guidance only. Final decision rests with the bank.
              Recommendations are based on general criteria and may not reflect individual bank policies.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {viewMode === 'list' && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Stats Cards */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tool Purpose</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Decision-support tool for agents to assess bank account readiness
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assessment Method</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Rule-first, AI-second architecture for explainable recommendations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Output</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Risk score, bank routing, documents, and interview guidance
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {viewMode === 'list' && (
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>Follow these steps to assess bank account readiness</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <span className="text-primary font-bold">1</span>
                </div>
                <h4 className="font-medium mb-1">Input Details</h4>
                <p className="text-sm text-muted-foreground">
                  Enter applicant and business information
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <span className="text-primary font-bold">2</span>
                </div>
                <h4 className="font-medium mb-1">Risk Assessment</h4>
                <p className="text-sm text-muted-foreground">
                  Rule-based scoring and risk categorization
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <span className="text-primary font-bold">3</span>
                </div>
                <h4 className="font-medium mb-1">Bank Routing</h4>
                <p className="text-sm text-muted-foreground">
                  Get recommended and avoid-list banks
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <span className="text-primary font-bold">4</span>
                </div>
                <h4 className="font-medium mb-1">Action Summary</h4>
                <p className="text-sm text-muted-foreground">
                  Documents needed and interview prep
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <Button size="lg" onClick={handleCreateNew} className="gap-2">
                <Plus className="h-5 w-5" />
                Start New Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'form' && (
        <BankReadinessCaseForm
          initialData={currentCase}
          onSubmit={handleFormSubmit}
          onCancel={handleBackToList}
        />
      )}

      {viewMode === 'results' && currentCase && assessmentResult && (
        <BankReadinessResults
          input={currentCase}
          result={assessmentResult}
          requiredDocuments={getRequiredDocuments(currentCase, assessmentResult.category)}
          helpfulDocuments={getHelpfulDocuments(currentCase, assessmentResult.category)}
          interviewGuidance={getInterviewGuidance(currentCase, assessmentResult.category)}
          onBack={handleBackToForm}
          onStartNew={handleCreateNew}
        />
      )}
    </div>
  );
};

export default BankReadiness;
