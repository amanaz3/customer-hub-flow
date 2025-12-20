import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  User,
  Bot,
  Send,
  FileText,
  DollarSign,
  Calendar,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaxFilingJob, TaxFilingTask, QueueConfig } from '@/hooks/useTaxFilingJobs';
import { format } from 'date-fns';

interface JobDetailProps {
  job: TaxFilingJob;
  tasks: TaxFilingTask[];
  queues: QueueConfig[];
  onClose: () => void;
  onUpdateJob: (updates: Partial<TaxFilingJob>) => void;
  onUpdateTask: (taskId: string, updates: Partial<TaxFilingTask>) => void;
  onAssignQueue: (queueName: string) => void;
}

const taskStatusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  pending: { color: 'bg-muted text-muted-foreground', icon: <Clock className="h-3 w-3" /> },
  queued: { color: 'bg-blue-500/10 text-blue-600', icon: <Clock className="h-3 w-3" /> },
  running: { color: 'bg-primary text-primary-foreground', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  completed: { color: 'bg-green-500 text-white', icon: <CheckCircle2 className="h-3 w-3" /> },
  failed: { color: 'bg-red-500 text-white', icon: <AlertTriangle className="h-3 w-3" /> },
  skipped: { color: 'bg-muted text-muted-foreground', icon: <X className="h-3 w-3" /> },
  blocked: { color: 'bg-amber-500/10 text-amber-600', icon: <AlertTriangle className="h-3 w-3" /> },
};

export function JobDetail({ 
  job, 
  tasks, 
  queues, 
  onClose, 
  onUpdateJob, 
  onUpdateTask,
  onAssignQueue 
}: JobDetailProps) {
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  const canStart = job.status === 'pending' || job.status === 'queued';
  const canPause = job.status === 'processing';
  const canReset = job.status === 'failed' || job.status === 'cancelled';

  const handleStart = () => {
    onUpdateJob({ status: 'processing', started_at: new Date().toISOString() });
  };

  const handlePause = () => {
    onUpdateJob({ status: 'queued' });
  };

  const handleReset = () => {
    onUpdateJob({ 
      status: 'pending', 
      started_at: null, 
      completed_at: null,
      last_error: null,
      retry_count: job.retry_count + 1
    });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {job.reference_number}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 mt-2">
          {canStart && (
            <Button size="sm" onClick={handleStart} className="gap-2">
              <Play className="h-4 w-4" />
              Start
            </Button>
          )}
          {canPause && (
            <Button size="sm" variant="outline" onClick={handlePause} className="gap-2">
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          )}
          {canReset && (
            <Button size="sm" variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Retry
            </Button>
          )}
          <div className="flex-1" />
          <Select value={job.current_queue} onValueChange={onAssignQueue}>
            <SelectTrigger className="w-[160px] h-8">
              <SelectValue placeholder="Assign Queue" />
            </SelectTrigger>
            <SelectContent>
              {queues.map(q => (
                <SelectItem key={q.queue_name} value={q.queue_name}>
                  {q.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Progress */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <ScrollArea className="flex-1">
        <CardContent className="space-y-4">
          {/* Job Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Calendar className="h-3 w-3" />
                Tax Year
              </div>
              <p className="font-semibold">{job.tax_year}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Settings className="h-3 w-3" />
                Mode
              </div>
              <p className="font-semibold capitalize">{job.execution_mode.replace('_', ' ')}</p>
            </div>
            {job.taxable_income !== null && (
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <DollarSign className="h-3 w-3" />
                  Taxable Income
                </div>
                <p className="font-semibold font-mono">AED {job.taxable_income?.toLocaleString()}</p>
              </div>
            )}
            {job.tax_liability !== null && (
              <div className="p-3 rounded-lg bg-primary/10">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Send className="h-3 w-3" />
                  Tax Liability
                </div>
                <p className="font-semibold font-mono text-primary">AED {job.tax_liability?.toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Risk Info */}
          {job.risk_category && (
            <div className={cn(
              "p-3 rounded-lg",
              job.risk_category === 'critical' && "bg-red-500/10",
              job.risk_category === 'high' && "bg-amber-500/10",
              job.risk_category === 'medium' && "bg-yellow-500/10",
              job.risk_category === 'low' && "bg-green-500/10"
            )}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Risk Assessment</span>
                <Badge variant="outline" className="capitalize">
                  {job.risk_category}
                </Badge>
              </div>
              {job.risk_score !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  Risk Score: {job.risk_score}
                </p>
              )}
              {job.anomaly_flags && job.anomaly_flags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {job.anomaly_flags.map((flag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {flag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Tasks */}
          <div>
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Workflow Tasks ({completedTasks}/{tasks.length})
            </h4>
            <div className="space-y-2">
              {tasks.map((task, index) => {
                const statusCfg = taskStatusConfig[task.status] || taskStatusConfig.pending;
                return (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-colors",
                      task.status === 'running' && "bg-primary/5 border border-primary/30",
                      task.status === 'completed' && "bg-green-500/5",
                      task.status === 'failed' && "bg-red-500/5",
                      task.status === 'pending' && "bg-muted/30"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                      statusCfg.color
                    )}>
                      {task.status === 'completed' || task.status === 'running' || task.status === 'failed' 
                        ? statusCfg.icon 
                        : index + 1
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{task.task_name}</span>
                        {task.executed_by && (
                          <Badge variant="outline" className="text-xs">
                            {task.executed_by === 'ai' ? <Bot className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                            {task.executed_by}
                          </Badge>
                        )}
                      </div>
                      {task.requires_verification && (
                        <span className="text-xs text-amber-600">Requires human verification</span>
                      )}
                      {task.confidence_score !== null && (
                        <span className="text-xs text-muted-foreground ml-2">
                          Confidence: {task.confidence_score}%
                        </span>
                      )}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs capitalize", statusCfg.color.includes('bg-') ? '' : statusCfg.color)}
                    >
                      {task.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {job.last_error && (
            <>
              <Separator />
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <div className="flex items-center gap-2 text-red-600 font-medium text-sm mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  Last Error
                </div>
                <p className="text-xs text-red-700 dark:text-red-300">{job.last_error}</p>
              </div>
            </>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
