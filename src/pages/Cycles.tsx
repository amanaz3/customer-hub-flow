import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Calendar, Users, CheckCircle2, Clock } from 'lucide-react';
import { CreateCycleDialog } from '@/components/Team/CreateCycleDialog';
import { formatDistance } from 'date-fns';
import { toast } from 'sonner';

interface Cycle {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  status: 'planning' | 'active' | 'completed' | 'loveable-stage' | 'dev-stage' | 'qa-stage' | 'live-stage';
  created_at: string;
  task_count?: number;
  completed_tasks?: number;
}

const Cycles: React.FC = () => {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<Cycle | undefined>();

  useEffect(() => {
    fetchCycles();
  }, []);

  const fetchCycles = async () => {
    try {
      // Fetch cycles
      const { data: cyclesData, error: cyclesError } = await supabase
        .from('cycles')
        .select('*')
        .order('start_date', { ascending: false });

      if (cyclesError) throw cyclesError;

      // Fetch task counts for each cycle
      const cyclesWithCounts = await Promise.all(
        (cyclesData || []).map(async (cycle) => {
          const { count: totalCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('cycle_id', cycle.id);

          const { count: completedCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('cycle_id', cycle.id)
            .eq('status', 'done');

          return {
            ...cycle,
            task_count: totalCount || 0,
            completed_tasks: completedCount || 0,
          };
        })
      );

      setCycles(cyclesWithCounts);
    } catch (error) {
      console.error('Error fetching cycles:', error);
      toast.error('Failed to load cycles');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Cycle['status']) => {
    switch (status) {
      case 'planning':
        return 'bg-secondary text-secondary-foreground';
      case 'active':
        return 'bg-primary text-primary-foreground';
      case 'loveable-stage':
        return 'bg-purple-500/10 text-purple-500';
      case 'dev-stage':
        return 'bg-cyan-500/10 text-cyan-500';
      case 'qa-stage':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'live-stage':
        return 'bg-emerald-500/10 text-emerald-500';
      case 'completed':
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: Cycle['status']) => {
    switch (status) {
      case 'planning':
        return <Calendar className="h-3 w-3" />;
      case 'active':
        return <Clock className="h-3 w-3" />;
      case 'loveable-stage':
      case 'dev-stage':
      case 'qa-stage':
      case 'live-stage':
        return <Clock className="h-3 w-3" />;
      case 'completed':
        return <CheckCircle2 className="h-3 w-3" />;
    }
  };

  const handleEditCycle = (cycle: Cycle) => {
    setSelectedCycle(cycle);
    setCreateDialogOpen(true);
  };

  const handleDialogClose = () => {
    setCreateDialogOpen(false);
    setSelectedCycle(undefined);
  };

  const groupedCycles = {
    active: cycles.filter((c) => c.status === 'active'),
    planning: cycles.filter((c) => c.status === 'planning'),
    loveableStage: cycles.filter((c) => c.status === 'loveable-stage'),
    devStage: cycles.filter((c) => c.status === 'dev-stage'),
    qaStage: cycles.filter((c) => c.status === 'qa-stage'),
    liveStage: cycles.filter((c) => c.status === 'live-stage'),
    completed: cycles.filter((c) => c.status === 'completed'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cycles</h1>
          <p className="text-muted-foreground mt-1">
            Manage your sprints and time-boxed work periods
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Cycle
        </Button>
      </div>

      {/* Active Cycles */}
      {groupedCycles.active.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Active Cycles
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groupedCycles.active.map((cycle) => (
              <CycleCard
                key={cycle.id}
                cycle={cycle}
                onEdit={handleEditCycle}
                onRefresh={fetchCycles}
              />
            ))}
          </div>
        </div>
      )}

      {/* Planning Cycles */}
      {groupedCycles.planning.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-secondary" />
            Planning
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groupedCycles.planning.map((cycle) => (
              <CycleCard
                key={cycle.id}
                cycle={cycle}
                onEdit={handleEditCycle}
                onRefresh={fetchCycles}
              />
            ))}
          </div>
        </div>
      )}

      {/* Loveable Stage Cycles */}
      {groupedCycles.loveableStage.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-500" />
            Loveable Stage
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groupedCycles.loveableStage.map((cycle) => (
              <CycleCard
                key={cycle.id}
                cycle={cycle}
                onEdit={handleEditCycle}
                onRefresh={fetchCycles}
              />
            ))}
          </div>
        </div>
      )}

      {/* Dev Stage Cycles */}
      {groupedCycles.devStage.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-cyan-500" />
            Dev Stage
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groupedCycles.devStage.map((cycle) => (
              <CycleCard
                key={cycle.id}
                cycle={cycle}
                onEdit={handleEditCycle}
                onRefresh={fetchCycles}
              />
            ))}
          </div>
        </div>
      )}

      {/* QA Stage Cycles */}
      {groupedCycles.qaStage.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            QA Stage
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groupedCycles.qaStage.map((cycle) => (
              <CycleCard
                key={cycle.id}
                cycle={cycle}
                onEdit={handleEditCycle}
                onRefresh={fetchCycles}
              />
            ))}
          </div>
        </div>
      )}

      {/* Live Stage Cycles */}
      {groupedCycles.liveStage.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-500" />
            Live Stage
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groupedCycles.liveStage.map((cycle) => (
              <CycleCard
                key={cycle.id}
                cycle={cycle}
                onEdit={handleEditCycle}
                onRefresh={fetchCycles}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Cycles */}
      {groupedCycles.completed.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            Completed
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groupedCycles.completed.map((cycle) => (
              <CycleCard
                key={cycle.id}
                cycle={cycle}
                onEdit={handleEditCycle}
                onRefresh={fetchCycles}
              />
            ))}
          </div>
        </div>
      )}

      {cycles.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No cycles yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first cycle to start organizing tasks into sprints
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Cycle
            </Button>
          </CardContent>
        </Card>
      )}

      <CreateCycleDialog
        open={createDialogOpen}
        onOpenChange={handleDialogClose}
        onCycleCreated={fetchCycles}
        cycle={selectedCycle}
      />
    </div>
  );
};

