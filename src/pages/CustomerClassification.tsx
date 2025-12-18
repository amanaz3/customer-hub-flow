import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, ResponsiveContainer, Treemap
} from 'recharts';
import { 
  Building2, Globe, TrendingUp, Users, Sparkles, Loader2, 
  DollarSign, MapPin, Briefcase, ArrowLeft, AlertTriangle, 
  CheckCircle2, Target, Lightbulb, Clock, ChevronDown, ChevronUp,
  Zap, TrendingDown, Shield, Star, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ClassificationData {
  name: string;
  count: number;
  revenue: number;
  percentage: number;
}

interface ClassificationGroup {
  industry: ClassificationData[];
  nationality: ClassificationData[];
  leadSource: ClassificationData[];
  jurisdiction: ClassificationData[];
}

interface AIAnalysis {
  summary: {
    headline: string;
    healthScore: number;
    keyStrength: string;
    keyRisk: string;
  };
  industryInsights: {
    industry: string;
    insight: string;
    reason: string;
    opportunity: string;
    risk: string;
    revenueImpact: 'high' | 'medium' | 'low';
  }[];
  nationalityInsights: {
    nationality: string;
    insight: string;
    culturalConsideration: string;
    growthPotential: 'high' | 'medium' | 'low';
  }[];
  channelAnalysis: {
    channel: string;
    effectiveness: 'excellent' | 'good' | 'average' | 'poor';
    reason: string;
    recommendation: string;
  }[];
  actionPlan: {
    priority: number;
    action: string;
    expectedImpact: string;
    timeline: string;
    resources: string;
  }[];
  recommendations: {
    title: string;
    description: string;
    rationale: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'high' | 'medium' | 'low';
    category: string;
  }[];
  revenueOptimization: {
    growthSegments: string[];
    optimizeSegments: string[];
    reduceRiskSegments: string[];
    potentialRevenueIncrease: string;
  };
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
];

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

const CustomerClassification = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [classifications, setClassifications] = useState<ClassificationGroup>({
    industry: [],
    nationality: [],
    leadSource: [],
    jurisdiction: [],
  });
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueVsDealData, setRevenueVsDealData] = useState<Array<{ name: string; turnover: number; dealValue: number }>>([]);
  const [dealSizeDistribution, setDealSizeDistribution] = useState<Array<{ range: string; count: number; revenue: number; percentage: number }>>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchClassificationData();
  }, []);

  const extractIndustry = (data: Record<string, any>, companyName?: string): string => {
    // Try various fields that might contain industry info
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

    // Check against industry keywords
    for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
      if (keywords.some(keyword => combinedText.includes(keyword))) {
        return industry;
      }
    }
    
    return 'Other';
  };

  const extractNationality = (data: Record<string, any>): string => {
    const nationality = 
      data.nationality ||
      data.step1?.nationality ||
      data.shareholder_nationality ||
      data.owner_nationality ||
      data.applicant_nationality ||
      data.shareholders?.[0]?.nationality;
    
    if (!nationality || nationality === 'Unknown' || nationality === '') {
      return 'Not Specified';
    }
    return nationality;
  };

  const fetchClassificationData = async () => {
    setLoading(true);
    try {
      const { data: customers, error: custError } = await supabase
        .from('customers')
        .select('id, lead_source, license_type, jurisdiction, amount, annual_turnover, company');

      const { data: applications, error: appError } = await supabase
        .from('account_applications')
        .select('id, customer_id, application_data');

      if (custError || appError) throw custError || appError;

      const industryMap = new Map<string, { count: number; revenue: number }>();
      const nationalityMap = new Map<string, { count: number; revenue: number }>();
      const leadSourceMap = new Map<string, { count: number; revenue: number }>();
      const jurisdictionMap = new Map<string, { count: number; revenue: number }>();

      let total = customers?.length || 0;
      let revenue = 0;

      // Create customer lookup map
      const customerMap = new Map(customers?.map(c => [c.id, c]) || []);

      // Process customers for lead source and jurisdiction
      customers?.forEach(customer => {
        const amt = Number(customer.amount) || 0;
        revenue += amt;

        const leadSource = customer.lead_source || 'Unknown';
        const lsData = leadSourceMap.get(leadSource) || { count: 0, revenue: 0 };
        leadSourceMap.set(leadSource, { count: lsData.count + 1, revenue: lsData.revenue + amt });

        const jurisdiction = customer.jurisdiction || customer.license_type || 'Unknown';
        const jData = jurisdictionMap.get(jurisdiction) || { count: 0, revenue: 0 };
        jurisdictionMap.set(jurisdiction, { count: jData.count + 1, revenue: jData.revenue + amt });
      });

      // Process applications for industry and nationality
      const processedCustomers = new Set<string>();
      
      applications?.forEach(app => {
        const data = app.application_data as Record<string, any> | null;
        if (!data || !app.customer_id) return;

        // Avoid double-counting
        if (processedCustomers.has(app.customer_id)) return;
        processedCustomers.add(app.customer_id);

        const customer = customerMap.get(app.customer_id);
        const amt = Number(customer?.amount) || 0;

        // Industry/Business Activity
        const industry = extractIndustry(data, customer?.company);
        const iData = industryMap.get(industry) || { count: 0, revenue: 0 };
        industryMap.set(industry, { count: iData.count + 1, revenue: iData.revenue + amt });

        // Nationality
        const nationality = extractNationality(data);
        const nData = nationalityMap.get(nationality) || { count: 0, revenue: 0 };
        nationalityMap.set(nationality, { count: nData.count + 1, revenue: nData.revenue + amt });
      });

      const toArray = (map: Map<string, { count: number; revenue: number }>): ClassificationData[] => {
        const totalCount = Array.from(map.values()).reduce((a, b) => a + b.count, 0);
        return Array.from(map.entries())
          .map(([name, data]) => ({
            name,
            count: data.count,
            revenue: data.revenue,
            percentage: totalCount > 0 ? Math.round((data.count / totalCount) * 100) : 0,
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 15);
      };

      setClassifications({
        industry: toArray(industryMap),
        nationality: toArray(nationalityMap),
        leadSource: toArray(leadSourceMap),
        jurisdiction: toArray(jurisdictionMap),
      });

      // Revenue vs Deal Value comparison by industry
      const revenueVsDeal = Array.from(industryMap.entries())
        .map(([name]) => {
          const customersInIndustry = customers?.filter(c => {
            const app = applications?.find(a => a.customer_id === c.id);
            const data = app?.application_data as Record<string, any> | null;
            return data ? extractIndustry(data, c.company) === name : false;
          }) || [];
          
          const totalTurnover = customersInIndustry.reduce((sum, c) => sum + (Number(c.annual_turnover) || 0), 0);
          const totalDealValue = customersInIndustry.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
          
          return { name, turnover: totalTurnover, dealValue: totalDealValue };
        })
        .filter(d => d.turnover > 0 || d.dealValue > 0)
        .sort((a, b) => (b.turnover + b.dealValue) - (a.turnover + a.dealValue))
        .slice(0, 10);

      setRevenueVsDealData(revenueVsDeal);
      
      // Deal size distribution buckets
      const dealBuckets = [
        { min: 0, max: 1000, label: '0-1K' },
        { min: 1000, max: 5000, label: '1K-5K' },
        { min: 5000, max: 10000, label: '5K-10K' },
        { min: 10000, max: 25000, label: '10K-25K' },
        { min: 25000, max: 50000, label: '25K-50K' },
        { min: 50000, max: 100000, label: '50K-100K' },
        { min: 100000, max: Infinity, label: '100K+' },
      ];
      
      const distribution = dealBuckets.map(bucket => {
        const dealsInBucket = customers?.filter(c => {
          const amt = Number(c.amount) || 0;
          return amt >= bucket.min && amt < bucket.max;
        }) || [];
        const bucketRevenue = dealsInBucket.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
        return {
          range: bucket.label,
          count: dealsInBucket.length,
          revenue: bucketRevenue,
          percentage: revenue > 0 ? Math.round((bucketRevenue / revenue) * 100) : 0,
        };
      }).filter(d => d.count > 0);
      
      setDealSizeDistribution(distribution);
      setTotalCustomers(total);
      setTotalRevenue(revenue);
    } catch (error) {
      console.error('Error fetching classification data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load classification data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const runAIAnalysis = async () => {
    setAnalyzingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-customer-classifications', {
        body: {
          classifications,
          totalCustomers,
          totalRevenue,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAiAnalysis(data.analysis);
      toast({
        title: 'Analysis Complete',
        description: 'AI analysis has been generated successfully',
      });
    } catch (error) {
      console.error('Error running AI analysis:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to run AI analysis',
        variant: 'destructive',
      });
    } finally {
      setAnalyzingAI(false);
    }
  };

  const formatCurrency = (value: number) => `AED ${value.toLocaleString()}`;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'low': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getEffectivenessIcon = (effectiveness: string) => {
    switch (effectiveness) {
      case 'excellent': return <Star className="h-4 w-4 text-amber-500" />;
      case 'good': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'average': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'poor': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const renderClassificationCard = (
    title: string,
    data: ClassificationData[],
    icon: React.ReactNode,
    colorIndex: number = 0
  ) => (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                labelLine={false}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[(index + colorIndex) % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip formatter={(value: number) => [value, 'Customers']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
          {data.slice(0, 5).map((item, idx) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[(idx + colorIndex) % COLORS.length] }} 
                />
                <span className="truncate max-w-[120px]">{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-xs">{item.count}</Badge>
                <span className="text-muted-foreground text-xs">{formatCurrency(item.revenue)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const treemapData = classifications.industry
    .filter(i => i.revenue > 0)
    .map((item, idx) => ({
      name: item.name,
      size: item.revenue,
      color: COLORS[idx % COLORS.length],
    }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/tracker')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Customer Classification</h1>
            <p className="text-muted-foreground">Analyze customers by industry, nationality, channels & revenue</p>
          </div>
        </div>
        <Button 
          onClick={runAIAnalysis} 
          disabled={analyzingAI}
          className="gap-2"
        >
          {analyzingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Run AI Analysis
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{totalCustomers.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-chart-1/10">
                <DollarSign className="h-6 w-6 text-chart-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-chart-2/10">
                <Briefcase className="h-6 w-6 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Industries</p>
                <p className="text-2xl font-bold">{classifications.industry.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-chart-3/10">
                <Globe className="h-6 w-6 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nationalities</p>
                <p className="text-2xl font-bold">{classifications.nationality.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="industry">By Industry</TabsTrigger>
          <TabsTrigger value="nationality">By Nationality</TabsTrigger>
          <TabsTrigger value="channels">By Channel</TabsTrigger>
          <TabsTrigger value="ai-insights" className="gap-2">
            <Sparkles className="h-3 w-3" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Revenue vs Deal Value Distribution */}
          {revenueVsDealData.length > 0 && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Annual Turnover vs Deal Value by Industry
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Comparing reported annual turnover with transaction deal values
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueVsDealData} layout="vertical" margin={{ left: 100 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                      <YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 11 }} />
                      <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="turnover" name="Annual Turnover" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="dealValue" name="Deal Value" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Deal Size Distribution */}
          {dealSizeDistribution.length > 0 && (
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Deal Size Distribution
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs p-3 text-sm bg-popover">
                        <p className="font-medium mb-1">How to interpret:</p>
                        <ul className="space-y-1 text-muted-foreground text-xs">
                          <li>• <strong>Many small deals</strong> = stable base revenue but low growth potential</li>
                          <li>• <strong>Few large deals</strong> = high revenue concentration risk</li>
                          <li>• <strong>Balanced mix</strong> = healthy, diversified revenue stream</li>
                          <li>• <strong>Revenue % vs Count %</strong> mismatch shows deal value impact</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  How deals of different values contribute to total revenue (AED {formatCurrency(totalRevenue)})
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Bar Chart - Count & Revenue by Range */}
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dealSizeDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="left" orientation="left" label={{ value: 'Deals', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                        <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} label={{ value: 'Revenue', angle: 90, position: 'insideRight', fontSize: 11 }} />
                        <RechartsTooltip 
                          formatter={(value: number, name: string) => 
                            name === 'revenue' ? formatCurrency(value) : `${value} deals`
                          } 
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="count" name="Deals" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Revenue Contribution Summary */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Revenue Contribution by Deal Size</p>
                    {dealSizeDistribution.map((bucket, idx) => (
                      <div key={bucket.range} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{bucket.range}</span>
                          <span className="text-muted-foreground">
                            {bucket.count} deals • {formatCurrency(bucket.revenue)} ({bucket.percentage}%)
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${bucket.percentage}%`,
                              backgroundColor: COLORS[idx % COLORS.length]
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderClassificationCard('By Industry', classifications.industry, <Building2 className="h-4 w-4" />, 0)}
            {renderClassificationCard('By Nationality', classifications.nationality, <Globe className="h-4 w-4" />, 2)}
            {renderClassificationCard('By Lead Source', classifications.leadSource, <TrendingUp className="h-4 w-4" />, 4)}
            {renderClassificationCard('By Jurisdiction', classifications.jurisdiction, <MapPin className="h-4 w-4" />, 6)}
          </div>
        </TabsContent>

        <TabsContent value="industry" className="space-y-4">
          {/* Revenue Treemap */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Industry Revenue Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={treemapData}
                    dataKey="size"
                    aspectRatio={4 / 3}
                    stroke="hsl(var(--border))"
                    fill="hsl(var(--primary))"
                  >
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(name) => `${name}`}
                    />
                  </Treemap>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue by Industry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classifications.industry} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => `AED ${(v/1000).toFixed(0)}K`} />
                    <YAxis type="category" dataKey="name" width={120} />
                    <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Industry Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {classifications.industry.slice(0, 9).map((industry, idx) => (
              <Card key={industry.name} className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge style={{ backgroundColor: COLORS[idx % COLORS.length] }} className="text-white">
                      {industry.name}
                    </Badge>
                    <span className="text-2xl font-bold">{industry.count}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-medium">{formatCurrency(industry.revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg per customer</span>
                      <span className="font-medium">{formatCurrency(Math.round(industry.revenue / industry.count))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Portfolio share</span>
                      <span className="font-medium">{industry.percentage}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="nationality" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Customer Nationality Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classifications.nationality}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                    <RechartsTooltip formatter={(value: number, name: string) => 
                      name === 'revenue' ? formatCurrency(value) : value
                    } />
                    <Legend />
                    <Bar yAxisId="left" dataKey="count" name="Customers" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {classifications.nationality.slice(0, 10).map((nat) => (
              <Card key={nat.name} className="border-border/50">
                <CardContent className="pt-4 text-center">
                  <p className="text-3xl font-bold">{nat.count}</p>
                  <p className="text-sm text-muted-foreground truncate">{nat.name}</p>
                  <Badge variant="outline" className="mt-2">{formatCurrency(nat.revenue)}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Lead Source Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={classifications.leadSource}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="count" name="Customers" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Channel Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {classifications.leadSource.map((source, idx) => {
                    const avgValue = source.count > 0 ? Math.round(source.revenue / source.count) : 0;
                    const maxAvg = Math.max(...classifications.leadSource.map(s => s.count > 0 ? s.revenue / s.count : 0));
                    const efficiency = maxAvg > 0 ? (avgValue / maxAvg) * 100 : 0;
                    
                    return (
                      <div key={source.name} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{source.name}</span>
                          <span className="text-muted-foreground">{formatCurrency(avgValue)} avg</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${efficiency}%`,
                              backgroundColor: COLORS[idx % COLORS.length]
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-6">
          {!aiAnalysis ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">AI Analysis Not Run</h3>
                <p className="text-muted-foreground mb-4">
                  Click "Run AI Analysis" to generate detailed insights with reasons, action plans, and recommendations.
                </p>
                <Button onClick={runAIAnalysis} disabled={analyzingAI}>
                  {analyzingAI ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Run AI Analysis
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary Card */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-semibold mb-2">{aiAnalysis.summary.headline}</h3>
                      <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-primary" />
                          <span className="text-sm">Health Score</span>
                        </div>
                        <div className="flex-1">
                          <Progress value={aiAnalysis.summary.healthScore} className="h-3" />
                        </div>
                        <span className="text-lg font-bold">{aiAnalysis.summary.healthScore}/100</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-600">Key Strength</span>
                      </div>
                      <p className="text-sm">{aiAnalysis.summary.keyStrength}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-600">Key Risk</span>
                      </div>
                      <p className="text-sm">{aiAnalysis.summary.keyRisk}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Industry Insights */}
              <Collapsible open={expandedSections['industry'] !== false} onOpenChange={() => toggleSection('industry')}>
                <Card className="border-border/50">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          Industry Insights
                          <Badge variant="secondary">{aiAnalysis.industryInsights.length}</Badge>
                        </div>
                        {expandedSections['industry'] === false ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      {aiAnalysis.industryInsights.map((insight, idx) => (
                        <div key={idx} className="p-4 rounded-lg border border-border/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge style={{ backgroundColor: COLORS[idx % COLORS.length] }} className="text-white">
                              {insight.industry}
                            </Badge>
                            <Badge variant="outline" className={getImpactColor(insight.revenueImpact)}>
                              {insight.revenueImpact} revenue impact
                            </Badge>
                          </div>
                          <p className="font-medium">{insight.insight}</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                              <p className="font-medium text-blue-600 mb-1">Why</p>
                              <p className="text-muted-foreground">{insight.reason}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                              <p className="font-medium text-emerald-600 mb-1">Opportunity</p>
                              <p className="text-muted-foreground">{insight.opportunity}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                              <p className="font-medium text-amber-600 mb-1">Risk</p>
                              <p className="text-muted-foreground">{insight.risk}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Nationality Insights */}
              <Collapsible open={expandedSections['nationality'] !== false} onOpenChange={() => toggleSection('nationality')}>
                <Card className="border-border/50">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="h-5 w-5" />
                          Nationality Insights
                          <Badge variant="secondary">{aiAnalysis.nationalityInsights.length}</Badge>
                        </div>
                        {expandedSections['nationality'] === false ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {aiAnalysis.nationalityInsights.map((insight, idx) => (
                          <div key={idx} className="p-4 rounded-lg border border-border/50 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{insight.nationality}</span>
                              <Badge variant="outline" className={getImpactColor(insight.growthPotential)}>
                                {insight.growthPotential} growth
                              </Badge>
                            </div>
                            <p className="text-sm">{insight.insight}</p>
                            <div className="p-3 rounded-lg bg-muted/50 text-sm">
                              <p className="font-medium mb-1">Cultural Consideration</p>
                              <p className="text-muted-foreground">{insight.culturalConsideration}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Channel Analysis */}
              <Collapsible open={expandedSections['channels'] !== false} onOpenChange={() => toggleSection('channels')}>
                <Card className="border-border/50">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Channel Analysis
                          <Badge variant="secondary">{aiAnalysis.channelAnalysis.length}</Badge>
                        </div>
                        {expandedSections['channels'] === false ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <div className="space-y-4">
                        {aiAnalysis.channelAnalysis.map((channel, idx) => (
                          <div key={idx} className="p-4 rounded-lg border border-border/50">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {getEffectivenessIcon(channel.effectiveness)}
                                <span className="font-medium">{channel.channel}</span>
                              </div>
                              <Badge variant="outline">{channel.effectiveness}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{channel.reason}</p>
                            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                              <div className="flex items-center gap-2 mb-1">
                                <Lightbulb className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium text-primary">Recommendation</span>
                              </div>
                              <p className="text-sm">{channel.recommendation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Action Plan */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Action Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {aiAnalysis.actionPlan.sort((a, b) => a.priority - b.priority).map((action, idx) => (
                      <div key={idx} className="flex gap-4 p-4 rounded-lg border border-border/50">
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            action.priority === 1 ? 'bg-red-500' : 
                            action.priority === 2 ? 'bg-amber-500' : 
                            action.priority === 3 ? 'bg-blue-500' : 'bg-muted-foreground'
                          }`}>
                            {action.priority}
                          </div>
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="font-medium">{action.action}</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Zap className="h-4 w-4" />
                              <span>{action.expectedImpact}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{action.timeline}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>{action.resources}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Strategic Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiAnalysis.recommendations.map((rec, idx) => (
                      <div key={idx} className="p-4 rounded-lg border border-border/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{rec.title}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getImpactColor(rec.impact)}>
                              {rec.impact} impact
                            </Badge>
                            <Badge variant="secondary">{rec.category}</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                        <div className="p-3 rounded-lg bg-muted/50 text-sm">
                          <p className="font-medium mb-1">Rationale</p>
                          <p className="text-muted-foreground">{rec.rationale}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Effort: {rec.effort}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Optimization */}
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Revenue Optimization Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                        <span className="font-medium text-emerald-600">Growth Segments</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {aiAnalysis.revenueOptimization.growthSegments.map((seg, idx) => (
                          <Badge key={idx} variant="outline" className="bg-emerald-500/5">{seg}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-600">Optimize</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {aiAnalysis.revenueOptimization.optimizeSegments.map((seg, idx) => (
                          <Badge key={idx} variant="outline" className="bg-blue-500/5">{seg}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="h-5 w-5 text-amber-600" />
                        <span className="font-medium text-amber-600">Reduce Risk</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {aiAnalysis.revenueOptimization.reduceRiskSegments.map((seg, idx) => (
                          <Badge key={idx} variant="outline" className="bg-amber-500/5">{seg}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Potential Revenue Increase</p>
                    <p className="text-2xl font-bold text-primary">{aiAnalysis.revenueOptimization.potentialRevenueIncrease}</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerClassification;
