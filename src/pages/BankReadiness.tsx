import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Plus, Clock, CheckCircle, AlertTriangle, FileText, Eye, History, Save } from 'lucide-react';
import BankReadinessCaseForm from '@/components/BankReadiness/BankReadinessCaseForm';
import BankReadinessResults from '@/components/BankReadiness/BankReadinessResults';
import CasesHistoryTab from '@/components/BankReadiness/CasesHistoryTab';
import { BankReadinessCaseInput, RiskAssessmentResult } from '@/types/bankReadiness';
import { useBankReadinessRuleEngine } from '@/hooks/useBankReadinessRuleEngine';
import { useBankReadinessRules } from '@/hooks/useBankReadinessRules';
import { useBankReadinessCases } from '@/hooks/useBankReadinessCases';
import { toast } from 'sonner';

type ViewMode = 'list' | 'form' | 'results';

// Demo data for showcasing the tool
const DEMO_CASE: BankReadinessCaseInput = {
  applicant_nationality: 'UAE',
  uae_residency: true,
  company_jurisdiction: 'mainland',
  license_activity: 'General Trading - Import/Export of Electronics',
  business_model: 'trading',
  expected_monthly_inflow: 'AED 500,000 - 1,000,000',
  source_of_funds: 'Business Revenue',
  source_of_funds_notes: 'Revenue from electronics import/export',
  incoming_payment_countries: ['China', 'Germany', 'USA'],
  previous_rejection: false,
};

const DEMO_RESULT: RiskAssessmentResult = {
  score: 35,
  category: 'low',
  flags: ['Standard trading activity', 'Clean banking history'],
  recommendedBanks: [
    { bank_name: 'Emirates NBD', fit_score: 92, reason_tags: ['Preferred for trading', 'Fast processing', 'Good for mainland'] },
    { bank_name: 'Mashreq Bank', fit_score: 88, reason_tags: ['SME friendly', 'Digital banking', 'Trade finance options'] },
    { bank_name: 'ADCB', fit_score: 85, reason_tags: ['Corporate accounts', 'Multi-currency', 'Good rates'] },
  ],
  banksToAvoid: [
    { bank_name: 'Standard Chartered', reason_tags: ['Strict onboarding for trading', 'Long processing time'] },
  ],
};

const DEMO_REQUIRED_DOCS = [
  'Trade License (original + copy)',
  'MOA / AOA (Memorandum & Articles of Association)',
  'Passport copies of all shareholders',
  'Emirates ID copies (if resident)',
  'Proof of address (utility bill < 3 months)',
  'Bank reference letter (if available)',
];

const DEMO_HELPFUL_DOCS = [
  'Previous audited financials',
  'Existing supplier contracts',
  'Business plan summary',
  'Trade history documentation',
];

const DEMO_INTERVIEW_GUIDANCE = [
  'Be prepared to explain your import/export flow clearly',
  'Have details ready about your main suppliers in China',
  'Explain your customer base and payment collection methods',
  'Discuss your expected transaction volumes and frequency',
  'Mention any existing banking relationships',
];

