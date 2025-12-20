import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator, 
  FileCheck, 
  Send, 
  CheckCircle2, 
  AlertTriangle,
  BookOpen,
  ArrowRight,
  MessageSquare,
  X,
  FlaskConical,
  Sparkles,
  LayoutGrid,
  Workflow,
  FileText,
  History,
  User,
  Bot,
  Settings,
  Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { EnhancedTaxWorkflow, TaxFiling as TaxFilingType } from '@/components/TaxFiling/EnhancedTaxWorkflow';
import { TaxFilingAssistant } from '@/components/TaxFiling/TaxFilingAssistant';
import { VectorDBSettings } from '@/components/TaxFiling/VectorDBSettings';
import { TaxModeSelector, TaxMode, AIExecutionMode } from '@/components/TaxFiling/TaxModeSelector';
import { AIWorkflowExecutor } from '@/components/TaxFiling/AIWorkflowExecutor';
import { JobQueueManager } from '@/components/TaxFiling/JobQueueManager';
import { useTaxFiling } from '@/hooks/useTaxFiling';
import { toast } from 'sonner';

// Demo data for showcasing the workflow
const DEMO_FILING: TaxFilingType = {
  id: 'demo-filing-001',
  tax_year: 2024,
  period_start: '2024-01-01',
  period_end: '2024-12-31',
  company_name: 'Acme Trading LLC',
  status: 'in_progress',
  current_step: 'verify_bookkeeping',
  total_revenue: 2450000,
  total_expenses: 1875000,
  taxable_income: 575000,
  tax_liability: 18000,
  bookkeeping_complete: true,
};

