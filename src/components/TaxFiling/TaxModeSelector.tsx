import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  User, 
  Bot, 
  Workflow, 
  Zap,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export type TaxMode = 'accountant' | 'ai';
export type AIExecutionMode = 'workflow-ui' | 'background';

interface TaxModeSelectorProps {
  mode: TaxMode;
  aiExecutionMode: AIExecutionMode;
  onModeChange: (mode: TaxMode) => void;
  onAIExecutionModeChange: (mode: AIExecutionMode) => void;
}

export function TaxModeSelector({ 
  mode, 
  aiExecutionMode,
  onModeChange, 
  onAIExecutionModeChange 
}: TaxModeSelectorProps) {
  return (
    <div className="space-y-4">
      {/* Main Mode Selection */}
      <div className="grid grid-cols-2 gap-4">
        {/* Accountant Mode */}
        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-md relative overflow-hidden",
            mode === 'accountant' 
              ? "border-primary ring-2 ring-primary/20" 
              : "border-border hover:border-primary/50"
          )}
          onClick={() => onModeChange('accountant')}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                mode === 'accountant' 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted"
              )}>
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Accountant Mode</h3>
                  {mode === 'accountant' && (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Manual step-by-step workflow with full control
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <Badge variant="outline" className="text-xs">Step-by-step</Badge>
                  <Badge variant="outline" className="text-xs">Full control</Badge>
                  <Badge variant="outline" className="text-xs">Manual review</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Mode */}
        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-md relative overflow-hidden",
            mode === 'ai' 
              ? "border-primary ring-2 ring-primary/20" 
              : "border-border hover:border-primary/50"
          )}
          onClick={() => onModeChange('ai')}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                mode === 'ai' 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted"
              )}>
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">AI Mode</h3>
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                    LangChain
                  </Badge>
                  {mode === 'ai' && (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  AI orchestrates full workflow automatically
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <Badge variant="outline" className="text-xs">Automated</Badge>
                  <Badge variant="outline" className="text-xs">AI-powered</Badge>
                  <Badge variant="outline" className="text-xs">Fast</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Execution Mode Selection (only shown when AI mode is selected) */}
      {mode === 'ai' && (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI Execution Mode</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Workflow UI Mode */}
              <Button
                variant={aiExecutionMode === 'workflow-ui' ? 'default' : 'outline'}
                className={cn(
                  "h-auto py-3 px-4 justify-start",
                  aiExecutionMode === 'workflow-ui' && "bg-primary"
                )}
                onClick={() => onAIExecutionModeChange('workflow-ui')}
              >
                <div className="flex items-center gap-3">
                  <Workflow className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Workflow UI</div>
                    <div className="text-xs opacity-80">Watch AI progress step-by-step</div>
                  </div>
                </div>
              </Button>

              {/* Background Mode */}
              <Button
                variant={aiExecutionMode === 'background' ? 'default' : 'outline'}
                className={cn(
                  "h-auto py-3 px-4 justify-start",
                  aiExecutionMode === 'background' && "bg-primary"
                )}
                onClick={() => onAIExecutionModeChange('background')}
              >
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Background</div>
                    <div className="text-xs opacity-80">Run in background, notify when done</div>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
