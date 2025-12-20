import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { TaxFilingWorkflow } from '@/components/TaxFiling/TaxFilingWorkflow';
import { TaxFilingAssistant } from '@/components/TaxFiling/TaxFilingAssistant';
import { useTaxFiling } from '@/hooks/useTaxFiling';

const TaxFiling = () => {
  const navigate = useNavigate();
  const [showAssistant, setShowAssistant] = useState(false);
  const { 
    currentFiling, 
    isBookkeepingComplete, 
    loading, 
    checkBookkeepingStatus,
    createNewFiling 
  } = useTaxFiling();

  useEffect(() => {
    checkBookkeepingStatus();
  }, []);

  const handleStartFiling = async () => {
    if (!isBookkeepingComplete) {
      // Redirect to bookkeeping module
      navigate('/ai-bookkeeper');
      return;
    }
    await createNewFiling();
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
        <div className="flex items-center gap-2">
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

      {/* Bookkeeping Check Alert */}
      {!loading && !isBookkeepingComplete && (
        <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-amber-700 dark:text-amber-300">
              Bookkeeping must be complete before filing taxes. Please complete your bookkeeping first.
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/ai-bookkeeper')}
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
                <Badge variant={isBookkeepingComplete ? "default" : "secondary"}>
                  {isBookkeepingComplete ? "Ready" : "Pending"}
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

      {/* Main Content Area */}
      <div className={cn(
        "grid gap-6",
        showAssistant ? "lg:grid-cols-3" : "lg:grid-cols-1"
      )}>
        {/* Workflow Section */}
        <div className={cn(showAssistant ? "lg:col-span-2" : "lg:col-span-1")}>
          <TaxFilingWorkflow 
            isBookkeepingComplete={isBookkeepingComplete}
            currentFiling={currentFiling}
            onStartFiling={handleStartFiling}
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
                <TaxFilingAssistant filingId={currentFiling?.id} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxFiling;
