import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Workflow, 
  Plus, 
  Play, 
  Pause, 
  Settings, 
  Trash2, 
  Copy, 
  ArrowRight,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  GitBranch,
  Database,
  Mail,
  MessageSquare,
  FileText,
  Users,
  Calendar,
  Bell,
  Filter,
  MoreVertical,
  Edit,
  Eye,
  ChevronRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock workflow data
const mockWorkflows = [
  {
    id: '1',
    name: 'New Customer Onboarding',
    description: 'Automated workflow for onboarding new customers',
    status: 'active',
    trigger: 'Customer Created',
    steps: 5,
    lastRun: '2 hours ago',
    runs: 156,
    successRate: 98.2,
  },
  {
    id: '2',
    name: 'Application Status Update',
    description: 'Notify stakeholders when application status changes',
    status: 'active',
    trigger: 'Status Change',
    steps: 3,
    lastRun: '30 minutes ago',
    runs: 432,
    successRate: 99.5,
  },
  {
    id: '3',
    name: 'Document Reminder',
    description: 'Send reminders for pending document uploads',
    status: 'paused',
    trigger: 'Schedule (Daily)',
    steps: 4,
    lastRun: '1 day ago',
    runs: 89,
    successRate: 95.1,
  },
  {
    id: '4',
    name: 'Invoice Generation',
    description: 'Auto-generate invoices on service completion',
    status: 'draft',
    trigger: 'Service Completed',
    steps: 6,
    lastRun: 'Never',
    runs: 0,
    successRate: 0,
  },
];

const triggerTypes = [
  { id: 'customer_created', name: 'Customer Created', icon: Users },
  { id: 'status_change', name: 'Status Change', icon: GitBranch },
  { id: 'document_uploaded', name: 'Document Uploaded', icon: FileText },
  { id: 'schedule', name: 'Schedule', icon: Calendar },
  { id: 'webhook', name: 'Webhook', icon: Zap },
  { id: 'manual', name: 'Manual Trigger', icon: Play },
];

const actionTypes = [
  { id: 'send_email', name: 'Send Email', icon: Mail },
  { id: 'send_notification', name: 'Send Notification', icon: Bell },
  { id: 'update_record', name: 'Update Record', icon: Database },
  { id: 'create_task', name: 'Create Task', icon: CheckCircle2 },
  { id: 'send_sms', name: 'Send SMS', icon: MessageSquare },
  { id: 'conditional', name: 'Conditional Branch', icon: GitBranch },
  { id: 'delay', name: 'Delay', icon: Clock },
  { id: 'filter', name: 'Filter', icon: Filter },
];

const WorkflowBuilder: React.FC = () => {
  const [activeTab, setActiveTab] = useState('workflows');
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Paused</Badge>;
      case 'draft':
        return <Badge className="bg-muted text-muted-foreground">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Workflow className="h-8 w-8 text-primary" />
            </div>
            Workflow Builder
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage automated workflows for your business processes
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Workflow
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Workflows</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <Workflow className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-500">8</p>
              </div>
              <Play className="h-8 w-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Runs Today</p>
                <p className="text-2xl font-bold">247</p>
              </div>
              <Zap className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-green-500">98.5%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="workflows">My Workflows</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">Run History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <Input placeholder="Search workflows..." className="max-w-sm" />
            <Select defaultValue="all">
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Workflow List */}
          <div className="grid gap-4">
            {mockWorkflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Workflow className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{workflow.name}</h3>
                          {getStatusBadge(workflow.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{workflow.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Trigger: {workflow.trigger}
                          </span>
                          <span className="flex items-center gap-1">
                            <GitBranch className="h-3 w-3" />
                            {workflow.steps} steps
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last run: {workflow.lastRun}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-medium">{workflow.runs} runs</p>
                        <p className="text-xs text-muted-foreground">
                          {workflow.successRate > 0 ? `${workflow.successRate}% success` : 'No runs yet'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {workflow.status === 'active' ? (
                          <Button variant="outline" size="icon">
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="outline" size="icon">
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="outline" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="h-4 w-4 mr-2" />
                              Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Customer Onboarding', description: 'Welcome new customers with automated emails and tasks', category: 'Sales' },
              { name: 'Document Collection', description: 'Request and track required documents', category: 'Operations' },
              { name: 'Payment Reminder', description: 'Send automated payment reminders', category: 'Finance' },
              { name: 'Status Notifications', description: 'Notify stakeholders on status changes', category: 'Communication' },
              { name: 'Task Assignment', description: 'Auto-assign tasks based on criteria', category: 'Operations' },
              { name: 'Report Generation', description: 'Generate and send periodic reports', category: 'Reporting' },
            ].map((template, idx) => (
              <Card key={idx} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{template.category}</Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Workflow Runs</CardTitle>
              <CardDescription>View the execution history of your workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { workflow: 'New Customer Onboarding', status: 'success', time: '2 minutes ago', duration: '1.2s' },
                  { workflow: 'Application Status Update', status: 'success', time: '15 minutes ago', duration: '0.8s' },
                  { workflow: 'New Customer Onboarding', status: 'success', time: '1 hour ago', duration: '1.5s' },
                  { workflow: 'Document Reminder', status: 'failed', time: '2 hours ago', duration: '0.3s' },
                  { workflow: 'Application Status Update', status: 'success', time: '3 hours ago', duration: '0.9s' },
                ].map((run, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {run.status === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      )}
                      <div>
                        <p className="font-medium">{run.workflow}</p>
                        <p className="text-sm text-muted-foreground">{run.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={run.status === 'success' ? 'default' : 'destructive'}>
                        {run.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{run.duration}</span>
                      <Button variant="ghost" size="sm">
                        View Logs
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Settings</CardTitle>
              <CardDescription>Configure global workflow settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Workflow Notifications</Label>
                  <p className="text-sm text-muted-foreground">Get notified when workflows fail or complete</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-retry Failed Workflows</Label>
                  <p className="text-sm text-muted-foreground">Automatically retry failed workflow runs</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Workflow Logging</Label>
                  <p className="text-sm text-muted-foreground">Enable detailed logging for debugging</p>
                </div>
                <Switch />
              </div>
              <div className="space-y-2">
                <Label>Default Timezone</Label>
                <Select defaultValue="utc">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc">UTC</SelectItem>
                    <SelectItem value="est">Eastern Time (EST)</SelectItem>
                    <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                    <SelectItem value="gmt">GMT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkflowBuilder;
