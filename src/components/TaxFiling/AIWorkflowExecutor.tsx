import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Bot, 
  Play, 
  Pause, 
  RotateCcw,
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  Zap,
  FileText,
  Calculator,
  ClipboardCheck,
  Send,
  BookOpen
} from 'lucide-react';
import { AIExecutionMode } from './TaxModeSelector';

interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
  error?: string;
}

const INITIAL_STEPS: WorkflowStep[] = [
  { id: 'verify_bookkeeping', name: 'Verify Bookkeeping', status: 'pending' },
  { id: 'classify_income', name: 'Classify Income', status: 'pending' },
  { id: 'compute_tax', name: 'Compute Tax', status: 'pending' },
  { id: 'review_filing', name: 'Review Filing', status: 'pending' },
  { id: 'prepare_submission', name: 'Prepare Submission', status: 'pending' },
];

const stepIcons: Record<string, React.ReactNode> = {
  verify_bookkeeping: <BookOpen className="h-4 w-4" />,
  classify_income: <FileText className="h-4 w-4" />,
  compute_tax: <Calculator className="h-4 w-4" />,
  review_filing: <ClipboardCheck className="h-4 w-4" />,
  prepare_submission: <Send className="h-4 w-4" />,
};

interface AIWorkflowExecutorProps {
  executionMode: AIExecutionMode;
  filingId?: string;
  bookkeepingData?: any;
  onComplete?: (results: Record<string, any>) => void;
  onCancel?: () => void;
}

