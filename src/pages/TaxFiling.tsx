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
  History
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { EnhancedTaxWorkflow, TaxFiling as TaxFilingType } from '@/components/TaxFiling/EnhancedTaxWorkflow';
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
  const [viewMode, setViewMode] = useState<'workflow' | 'classic'>('workflow');
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calculator className="h-7 w-7 text-primary" />
            UAE Corporate Tax Filing
          </h1>
          <p className="text-muted-foreground">
            Automate your SME corporate tax filings with AI assistance
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={viewMode === 'workflow' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('workflow')}
              className="gap-2"
            >
              <Workflow className="h-4 w-4" />
              <span className="hidden sm:inline">Workflow</span>
            </Button>
            <Button
              variant={viewMode === 'classic' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('classic')}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Classic</span>
            </Button>
          </div>

          {/* Demo Mode Toggle */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
            <FlaskConical className="h-4 w-4 text-primary" />
            <Label htmlFor="demo-mode" className="text-sm font-medium cursor-pointer">
              Demo Mode
            </Label>
            <Switch
              id="demo-mode"
              checked={demoMode}
              onCheckedChange={setDemoMode}
            />
            {demoMode && (
              <Badge variant="secondary" className="ml-1">
                Sample Data
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Workflow View */}
      {viewMode === 'workflow' ? (
        <div className={cn(
          "grid gap-6",
          showAssistant ? "lg:grid-cols-3" : "lg:grid-cols-1"
        )}>
          {/* Main Workflow */}
          <div className={cn(showAssistant ? "lg:col-span-2" : "lg:col-span-1")}>
            <EnhancedTaxWorkflow 
              bookkeepingStatus={effectiveBookkeepingStatus}
              currentFiling={effectiveFiling}
              onStartFiling={handleStartFiling}
              onGoToBookkeeping={handleGoToBookkeeping}
              demoMode={demoMode}
            />
          </div>

          {/* AI Assistant Panel */}
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

          {/* Floating AI Button */}
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
      ) : (
        <>
          {/* Classic View - Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Calculator className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tax Rate</p>
                    <p className="text-2xl font-bold">9%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Threshold</p>
                    <p className="text-2xl font-bold">AED 375K</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-lg">
                    <FileCheck className="h-6 w-6 text-amber-600 dark:text-amber-400" />
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
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Send className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Filing Year</p>
                    <p className="text-2xl font-bold">{new Date().getFullYear()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bookkeeping Alert */}
          {!loading && !effectiveBookkeepingStatus.isComplete && (
            <Alert className="border-amber-500/50 bg-amber-500/10">
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

          {/* Classic Tabs */}
          <Tabs defaultValue="workflow" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="workflow" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                <span className="hidden sm:inline">Tax Workflow</span>
                <span className="sm:hidden">Tax</span>
              </TabsTrigger>
              <TabsTrigger value="filings" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Past Filings</span>
                <span className="sm:hidden">History</span>
              </TabsTrigger>
              <TabsTrigger value="assistant" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">AI Assistant</span>
                <span className="sm:hidden">AI</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">AI Settings</span>
                <span className="sm:hidden">Settings</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="workflow">
              <EnhancedTaxWorkflow 
                bookkeepingStatus={effectiveBookkeepingStatus}
                currentFiling={effectiveFiling}
                onStartFiling={handleStartFiling}
                onGoToBookkeeping={handleGoToBookkeeping}
                demoMode={demoMode}
              />
            </TabsContent>
            
            <TabsContent value="filings">
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
            
            <TabsContent value="assistant">
              <Card className="h-[600px] flex flex-col">
                <CardContent className="flex-1 overflow-hidden p-0">
                  <TaxFilingAssistant filingId={effectiveFiling?.id} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings">
              <VectorDBSettings onSetupComplete={handleVectorDBSetup} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default TaxFiling;
