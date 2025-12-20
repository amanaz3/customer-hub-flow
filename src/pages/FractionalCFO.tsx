import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  LineChart,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Target,
  Lightbulb,
  Brain,
  Sparkles,
  FileText,
  Calendar,
  RefreshCw,
  Settings,
  Download,
  Play,
  Zap,
  Shield,
  TrendingDown,
  Activity,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';

const FractionalCFO = () => {
  const [activeModule, setActiveModule] = useState('insights');

  // Mock KPI data
  const kpiData = {
    grossMargin: { value: 42.5, trend: 2.3, status: 'good' },
    burnRate: { value: 85000, trend: -5.2, status: 'warning' },
    runway: { value: 18, trend: 1, status: 'good' },
    currentRatio: { value: 2.1, trend: 0.3, status: 'good' },
    quickRatio: { value: 1.8, trend: -0.1, status: 'neutral' },
    debtToEquity: { value: 0.45, trend: -0.05, status: 'good' },
  };

  // Mock alerts
  const alerts = [
    { id: 1, type: 'warning', title: 'Cash Flow Alert', message: 'Projected cash deficit in 45 days based on current burn rate', module: 'forecasting' },
    { id: 2, type: 'info', title: 'Revenue Anomaly Detected', message: 'Q4 revenue 15% below trend - investigating seasonal patterns', module: 'insights' },
    { id: 3, type: 'success', title: 'Cost Optimization Opportunity', message: 'AI identified $12,000/month savings in SaaS subscriptions', module: 'advisory' },
  ];

  // Mock scenarios
  const scenarios = [
    { name: 'Base Case', revenue: 2400000, expenses: 1920000, profit: 480000, probability: 60 },
    { name: 'Conservative', revenue: 2000000, expenses: 1920000, profit: 80000, probability: 25 },
    { name: 'Optimistic', revenue: 2800000, expenses: 2000000, profit: 800000, probability: 15 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'danger': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fractional CFO</h1>
          <p className="text-muted-foreground">AI-powered financial analysis, forecasting, and strategic advisory</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Brain className="h-3 w-3" />
            AI-Powered
          </Badge>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Data
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Gross Margin</span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">{kpiData.grossMargin.value}%</span>
              <span className="text-xs text-green-500 ml-2">+{kpiData.grossMargin.trend}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Burn Rate</span>
              <TrendingDown className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">${(kpiData.burnRate.value / 1000).toFixed(0)}K</span>
              <span className="text-xs text-green-500 ml-2">{kpiData.burnRate.trend}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Runway</span>
              <Calendar className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">{kpiData.runway.value}</span>
              <span className="text-sm text-muted-foreground ml-1">months</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Current Ratio</span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">{kpiData.currentRatio.value}</span>
              <span className="text-xs text-green-500 ml-2">+{kpiData.currentRatio.trend}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Quick Ratio</span>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">{kpiData.quickRatio.value}</span>
              <span className="text-xs text-red-500 ml-2">{kpiData.quickRatio.trend}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">D/E Ratio</span>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">{kpiData.debtToEquity.value}</span>
              <span className="text-xs text-green-500 ml-2">{kpiData.debtToEquity.trend}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Alerts */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI-Generated Alerts & Insights
            </CardTitle>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                {getAlertIcon(alert.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{alert.title}</span>
                    <Badge variant="outline" className="text-xs">{alert.module}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{alert.message}</p>
                </div>
                <Button variant="ghost" size="sm">
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Modules */}
      <Tabs value={activeModule} onValueChange={setActiveModule} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
          <TabsTrigger value="insights" className="gap-2 py-3">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Insights & Analysis</span>
            <span className="sm:hidden">Insights</span>
          </TabsTrigger>
          <TabsTrigger value="forecasting" className="gap-2 py-3">
            <LineChart className="h-4 w-4" />
            <span className="hidden sm:inline">Forecasting</span>
            <span className="sm:hidden">Forecast</span>
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="gap-2 py-3">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Scenario Planning</span>
            <span className="sm:hidden">Scenarios</span>
          </TabsTrigger>
          <TabsTrigger value="advisory" className="gap-2 py-3">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Strategic Advisory</span>
            <span className="sm:hidden">Advisory</span>
          </TabsTrigger>
          <TabsTrigger value="dashboards" className="gap-2 py-3">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboards</span>
            <span className="sm:hidden">Dash</span>
          </TabsTrigger>
        </TabsList>

        {/* Financial Insights & Analysis */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">P&L Analysis</CardTitle>
                <CardDescription>AI-powered profit & loss insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Revenue</span>
                    <span className="font-medium">$2.4M</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>COGS</span>
                    <span className="font-medium">$1.38M</span>
                  </div>
                  <Progress value={57.5} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Operating Expenses</span>
                    <span className="font-medium">$540K</span>
                  </div>
                  <Progress value={22.5} className="h-2" />
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between font-medium">
                    <span>Net Income</span>
                    <span className="text-green-500">$480K</span>
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  <Brain className="h-4 w-4 mr-2" />
                  Generate AI Analysis
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Anomaly Detection</CardTitle>
                <CardDescription>ML-based pattern analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium text-sm">Expense Spike Detected</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Marketing spend increased 45% vs. previous quarter without corresponding revenue growth.</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-sm">Seasonal Pattern</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Revenue historically dips 12% in Q1 - consider adjusting cash reserves.</p>
                </div>
                <Button className="w-full" variant="outline">
                  <Zap className="h-4 w-4 mr-2" />
                  Run Deep Analysis
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">KPI Trends</CardTitle>
              <CardDescription>Historical performance with ML predictions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground border rounded-lg bg-muted/20">
                <div className="text-center">
                  <LineChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Interactive KPI charts will appear here</p>
                  <p className="text-xs mt-1">Powered by ML-based trend analysis</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forecasting */}
        <TabsContent value="forecasting" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Revenue Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">$2.8M</div>
                <p className="text-sm text-muted-foreground">Next 12 months (predicted)</p>
                <div className="flex items-center gap-1 mt-2 text-green-500 text-sm">
                  <ArrowUpRight className="h-4 w-4" />
                  <span>+16.7% YoY growth</span>
                </div>
                <Progress value={85} className="mt-4 h-2" />
                <p className="text-xs text-muted-foreground mt-1">85% confidence interval</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Cash Flow Projection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">$1.2M</div>
                <p className="text-sm text-muted-foreground">EOY cash position</p>
                <div className="flex items-center gap-1 mt-2 text-yellow-500 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Deficit risk in Q3</span>
                </div>
                <Progress value={72} className="mt-4 h-2" />
                <p className="text-xs text-muted-foreground mt-1">72% confidence interval</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Expense Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">$2.1M</div>
                <p className="text-sm text-muted-foreground">Projected annual expenses</p>
                <div className="flex items-center gap-1 mt-2 text-muted-foreground text-sm">
                  <Activity className="h-4 w-4" />
                  <span>+8.2% vs budget</span>
                </div>
                <Progress value={90} className="mt-4 h-2" />
                <p className="text-xs text-muted-foreground mt-1">90% confidence interval</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">ML-Powered Forecasts</CardTitle>
                  <CardDescription>Time series predictions using Prophet & LSTM models</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retrain Model
                  </Button>
                  <Button size="sm">
                    <Play className="h-4 w-4 mr-2" />
                    Generate Forecast
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center text-muted-foreground border rounded-lg bg-muted/20">
                <div className="text-center">
                  <LineChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Forecast visualization with confidence bands</p>
                  <p className="text-xs mt-1">Historical data + ML predictions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scenario Planning */}
        <TabsContent value="scenarios" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {scenarios.map((scenario, idx) => (
              <Card key={idx} className={cn(
                idx === 0 && "border-primary/50 bg-primary/5"
              )}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{scenario.name}</CardTitle>
                    <Badge variant={idx === 0 ? "default" : "outline"}>{scenario.probability}% likely</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Revenue</span>
                    <span className="font-medium">${(scenario.revenue / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Expenses</span>
                    <span className="font-medium">${(scenario.expenses / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm font-medium">Net Profit</span>
                    <span className={cn(
                      "font-bold",
                      scenario.profit > 200000 ? "text-green-500" : scenario.profit > 0 ? "text-yellow-500" : "text-red-500"
                    )}>
                      ${(scenario.profit / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <Button variant="outline" className="w-full mt-4" size="sm">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Scenario Modeler</CardTitle>
                  <CardDescription>Simulate different business conditions</CardDescription>
                </div>
                <Button>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Scenario
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Adjust Variables</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Revenue Growth</span>
                        <span>+15%</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Cost Reduction</span>
                        <span>-8%</span>
                      </div>
                      <Progress value={40} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Headcount Change</span>
                        <span>+3 FTEs</span>
                      </div>
                      <Progress value={30} className="h-2" />
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-4">Projected Impact</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">New Revenue</span>
                      <span className="font-medium text-green-500">$2.76M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">New Expenses</span>
                      <span className="font-medium">$1.85M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">EBITDA Change</span>
                      <span className="font-medium text-green-500">+$142K</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Runway Impact</span>
                      <span className="font-medium text-green-500">+4 months</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Strategic Advisory */}
        <TabsContent value="advisory" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  AI Recommendations
                </CardTitle>
                <CardDescription>Prioritized by ROI and risk assessment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg border bg-green-500/5 border-green-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Optimize SaaS Spend</span>
                    <Badge variant="outline" className="text-green-500">High ROI</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Consolidate 3 overlapping tools to save $12K/month with minimal disruption.</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="default">Accept</Button>
                    <Button size="sm" variant="outline">Details</Button>
                  </div>
                </div>

                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Renegotiate Vendor Contracts</span>
                    <Badge variant="outline">Medium ROI</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">3 contracts up for renewal - potential 15% savings based on market rates.</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Review</Button>
                  </div>
                </div>

                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Consider Line of Credit</span>
                    <Badge variant="outline" className="text-yellow-500">Advisory</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Current ratios support $500K facility at favorable terms for Q3 coverage.</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Explore Options</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Board-Ready Reports
                </CardTitle>
                <CardDescription>AI-generated executive summaries</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Monthly Financial Summary</span>
                      <p className="text-sm text-muted-foreground">Last generated: Dec 15, 2024</p>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Cash Flow Analysis</span>
                      <p className="text-sm text-muted-foreground">Last generated: Dec 18, 2024</p>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Strategic Roadmap Q1 2025</span>
                      <p className="text-sm text-muted-foreground">Draft - needs review</p>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button className="w-full">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate New Report
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Decision Engine</CardTitle>
              <CardDescription>AI-scored recommendations with human override capability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium text-sm">Recommendation</th>
                      <th className="text-center py-3 px-2 font-medium text-sm">ROI Score</th>
                      <th className="text-center py-3 px-2 font-medium text-sm">Risk Level</th>
                      <th className="text-center py-3 px-2 font-medium text-sm">Cash Impact</th>
                      <th className="text-center py-3 px-2 font-medium text-sm">Priority</th>
                      <th className="text-right py-3 px-2 font-medium text-sm">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 text-sm">Optimize cloud infrastructure</td>
                      <td className="py-3 px-2 text-center"><Badge variant="default">92</Badge></td>
                      <td className="py-3 px-2 text-center"><Badge variant="outline" className="text-green-500">Low</Badge></td>
                      <td className="py-3 px-2 text-center text-green-500">+$8K/mo</td>
                      <td className="py-3 px-2 text-center">1</td>
                      <td className="py-3 px-2 text-right"><Button size="sm" variant="outline">Review</Button></td>
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 text-sm">Accelerate AR collection</td>
                      <td className="py-3 px-2 text-center"><Badge variant="default">87</Badge></td>
                      <td className="py-3 px-2 text-center"><Badge variant="outline" className="text-yellow-500">Medium</Badge></td>
                      <td className="py-3 px-2 text-center text-green-500">+$45K</td>
                      <td className="py-3 px-2 text-center">2</td>
                      <td className="py-3 px-2 text-right"><Button size="sm" variant="outline">Review</Button></td>
                    </tr>
                    <tr className="hover:bg-muted/50">
                      <td className="py-3 px-2 text-sm">Expand to new market segment</td>
                      <td className="py-3 px-2 text-center"><Badge variant="secondary">68</Badge></td>
                      <td className="py-3 px-2 text-center"><Badge variant="outline" className="text-red-500">High</Badge></td>
                      <td className="py-3 px-2 text-center text-red-500">-$120K</td>
                      <td className="py-3 px-2 text-center">3</td>
                      <td className="py-3 px-2 text-right"><Button size="sm" variant="outline">Review</Button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dashboards */}
        <TabsContent value="dashboards" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="p-6 text-center">
                <PieChart className="h-12 w-12 mx-auto mb-3 text-primary" />
                <h3 className="font-medium">Revenue Breakdown</h3>
                <p className="text-sm text-muted-foreground mt-1">By product, region, segment</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="p-6 text-center">
                <LineChart className="h-12 w-12 mx-auto mb-3 text-primary" />
                <h3 className="font-medium">Cash Flow Trends</h3>
                <p className="text-sm text-muted-foreground mt-1">Historical + forecasted</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 text-primary" />
                <h3 className="font-medium">Expense Analysis</h3>
                <p className="text-sm text-muted-foreground mt-1">Category breakdown</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 mx-auto mb-3 text-primary" />
                <h3 className="font-medium">KPI Scoreboard</h3>
                <p className="text-sm text-muted-foreground mt-1">All metrics at a glance</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Custom Dashboard Builder</CardTitle>
                  <CardDescription>Drag and drop metrics to create personalized views</CardDescription>
                </div>
                <Button>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Dashboard
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground border rounded-lg bg-muted/20 border-dashed">
                <div className="text-center">
                  <LayoutDashboard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Drop widgets here to build your dashboard</p>
                  <p className="text-xs mt-1">KPIs, charts, alerts, and insights</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer with Model Feedback */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-primary" />
              <div>
                <span className="font-medium text-sm">ML Model Performance</span>
                <p className="text-xs text-muted-foreground">Last 30 days: 89% forecast accuracy | 94% anomaly detection rate</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retrain Models
              </Button>
              <Button variant="outline" size="sm">
                View Feedback History
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FractionalCFO;
