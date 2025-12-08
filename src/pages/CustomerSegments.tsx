import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  DollarSign,
  Repeat,
  Star,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Target,
  ArrowRight,
  Zap,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Loader2,
  Building2,
  Briefcase
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Treemap } from 'recharts';

interface BusinessBreakdown {
  licenseTypes: Record<string, number>;
  jurisdictions: Record<string, number>;
  industries: Record<string, { count: number; revenue: number }>;
}

interface IndustryData {
  name: string;
  count: number;
  revenue: number;
  percentage: number;
}

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  'Real Estate': ['real estate', 'property', 'properties', 'realty', 'land', 'building', 'construction estate', 'brokerage'],
  'Gold & Diamonds': ['gold', 'diamond', 'jewelry', 'jewellery', 'precious', 'gems', 'bullion', 'ornaments'],
  'Trading': ['trading', 'import', 'export', 'general trading', 'wholesale', 'commodities', 'merchandise'],
  'Technology': ['tech', 'software', 'it ', 'digital', 'computer', 'app', 'saas', 'ai', 'cyber', 'data'],
  'Consulting': ['consult', 'advisory', 'management consult', 'business consult', 'strategy'],
  'Construction': ['construction', 'contracting', 'building', 'civil', 'infrastructure', 'engineering'],
  'Food & Beverage': ['food', 'restaurant', 'catering', 'beverage', 'cafe', 'hospitality', 'kitchen'],
  'Healthcare': ['health', 'medical', 'pharma', 'clinic', 'hospital', 'dental', 'wellness'],
  'Logistics': ['transport', 'logistics', 'shipping', 'freight', 'cargo', 'delivery', 'courier'],
  'Financial Services': ['finance', 'investment', 'bank', 'insurance', 'capital', 'fund', 'asset'],
  'Retail': ['retail', 'shop', 'store', 'ecommerce', 'supermarket', 'mall'],
  'Manufacturing': ['manufactur', 'factory', 'production', 'industrial', 'assembly'],
  'Tourism & Hospitality': ['tourism', 'travel', 'hotel', 'tour', 'airline', 'resort'],
  'Media & Marketing': ['media', 'marketing', 'advertising', 'digital marketing', 'pr ', 'events', 'creative'],
  'Education': ['education', 'training', 'school', 'academy', 'learning', 'institute', 'coaching'],
  'Automotive': ['auto', 'car', 'vehicle', 'motor', 'garage', 'spare parts'],
  'Oil & Gas': ['oil', 'gas', 'petroleum', 'energy', 'fuel'],
  'Legal Services': ['legal', 'law', 'attorney', 'advocate', 'notary'],
};

const extractIndustry = (data: Record<string, any>, companyName?: string): string => {
  const fieldsToCheck = [
    data.business_activity_details,
    data.proposed_activity,
    data.step2?.business_activity_details,
    data.step2?.proposed_activity,
    data.step3?.business_activity_details,
    data.step3?.proposed_activity,
    data.business_activity,
    data.activity_type,
    data.company_activity,
    companyName,
  ];

  const combinedText = fieldsToCheck.filter(Boolean).join(' ').toLowerCase();
  
  if (!combinedText) return 'Other';

  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (keywords.some(keyword => combinedText.includes(keyword))) {
      return industry;
    }
  }
  
  return 'Other';
};

interface CustomerSegment {
  name: string;
  count: number;
  totalRevenue: number;
  avgRevenue: number;
  repeatRate: number;
  growthPotential: 'high' | 'medium' | 'low';
  description: string;
  businessBreakdown: BusinessBreakdown;
}

