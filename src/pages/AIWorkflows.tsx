import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Play, Plus, Settings, Zap, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const AIWorkflows = () => {
  const navigate = useNavigate();

  const handleWorkflowClick = (route: string | null) => {
    if (route) {
      window.scrollTo(0, 0);
      navigate(route);
    }
  };
  const workflows = [
    {
      id: '1',
      name: 'Invoice Processing',
      description: 'Automatically extract data from invoices and categorize transactions',
      status: 'active',
      lastRun: '2 hours ago',
      runs: 156,
      route: null,
    },
    {
      id: '2',
      name: 'Customer Onboarding',
      description: 'Automate document collection and verification for new customers',
      status: 'active',
      lastRun: '1 day ago',
      runs: 45,
      route: null,
    },
    {
      id: '3',
      name: 'Bank Reconciliation',
      description: 'Match bank transactions with invoices and bills automatically',
      status: 'paused',
      lastRun: '3 days ago',
      runs: 89,
      route: null,
    },
    {
      id: '4',
      name: 'AI Books',
      description: 'Intelligent bookkeeping automation with AI-powered categorization and reconciliation',
      status: 'active',
      lastRun: '5 hours ago',
      runs: 234,
      route: '/ai-bookkeeper',
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-violet-600" />
            <h1 className="text-2xl font-bold">AI Workflows</h1>
            <Badge variant="outline" className="bg-violet-500/10 text-violet-600 border-violet-500/20">
              Sandbox
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Create and manage AI-powered automation workflows
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Workflow
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">2</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Runs (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">290</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">98.2%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Your Workflows</h2>
        <div className="grid gap-4">
          {workflows.map((workflow) => (
            <Card 
              key={workflow.id} 
              className={`hover:shadow-md transition-shadow ${workflow.route ? 'cursor-pointer' : ''}`}
              onClick={() => handleWorkflowClick(workflow.route)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-violet-500/10">
                      <Sparkles className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{workflow.name}</h3>
                        <Badge 
                          variant="outline" 
                          className={workflow.status === 'active' 
                            ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                            : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                          }
                        >
                          {workflow.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{workflow.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{workflow.lastRun}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{workflow.runs} runs</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIWorkflows;
