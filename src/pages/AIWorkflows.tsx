import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Sparkles, Play, Plus, Settings, Zap, Clock, CheckCircle2, 
  BookOpen, FlaskConical, Upload, Scale, BarChart3, Receipt, 
  FileSearch, TrendingUp, History, Brain, LayoutGrid, Workflow, Landmark
} from 'lucide-react';
import { BillUpload } from '@/components/Bookkeeper/BillUpload';
import { ReconciliationView } from '@/components/Bookkeeper/ReconciliationView';
import { AnalyticsDashboard } from '@/components/Bookkeeper/AnalyticsDashboard';
import { TransactionHistory } from '@/components/Bookkeeper/TransactionHistory';
import { AIWorkflowDashboard } from '@/components/Bookkeeper/AIWorkflowDashboard';
import { EnhancedWorkflow } from '@/components/Bookkeeper/EnhancedWorkflow';
import { useBookkeeper } from '@/hooks/useBookkeeper';
import { LeanBankConnection, LeanTransactionFeed, LeanSyncStatus } from '@/components/Bookkeeper/LeanIntegration';

const AIWorkflows = () => {
  const [activeSection, setActiveSection] = useState<'workflows' | 'books'>('workflows');
  const [demoMode, setDemoMode] = useState(false);
  const [viewMode, setViewMode] = useState<'workflow' | 'classic' | 'banking'>('workflow');
  const [leanEnabled, setLeanEnabled] = useState(false);
  const { bills, invoices, loading } = useBookkeeper(demoMode);

  const workflows = [
    {
      id: '1',
      name: 'Invoice Processing',
      description: 'Automatically extract data from invoices and categorize transactions',
      status: 'active',
      lastRun: '2 hours ago',
      runs: 156,
    },
    {
      id: '2',
      name: 'Customer Onboarding',
      description: 'Automate document collection and verification for new customers',
      status: 'active',
      lastRun: '1 day ago',
      runs: 45,
    },
    {
      id: '3',
      name: 'Bank Reconciliation',
      description: 'Match bank transactions with invoices and bills automatically',
      status: 'paused',
      lastRun: '3 days ago',
      runs: 89,
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-violet-600" />
            <h1 className="text-2xl font-bold">AI Workflows</h1>
            <Badge variant="outline" className="bg-violet-500/10 text-violet-600 border-violet-500/20">
              Sandbox
            </Badge>
          </div>
          <p className="text-muted-foreground">
            AI-powered automation workflows and bookkeeping
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Section Toggle */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={activeSection === 'workflows' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveSection('workflows')}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Workflows</span>
            </Button>
            <Button
              variant={activeSection === 'books' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveSection('books')}
              className="gap-2"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">AI Books</span>
            </Button>
          </div>

          {activeSection === 'books' && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
              <FlaskConical className="h-4 w-4 text-primary" />
              <Label htmlFor="demo-mode" className="text-sm font-medium cursor-pointer">
                Demo
              </Label>
              <Switch
                id="demo-mode"
                checked={demoMode}
                onCheckedChange={setDemoMode}
              />
            </div>
          )}

          {activeSection === 'workflows' && (
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Workflow
            </Button>
          )}
        </div>
      </div>

      {activeSection === 'workflows' ? (
        <>
          {/* Workflows Stats */}
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

          {/* Workflows List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Your Workflows</h2>
            <div className="grid gap-4">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="hover:shadow-md transition-shadow">
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
                          <Button variant="outline" size="sm">
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
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
        </>
      ) : (
        <>
          {/* AI Books Section */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
              <Button
                variant={viewMode === 'workflow' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('workflow')}
                className="gap-2"
              >
                <Workflow className="h-4 w-4" />
                <span className="hidden sm:inline">Workflow</span>
              </Button>
              <Button
                variant={viewMode === 'classic' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('classic')}
                className="gap-2"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Classic</span>
              </Button>
              <Button
                variant={viewMode === 'banking' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('banking')}
                className="gap-2"
              >
                <Landmark className="h-4 w-4" />
                <span className="hidden sm:inline">Banking</span>
              </Button>
            </div>
            {demoMode && (
              <Badge variant="secondary">Sample Data</Badge>
            )}
          </div>

          {viewMode === 'workflow' ? (
            <EnhancedWorkflow demoMode={demoMode} />
          ) : viewMode === 'banking' ? (
            <div className="space-y-6">
              <LeanSyncStatus leanEnabled={leanEnabled} demoMode={demoMode} />
              <LeanBankConnection 
                leanEnabled={leanEnabled} 
                onLeanToggle={setLeanEnabled}
                demoMode={demoMode}
              />
              <LeanTransactionFeed 
                leanEnabled={leanEnabled} 
                demoMode={demoMode}
                onImportToWorkflow={(txs) => {
                  console.log('Importing transactions to workflow:', txs);
                }}
              />
            </div>
          ) : (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <Receipt className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Bills</p>
                        <p className="text-2xl font-bold">{bills.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                        <FileSearch className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Invoices</p>
                        <p className="text-2xl font-bold">{invoices.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                        <Scale className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pending Payables</p>
                        <p className="text-2xl font-bold">
                          {bills.filter(b => !b.is_paid).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pending Receivables</p>
                        <p className="text-2xl font-bold">
                          {invoices.filter(i => !i.is_paid).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Tabs */}
              <Tabs defaultValue="workflow" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
                  <TabsTrigger value="workflow" className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    <span className="hidden sm:inline">AI Workflow</span>
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    <span className="hidden sm:inline">History</span>
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline">Bill Capture</span>
                  </TabsTrigger>
                  <TabsTrigger value="reconciliation" className="flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    <span className="hidden sm:inline">Reconciliation</span>
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Analytics</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="workflow">
                  <AIWorkflowDashboard />
                </TabsContent>
                
                <TabsContent value="history">
                  <TransactionHistory demoMode={demoMode} />
                </TabsContent>
                
                <TabsContent value="upload">
                  <BillUpload demoMode={demoMode} />
                </TabsContent>
                
                <TabsContent value="reconciliation">
                  <ReconciliationView demoMode={demoMode} />
                </TabsContent>
                
                <TabsContent value="analytics">
                  <AnalyticsDashboard demoMode={demoMode} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AIWorkflows;