interface AIAnalysis {
  summary: string;
  segmentInsights: Array<{
    segment: string;
    health: string;
    reason: string;
    opportunity: string;
    risk: string;
  }>;
  retentionStrategies: Array<{
    segment: string;
    strategy: string;
    expectedImpact: string;
    timeline: string;
  }>;
  upsellOpportunities: Array<{
    fromSegment: string;
    toSegment: string;
    action: string;
    potentialRevenue: string;
  }>;
  actionPlan: Array<{
    priority: number;
    action: string;
    targetSegment: string;
    expectedOutcome: string;
  }>;
  revenueOptimization: {
    focusAreas: string[];
    quickWins: string[];
    longTermStrategies: string[];
  };
  warnings: Array<{
    type: string;
    message: string;
    affectedSegments: string[];
    urgency: string;
  }>;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const CustomerSegments = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    insights: true,
    retention: false,
    upsell: false,
    actionPlan: false,
    optimization: false,
    warnings: false
  });
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to access this page");
        navigate('/');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        toast.error("Access denied. Admin privileges required.");
        navigate('/');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const { data: segmentData, isLoading: segmentsLoading } = useQuery({
    queryKey: ['customer-segments-analytics'],
    queryFn: async () => {
      const { data: customers, error } = await supabase
        .from('customers')
        .select(`
          id,
          name,
          company,
          amount,
          status,
          created_at,
          product_id,
          license_type,
          jurisdiction,
          products(name)
        `);

      if (error) throw error;

      const { data: applications } = await supabase
        .from('account_applications')
        .select('customer_id, status, created_at, application_data');

      // Create customer lookup
      const customerLookup = new Map(customers?.map(c => [c.id, c]) || []);

      const customerMap = new Map<string, {
        totalRevenue: number;
        applicationCount: number;
        statuses: string[];
        productTypes: string[];
        licenseType: string;
        jurisdiction: string | null;
        industry: string;
      }>();

      // Global industry tracking
      const globalIndustryMap = new Map<string, { count: number; revenue: number }>();

      customers?.forEach(customer => {
        const existing = customerMap.get(customer.id) || {
          totalRevenue: 0,
          applicationCount: 0,
          statuses: [],
          productTypes: [],
          licenseType: customer.license_type || 'Unknown',
          jurisdiction: customer.jurisdiction,
          industry: 'Other'
        };
        existing.totalRevenue += Number(customer.amount) || 0;
        existing.licenseType = customer.license_type || 'Unknown';
        existing.jurisdiction = customer.jurisdiction;
        if (customer.products?.name) {
          existing.productTypes.push(customer.products.name);
        }
        customerMap.set(customer.id, existing);
      });

      // Process applications for industry extraction
      const processedCustomers = new Set<string>();
      applications?.forEach(app => {
        if (app.customer_id && customerMap.has(app.customer_id)) {
          const existing = customerMap.get(app.customer_id)!;
          existing.applicationCount++;
          existing.statuses.push(app.status);
          
          // Extract industry from application_data
          if (!processedCustomers.has(app.customer_id)) {
            const appData = app.application_data as Record<string, any> | null;
            const customer = customerLookup.get(app.customer_id);
            if (appData) {
              existing.industry = extractIndustry(appData, customer?.company);
            }
            processedCustomers.add(app.customer_id);
            
            // Track global industry
            const ind = existing.industry;
            const indData = globalIndustryMap.get(ind) || { count: 0, revenue: 0 };
            globalIndustryMap.set(ind, { 
              count: indData.count + 1, 
              revenue: indData.revenue + existing.totalRevenue 
            });
          }
          
          customerMap.set(app.customer_id, existing);
        }
      });

      const createEmptyBreakdown = (): BusinessBreakdown => ({
        licenseTypes: {},
        jurisdictions: {},
        industries: {}
      });

      const addToBreakdown = (breakdown: BusinessBreakdown, licenseType: string, jurisdiction: string | null, industry: string, revenue: number) => {
        breakdown.licenseTypes[licenseType] = (breakdown.licenseTypes[licenseType] || 0) + 1;
        const jur = jurisdiction || 'Not Specified';
        breakdown.jurisdictions[jur] = (breakdown.jurisdictions[jur] || 0) + 1;
        const indData = breakdown.industries[industry] || { count: 0, revenue: 0 };
        breakdown.industries[industry] = { count: indData.count + 1, revenue: indData.revenue + revenue };
      };

      let highValueRepeat = { count: 0, totalRevenue: 0, breakdown: createEmptyBreakdown() };
      let growthPotential = { count: 0, totalRevenue: 0, breakdown: createEmptyBreakdown() };
      let newCustomers = { count: 0, totalRevenue: 0, breakdown: createEmptyBreakdown() };
      let atRisk = { count: 0, totalRevenue: 0, breakdown: createEmptyBreakdown() };
      let dormant = { count: 0, totalRevenue: 0, breakdown: createEmptyBreakdown() };

      customerMap.forEach((data) => {
        if (data.applicationCount >= 2 && data.totalRevenue > 10000) {
          highValueRepeat.count++;
          highValueRepeat.totalRevenue += data.totalRevenue;
          addToBreakdown(highValueRepeat.breakdown, data.licenseType, data.jurisdiction, data.industry, data.totalRevenue);
        } else if (data.applicationCount === 1 && data.totalRevenue > 5000) {
          growthPotential.count++;
          growthPotential.totalRevenue += data.totalRevenue;
          addToBreakdown(growthPotential.breakdown, data.licenseType, data.jurisdiction, data.industry, data.totalRevenue);
        } else if (data.applicationCount <= 1 && data.totalRevenue <= 5000) {
          newCustomers.count++;
          newCustomers.totalRevenue += data.totalRevenue;
          addToBreakdown(newCustomers.breakdown, data.licenseType, data.jurisdiction, data.industry, data.totalRevenue);
        } else if (data.statuses.includes('rejected')) {
          atRisk.count++;
          atRisk.totalRevenue += data.totalRevenue;
          addToBreakdown(atRisk.breakdown, data.licenseType, data.jurisdiction, data.industry, data.totalRevenue);
        } else {
          dormant.count++;
          dormant.totalRevenue += data.totalRevenue;
          addToBreakdown(dormant.breakdown, data.licenseType, data.jurisdiction, data.industry, data.totalRevenue);
        }
      });

      const segments: CustomerSegment[] = [];

      segments.push({
        name: 'High-Value Repeat',
        count: highValueRepeat.count,
        totalRevenue: highValueRepeat.totalRevenue,
        avgRevenue: highValueRepeat.count > 0 ? highValueRepeat.totalRevenue / highValueRepeat.count : 0,
        repeatRate: 85,
        growthPotential: 'high',
        description: 'Multiple applications, high revenue - prioritize retention',
        businessBreakdown: highValueRepeat.breakdown
      });

      segments.push({
        name: 'Growth Potential',
        count: growthPotential.count,
        totalRevenue: growthPotential.totalRevenue,
        avgRevenue: growthPotential.count > 0 ? growthPotential.totalRevenue / growthPotential.count : 0,
        repeatRate: 40,
        growthPotential: 'high',
        description: 'Single service, good revenue - upsell opportunity',
        businessBreakdown: growthPotential.breakdown
      });

      segments.push({
        name: 'New Customers',
        count: newCustomers.count,
        totalRevenue: newCustomers.totalRevenue,
        avgRevenue: newCustomers.count > 0 ? newCustomers.totalRevenue / newCustomers.count : 0,
        repeatRate: 20,
        growthPotential: 'medium',
        description: 'Recent signups - nurture and onboard',
        businessBreakdown: newCustomers.breakdown
      });

      segments.push({
        name: 'At-Risk',
        count: atRisk.count,
        totalRevenue: atRisk.totalRevenue,
        avgRevenue: atRisk.count > 0 ? atRisk.totalRevenue / atRisk.count : 0,
        repeatRate: 10,
        growthPotential: 'low',
        description: 'Rejected applications - needs attention',
        businessBreakdown: atRisk.breakdown
      });

      segments.push({
        name: 'Dormant',
        count: dormant.count,
        totalRevenue: dormant.totalRevenue,
        avgRevenue: dormant.count > 0 ? dormant.totalRevenue / dormant.count : 0,
        repeatRate: 5,
        growthPotential: 'low',
        description: 'No recent activity - re-engagement needed',
        businessBreakdown: dormant.breakdown
      });

      // Convert global industry map to array for charts
      const totalIndustryCount = Array.from(globalIndustryMap.values()).reduce((a, b) => a + b.count, 0);
      const industryData: IndustryData[] = Array.from(globalIndustryMap.entries())
        .map(([name, data]) => ({
          name,
          count: data.count,
          revenue: data.revenue,
          percentage: totalIndustryCount > 0 ? Math.round((data.count / totalIndustryCount) * 100) : 0
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 15);

      return {
        segments,
        industryData,
        totalCustomers: customerMap.size,
        totalRevenue: Array.from(customerMap.values()).reduce((sum, c) => sum + c.totalRevenue, 0)
      };
    },
    enabled: isAdmin
  });

  const runAIAnalysis = async () => {
    if (!segmentData) return;
    
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-customer-segments', {
        body: {
          segments: segmentData.segments,
          totalCustomers: segmentData.totalCustomers,
          totalRevenue: segmentData.totalRevenue
        }
      });

      if (error) throw error;
      setAiAnalysis(data);
      toast.success('AI analysis completed');
    } catch (error) {
      console.error('AI analysis error:', error);
      toast.error('Failed to run AI analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Healthy</Badge>;
      case 'attention':
        return <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30"><AlertTriangle className="h-3 w-3 mr-1" />Attention</Badge>;
      case 'critical':
        return <Badge className="bg-red-500/20 text-red-700 border-red-500/30"><ShieldAlert className="h-3 w-3 mr-1" />Critical</Badge>;
      default:
        return <Badge variant="secondary">{health}</Badge>;
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return <Badge className="bg-emerald-500/20 text-emerald-700">High Impact</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500/20 text-amber-700">Medium Impact</Badge>;
      case 'low':
        return <Badge className="bg-slate-500/20 text-slate-700">Low Impact</Badge>;
      default:
        return <Badge variant="secondary">{impact}</Badge>;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return <Badge className="bg-red-500/20 text-red-700">Urgent</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500/20 text-amber-700">Medium</Badge>;
      case 'low':
        return <Badge className="bg-slate-500/20 text-slate-700">Low</Badge>;
      default:
        return <Badge variant="secondary">{urgency}</Badge>;
    }
  };

  if (loading || segmentsLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  const segments = segmentData?.segments || [];
  const industryData = segmentData?.industryData || [];
  
  const chartData = segments.map(s => ({
    name: s.name,
    customers: s.count,
    revenue: s.totalRevenue
  }));

  const pieData = segments.map(s => ({
    name: s.name,
    value: s.count
  }));

  // Industry chart data
  const industryChartData = industryData.map(ind => ({
    name: ind.name,
    revenue: ind.revenue,
    count: ind.count
  }));

  const industryPieData = industryData.map(ind => ({
    name: ind.name,
    value: ind.revenue
  }));

  // Treemap data for industry
  const industryTreemapData = industryData.map((ind, idx) => ({
    name: ind.name,
    size: ind.revenue,
    fill: COLORS[idx % COLORS.length]
  }));

  const getGrowthBadge = (potential: string) => {
    switch (potential) {
      case 'high':
        return <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">High Growth</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30">Medium</Badge>;
      default:
        return <Badge className="bg-red-500/20 text-red-700 border-red-500/30">Low</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Segments</h1>
          <p className="text-muted-foreground">
            Recurring revenue analysis and growth potential by customer segment
          </p>
        </div>
        <Button 
          onClick={runAIAnalysis} 
          disabled={isAnalyzing}
          className="gap-2"
        >
          {isAnalyzing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{segmentData?.totalCustomers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">AED {(segmentData?.totalRevenue || 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">High Growth Segments</p>
                <p className="text-2xl font-bold">{segments.filter(s => s.growthPotential === 'high').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <Repeat className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Repeat Rate</p>
                <p className="text-2xl font-bold">
                  {segments.length > 0 
                    ? Math.round(segments.reduce((sum, s) => sum + s.repeatRate, 0) / segments.length)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Section */}
      {aiAnalysis && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI-Powered Segment Analysis
            </CardTitle>
            <CardDescription>{aiAnalysis.summary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Segment Insights */}
            <Collapsible open={expandedSections.insights} onOpenChange={() => toggleSection('insights')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold">Segment Health Insights</span>
                    <Badge variant="secondary">{aiAnalysis.segmentInsights?.length || 0}</Badge>
                  </div>
                  {expandedSections.insights ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 px-4 pb-4">
                {aiAnalysis.segmentInsights?.map((insight, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{insight.segment}</span>
                      {getHealthBadge(insight.health)}
                    </div>
                    <p className="text-sm text-muted-foreground"><strong>Reason:</strong> {insight.reason}</p>
                    <p className="text-sm text-emerald-700"><strong>Opportunity:</strong> {insight.opportunity}</p>
                    {insight.risk && <p className="text-sm text-red-700"><strong>Risk:</strong> {insight.risk}</p>}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Retention Strategies */}
            <Collapsible open={expandedSections.retention} onOpenChange={() => toggleSection('retention')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-600" />
                    <span className="font-semibold">Retention Strategies</span>
                    <Badge variant="secondary">{aiAnalysis.retentionStrategies?.length || 0}</Badge>
                  </div>
                  {expandedSections.retention ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 px-4 pb-4">
                {aiAnalysis.retentionStrategies?.map((strategy, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-muted/50 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{strategy.segment}</Badge>
                        {getImpactBadge(strategy.expectedImpact)}
                      </div>
                      <p className="text-sm">{strategy.strategy}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {strategy.timeline}
                      </p>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Upsell Opportunities */}
            <Collapsible open={expandedSections.upsell} onOpenChange={() => toggleSection('upsell')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                    <span className="font-semibold">Upsell Opportunities</span>
                    <Badge variant="secondary">{aiAnalysis.upsellOpportunities?.length || 0}</Badge>
                  </div>
                  {expandedSections.upsell ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 px-4 pb-4">
                {aiAnalysis.upsellOpportunities?.map((opp, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{opp.fromSegment}</Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Badge className="bg-emerald-500/20 text-emerald-700">{opp.toSegment}</Badge>
                    </div>
                    <p className="text-sm">{opp.action}</p>
                    <p className="text-xs text-emerald-600 font-medium">Potential: {opp.potentialRevenue}</p>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Action Plan */}
            <Collapsible open={expandedSections.actionPlan} onOpenChange={() => toggleSection('actionPlan')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-purple-600" />
                    <span className="font-semibold">Prioritized Action Plan</span>
                    <Badge variant="secondary">{aiAnalysis.actionPlan?.length || 0}</Badge>
                  </div>
                  {expandedSections.actionPlan ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 px-4 pb-4">
                {aiAnalysis.actionPlan?.sort((a, b) => a.priority - b.priority).map((action, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-muted/50 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      {action.priority}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{action.action}</span>
                        <Badge variant="outline" className="text-xs">{action.targetSegment}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{action.expectedOutcome}</p>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Revenue Optimization */}
            {aiAnalysis.revenueOptimization && (
              <Collapsible open={expandedSections.optimization} onOpenChange={() => toggleSection('optimization')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                      <span className="font-semibold">Revenue Optimization</span>
                    </div>
                    {expandedSections.optimization ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-blue-500/10">
                      <h4 className="font-medium text-blue-700 mb-2">Focus Areas</h4>
                      <ul className="text-sm space-y-1">
                        {aiAnalysis.revenueOptimization.focusAreas?.map((area, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Target className="h-3 w-3 mt-1 text-blue-600" />
                            {area}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 rounded-lg bg-emerald-500/10">
                      <h4 className="font-medium text-emerald-700 mb-2">Quick Wins</h4>
                      <ul className="text-sm space-y-1">
                        {aiAnalysis.revenueOptimization.quickWins?.map((win, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Zap className="h-3 w-3 mt-1 text-emerald-600" />
                            {win}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-500/10">
                      <h4 className="font-medium text-purple-700 mb-2">Long-Term Strategies</h4>
                      <ul className="text-sm space-y-1">
                        {aiAnalysis.revenueOptimization.longTermStrategies?.map((strategy, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <TrendingUp className="h-3 w-3 mt-1 text-purple-600" />
                            {strategy}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Warnings */}
            {aiAnalysis.warnings && aiAnalysis.warnings.length > 0 && (
              <Collapsible open={expandedSections.warnings} onOpenChange={() => toggleSection('warnings')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-4 h-auto bg-red-500/5">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-red-600" />
                      <span className="font-semibold text-red-700">Warnings</span>
                      <Badge className="bg-red-500/20 text-red-700">{aiAnalysis.warnings.length}</Badge>
                    </div>
                    {expandedSections.warnings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 px-4 pb-4">
                  {aiAnalysis.warnings.map((warning, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-red-700">{warning.type}</Badge>
                        {getUrgencyBadge(warning.urgency)}
                      </div>
                      <p className="text-sm">{warning.message}</p>
                      <div className="flex gap-1 flex-wrap">
                        {warning.affectedSegments?.map((seg, sIdx) => (
                          <Badge key={sIdx} variant="secondary" className="text-xs">{seg}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="segments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="segments" className="gap-2">
            <Users className="h-4 w-4" />
            Segments
          </TabsTrigger>
          <TabsTrigger value="industry" className="gap-2">
            <Building2 className="h-4 w-4" />
            Industry Classification
          </TabsTrigger>
          <TabsTrigger value="details" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Segment Details
          </TabsTrigger>
        </TabsList>

        {/* Segments Tab */}
        <TabsContent value="segments" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customers by Segment</CardTitle>
                <CardDescription>Distribution of customers across segments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Segment</CardTitle>
                <CardDescription>Total revenue contribution per segment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                      <YAxis type="category" dataKey="name" width={75} />
                      <Tooltip formatter={(value: number) => [`AED ${value.toLocaleString()}`, 'Revenue']} />
                      <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Industry Tab */}
        <TabsContent value="industry" className="space-y-6 mt-6">
          {industryData.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No industry data available. Industry is extracted from application details.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Industry Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Industries</p>
                        <p className="text-2xl font-bold">{industryData.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-emerald-500/10">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Top Industry</p>
                        <p className="text-lg font-bold truncate">{industryData[0]?.name || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-blue-500/10">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Top Industry Revenue</p>
                        <p className="text-lg font-bold">AED {(industryData[0]?.revenue || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-amber-500/10">
                        <Users className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Customers/Industry</p>
                        <p className="text-2xl font-bold">
                          {industryData.length > 0 
                            ? Math.round(industryData.reduce((sum, i) => sum + i.count, 0) / industryData.length) 
                            : 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Industry Charts */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Industry</CardTitle>
                    <CardDescription>Distribution of revenue across industries</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={industryChartData} layout="vertical" margin={{ left: 100 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                          <YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(value: number) => [`AED ${value.toLocaleString()}`, 'Revenue']} />
                          <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                            {industryChartData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Industry Distribution</CardTitle>
                    <CardDescription>Revenue share by industry (Treemap)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <Treemap
                          data={industryTreemapData}
                          dataKey="size"
                          aspectRatio={4 / 3}
                          stroke="#fff"
                        >
                          {industryTreemapData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                          <Tooltip 
                            formatter={(value: number) => [`AED ${value.toLocaleString()}`, 'Revenue']}
                          />
                        </Treemap>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Industry Leaderboard */}
              <Card>
                <CardHeader>
                  <CardTitle>Industry Leaderboard</CardTitle>
                  <CardDescription>Ranked by revenue with customer count</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {industryData.map((ind, idx) => {
                      const maxRevenue = industryData[0]?.revenue || 1;
                      const percentage = Math.round((ind.revenue / maxRevenue) * 100);
                      return (
                        <div key={ind.name} className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" 
                            style={{ backgroundColor: COLORS[idx % COLORS.length] + '20', color: COLORS[idx % COLORS.length] }}>
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{ind.name}</span>
                              <span className="text-sm text-muted-foreground">{ind.count} customers</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Progress value={percentage} className="h-2 flex-1" />
                              <span className="text-sm font-semibold w-24 text-right">AED {ind.revenue.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Segment Details Tab */}
        <TabsContent value="details" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {segments.map((segment, index) => (
              <Card key={segment.name} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        {segment.name}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {segment.description}
                      </CardDescription>
                    </div>
                    {getGrowthBadge(segment.growthPotential)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Customers</p>
                      <p className="text-xl font-bold">{segment.count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Revenue</p>
                      <p className="text-xl font-bold">AED {segment.totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {segment.count > 0 && (
                    <div className="space-y-3 pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Business Activity</p>
                      
                      {/* Industry Breakdown */}
                      {Object.keys(segment.businessBreakdown.industries).length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> Industry
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(segment.businessBreakdown.industries)
                              .sort((a, b) => b[1].revenue - a[1].revenue)
                              .slice(0, 5)
                              .map(([industry, data]) => (
                              <Badge key={industry} variant="outline" className="text-xs">
                                {industry}: {data.count} (AED {Math.round(data.revenue/1000)}K)
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">License Type</p>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(segment.businessBreakdown.licenseTypes).map(([type, count]) => (
                            <Badge key={type} variant="outline" className="text-xs">
                              {type}: {count}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Jurisdiction</p>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(segment.businessBreakdown.jurisdictions)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5)
                            .map(([jur, count]) => (
                            <Badge key={jur} variant="secondary" className="text-xs">
                              {jur}: {count}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Repeat Rate</span>
                      <span className="font-medium">{segment.repeatRate}%</span>
                    </div>
                    <Progress value={segment.repeatRate} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Avg Revenue</span>
                    <span className="font-semibold text-emerald-600">
                      AED {Math.round(segment.avgRevenue).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerSegments;
