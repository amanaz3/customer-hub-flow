import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LayoutGrid, 
  List,
  RefreshCcw,
  Settings,
  Loader2,
  BarChart3
} from 'lucide-react';
import { QueueCard } from './QueueCard';
import { QueueConfig } from '@/hooks/useTaxFilingJobs';

interface QueueDashboardProps {
  queues: QueueConfig[];
  loading: boolean;
  getQueueStats: (queueName: string) => {
    total: number;
    pending: number;
    processing: number;
    awaiting_review: number;
    completed: number;
    failed: number;
  };
  onUpdateQueue: (queueName: string, updates: Partial<QueueConfig>) => void;
  onRefresh: () => void;
}

export function QueueDashboard({ 
  queues, 
  loading, 
  getQueueStats,
  onUpdateQueue, 
  onRefresh 
}: QueueDashboardProps) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [configuring, setConfiguring] = useState<string | null>(null);

  const totalStats = queues.reduce((acc, q) => {
    const stats = getQueueStats(q.queue_name);
    return {
      total: acc.total + stats.total,
      pending: acc.pending + stats.pending,
      processing: acc.processing + stats.processing,
      awaiting_review: acc.awaiting_review + stats.awaiting_review,
      completed: acc.completed + stats.completed,
      failed: acc.failed + stats.failed,
    };
  }, { total: 0, pending: 0, processing: 0, awaiting_review: 0, completed: 0, failed: 0 });

  const activeQueues = queues.filter(q => q.is_active && !q.is_paused).length;
  const pausedQueues = queues.filter(q => q.is_paused).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-primary">{totalStats.total}</p>
            <p className="text-xs text-muted-foreground">Total Jobs</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{totalStats.pending + totalStats.processing}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{totalStats.awaiting_review}</p>
            <p className="text-xs text-muted-foreground">Awaiting Review</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-green-600">{totalStats.completed}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-red-600">{totalStats.failed}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">
              <span className="text-green-600">{activeQueues}</span>
              <span className="text-muted-foreground text-lg">/</span>
              <span className="text-amber-600">{pausedQueues}</span>
            </p>
            <p className="text-xs text-muted-foreground">Active/Paused</p>
          </CardContent>
        </Card>
      </div>

      {/* Queue Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Queue Management
          <Badge variant="secondary">{queues.length} queues</Badge>
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={view === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setView('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setView('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCcw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Queues Grid/List */}
      <div className={view === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
        : "space-y-3"
      }>
        {queues.map(queue => (
          <QueueCard
            key={queue.queue_name}
            queue={queue}
            stats={getQueueStats(queue.queue_name)}
            onTogglePause={() => onUpdateQueue(queue.queue_name, { is_paused: !queue.is_paused })}
            onConfigure={() => setConfiguring(queue.queue_name)}
          />
        ))}
      </div>
    </div>
  );
}
