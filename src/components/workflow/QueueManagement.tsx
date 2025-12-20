import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Layers,
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MoreVertical,
  ArrowUpCircle,
  Users,
  Settings,
  Activity,
  Zap,
  Database,
  Brain,
} from 'lucide-react';

interface Queue {
  id: string;
  name: string;
  type: 'temporal' | 'rabbitmq' | 'internal';
  status: 'active' | 'paused';
  pending: number;
  inProgress: number;
  failed: number;
  completed: number;
  maxConcurrent: number;
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
  };
}

interface Job {
  id: string;
  queue: string;
  workflow: string;
  step: string;
  status: 'pending' | 'in_progress' | 'failed' | 'completed';
  startedAt: string;
  duration?: string;
  retries: number;
  assignee?: string;
  error?: string;
}

const mockQueues: Queue[] = [
  {
    id: 'q1',
    name: 'AI Processing',
    type: 'temporal',
    status: 'active',
    pending: 12,
    inProgress: 3,
    failed: 1,
    completed: 156,
    maxConcurrent: 5,
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
  },
  {
    id: 'q2',
    name: 'Human Approvals',
    type: 'internal',
    status: 'active',
    pending: 8,
    inProgress: 2,
    failed: 0,
    completed: 89,
    maxConcurrent: 10,
    retryPolicy: { maxRetries: 0, backoffMs: 0 },
  },
  {
    id: 'q3',
    name: 'Event Triggers',
    type: 'rabbitmq',
    status: 'paused',
    pending: 45,
    inProgress: 0,
    failed: 5,
    completed: 234,
    maxConcurrent: 20,
    retryPolicy: { maxRetries: 5, backoffMs: 2000 },
  },
  {
    id: 'q4',
    name: 'Data Fetch',
    type: 'temporal',
    status: 'active',
    pending: 3,
    inProgress: 1,
    failed: 0,
    completed: 67,
    maxConcurrent: 8,
    retryPolicy: { maxRetries: 3, backoffMs: 500 },
  },
];

const mockJobs: Job[] = [
  {
    id: 'j1',
    queue: 'AI Processing',
    workflow: 'Invoice Processing',
    step: 'Validate & Categorize',
    status: 'in_progress',
    startedAt: '2 min ago',
    duration: '2m 15s',
    retries: 0,
  },
  {
    id: 'j2',
    queue: 'Human Approvals',
    workflow: 'Invoice Processing',
    step: 'Manager Approval',
    status: 'pending',
    startedAt: '5 min ago',
    retries: 0,
    assignee: 'john@company.com',
  },
  {
    id: 'j3',
    queue: 'AI Processing',
    workflow: 'Document Review',
    step: 'Summarize Content',
    status: 'failed',
    startedAt: '10 min ago',
    duration: '45s',
    retries: 3,
    error: 'API timeout',
  },
  {
    id: 'j4',
    queue: 'Event Triggers',
    workflow: 'Customer Onboarding',
    step: 'Send Welcome Email',
    status: 'pending',
    startedAt: '15 min ago',
    retries: 0,
  },
  {
    id: 'j5',
    queue: 'Data Fetch',
    workflow: 'Financial Report',
    step: 'Fetch Bank Data',
    status: 'completed',
    startedAt: '20 min ago',
    duration: '12s',
    retries: 0,
  },
];

