import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  GripVertical,
  UserCheck,
  Database,
  Brain,
  Zap,
  FileOutput,
  Trash2,
  Edit,
  Copy,
  MoreVertical,
  ArrowDown,
  Clock,
  Users,
  Settings,
  Save,
  Play,
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  type: 'human_approval' | 'data_fetch' | 'ai_task' | 'event_trigger' | 'output';
  name: string;
  description: string;
  config: {
    approvers?: string[];
    deadline?: string;
    aiModel?: string;
    eventSource?: string;
    outputFormat?: string;
  };
  dependencies?: string[];
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  engine: 'manual' | 'temporal';
  steps: WorkflowStep[];
  division: string;
  service: string;
}

const stepTypes = [
  { type: 'human_approval', name: 'Human Approval', icon: UserCheck, color: 'bg-blue-500' },
  { type: 'data_fetch', name: 'Data Fetch / Transform', icon: Database, color: 'bg-green-500' },
  { type: 'ai_task', name: 'AI-Assisted Task', icon: Brain, color: 'bg-purple-500' },
  { type: 'event_trigger', name: 'Event Trigger', icon: Zap, color: 'bg-yellow-500' },
  { type: 'output', name: 'Output / Bookkeeping', icon: FileOutput, color: 'bg-orange-500' },
];

const mockWorkflow: Workflow = {
  id: 'wf1',
  name: 'Invoice Processing Workflow',
  description: 'End-to-end invoice processing with approvals and bookkeeping',
  engine: 'temporal',
  division: 'Finance',
  service: 'Invoice Processing',
  steps: [
    {
      id: 's1',
      type: 'data_fetch',
      name: 'Extract Invoice Data',
      description: 'Extract data from uploaded invoice document',
      config: {},
    },
    {
      id: 's2',
      type: 'ai_task',
      name: 'Validate & Categorize',
      description: 'AI validates invoice data and suggests category',
      config: { aiModel: 'gpt-4' },
      dependencies: ['s1'],
    },
    {
      id: 's3',
      type: 'human_approval',
      name: 'Manager Approval',
      description: 'Manager reviews and approves invoice',
      config: { approvers: ['manager@company.com'], deadline: '24h' },
      dependencies: ['s2'],
    },
    {
      id: 's4',
      type: 'output',
      name: 'Record in Ledger',
      description: 'Record approved invoice in bookkeeping system',
      config: { outputFormat: 'json' },
      dependencies: ['s3'],
    },
  ],
};