const BankReadiness = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentCase, setCurrentCase] = useState<BankReadinessCaseInput | null>(null);
  const [assessmentResult, setAssessmentResult] = useState<RiskAssessmentResult | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('assessment');
  
  // Use the new DB-driven rule engine
  const ruleEngine = useBankReadinessRuleEngine();
  // Keep the old hook for document/interview guidance (these are still hard-coded)
  const { getRequiredDocuments, getHelpfulDocuments, getInterviewGuidance } = useBankReadinessRules();
  // Cases hook for saving and tracking outcomes
  const { saveCase, getAccuracyStats } = useBankReadinessCases();

  const handleCreateNew = () => {
    setCurrentCase(null);
    setAssessmentResult(null);
    setShowDemo(false);
    setCurrentCaseId(null);
    setViewMode('form');
  };

  const handleFormSubmit = (data: BankReadinessCaseInput) => {
    setCurrentCase(data);
    // Use the new rule engine for assessment
    const result = ruleEngine.assessRisk(data);
    setAssessmentResult(result);
    setViewMode('results');
  };

  const handleSaveCase = async () => {
    if (!currentCase || !assessmentResult || showDemo) return;
    
    const caseId = await saveCase(currentCase, assessmentResult);
    if (caseId) {
      setCurrentCaseId(caseId);
      toast.success('Case saved! You can track the outcome later in the History tab.');
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setCurrentCase(null);
    setAssessmentResult(null);
    setShowDemo(false);
    setCurrentCaseId(null);
  };

  const handleBackToForm = () => {
    setViewMode('form');
  };

  const handleToggleDemo = (checked: boolean) => {
    setShowDemo(checked);
    if (checked) {
      setCurrentCase(DEMO_CASE);
      setAssessmentResult(DEMO_RESULT);
      setViewMode('results');
    } else {
      setCurrentCase(null);
      setAssessmentResult(null);
      setViewMode('list');
    }
  };

  const stats = getAccuracyStats();

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
            {stats.casesWithOutcome > 0 && (
              <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded">
                {stats.accuracyRate}% accuracy ({stats.casesWithOutcome} outcomes tracked)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Demo Toggle */}
          {activeTab === 'assessment' && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="demo-mode" className="text-sm cursor-pointer">Demo Mode</Label>
              <Switch
                id="demo-mode"
                checked={showDemo}
                onCheckedChange={handleToggleDemo}
              />
            </div>
          )}
          {activeTab === 'assessment' && viewMode === 'list' && !showDemo && (
            <Button onClick={handleCreateNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Create New Case
            </Button>
          )}
          {activeTab === 'assessment' && viewMode === 'results' && !showDemo && !currentCaseId && (
            <Button onClick={handleSaveCase} variant="outline" className="gap-2">
              <Save className="h-4 w-4" />
              Save for Tracking
            </Button>
          )}
          {currentCaseId && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              ✓ Saved
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="assessment" className="gap-2">
            <Building2 className="h-4 w-4" />
            Assessment
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History & Outcomes
            {stats.totalCases > 0 && (
              <span className="ml-1 text-xs bg-muted px-1.5 rounded">{stats.totalCases}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assessment" className="mt-6">
          {renderAssessmentContent()}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <CasesHistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );

  function renderAssessmentContent() {
    return (
      <>
        {/* Demo Banner */}
        {showDemo && (
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Eye className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Demo Mode Active:</strong> You're viewing example results for a UAE national trading company.
                  This shows how the tool assesses risk, recommends banks, and provides actionable guidance.
                  <span className="block mt-1 text-blue-600 dark:text-blue-400">Toggle off to start a real assessment.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Disclaimer */}
        {!showDemo && (
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
        )}

        {/* Loading State */}
        {ruleEngine.loading && viewMode === 'list' && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Loading rules engine...
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {viewMode === 'list' && !showDemo && !ruleEngine.loading && (
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
                <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{ruleEngine.rules.length}</p>
                <p className="text-xs text-muted-foreground">
                  Database-driven rule engine
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bank Profiles</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{ruleEngine.bankProfiles.length}</p>
                <p className="text-xs text-muted-foreground">
                  Configured for matching
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {viewMode === 'list' && !showDemo && !ruleEngine.loading && (
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

              <div className="mt-8 flex justify-center gap-4">
                <Button variant="outline" onClick={() => handleToggleDemo(true)} className="gap-2">
                  <Eye className="h-5 w-5" />
                  View Demo Results
                </Button>
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
            requiredDocuments={showDemo ? DEMO_REQUIRED_DOCS : getRequiredDocuments(currentCase, assessmentResult.category)}
            helpfulDocuments={showDemo ? DEMO_HELPFUL_DOCS : getHelpfulDocuments(currentCase, assessmentResult.category)}
            interviewGuidance={showDemo ? DEMO_INTERVIEW_GUIDANCE : getInterviewGuidance(currentCase, assessmentResult.category)}
            onBack={showDemo ? handleBackToList : handleBackToForm}
            onStartNew={handleCreateNew}
          />
        )}
      </>
    );
  }
};

export default BankReadiness;