interface CycleCardProps {
  cycle: Cycle;
  onEdit: (cycle: Cycle) => void;
  onRefresh: () => void;
}

const CycleCard: React.FC<CycleCardProps> = ({ cycle, onEdit, onRefresh }) => {
  const progress =
    cycle.task_count && cycle.task_count > 0
      ? Math.round((cycle.completed_tasks! / cycle.task_count) * 100)
      : 0;

  const daysRemaining = Math.ceil(
    (new Date(cycle.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const getStatusColor = (status: Cycle['status']) => {
    switch (status) {
      case 'planning':
        return 'bg-secondary text-secondary-foreground';
      case 'active':
        return 'bg-primary text-primary-foreground';
      case 'loveable-stage':
        return 'bg-purple-500/10 text-purple-500';
      case 'dev-stage':
        return 'bg-cyan-500/10 text-cyan-500';
      case 'qa-stage':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'live-stage':
        return 'bg-emerald-500/10 text-emerald-500';
      case 'completed':
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: Cycle['status']) => {
    switch (status) {
      case 'planning':
        return <Calendar className="h-3 w-3" />;
      case 'active':
        return <Clock className="h-3 w-3" />;
      case 'loveable-stage':
      case 'dev-stage':
      case 'qa-stage':
      case 'live-stage':
        return <Clock className="h-3 w-3" />;
      case 'completed':
        return <CheckCircle2 className="h-3 w-3" />;
    }
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onEdit(cycle)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{cycle.name}</CardTitle>
            <CardDescription className="mt-1">
              {new Date(cycle.start_date).toLocaleDateString()} -{' '}
              {new Date(cycle.end_date).toLocaleDateString()}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(cycle.status)} variant="secondary">
            <span className="flex items-center gap-1">
              {getStatusIcon(cycle.status)}
              {cycle.status}
            </span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {cycle.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{cycle.description}</p>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {cycle.completed_tasks} / {cycle.task_count} tasks
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{cycle.task_count || 0} tasks</span>
          </div>
          {cycle.status === 'active' && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {daysRemaining > 0 ? `${daysRemaining}d left` : 'Due today'}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Cycles;