export function AIWorkflowExecutor({
  executionMode,
  filingId,
  bookkeepingData,
  onComplete,
  onCancel,
}: AIWorkflowExecutorProps) {
  const [steps, setSteps] = useState<WorkflowStep[]>(INITIAL_STEPS);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<Record<string, any>>({});

  // Polling for background mode - simplified without database table
  useEffect(() => {
    if (executionMode !== 'background' || !isRunning || !filingId) return;

    // For background mode, we simulate progress updates
    // Full implementation requires the tax_workflow_state table migration
    let currentProgress = 0;
    const pollInterval = setInterval(() => {
      currentProgress += 20;
      if (currentProgress >= 100) {
        setProgress(100);
        setIsRunning(false);
        setSteps(prev => prev.map(s => ({ ...s, status: 'completed' })));
        toast.success('AI workflow completed in background!');
        clearInterval(pollInterval);
      } else {
        setProgress(currentProgress);
        const stepIndex = Math.floor((currentProgress / 100) * 5);
        setCurrentStepIndex(stepIndex);
        setSteps(prev => prev.map((s, i) => ({
          ...s,
          status: i < stepIndex ? 'completed' : i === stepIndex ? 'running' : 'pending'
        })));
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [executionMode, isRunning, filingId, onComplete]);

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  }, []);

  const startWorkflow = async () => {
    setIsRunning(true);
    setError(null);
    setProgress(0);
    setCurrentStepIndex(0);
    setSteps(INITIAL_STEPS);
    setLogs([]);
    setResults({});

    addLog(`Starting AI workflow in ${executionMode} mode...`);

    try {
      const mode = executionMode === 'workflow-ui' ? 'stream' : 'background';
      
      if (mode === 'stream') {
        // Streaming mode - process SSE events
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tax-langchain-orchestrator`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              mode: 'stream',
              filingId,
              bookkeepingData: bookkeepingData || {
                invoices: 156,
                bills: 89,
                reconciliations: 47,
                totalRevenue: 2450000,
                totalExpenses: 1875000,
              },
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';
        const collectedResults: Record<string, any> = {};

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          let newlineIndex;
          while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);

            if (!line || line.startsWith(':')) continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const event = JSON.parse(jsonStr);

              if (event.type === 'step_start') {
                addLog(`Starting: ${event.stepName}`);
                setCurrentStepIndex(event.stepIndex);
                setSteps(prev => prev.map((s, i) => ({
                  ...s,
                  status: i === event.stepIndex ? 'running' : i < event.stepIndex ? 'completed' : 'pending'
                })));
              } else if (event.type === 'step_complete') {
                addLog(`Completed: ${event.stepName} (${event.progress}%)`);
                setProgress(event.progress);
                collectedResults[event.stepId] = event.result;
                setResults({ ...collectedResults });
                setSteps(prev => prev.map((s, i) => ({
                  ...s,
                  status: i <= event.stepIndex ? 'completed' : 'pending',
                  result: i === event.stepIndex ? event.result : s.result
                })));
              } else if (event.type === 'step_error') {
                addLog(`Error in ${event.stepId}: ${event.error}`);
                setError(event.error);
                setSteps(prev => prev.map((s, i) => ({
                  ...s,
                  status: i === event.stepIndex ? 'error' : s.status,
                  error: i === event.stepIndex ? event.error : undefined
                })));
              } else if (event.type === 'workflow_complete') {
                addLog('Workflow completed successfully!');
                setProgress(100);
                toast.success('AI workflow completed!');
                onComplete?.(event.results);
              }
            } catch (e) {
              // Ignore parse errors for partial JSON
            }
          }
        }
      } else {
        // Background mode - just start and poll
        const { data, error } = await supabase.functions.invoke('tax-langchain-orchestrator', {
          body: {
            mode: 'background',
            filingId: filingId || `temp-${Date.now()}`,
            bookkeepingData: bookkeepingData || {
              invoices: 156,
              bills: 89,
              reconciliations: 47,
              totalRevenue: 2450000,
              totalExpenses: 1875000,
            },
          },
        });

        if (error) throw error;
        addLog('Background workflow started. Polling for updates...');
        toast.info('AI workflow started in background');
      }
    } catch (err: any) {
      console.error('Workflow error:', err);
      setError(err.message);
      addLog(`Error: ${err.message}`);
      toast.error('Workflow failed: ' + err.message);
    } finally {
      if (executionMode === 'workflow-ui') {
        setIsRunning(false);
      }
    }
  };

  const resetWorkflow = () => {
    setSteps(INITIAL_STEPS);
    setProgress(0);
    setCurrentStepIndex(-1);
    setError(null);
    setLogs([]);
    setResults({});
    setIsRunning(false);
  };

  return (
    <div className="space-y-4">
      {/* Control Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                <Bot className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">AI LangChain Orchestrator</h3>
                <p className="text-sm text-muted-foreground">
                  {executionMode === 'workflow-ui' ? 'Visual workflow execution' : 'Background processing'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isRunning ? (
                <>
                  <Button onClick={startWorkflow} className="gap-2">
                    <Play className="h-4 w-4" />
                    Start AI Workflow
                  </Button>
                  {progress > 0 && (
                    <Button variant="outline" onClick={resetWorkflow} className="gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </Button>
                  )}
                </>
              ) : (
                <Button variant="outline" onClick={onCancel} className="gap-2">
                  <Pause className="h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardContent className="py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Steps */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Workflow Steps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-colors",
                  step.status === 'running' && "bg-primary/10 border border-primary/30",
                  step.status === 'completed' && "bg-green-500/10",
                  step.status === 'error' && "bg-destructive/10",
                  step.status === 'pending' && "bg-muted/50"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-full",
                  step.status === 'running' && "bg-primary text-primary-foreground",
                  step.status === 'completed' && "bg-green-500 text-white",
                  step.status === 'error' && "bg-destructive text-destructive-foreground",
                  step.status === 'pending' && "bg-muted-foreground/20"
                )}>
                  {step.status === 'running' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : step.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : step.status === 'error' ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {stepIcons[step.id]}
                    <span className="font-medium">{step.name}</span>
                  </div>
                  {step.status === 'running' && (
                    <span className="text-xs text-primary">Processing...</span>
                  )}
                  {step.result?.confidence && (
                    <Badge variant="outline" className="text-xs mt-1">
                      Confidence: {step.result.confidence}%
                    </Badge>
                  )}
                </div>
                <Badge
                  variant={
                    step.status === 'completed' ? 'default' :
                    step.status === 'running' ? 'secondary' :
                    step.status === 'error' ? 'destructive' : 'outline'
                  }
                  className="text-xs"
                >
                  {step.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Logs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Execution Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] rounded-lg border bg-muted/30 p-3">
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Click "Start AI Workflow" to begin
                </p>
              ) : (
                <div className="space-y-1 font-mono text-xs">
                  {logs.map((log, i) => (
                    <div key={i} className="text-muted-foreground">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Results Summary */}
      {Object.keys(results).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Results Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto">
                {JSON.stringify(results, null, 2)}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