const WorkflowDesigner: React.FC = () => {
  const [workflow, setWorkflow] = useState<Workflow>(mockWorkflow);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [isAddStepOpen, setIsAddStepOpen] = useState(false);
  const [newStepType, setNewStepType] = useState<string>('');

  const getStepIcon = (type: WorkflowStep['type']) => {
    const stepType = stepTypes.find((s) => s.type === type);
    if (!stepType) return null;
    const Icon = stepType.icon;
    return <Icon className="h-5 w-5" />;
  };

  const getStepColor = (type: WorkflowStep['type']) => {
    return stepTypes.find((s) => s.type === type)?.color || 'bg-gray-500';
  };

  const handleAddStep = () => {
    if (!newStepType) return;
    const newStep: WorkflowStep = {
      id: `s${Date.now()}`,
      type: newStepType as WorkflowStep['type'],
      name: `New ${stepTypes.find((s) => s.type === newStepType)?.name}`,
      description: '',
      config: {},
    };
    setWorkflow((prev) => ({
      ...prev,
      steps: [...prev.steps, newStep],
    }));
    setIsAddStepOpen(false);
    setNewStepType('');
  };

  const handleDeleteStep = (stepId: string) => {
    setWorkflow((prev) => ({
      ...prev,
      steps: prev.steps.filter((s) => s.id !== stepId),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Workflow Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                {workflow.name}
                <Badge variant="outline">{workflow.division}</Badge>
                <Badge variant="secondary">{workflow.service}</Badge>
              </CardTitle>
              <CardDescription>{workflow.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 mr-4">
                <Label htmlFor="engine" className="text-sm">
                  Engine:
                </Label>
                <Select
                  value={workflow.engine}
                  onValueChange={(v) =>
                    setWorkflow((prev) => ({ ...prev, engine: v as 'manual' | 'temporal' }))
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">DB/Manual</SelectItem>
                    <SelectItem value="temporal">Temporal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" className="gap-2">
                <Save className="h-4 w-4" />
                Save
              </Button>
              <Button className="gap-2">
                <Play className="h-4 w-4" />
                Test Run
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-3 gap-6">
        {/* Step Types Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Step Types</CardTitle>
            <CardDescription>Drag to add steps to workflow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {stepTypes.map((stepType) => (
              <div
                key={stepType.type}
                className="flex items-center gap-3 p-3 border rounded-lg cursor-move hover:bg-muted/50 transition-colors"
                draggable
              >
                <div className={`p-2 rounded-lg ${stepType.color}/10`}>
                  <stepType.icon className={`h-5 w-5 text-${stepType.color.replace('bg-', '')}`} />
                </div>
                <div>
                  <p className="font-medium text-sm">{stepType.name}</p>
                </div>
                <GripVertical className="h-4 w-4 text-muted-foreground ml-auto" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Workflow Canvas */}
        <Card className="col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Workflow Steps</CardTitle>
              <Dialog open={isAddStepOpen} onOpenChange={setIsAddStepOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1">
                    <Plus className="h-4 w-4" />
                    Add Step
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Workflow Step</DialogTitle>
                    <DialogDescription>Select the type of step to add</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-3 py-4">
                    {stepTypes.map((stepType) => (
                      <div
                        key={stepType.type}
                        onClick={() => setNewStepType(stepType.type)}
                        className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                          newStepType === stepType.type
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${stepType.color}/10`}>
                          <stepType.icon className="h-5 w-5" />
                        </div>
                        <span className="font-medium text-sm">{stepType.name}</span>
                      </div>
                    ))}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddStepOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddStep} disabled={!newStepType}>
                      Add Step
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workflow.steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div
                    className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedStep?.id === step.id
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedStep(step)}
                  >
                    <div className="cursor-move">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className={`p-2 rounded-lg ${getStepColor(step.type)}/10`}>
                      {getStepIcon(step.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{step.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {stepTypes.find((s) => s.type === step.type)?.name}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      {step.config.deadline && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Deadline: {step.config.deadline}</span>
                        </div>
                      )}
                      {step.config.approvers && step.config.approvers.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>Approvers: {step.config.approvers.join(', ')}</span>
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteStep(step.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {index < workflow.steps.length - 1 && (
                    <div className="flex justify-center">
                      <ArrowDown className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Step Configuration Panel */}
      {selectedStep && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configure: {selectedStep.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Step Name</Label>
                  <Input value={selectedStep.name} onChange={() => {}} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={selectedStep.description} onChange={() => {}} rows={3} />
                </div>
              </div>
              <div className="space-y-4">
                {selectedStep.type === 'human_approval' && (
                  <>
                    <div className="space-y-2">
                      <Label>Approvers</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select approvers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="director">Director</SelectItem>
                          <SelectItem value="cfo">CFO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Deadline</Label>
                      <Select defaultValue="24h">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1h">1 Hour</SelectItem>
                          <SelectItem value="4h">4 Hours</SelectItem>
                          <SelectItem value="24h">24 Hours</SelectItem>
                          <SelectItem value="48h">48 Hours</SelectItem>
                          <SelectItem value="1w">1 Week</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                {selectedStep.type === 'ai_task' && (
                  <>
                    <div className="space-y-2">
                      <Label>AI Model</Label>
                      <Select defaultValue="gpt-4">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                          <SelectItem value="gpt-3.5">GPT-3.5</SelectItem>
                          <SelectItem value="claude">Claude</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-Execute</Label>
                        <p className="text-xs text-muted-foreground">
                          Execute without human review
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </>
                )}
                {selectedStep.type === 'event_trigger' && (
                  <div className="space-y-2">
                    <Label>Event Source</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rabbitmq">RabbitMQ</SelectItem>
                        <SelectItem value="n8n">n8n</SelectItem>
                        <SelectItem value="zapier">Zapier</SelectItem>
                        <SelectItem value="webhook">Webhook</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkflowDesigner;