const QueueManagement: React.FC = () => {
  const [queues, setQueues] = useState<Queue[]>(mockQueues);
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-500">Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500/10 text-yellow-500">Paused</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500/10 text-blue-500">In Progress</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/10 text-destructive">Failed</Badge>;
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-500">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getQueueTypeIcon = (type: Queue['type']) => {
    switch (type) {
      case 'temporal':
        return <Zap className="h-4 w-4" />;
      case 'rabbitmq':
        return <Activity className="h-4 w-4" />;
      case 'internal':
        return <Database className="h-4 w-4" />;
    }
  };

  const toggleQueueStatus = (queueId: string) => {
    setQueues((prev) =>
      prev.map((q) =>
        q.id === queueId ? { ...q, status: q.status === 'active' ? 'paused' : 'active' } : q
      )
    );
  };

  const retryJob = (jobId: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: 'pending', retries: j.retries + 1 } : j))
    );
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Queue Overview</TabsTrigger>
          <TabsTrigger value="jobs">Active Jobs</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Queues</p>
                    <p className="text-2xl font-bold">{queues.length}</p>
                  </div>
                  <Layers className="h-8 w-8 text-primary/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Jobs</p>
                    <p className="text-2xl font-bold text-yellow-500">
                      {queues.reduce((acc, q) => acc + q.pending, 0)}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                    <p className="text-2xl font-bold text-blue-500">
                      {queues.reduce((acc, q) => acc + q.inProgress, 0)}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                    <p className="text-2xl font-bold text-destructive">
                      {queues.reduce((acc, q) => acc + q.failed, 0)}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-destructive/20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Queue Cards */}
          <div className="grid grid-cols-2 gap-4">
            {queues.map((queue) => (
              <Card key={queue.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {getQueueTypeIcon(queue.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {queue.name}
                          {getStatusBadge(queue.status)}
                        </CardTitle>
                        <CardDescription className="capitalize">{queue.type}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleQueueStatus(queue.id)}
                      >
                        {queue.status === 'active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="outline" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2 bg-muted/50 rounded">
                        <p className="text-lg font-bold">{queue.pending}</p>
                        <p className="text-xs text-muted-foreground">Pending</p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded">
                        <p className="text-lg font-bold text-blue-500">{queue.inProgress}</p>
                        <p className="text-xs text-muted-foreground">Active</p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded">
                        <p className="text-lg font-bold text-destructive">{queue.failed}</p>
                        <p className="text-xs text-muted-foreground">Failed</p>
                      </div>
                      <div className="p-2 bg-muted/50 rounded">
                        <p className="text-lg font-bold text-green-500">{queue.completed}</p>
                        <p className="text-xs text-muted-foreground">Done</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Capacity</span>
                        <span>
                          {queue.inProgress} / {queue.maxConcurrent}
                        </span>
                      </div>
                      <Progress
                        value={(queue.inProgress / queue.maxConcurrent) * 100}
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Job Queue</CardTitle>
                <div className="flex items-center gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Queue</TableHead>
                    <TableHead>Workflow / Step</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Retries</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-sm">{job.id}</TableCell>
                      <TableCell>{job.queue}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{job.workflow}</p>
                          <p className="text-sm text-muted-foreground">{job.step}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell>{job.startedAt}</TableCell>
                      <TableCell>{job.duration || '-'}</TableCell>
                      <TableCell>
                        {job.retries > 0 && (
                          <Badge variant="outline" className="text-yellow-500">
                            {job.retries}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {job.status === 'failed' && (
                              <DropdownMenuItem onClick={() => retryJob(job.id)}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <ArrowUpCircle className="h-4 w-4 mr-2" />
                              Escalate
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Users className="h-4 w-4 mr-2" />
                              Reassign
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <div className="grid grid-cols-2 gap-6">
            {queues.map((queue) => (
              <Card key={queue.id}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getQueueTypeIcon(queue.type)}
                    {queue.name} Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Max Concurrent Jobs</Label>
                    <Input type="number" defaultValue={queue.maxConcurrent} />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Retries</Label>
                    <Input type="number" defaultValue={queue.retryPolicy.maxRetries} />
                  </div>
                  <div className="space-y-2">
                    <Label>Retry Backoff (ms)</Label>
                    <Input type="number" defaultValue={queue.retryPolicy.backoffMs} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Event Triggers</Label>
                      <p className="text-xs text-muted-foreground">Enable external triggers</p>
                    </div>
                    <Switch defaultChecked={queue.type !== 'internal'} />
                  </div>
                  <Button className="w-full">Save Configuration</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QueueManagement;
