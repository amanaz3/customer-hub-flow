import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Workflow, Building2, GitBranch, Layers, Brain, FileText, Activity } from 'lucide-react';

import OrgStructureTab from '@/components/workflow/OrgStructureTab';
import WorkflowDesigner from '@/components/workflow/WorkflowDesigner';
import QueueManagement from '@/components/workflow/QueueManagement';
import AuditMonitoring from '@/components/workflow/AuditMonitoring';
import AIIntegration from '@/components/workflow/AIIntegration';

const WorkflowBuilder: React.FC = () => {
  const [activeTab, setActiveTab] = useState('org-structure');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Workflow className="h-8 w-8 text-primary" />
            </div>
            SME Workflow Builder
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure org structure, workflows, AI tasks, queues, and monitoring
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Divisions</p>
                <p className="text-2xl font-bold">4</p>
              </div>
              <Building2 className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Workflows</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <GitBranch className="h-8 w-8 text-blue-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Queues</p>
                <p className="text-2xl font-bold">4</p>
              </div>
              <Layers className="h-8 w-8 text-green-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Tasks</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <Brain className="h-8 w-8 text-purple-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Executions Today</p>
                <p className="text-2xl font-bold">47</p>
              </div>
              <Activity className="h-8 w-8 text-yellow-500/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="org-structure" className="gap-2">
            <Building2 className="h-4 w-4" />
            Org Structure
          </TabsTrigger>
          <TabsTrigger value="workflow-designer" className="gap-2">
            <GitBranch className="h-4 w-4" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="queue-management" className="gap-2">
            <Layers className="h-4 w-4" />
            Queues
          </TabsTrigger>
          <TabsTrigger value="ai-integration" className="gap-2">
            <Brain className="h-4 w-4" />
            AI/LangChain
          </TabsTrigger>
          <TabsTrigger value="audit-monitoring" className="gap-2">
            <FileText className="h-4 w-4" />
            Audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="org-structure" className="mt-6">
          <OrgStructureTab />
        </TabsContent>

        <TabsContent value="workflow-designer" className="mt-6">
          <WorkflowDesigner />
        </TabsContent>

        <TabsContent value="queue-management" className="mt-6">
          <QueueManagement />
        </TabsContent>

        <TabsContent value="ai-integration" className="mt-6">
          <AIIntegration />
        </TabsContent>

        <TabsContent value="audit-monitoring" className="mt-6">
          <AuditMonitoring />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkflowBuilder;
