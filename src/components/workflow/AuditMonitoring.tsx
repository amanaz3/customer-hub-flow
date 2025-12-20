import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  FileText,
  Search,
  Download,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Brain,
  Zap,
  FileJson,
  Calendar,
  Filter,
  Eye,
} from 'lucide-react';

interface AuditEntry {
  id: string;
  timestamp: string;
  workflow: string;
  step: string;
  action: string;
  actor: string;
  actorType: 'human' | 'ai' | 'system';
  status: 'success' | 'failed' | 'pending';
  details: {
    input?: any;
    output?: any;
    error?: string;
    duration?: string;
  };
  division: string;
}

interface WorkflowExecution {
  id: string;
  workflow: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  startedAt: string;
  completedAt?: string;
  currentStep: string;
  steps: {
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    actor?: string;
    startedAt?: string;
    completedAt?: string;
  }[];
  division: string;
  company: string;
}

const mockAuditEntries: AuditEntry[] = [
  {
    id: 'a1',
    timestamp: '2024-01-15 10:30:45',
    workflow: 'Invoice Processing',
    step: 'Extract Invoice Data',
    action: 'Data extraction completed',
    actor: 'System',
    actorType: 'system',
    status: 'success',
    details: { output: { invoiceNumber: 'INV-2024-001', amount: 5000 }, duration: '2.3s' },
    division: 'Finance',
  },
  {
    id: 'a2',
    timestamp: '2024-01-15 10:31:12',
    workflow: 'Invoice Processing',
    step: 'AI Validation',
    action: 'Invoice categorized as Equipment Purchase',
    actor: 'GPT-4',
    actorType: 'ai',
    status: 'success',
    details: { output: { category: 'Equipment', confidence: 0.95 }, duration: '1.5s' },
    division: 'Finance',
  },
  {
    id: 'a3',
    timestamp: '2024-01-15 10:45:00',
    workflow: 'Invoice Processing',
    step: 'Manager Approval',
    action: 'Approved with comment',
    actor: 'john@company.com',
    actorType: 'human',
    status: 'success',
    details: { output: { approved: true, comment: 'Verified with vendor' } },
    division: 'Finance',
  },
  {
    id: 'a4',
    timestamp: '2024-01-15 11:00:00',
    workflow: 'Contract Review',
    step: 'AI Analysis',
    action: 'Risk analysis failed',
    actor: 'Claude',
    actorType: 'ai',
    status: 'failed',
    details: { error: 'API timeout after 30s', duration: '30s' },
    division: 'Legal',
  },
];

const mockExecutions: WorkflowExecution[] = [
  {
    id: 'e1',
    workflow: 'Invoice Processing',
    status: 'running',
    startedAt: '2024-01-15 10:30:00',
    currentStep: 'Manager Approval',
    division: 'Finance',
    company: 'Acme Corp',
    steps: [
      { name: 'Extract Data', status: 'completed', startedAt: '10:30:00', completedAt: '10:30:45' },
      { name: 'AI Validation', status: 'completed', startedAt: '10:30:45', completedAt: '10:31:12' },
      { name: 'Manager Approval', status: 'running', actor: 'john@company.com', startedAt: '10:31:12' },
      { name: 'Record in Ledger', status: 'pending' },
    ],
  },
  {
    id: 'e2',
    workflow: 'Contract Review',
    status: 'failed',
    startedAt: '2024-01-15 11:00:00',
    currentStep: 'AI Analysis',
    division: 'Legal',
    company: 'Acme Corp',
    steps: [
      { name: 'Upload Document', status: 'completed', startedAt: '11:00:00', completedAt: '11:00:05' },
      { name: 'AI Analysis', status: 'failed', startedAt: '11:00:05' },
      { name: 'Legal Review', status: 'skipped' },
      { name: 'Final Approval', status: 'skipped' },
    ],
  },
  {
    id: 'e3',
    workflow: 'Tax Filing',
    status: 'completed',
    startedAt: '2024-01-14 09:00:00',
    completedAt: '2024-01-14 14:30:00',
    currentStep: 'Completed',
    division: 'Tax',
    company: 'Acme Corp',
    steps: [
      { name: 'Data Collection', status: 'completed' },
      { name: 'AI Calculation', status: 'completed' },
      { name: 'CFO Approval', status: 'completed' },
      { name: 'Submit to Authority', status: 'completed' },
    ],
  },
];

