import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Settings, 
  Play, 
  Pause, 
  Users,
  Zap,
  AlertTriangle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QueueConfig } from '@/hooks/useTaxFilingJobs';

interface QueueCardProps {
  queue: QueueConfig;
  stats: {
    total: number;
    pending: number;
    processing: number;
    awaiting_review: number;
    completed: number;
    failed: number;
  };
  onTogglePause: () => void;
  onConfigure: () => void;
}

const queueIcons: Record<string, React.ReactNode> = {
  ai_preparation: <Zap className="h-4 w-4" />,
  human_review: <Users className="h-4 w-4" />,
  standard: <Clock className="h-4 w-4" />,
  premium: <TrendingUp className="h-4 w-4" />,
  risk_prioritized: <AlertTriangle className="h-4 w-4" />,
  batch: <Settings className="h-4 w-4" />,
  parallel: <Zap className="h-4 w-4" />,
};

export function QueueCard({ queue, stats, onTogglePause, onConfigure }: QueueCardProps) {
  const utilizationPercent = stats.total > 0 
    ? ((stats.processing + stats.awaiting_review) / queue.max_parallel_jobs) * 100 
    : 0;

  return (
    <Card className={cn(
      "transition-all",
      !queue.is_active && "opacity-50",
      queue.is_paused && "border-amber-500/50 bg-amber-500/5"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className={cn(
              "p-1.5 rounded-lg",
              queue.is_paused ? "bg-amber-500/20 text-amber-600" : "bg-primary/10 text-primary"
            )}>
              {queueIcons[queue.queue_name] || <Settings className="h-4 w-4" />}
            </div>
            {queue.display_name}
          </CardTitle>
          <div className="flex items-center gap-2">
            {queue.is_paused && (
              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                Paused
              </Badge>
            )}
            <Switch
              checked={!queue.is_paused}
              onCheckedChange={onTogglePause}
              disabled={!queue.is_active}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {queue.description}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded bg-muted/50">
            <p className="text-lg font-bold">{stats.pending + stats.processing}</p>
            <p className="text-xs text-muted-foreground">In Queue</p>
          </div>
          <div className="p-2 rounded bg-green-500/10">
            <p className="text-lg font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">Done</p>
          </div>
          <div className="p-2 rounded bg-red-500/10">
            <p className="text-lg font-bold text-red-600">{stats.failed}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>
        </div>

        {/* Utilization */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Worker Utilization</span>
            <span className="font-medium">{stats.processing}/{queue.max_workers} workers</span>
          </div>
          <Progress value={Math.min(utilizationPercent, 100)} className="h-1.5" />
        </div>

        {/* Config Summary */}
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            Max {queue.max_workers} workers
          </Badge>
          <Badge variant="outline" className="text-xs">
            Batch: {queue.max_batch_size}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Priority: {queue.priority_weight}
          </Badge>
          {queue.requires_approval && (
            <Badge variant="outline" className="text-xs bg-amber-500/10">
              Approval Required
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={onConfigure}
          >
            <Settings className="h-3 w-3 mr-1" />
            Configure
          </Button>
          <Button 
            variant={queue.is_paused ? "default" : "outline"} 
            size="sm"
            className="flex-1"
            onClick={onTogglePause}
            disabled={!queue.is_active}
          >
            {queue.is_paused ? (
              <>
                <Play className="h-3 w-3 mr-1" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-3 w-3 mr-1" />
                Pause
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
