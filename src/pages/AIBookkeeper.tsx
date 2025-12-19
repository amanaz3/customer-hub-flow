import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  Scale, 
  BarChart3, 
  Receipt, 
  FileSearch, 
  TrendingUp,
  FlaskConical,
  History,
  Brain
} from 'lucide-react';
import { BillUpload } from '@/components/Bookkeeper/BillUpload';
import { ReconciliationView } from '@/components/Bookkeeper/ReconciliationView';
import { AnalyticsDashboard } from '@/components/Bookkeeper/AnalyticsDashboard';
import { TransactionHistory } from '@/components/Bookkeeper/TransactionHistory';
import { AIWorkflowDashboard } from '@/components/Bookkeeper/AIWorkflowDashboard';
import { useBookkeeper } from '@/hooks/useBookkeeper';

export default function AIBookkeeper() {
  const [demoMode, setDemoMode] = useState(false);
  const { bills, invoices, loading } = useBookkeeper(demoMode);

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Bookkeeper</h1>
            <p className="text-muted-foreground">
              Automated bookkeeping with OCR bill capture, reconciliation, and cash flow forecasting
            </p>
          </div>
          
          {/* Demo Mode Toggle */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
            <FlaskConical className="h-4 w-4 text-primary" />
            <Label htmlFor="demo-mode" className="text-sm font-medium cursor-pointer">
              Demo Mode
            </Label>
            <Switch
              id="demo-mode"
              checked={demoMode}
              onCheckedChange={setDemoMode}
            />
            {demoMode && (
              <Badge variant="secondary" className="ml-1">
                Sample Data
              </Badge>
            )}
          </div>
        </div>

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
              <span className="sm:hidden">AI</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
              <span className="sm:hidden">List</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Bill Capture</span>
              <span className="sm:hidden">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="reconciliation" className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              <span className="hidden sm:inline">Reconciliation</span>
              <span className="sm:hidden">Reconcile</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
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
      </div>
  );
}
