import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator, 
  FileCheck, 
  Upload, 
  Send, 
  CheckCircle2, 
  AlertTriangle,
  BookOpen,
  ArrowRight,
  MessageSquare,
  X,
  FlaskConical,
  Settings,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { TaxFilingWorkflow, TaxFiling as TaxFilingType } from '@/components/TaxFiling/TaxFilingWorkflow';
import { TaxFilingAssistant } from '@/components/TaxFiling/TaxFilingAssistant';
import { VectorDBSettings } from '@/components/TaxFiling/VectorDBSettings';
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
  const [activeTab, setActiveTab] = useState('workflow');
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
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            UAE Corporate Tax Filing
          </h1>
          <p className="text-muted-foreground">
            Automate your SME corporate tax filings with AI assistance
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Demo Mode Toggle */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-muted/50">
            <FlaskConical className={cn("h-4 w-4", demoMode && "text-primary")} />
            <Label htmlFor="demo-mode" className="text-sm font-medium cursor-pointer">
              Demo Mode
            </Label>
            <Switch
              id="demo-mode"
              checked={demoMode}
              onCheckedChange={setDemoMode}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAssistant(!showAssistant)}
            className={cn(showAssistant && "bg-primary/10")}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Tax GPT Assistant
          </Button>
        </div>
      </div>

      {/* Demo Mode Banner */}
      {demoMode && (
        <Alert className="border-primary/50 bg-primary/10">
          <FlaskConical className="h-4 w-4 text-primary" />
          <AlertDescription className="text-primary">
            <strong>Demo Mode Active:</strong> Showing sample data for Acme Trading LLC (AED 2.45M revenue, AED 575K taxable income)
          </AlertDescription>
        </Alert>
      )}

      {/* Bookkeeping Check Alert */}
      {!loading && !effectiveBookkeepingStatus.isComplete && (
        <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-amber-700 dark:text-amber-300">
              {effectiveBookkeepingStatus.summary}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleGoToBookkeeping}
              className="ml-4 border-amber-500 text-amber-700 hover:bg-amber-500/20"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Go to Bookkeeping
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Calculator className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tax Rate</p>
                <p className="text-xl font-bold">9%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Threshold</p>
                <p className="text-xl font-bold">AED 375K</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <FileCheck className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={effectiveBookkeepingStatus.isComplete ? "default" : "secondary"}>
                {effectiveBookkeepingStatus.isComplete ? "Ready" : "Pending"}
              </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Send className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Filing Year</p>
                <p className="text-xl font-bold">{new Date().getFullYear()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Workflow and AI Settings */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="workflow" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Tax Workflow
          </TabsTrigger>
          <TabsTrigger value="ai-settings" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflow" className="mt-4">
          {/* Main Content Area */}
          <div className={cn(
            "grid gap-6",
            showAssistant ? "lg:grid-cols-3" : "lg:grid-cols-1"
          )}>
            {/* Workflow Section */}
            <div className={cn(showAssistant ? "lg:col-span-2" : "lg:col-span-1")}>
              <TaxFilingWorkflow 
                bookkeepingStatus={effectiveBookkeepingStatus}
                currentFiling={effectiveFiling}
                onStartFiling={handleStartFiling}
                onGoToBookkeeping={handleGoToBookkeeping}
              />
            </div>

            {/* AI Assistant Panel */}
            {showAssistant && (
              <div className="lg:col-span-1">
                <Card className="h-[600px] flex flex-col">
                  <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      Tax GPT Assistant
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowAssistant(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden p-0">
                    <TaxFilingAssistant filingId={effectiveFiling?.id} />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="ai-settings" className="mt-4">
          <VectorDBSettings onSetupComplete={handleVectorDBSetup} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaxFiling;