const TaxFiling = () => {
  const navigate = useNavigate();
  const [showAssistant, setShowAssistant] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [taxMode, setTaxMode] = useState<TaxMode>('accountant');
  const [accountantTab, setAccountantTab] = useState<string>('workflow');
  const [aiExecutionMode, setAIExecutionMode] = useState<AIExecutionMode>('workflow-ui');
  const { 
    currentFiling, 
    bookkeepingStatus,
    isBookkeepingComplete, 
    loading, 
    checkBookkeepingStatus,
    createNewFiling 
  } = useTaxFiling();

  useEffect(() => {
    checkBookkeepingStatus();
  }, []);

  const handleStartFiling = async () => {
    if (!demoMode && !isBookkeepingComplete) {
      navigate('/ai-bookkeeper');
      return;
    }
    await createNewFiling();
  };

  const handleGoToBookkeeping = () => {
    navigate('/ai-bookkeeper');
  };

  // Demo bookkeeping status
  const demoBookkeepingStatus = {
    scenario: 'existing_with_bookkeeping' as const,
    hasReconciliations: true,
    hasInvoices: true,
    hasBills: true,
    hasPayments: true,
    reconciliationCount: 47,
    invoiceCount: 156,
    billCount: 89,
    isComplete: true,
    summary: 'Complete bookkeeping found: 156 invoices, 89 bills, 47 reconciliations',
  };

  // Use demo data when demo mode is enabled
  const effectiveFiling = demoMode ? DEMO_FILING : currentFiling;
  const effectiveBookkeepingStatus = demoMode ? demoBookkeepingStatus : bookkeepingStatus;

  const handleVectorDBSetup = (provider: string) => {
    toast.info(`To create embeddings table for ${provider}, please ask me: "Create embeddings table for tax filing"`);
  };

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            UAE Corporate Tax Filing
          </h1>
          <p className="text-sm text-muted-foreground">
            Automate your SME corporate tax filings with AI assistance
          </p>
        </div>
        
        {/* Demo Mode Toggle */}
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border">
          <FlaskConical className="h-4 w-4 text-primary" />
          <Label htmlFor="demo-mode" className="text-sm font-medium cursor-pointer">
            Demo
          </Label>
          <Switch
            id="demo-mode"
            checked={demoMode}
            onCheckedChange={setDemoMode}
          />
          {demoMode && (
            <Badge variant="secondary" className="text-xs">
              Sample Data
            </Badge>
          )}
        </div>
      </div>

      {/* Primary Mode Tabs - Level 1 */}
      <div className="border-b">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            onClick={() => setTaxMode('accountant')}
            className={cn(
              "relative rounded-none border-b-2 px-4 py-2 font-medium transition-colors",
              taxMode === 'accountant'
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <User className="h-4 w-4 mr-2" />
            Accountant - Manual
          </Button>
          <Button
            variant="ghost"
            onClick={() => setTaxMode('ai')}
            className={cn(
              "relative rounded-none border-b-2 px-4 py-2 font-medium transition-colors",
              taxMode === 'ai'
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Bot className="h-4 w-4 mr-2" />
            AI
          </Button>
        </div>
      </div>

      {/* Content Area */}
      {taxMode === 'ai' ? (
        <div className="space-y-4">
          {/* AI Mode Options */}
          <TaxModeSelector 
            mode={taxMode}
            aiExecutionMode={aiExecutionMode}
            onModeChange={setTaxMode}
            onAIExecutionModeChange={setAIExecutionMode}
          />
          
          {/* AI Workflow Executor */}
          <AIWorkflowExecutor 
            executionMode={aiExecutionMode}
            filingId={effectiveFiling?.id}
            bookkeepingData={{
              invoices: effectiveBookkeepingStatus.invoiceCount || 0,
              bills: effectiveBookkeepingStatus.billCount || 0,
              reconciliations: effectiveBookkeepingStatus.reconciliationCount || 0,
            }}
            onComplete={(results) => {
              toast.success('AI workflow completed!');
              console.log('Workflow results:', results);
            }}
          />
        </div>
      ) : (
        /* Accountant Mode - Level 2 Tabs */
        <Tabs value={accountantTab} onValueChange={setAccountantTab} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <TabsList className="h-auto p-1 bg-muted/50">
              <TabsTrigger value="workflow" className="flex items-center gap-2 data-[state=active]:bg-background">
                <Workflow className="h-4 w-4" />
                <span className="hidden sm:inline">Workflow</span>
              </TabsTrigger>
              <TabsTrigger value="classic" className="flex items-center gap-2 data-[state=active]:bg-background">
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Classic</span>
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex items-center gap-2 data-[state=active]:bg-background">
                <Briefcase className="h-4 w-4" />
                <span className="hidden sm:inline">Jobs</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-background">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
              </TabsTrigger>
              <TabsTrigger value="assistant" className="flex items-center gap-2 data-[state=active]:bg-background">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Assistant</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-background">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Context Badge */}
            <Badge variant="outline" className="text-xs self-start sm:self-auto">
              {accountantTab === 'workflow' && 'Step-by-step guided workflow'}
              {accountantTab === 'classic' && 'Traditional dashboard view'}
              {accountantTab === 'jobs' && 'Background jobs & queues'}
              {accountantTab === 'history' && 'Past tax filings'}
              {accountantTab === 'assistant' && 'AI-powered tax assistant'}
              {accountantTab === 'settings' && 'AI Assistant configuration'}
            </Badge>
          </div>

          {/* Workflow View */}
          <TabsContent value="workflow" className="mt-0">
            <div className={cn(
              "grid gap-6",
              showAssistant ? "lg:grid-cols-3" : "lg:grid-cols-1"
            )}>
              <div className={cn(showAssistant ? "lg:col-span-2" : "lg:col-span-1")}>
                <EnhancedTaxWorkflow 
                  bookkeepingStatus={effectiveBookkeepingStatus}
                  currentFiling={effectiveFiling}
                  onStartFiling={handleStartFiling}
                  onGoToBookkeeping={handleGoToBookkeeping}
                  demoMode={demoMode}
                />
              </div>

              {showAssistant && (
                <div className="lg:col-span-1">
                  <Card className="h-[600px] flex flex-col sticky top-4">
                    <div className="flex-shrink-0 flex items-center justify-between py-3 px-4 border-b">
                      <h3 className="text-base font-semibold flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        Tax GPT Assistant
                      </h3>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setShowAssistant(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardContent className="flex-1 overflow-hidden p-0">
                      <TaxFilingAssistant filingId={effectiveFiling?.id} />
                    </CardContent>
                  </Card>
                </div>
              )}

              {!showAssistant && (
                <Button
                  onClick={() => setShowAssistant(true)}
                  className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
                  size="icon"
                >
                  <MessageSquare className="h-6 w-6" />
                </Button>
              )}
            </div>
          </TabsContent>

          {/* Classic View */}
          <TabsContent value="classic" className="mt-0 space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tax Rate</p>
                    <p className="text-xl font-bold">9%</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Threshold</p>
                    <p className="text-xl font-bold">AED 375K</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                    <FileCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant={effectiveBookkeepingStatus.isComplete ? "default" : "secondary"} className="text-xs">
                      {effectiveBookkeepingStatus.isComplete ? "Ready" : "Pending"}
                    </Badge>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                    <Send className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Filing Year</p>
                    <p className="text-xl font-bold">{new Date().getFullYear()}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Bookkeeping Alert */}
            {!loading && !effectiveBookkeepingStatus.isComplete && (
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="text-amber-700 dark:text-amber-300 text-sm">
                    {effectiveBookkeepingStatus.summary}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleGoToBookkeeping}
                    className="border-amber-500 text-amber-700 hover:bg-amber-500/20 w-fit"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Go to Bookkeeping
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Tax Workflow */}
            <EnhancedTaxWorkflow 
              bookkeepingStatus={effectiveBookkeepingStatus}
              currentFiling={effectiveFiling}
              onStartFiling={handleStartFiling}
              onGoToBookkeeping={handleGoToBookkeeping}
              demoMode={demoMode}
            />
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="mt-0">
            <JobQueueManager />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-0">
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Past Filings</h3>
                <p className="text-muted-foreground">
                  Your completed tax filings will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assistant Tab */}
          <TabsContent value="assistant" className="mt-0">
            <Card className="h-[600px] flex flex-col">
              <CardContent className="flex-1 overflow-hidden p-0">
                <TaxFilingAssistant filingId={effectiveFiling?.id} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-0">
            <VectorDBSettings onSetupComplete={handleVectorDBSetup} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default TaxFiling;
