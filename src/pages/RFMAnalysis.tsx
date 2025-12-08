import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  ArrowLeft, Crown, Heart, Star, UserPlus, AlertTriangle, Moon, TrendingUp, Users, DollarSign, Clock,
  Sparkles, ChevronDown, ChevronUp, ArrowRight, Target, Zap, ShieldAlert, CheckCircle2, Loader2,
  Activity, BarChart3, Building2, Briefcase
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Treemap } from "recharts";

// Industry keywords for classification
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  'Real Estate': ['real estate', 'property', 'properties', 'realty', 'housing', 'apartments', 'villa', 'land', 'construction', 'building'],
  'Gold & Diamonds': ['gold', 'diamond', 'jewelry', 'jewellery', 'precious', 'gems', 'bullion'],
  'Trading': ['trading', 'import', 'export', 'wholesale', 'retail', 'commerce', 'merchandise', 'goods'],
  'Technology': ['technology', 'tech', 'software', 'it ', 'digital', 'computer', 'app', 'saas', 'cloud'],
  'Healthcare': ['health', 'medical', 'hospital', 'clinic', 'pharma', 'healthcare', 'doctor', 'dental'],
  'Consulting': ['consulting', 'consultancy', 'advisory', 'management consulting', 'business consulting'],
  'Construction': ['construction', 'contracting', 'contractor', 'engineering', 'infrastructure'],
  'Food & Beverage': ['food', 'restaurant', 'catering', 'beverage', 'cafe', 'hotel', 'hospitality'],
  'Finance': ['finance', 'financial', 'investment', 'banking', 'insurance', 'fintech'],
  'Manufacturing': ['manufacturing', 'factory', 'production', 'industrial'],
  'Transportation': ['transport', 'logistics', 'shipping', 'freight', 'cargo', 'delivery'],
  'Education': ['education', 'school', 'training', 'academy', 'learning', 'institute'],
  'Media': ['media', 'advertising', 'marketing', 'creative', 'design', 'entertainment'],
  'E-commerce': ['ecommerce', 'e-commerce', 'online store', 'marketplace', 'amazon', 'shopify']
};

interface CustomerRFM {
  id: string;
  name: string;
  company: string;
  email: string;
  recency: number;
  frequency: number;
  monetary: number;
  rScore: number;
  fScore: number;
  mScore: number;
  rfmScore: number;
  segment: string;
  industry: string;
}

interface IndustryData {
  name: string;
  customers: number;
  revenue: number;
  segments: Record<string, { count: number; revenue: number }>;
}

interface RFMSegment {
  name: string;
  description: string;
  customers: CustomerRFM[];
  icon: React.ElementType;
  color: string;
  bgColor: string;
  action: string;
  industryBreakdown: Record<string, { count: number; revenue: number }>;
}

interface AIAnalysis {
  summary: string;
  rfmHealthScore: number;
  segmentAnalysis: Array<{
    segment: string;
    status: string;
    keyInsight: string;
    movementTrend: string;
    actionRequired: string;
  }>;
  migrationStrategies: Array<{
    fromSegment: string;
    toSegment: string;
    strategy: string;
    effort: string;
    impact: string;
  }>;
  recencyInsights: {
    status: string;
    insight: string;
    recommendation: string;
  };
  frequencyInsights: {
    status: string;
    insight: string;
    recommendation: string;
  };
  monetaryInsights: {
    status: string;
    insight: string;
    recommendation: string;
  };
  prioritizedActions: Array<{
    priority: number;
    action: string;
    targetSegment: string;
    expectedROI: string;
    timeline: string;
  }>;
  churnRiskAnalysis: {
    highRiskSegments: string[];
    atRiskRevenue: string;
    preventionStrategies: string[];
  };
  growthOpportunities: Array<{
    opportunity: string;
    targetSegment: string;
    potentialImpact: string;
  }>;
}

