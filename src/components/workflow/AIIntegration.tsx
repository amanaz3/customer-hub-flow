import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Brain,
  Sparkles,
  FileText,
  FormInput,
  CheckCircle,
  AlertTriangle,
  Settings,
  Zap,
  Lightbulb,
  Shield,
  Clock,
  Activity,
} from 'lucide-react';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  capabilities: string[];
  costPerToken: number;
  avgLatency: string;
}

interface AITask {
  id: string;
  name: string;
  type: 'summarize' | 'validate' | 'prefill' | 'suggest' | 'categorize';
  model: string;
  mode: 'suggest' | 'auto';
  enabled: boolean;
  division?: string;
}

const mockModels: AIModel[] = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    capabilities: ['summarize', 'validate', 'categorize', 'suggest'],
    costPerToken: 0.03,
    avgLatency: '2-5s',
  },
  {
    id: 'gpt-3.5',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    capabilities: ['summarize', 'prefill', 'categorize'],
    costPerToken: 0.002,
    avgLatency: '0.5-2s',
  },
  {
    id: 'claude-3',
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    capabilities: ['summarize', 'validate', 'suggest', 'categorize'],
    costPerToken: 0.015,
    avgLatency: '1-3s',
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'Google',
    capabilities: ['summarize', 'prefill', 'categorize'],
    costPerToken: 0.001,
    avgLatency: '0.5-1.5s',
  },
];

const mockTasks: AITask[] = [
  { id: 't1', name: 'Document Summarization', type: 'summarize', model: 'gpt-4', mode: 'auto', enabled: true },
  { id: 't2', name: 'Invoice Validation', type: 'validate', model: 'claude-3', mode: 'suggest', enabled: true, division: 'Finance' },
  { id: 't3', name: 'Form Pre-fill', type: 'prefill', model: 'gpt-3.5', mode: 'auto', enabled: true },
  { id: 't4', name: 'Workflow Suggestions', type: 'suggest', model: 'gpt-4', mode: 'suggest', enabled: false },
  { id: 't5', name: 'Expense Categorization', type: 'categorize', model: 'gemini-pro', mode: 'auto', enabled: true, division: 'Finance' },
];

const AIIntegration: React.FC = () => {
  const [tasks, setTasks] = useState<AITask[]>(mockTasks);
  const [defaultModel, setDefaultModel] = useState('gpt-4');
  const [globalMode, setGlobalMode] = useState<'suggest' | 'auto'>('suggest');
  const [confidenceThreshold, setConfidenceThreshold] = useState([0.85]);

  const toggleTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const getTaskIcon = (type: AITask['type']) => {
    switch (type) {
      case 'summarize':
        return <FileText className="h-4 w-4" />;
      case 'validate':
        return <CheckCircle className="h-4 w-4" />;
      case 'prefill':
        return <FormInput className="h-4 w-4" />;
      case 'suggest':
        return <Lightbulb className="h-4 w-4" />;
      case 'categorize':
        return <Sparkles className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Tasks Enabled</p>
                <p className="text-2xl font-bold">{tasks.filter((t) => t.enabled).length}</p>
              </div>
              <Brain className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Models</p>
                <p className="text-2xl font-bold">{mockModels.length}</p>
              </div>
              <Sparkles className="h-8 w-8 text-purple-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Auto-Execute</p>
                <p className="text-2xl font-bold">{tasks.filter((t) => t.mode === 'auto' && t.enabled).length}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Suggest Only</p>
                <p className="text-2xl font-bold">{tasks.filter((t) => t.mode === 'suggest' && t.enabled).length}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Global Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Global AI Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Default AI Model</Label>
              <Select value={defaultModel} onValueChange={setDefaultModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name} ({model.provider})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Execution Mode</Label>
              <Select value={globalMode} onValueChange={(v) => setGlobalMode(v as 'suggest' | 'auto')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suggest">Suggest Only (Human Review)</SelectItem>
                  <SelectItem value="auto">Auto-Execute</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {globalMode === 'suggest'
                  ? 'AI suggestions require human approval before execution'
                  : 'AI outputs are automatically applied without review'}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Confidence Threshold</Label>
                <span className="text-sm font-medium">{Math.round(confidenceThreshold[0] * 100)}%</span>
              </div>
              <Slider
                value={confidenceThreshold}
                onValueChange={setConfidenceThreshold}
                min={0.5}
                max={1}
                step={0.05}
              />
              <p className="text-xs text-muted-foreground">
                Auto-execute only when AI confidence exceeds this threshold
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Enable AI Logging</Label>
                <p className="text-xs text-muted-foreground">Log all AI inputs/outputs for audit</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Fallback to Human</Label>
                <p className="text-xs text-muted-foreground">Route to human if AI fails</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* AI Tasks */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Task Configuration
            </CardTitle>
            <CardDescription>Configure AI-assisted tasks per workflow step</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" defaultValue={['t1', 't2']}>
              {tasks.map((task) => (
                <AccordionItem key={task.id} value={task.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-2 rounded-lg bg-primary/10">{getTaskIcon(task.type)}</div>
                      <div className="text-left flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{task.name}</span>
                          {task.division && (
                            <Badge variant="outline" className="text-xs">
                              {task.division}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">{task.type}</p>
                      </div>
                      <div className="flex items-center gap-2 mr-4">
                        <Badge
                          className={
                            task.mode === 'auto'
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : 'bg-blue-500/10 text-blue-500'
                          }
                        >
                          {task.mode === 'auto' ? 'Auto-Execute' : 'Suggest Only'}
                        </Badge>
                        <Switch
                          checked={task.enabled}
                          onCheckedChange={() => toggleTask(task.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="space-y-2">
                        <Label>AI Model</Label>
                        <Select defaultValue={task.model}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {mockModels.map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Execution Mode</Label>
                        <Select defaultValue={task.mode}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="suggest">Suggest Only</SelectItem>
                            <SelectItem value="auto">Auto-Execute</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Custom Prompt (Optional)</Label>
                        <Textarea
                          placeholder="Override default prompt for this task..."
                          rows={3}
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Apply to Divisions</Label>
                        <Select defaultValue={task.division || 'all'}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Divisions</SelectItem>
                            <SelectItem value="Finance">Finance</SelectItem>
                            <SelectItem value="Legal">Legal</SelectItem>
                            <SelectItem value="Tax">Tax</SelectItem>
                            <SelectItem value="Operations">Operations</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>

      {/* Model Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Available AI Models</CardTitle>
          <CardDescription>Compare models for your workflow tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {mockModels.map((model) => (
              <Card key={model.id} className="border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    {model.name}
                    <Badge variant="outline">{model.provider}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Latency</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {model.avgLatency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cost/1K tokens</span>
                    <span>${model.costPerToken.toFixed(3)}</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Capabilities:</p>
                    <div className="flex flex-wrap gap-1">
                      {model.capabilities.map((cap) => (
                        <Badge key={cap} variant="secondary" className="text-xs capitalize">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIIntegration;