const AuditMonitoring: React.FC = () => {
  const [expandedExecution, setExpandedExecution] = useState<string | null>('e1');
  const [activeTab, setActiveTab] = useState('executions');

  const getActorIcon = (type: AuditEntry['actorType']) => {
    switch (type) {
      case 'human':
        return <User className="h-4 w-4" />;
      case 'ai':
        return <Brain className="h-4 w-4" />;
      case 'system':
        return <Zap className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-500">Completed</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/10 text-destructive">Failed</Badge>;
      case 'running':
        return <Badge className="bg-blue-500/10 text-blue-500">Running</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500/10 text-yellow-500">Paused</Badge>;
      case 'skipped':
        return <Badge variant="secondary">Skipped</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="executions">Workflow Executions</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="exports">Bookkeeping Export</TabsTrigger>
        </TabsList>

        <TabsContent value="executions" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <Input placeholder="Search workflows..." className="max-w-sm" />
            <Select defaultValue="all">
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Divisions</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="tax">Tax</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Execution Cards */}
          <div className="space-y-4">
            {mockExecutions.map((execution) => (
              <Card key={execution.id}>
                <Collapsible
                  open={expandedExecution === execution.id}
                  onOpenChange={() =>
                    setExpandedExecution(expandedExecution === execution.id ? null : execution.id)
                  }
                >
                  <CardHeader className="pb-3">
                    <CollapsibleTrigger className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-4">
                        {expandedExecution === execution.id ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                        <div className="text-left">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {execution.workflow}
                            {getStatusBadge(execution.status)}
                          </CardTitle>
                          <CardDescription>
                            {execution.company} · {execution.division} · Started: {execution.startedAt}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">Current: {execution.currentStep}</p>
                          <p className="text-xs text-muted-foreground">
                            {execution.steps.filter((s) => s.status === 'completed').length} /{' '}
                            {execution.steps.length} steps
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </CollapsibleTrigger>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Step Timeline */}
                        <div className="relative">
                          {execution.steps.map((step, index) => (
                            <div key={index} className="flex items-start gap-4 pb-4">
                              <div className="flex flex-col items-center">
                                {getStepStatusIcon(step.status)}
                                {index < execution.steps.length - 1 && (
                                  <div className="w-0.5 h-full bg-muted-foreground/20 mt-2" />
                                )}
                              </div>
                              <div className="flex-1 pb-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{step.name}</p>
                                    {step.actor && (
                                      <p className="text-sm text-muted-foreground">
                                        Assigned: {step.actor}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right text-sm text-muted-foreground">
                                    {step.startedAt && <p>Started: {step.startedAt}</p>}
                                    {step.completedAt && <p>Completed: {step.completedAt}</p>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Audit Trail</CardTitle>
                <div className="flex items-center gap-2">
                  <Input placeholder="Search..." className="w-64" />
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Workflow / Step</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Division</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAuditEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-sm">{entry.timestamp}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{entry.workflow}</p>
                          <p className="text-sm text-muted-foreground">{entry.step}</p>
                        </div>
                      </TableCell>
                      <TableCell>{entry.action}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActorIcon(entry.actorType)}
                          <span>{entry.actor}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(entry.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.division}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exports" className="mt-4">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="h-5 w-5" />
                  Bookkeeping Export
                </CardTitle>
                <CardDescription>Export workflow outputs in bookkeeping-ready JSON format</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <div className="flex items-center gap-2">
                    <Input type="date" />
                    <span>to</span>
                    <Input type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Division</label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Divisions</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="tax">Tax</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Export Format</label>
                  <Select defaultValue="json">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xml">XML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  Generate Export
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Tax Compliance Export
                </CardTitle>
                <CardDescription>Export data formatted for tax authority submissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tax Period</label>
                  <Select defaultValue="q4-2024">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="q4-2024">Q4 2024</SelectItem>
                      <SelectItem value="q3-2024">Q3 2024</SelectItem>
                      <SelectItem value="q2-2024">Q2 2024</SelectItem>
                      <SelectItem value="q1-2024">Q1 2024</SelectItem>
                      <SelectItem value="fy-2024">FY 2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tax Type</label>
                  <Select defaultValue="vat">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vat">VAT Return</SelectItem>
                      <SelectItem value="corporate">Corporate Tax</SelectItem>
                      <SelectItem value="payroll">Payroll Tax</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Exports include complete audit trail, AI outputs, and human approvals for compliance verification.
                  </p>
                </div>
                <Button className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  Generate Tax Export
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuditMonitoring;