const RFMAnalysis = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [customers, setCustomers] = useState<CustomerRFM[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    segments: true,
    migration: false,
    rfmDimensions: false,
    actions: false,
    churn: false,
    growth: false
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
      fetchCustomerData();
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/');
    }
  };

  const extractIndustry = (appData: any, company: string): string => {
    const searchText = [
      company,
      appData?.business_activity_details,
      appData?.proposed_activity,
      appData?.company_name,
      appData?.license_type,
      appData?.business_nature,
      appData?.industry_type
    ].filter(Boolean).join(' ').toLowerCase();

    for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
      if (keywords.some(keyword => searchText.includes(keyword))) {
        return industry;
      }
    }
    return 'Other';
  };

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select(`
          id,
          name,
          company,
          email,
          amount,
          created_at,
          updated_at,
          account_applications (
            id,
            created_at,
            status,
            application_data
          )
        `);

      if (customersError) throw customersError;

      const now = new Date();
      
      const rfmCustomers: CustomerRFM[] = (customersData || []).map(customer => {
        const applications = customer.account_applications || [];
        
        const lastActivity = applications.length > 0 
          ? new Date(Math.max(...applications.map(a => new Date(a.created_at).getTime())))
          : new Date(customer.updated_at || customer.created_at);
        const recency = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        
        const frequency = applications.length;
        const monetary = customer.amount || 0;

        // Extract industry from first application's data
        const firstAppData = applications[0]?.application_data;
        const industry = extractIndustry(firstAppData, customer.company);

        return {
          id: customer.id,
          name: customer.name,
          company: customer.company,
          email: customer.email,
          recency,
          frequency,
          monetary,
          rScore: 0,
          fScore: 0,
          mScore: 0,
          rfmScore: 0,
          segment: '',
          industry
        };
      });

      const recencies = rfmCustomers.map(c => c.recency).sort((a, b) => a - b);
      const frequencies = rfmCustomers.map(c => c.frequency).sort((a, b) => a - b);
      const monetaries = rfmCustomers.map(c => c.monetary).sort((a, b) => a - b);

      const getQuintile = (value: number, sortedArray: number[], inverse: boolean = false) => {
        if (sortedArray.length === 0) return 3;
        const index = sortedArray.findIndex(v => v >= value);
        const position = index === -1 ? sortedArray.length : index;
        const quintile = Math.ceil(((position + 1) / sortedArray.length) * 5);
        return inverse ? 6 - quintile : quintile;
      };

      rfmCustomers.forEach(customer => {
        customer.rScore = getQuintile(customer.recency, recencies, true);
        customer.fScore = getQuintile(customer.frequency, frequencies);
        customer.mScore = getQuintile(customer.monetary, monetaries);
        customer.rfmScore = customer.rScore + customer.fScore + customer.mScore;
        customer.segment = assignSegment(customer.rScore, customer.fScore, customer.mScore);
      });

      setCustomers(rfmCustomers);
    } catch (error) {
      console.error('Error fetching customer data:', error);
      toast.error("Failed to load customer data");
    } finally {
      setLoading(false);
    }
  };

  const assignSegment = (r: number, f: number, m: number): string => {
    if (r >= 4 && f >= 4 && m >= 4) return 'Champions';
    if (f >= 4 && r >= 3) return 'Loyal';
    if (r >= 4 && f >= 2 && f <= 3) return 'Potential Loyalists';
    if (r >= 4 && f <= 2) return 'New Customers';
    if (r <= 2 && f >= 3) return 'At Risk';
    if (r <= 2 && f <= 2) return 'Hibernating';
    return 'Need Attention';
  };

  const segments: RFMSegment[] = useMemo(() => {
    const segmentMap: Record<string, RFMSegment> = {
      'Champions': {
        name: 'Champions',
        description: 'Best customers. Bought recently, buy often, spend the most.',
        customers: [],
        icon: Crown,
        color: 'text-amber-600',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        action: 'Reward them. Can be early adopters. Will promote your brand.',
        industryBreakdown: {}
      },
      'Loyal': {
        name: 'Loyal',
        description: 'Spend good money. Responsive to promotions.',
        customers: [],
        icon: Heart,
        color: 'text-red-600',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        action: 'Upsell higher value products. Ask for reviews.',
        industryBreakdown: {}
      },
      'Potential Loyalists': {
        name: 'Potential Loyalists',
        description: 'Recent customers with average frequency.',
        customers: [],
        icon: Star,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        action: 'Offer membership/loyalty programs. Recommend other products.',
        industryBreakdown: {}
      },
      'New Customers': {
        name: 'New Customers',
        description: 'Bought most recently, but not often.',
        customers: [],
        icon: UserPlus,
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        action: 'Provide onboarding support. Give early success.',
        industryBreakdown: {}
      },
      'At Risk': {
        name: 'At Risk',
        description: 'Spent big money and purchased often. But long time ago.',
        customers: [],
        icon: AlertTriangle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        action: 'Send personalized emails. Offer renewals. Provide value.',
        industryBreakdown: {}
      },
      'Hibernating': {
        name: 'Hibernating',
        description: 'Last purchase was long time ago. Low spenders.',
        customers: [],
        icon: Moon,
        color: 'text-slate-600',
        bgColor: 'bg-slate-100 dark:bg-slate-900/30',
        action: 'Offer special discounts. Recreate brand value.',
        industryBreakdown: {}
      },
      'Need Attention': {
        name: 'Need Attention',
        description: 'Above average recency, frequency & monetary values.',
        customers: [],
        icon: TrendingUp,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        action: 'Make limited time offers. Recommend based on past purchases.',
        industryBreakdown: {}
      }
    };

    customers.forEach(customer => {
      if (segmentMap[customer.segment]) {
        segmentMap[customer.segment].customers.push(customer);
        // Track industry breakdown per segment
        const industry = customer.industry;
        if (!segmentMap[customer.segment].industryBreakdown[industry]) {
          segmentMap[customer.segment].industryBreakdown[industry] = { count: 0, revenue: 0 };
        }
        segmentMap[customer.segment].industryBreakdown[industry].count++;
        segmentMap[customer.segment].industryBreakdown[industry].revenue += customer.monetary;
      }
    });

    return Object.values(segmentMap).filter(s => s.customers.length > 0);
  }, [customers]);

  // Industry data across all segments
  const industryData: IndustryData[] = useMemo(() => {
    const industries: Record<string, IndustryData> = {};
    
    customers.forEach(customer => {
      const industry = customer.industry;
      if (!industries[industry]) {
        industries[industry] = { name: industry, customers: 0, revenue: 0, segments: {} };
      }
      industries[industry].customers++;
      industries[industry].revenue += customer.monetary;
      
      // Track per-segment breakdown
      if (!industries[industry].segments[customer.segment]) {
        industries[industry].segments[customer.segment] = { count: 0, revenue: 0 };
      }
      industries[industry].segments[customer.segment].count++;
      industries[industry].segments[customer.segment].revenue += customer.monetary;
    });

    return Object.values(industries).sort((a, b) => b.revenue - a.revenue);
  }, [customers]);

  const industryTreemapData = useMemo(() => {
    return industryData.map(ind => ({
      name: ind.name,
      size: ind.revenue,
      customers: ind.customers
    }));
  }, [industryData]);

  const pieData = useMemo(() => {
    return segments.map(seg => ({
      name: seg.name,
      value: seg.customers.length
    }));
  }, [segments]);

  const revenueBySegment = useMemo(() => {
    return segments.map(seg => ({
      name: seg.name,
      revenue: seg.customers.reduce((sum, c) => sum + c.monetary, 0),
      customers: seg.customers.length
    }));
  }, [segments]);

  const scatterData = useMemo(() => {
    return customers.map(c => ({
      x: c.recency,
      y: c.frequency,
      z: c.monetary,
      name: c.name,
      segment: c.segment
    }));
  }, [customers]);

  const COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#22c55e', '#f97316', '#64748b', '#a855f7'];

  const stats = useMemo(() => {
    const totalRevenue = customers.reduce((sum, c) => sum + c.monetary, 0);
    const avgRecency = customers.length > 0 
      ? Math.round(customers.reduce((sum, c) => sum + c.recency, 0) / customers.length) 
      : 0;
    const avgFrequency = customers.length > 0 
      ? (customers.reduce((sum, c) => sum + c.frequency, 0) / customers.length).toFixed(1) 
      : '0';
    const championsRevenue = segments.find(s => s.name === 'Champions')?.customers.reduce((sum, c) => sum + c.monetary, 0) || 0;
    
    return {
      totalCustomers: customers.length,
      totalRevenue,
      avgRecency,
      avgFrequency,
      championsRevenue,
      championsPercent: totalRevenue > 0 ? Math.round((championsRevenue / totalRevenue) * 100) : 0
    };
  }, [customers, segments]);

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-rfm-segments', {
        body: {
          segments: segments.map(s => ({
            name: s.name,
            customers: s.customers,
            description: s.description,
            action: s.action
          })),
          stats,
          customers: customers.slice(0, 100) // Limit for API
        }
      });

      if (error) throw error;
      setAiAnalysis(data);
      toast.success('RFM AI analysis completed');
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'thriving':
        return <Badge className="bg-emerald-500/20 text-emerald-700"><CheckCircle2 className="h-3 w-3 mr-1" />Thriving</Badge>;
      case 'stable':
        return <Badge className="bg-blue-500/20 text-blue-700"><Activity className="h-3 w-3 mr-1" />Stable</Badge>;
      case 'declining':
        return <Badge className="bg-amber-500/20 text-amber-700"><TrendingUp className="h-3 w-3 mr-1 rotate-180" />Declining</Badge>;
      case 'critical':
        return <Badge className="bg-red-500/20 text-red-700"><ShieldAlert className="h-3 w-3 mr-1" />Critical</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDimensionStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-emerald-500/20 text-emerald-700">Healthy</Badge>;
      case 'concerning':
        return <Badge className="bg-amber-500/20 text-amber-700">Concerning</Badge>;
      case 'critical':
        return <Badge className="bg-red-500/20 text-red-700">Critical</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getEffortBadge = (effort: string) => {
    switch (effort) {
      case 'low':
        return <Badge className="bg-emerald-500/20 text-emerald-700">Low Effort</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500/20 text-amber-700">Medium Effort</Badge>;
      case 'high':
        return <Badge className="bg-red-500/20 text-red-700">High Effort</Badge>;
      default:
        return <Badge variant="secondary">{effort}</Badge>;
    }
  };

  if (!isAdmin) return null;

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/tracker')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">RFM Analysis</h1>
            <p className="text-muted-foreground">
              Industry-standard customer segmentation based on Recency, Frequency, and Monetary value
            </p>
          </div>
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalCustomers}</p>
                <p className="text-sm text-muted-foreground">Total Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">AED {stats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.avgRecency} days</p>
                <p className="text-sm text-muted-foreground">Avg Recency</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-2xl font-bold">{stats.championsPercent}%</p>
                <p className="text-sm text-muted-foreground">Revenue from Champions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Section */}
      {aiAnalysis && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI-Powered RFM Analysis
              </CardTitle>
              {aiAnalysis.rfmHealthScore && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Health Score:</span>
                  <div className="flex items-center gap-2">
                    <Progress value={aiAnalysis.rfmHealthScore} className="w-24 h-2" />
                    <span className="font-bold text-primary">{aiAnalysis.rfmHealthScore}%</span>
                  </div>
                </div>
              )}
            </div>
            <CardDescription>{aiAnalysis.summary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Segment Analysis */}
            <Collapsible open={expandedSections.segments} onOpenChange={() => toggleSection('segments')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold">Segment Analysis</span>
                    <Badge variant="secondary">{aiAnalysis.segmentAnalysis?.length || 0}</Badge>
                  </div>
                  {expandedSections.segments ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 px-4 pb-4">
                {aiAnalysis.segmentAnalysis?.map((seg, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{seg.segment}</span>
                      <div className="flex gap-2">
                        {getStatusBadge(seg.status)}
                        <Badge variant="outline">{seg.movementTrend}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{seg.keyInsight}</p>
                    <p className="text-sm text-primary"><strong>Action:</strong> {seg.actionRequired}</p>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Migration Strategies */}
            <Collapsible open={expandedSections.migration} onOpenChange={() => toggleSection('migration')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-emerald-600" />
                    <span className="font-semibold">Migration Strategies</span>
                    <Badge variant="secondary">{aiAnalysis.migrationStrategies?.length || 0}</Badge>
                  </div>
                  {expandedSections.migration ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 px-4 pb-4">
                {aiAnalysis.migrationStrategies?.map((migration, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{migration.fromSegment}</Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Badge className="bg-emerald-500/20 text-emerald-700">{migration.toSegment}</Badge>
                      {getEffortBadge(migration.effort)}
                    </div>
                    <p className="text-sm">{migration.strategy}</p>
                    <p className="text-xs text-emerald-600 font-medium">Impact: {migration.impact}</p>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* RFM Dimension Insights */}
            <Collapsible open={expandedSections.rfmDimensions} onOpenChange={() => toggleSection('rfmDimensions')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-600" />
                    <span className="font-semibold">RFM Dimension Insights</span>
                  </div>
                  {expandedSections.rfmDimensions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4">
                <div className="grid md:grid-cols-3 gap-4">
                  {aiAnalysis.recencyInsights && (
                    <div className="p-4 rounded-lg bg-blue-500/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-blue-700">Recency</h4>
                        {getDimensionStatusBadge(aiAnalysis.recencyInsights.status)}
                      </div>
                      <p className="text-sm">{aiAnalysis.recencyInsights.insight}</p>
                      <p className="text-xs text-blue-600"><strong>Recommendation:</strong> {aiAnalysis.recencyInsights.recommendation}</p>
                    </div>
                  )}
                  {aiAnalysis.frequencyInsights && (
                    <div className="p-4 rounded-lg bg-emerald-500/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-emerald-700">Frequency</h4>
                        {getDimensionStatusBadge(aiAnalysis.frequencyInsights.status)}
                      </div>
                      <p className="text-sm">{aiAnalysis.frequencyInsights.insight}</p>
                      <p className="text-xs text-emerald-600"><strong>Recommendation:</strong> {aiAnalysis.frequencyInsights.recommendation}</p>
                    </div>
                  )}
                  {aiAnalysis.monetaryInsights && (
                    <div className="p-4 rounded-lg bg-amber-500/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-amber-700">Monetary</h4>
                        {getDimensionStatusBadge(aiAnalysis.monetaryInsights.status)}
                      </div>
                      <p className="text-sm">{aiAnalysis.monetaryInsights.insight}</p>
                      <p className="text-xs text-amber-600"><strong>Recommendation:</strong> {aiAnalysis.monetaryInsights.recommendation}</p>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Prioritized Actions */}
            <Collapsible open={expandedSections.actions} onOpenChange={() => toggleSection('actions')}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-600" />
                    <span className="font-semibold">Prioritized Actions</span>
                    <Badge variant="secondary">{aiAnalysis.prioritizedActions?.length || 0}</Badge>
                  </div>
                  {expandedSections.actions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 px-4 pb-4">
                {aiAnalysis.prioritizedActions?.sort((a, b) => a.priority - b.priority).map((action, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-muted/50 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      {action.priority}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{action.action}</span>
                        <Badge variant="outline" className="text-xs">{action.targetSegment}</Badge>
                        <Badge className="bg-emerald-500/20 text-emerald-700 text-xs">ROI: {action.expectedROI}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {action.timeline}
                      </p>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Churn Risk */}
            {aiAnalysis.churnRiskAnalysis && (
              <Collapsible open={expandedSections.churn} onOpenChange={() => toggleSection('churn')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-4 h-auto bg-red-500/5">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-red-600" />
                      <span className="font-semibold text-red-700">Churn Risk Analysis</span>
                    </div>
                    {expandedSections.churn ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4">
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">At-Risk Revenue</span>
                      <span className="text-lg font-bold text-red-700">{aiAnalysis.churnRiskAnalysis.atRiskRevenue}</span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">High-Risk Segments</p>
                      <div className="flex gap-1 flex-wrap">
                        {aiAnalysis.churnRiskAnalysis.highRiskSegments?.map((seg, idx) => (
                          <Badge key={idx} className="bg-red-500/20 text-red-700">{seg}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Prevention Strategies</p>
                      <ul className="text-sm space-y-1">
                        {aiAnalysis.churnRiskAnalysis.preventionStrategies?.map((strategy, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="h-3 w-3 mt-1 text-red-600" />
                            {strategy}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Growth Opportunities */}
            {aiAnalysis.growthOpportunities && aiAnalysis.growthOpportunities.length > 0 && (
              <Collapsible open={expandedSections.growth} onOpenChange={() => toggleSection('growth')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-4 h-auto bg-emerald-500/5">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      <span className="font-semibold text-emerald-700">Growth Opportunities</span>
                      <Badge className="bg-emerald-500/20 text-emerald-700">{aiAnalysis.growthOpportunities.length}</Badge>
                    </div>
                    {expandedSections.growth ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 px-4 pb-4">
                  {aiAnalysis.growthOpportunities.map((opp, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{opp.opportunity}</span>
                        <Badge variant="outline">{opp.targetSegment}</Badge>
                      </div>
                      <p className="text-sm text-emerald-700 font-medium">Impact: {opp.potentialImpact}</p>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabbed Content */}
      <Tabs defaultValue="segments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="segments" className="gap-2">
            <Users className="h-4 w-4" />
            RFM Segments
          </TabsTrigger>
          <TabsTrigger value="industry" className="gap-2">
            <Building2 className="h-4 w-4" />
            Industry Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="segments" className="space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Distribution by Segment</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Segment</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueBySegment}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `AED ${value.toLocaleString()}`} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* RFM Scatter Plot */}
          <Card>
            <CardHeader>
              <CardTitle>RFM Distribution</CardTitle>
              <CardDescription>Recency vs Frequency (bubble size = Monetary value)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid />
                  <XAxis type="number" dataKey="x" name="Recency (days)" />
                  <YAxis type="number" dataKey="y" name="Frequency" />
                  <ZAxis type="number" dataKey="z" range={[50, 500]} name="Monetary" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value: number, name: string) => {
                    if (name === 'Monetary') return `AED ${value.toLocaleString()}`;
                    return value;
                  }} />
                  <Scatter name="Customers" data={scatterData} fill="hsl(var(--primary))" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="industry" className="space-y-6">
          {/* Industry Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{industryData.length}</p>
                    <p className="text-sm text-muted-foreground">Industries Identified</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Crown className="h-8 w-8 text-amber-600" />
                  <div>
                    <p className="text-2xl font-bold">{industryData[0]?.name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">Top Revenue Industry</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">AED {(industryData[0]?.revenue || 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Top Industry Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Industry Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Industry</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={industryData.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={120} fontSize={11} />
                    <Tooltip formatter={(value: number) => `AED ${value.toLocaleString()}`} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Industry Revenue Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <Treemap
                    data={industryTreemapData}
                    dataKey="size"
                    aspectRatio={4/3}
                    stroke="#fff"
                    fill="hsl(var(--primary))"
                  >
                    <Tooltip
                      formatter={(value: number, name: string, props: any) => [
                        `AED ${value.toLocaleString()}`,
                        props.payload.name
                      ]}
                    />
                  </Treemap>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Industry-Segment Matrix */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Industry by RFM Segment
              </CardTitle>
              <CardDescription>Which industries are Champions, Loyal, At Risk, etc.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {industryData.slice(0, 8).map((industry) => {
                  const maxRevenue = industryData[0]?.revenue || 1;
                  const segmentEntries = Object.entries(industry.segments)
                    .sort(([, a], [, b]) => b.revenue - a.revenue);
                  
                  return (
                    <div key={industry.name} className="p-4 rounded-lg bg-muted/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-primary" />
                          <div>
                            <h4 className="font-semibold">{industry.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {industry.customers} customers • AED {industry.revenue.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="w-32">
                          <Progress value={(industry.revenue / maxRevenue) * 100} className="h-2" />
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {segmentEntries.map(([segmentName, data]) => {
                          const segment = segments.find(s => s.name === segmentName);
                          return (
                            <Badge 
                              key={segmentName} 
                              className={`${segment?.bgColor || 'bg-muted'} ${segment?.color || 'text-foreground'} gap-1`}
                            >
                              {segmentName}: {data.count} (AED {data.revenue.toLocaleString()})
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Champions & Loyal by Industry */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-600" />
                  Champions by Industry
                </CardTitle>
                <CardDescription>Your best customers in each industry</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {industryData
                    .filter(ind => ind.segments['Champions'])
                    .sort((a, b) => (b.segments['Champions']?.revenue || 0) - (a.segments['Champions']?.revenue || 0))
                    .slice(0, 6)
                    .map((industry) => {
                      const champData = industry.segments['Champions'];
                      return (
                        <div key={industry.name} className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10">
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-amber-600" />
                            <span className="font-medium">{industry.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-amber-700">{champData.count} champions</p>
                            <p className="text-xs text-muted-foreground">AED {champData.revenue.toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  {industryData.filter(ind => ind.segments['Champions']).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No Champions identified yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  At Risk by Industry
                </CardTitle>
                <CardDescription>Industries with customers at risk of churning</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {industryData
                    .filter(ind => ind.segments['At Risk'])
                    .sort((a, b) => (b.segments['At Risk']?.revenue || 0) - (a.segments['At Risk']?.revenue || 0))
                    .slice(0, 6)
                    .map((industry) => {
                      const riskData = industry.segments['At Risk'];
                      return (
                        <div key={industry.name} className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            <span className="font-medium">{industry.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-orange-700">{riskData.count} at risk</p>
                            <p className="text-xs text-muted-foreground">AED {riskData.revenue.toLocaleString()} at stake</p>
                          </div>
                        </div>
                      );
                    })}
                  {industryData.filter(ind => ind.segments['At Risk']).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No At Risk customers identified</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Segment Cards */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Customer Segments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {segments.map((segment) => {
            const Icon = segment.icon;
            const totalRevenue = segment.customers.reduce((sum, c) => sum + c.monetary, 0);
            const avgMonetary = segment.customers.length > 0 
              ? Math.round(totalRevenue / segment.customers.length) 
              : 0;
            
            const topIndustries = Object.entries(segment.industryBreakdown)
              .sort(([, a], [, b]) => b.revenue - a.revenue)
              .slice(0, 3);

            return (
              <Card key={segment.name} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${segment.bgColor}`}>
                      <Icon className={`h-6 w-6 ${segment.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{segment.name}</CardTitle>
                      <Badge variant="secondary">{segment.customers.length} customers</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{segment.description}</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Revenue</p>
                      <p className="font-semibold">AED {totalRevenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Value</p>
                      <p className="font-semibold">AED {avgMonetary.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Industry Breakdown */}
                  {topIndustries.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> Top Industries
                      </p>
                      <div className="space-y-1">
                        {topIndustries.map(([industry, data]) => (
                          <div key={industry} className="flex justify-between text-sm">
                            <span className="truncate max-w-[140px]">{industry}</span>
                            <span className="text-muted-foreground">{data.count} • AED {data.revenue.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Recommended Action:</p>
                    <p className="text-sm">{segment.action}</p>
                  </div>

                  {segment.customers.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground font-medium mb-2">Top Customers:</p>
                      <div className="space-y-1">
                        {segment.customers
                          .sort((a, b) => b.monetary - a.monetary)
                          .slice(0, 3)
                          .map(c => (
                            <div key={c.id} className="flex justify-between text-sm">
                              <span className="truncate max-w-[150px]">{c.name}</span>
                              <span className="text-muted-foreground">AED {c.monetary.toLocaleString()}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RFMAnalysis;
