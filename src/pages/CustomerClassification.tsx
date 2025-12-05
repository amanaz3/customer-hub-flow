import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, Treemap 
} from 'recharts';
import { 
  Building2, Globe, TrendingUp, Users, Sparkles, Loader2, 
  DollarSign, MapPin, Briefcase, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

interface AIInsight {
  title: string;
  description: string;
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
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

const CustomerClassification = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classifications, setClassifications] = useState<ClassificationGroup>({
    industry: [],
    nationality: [],
    leadSource: [],
    jurisdiction: [],
  });
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    fetchClassificationData();
  }, []);

  const fetchClassificationData = async () => {
    setLoading(true);
    try {
      // Fetch customers with their applications
      const { data: customers, error: custError } = await supabase
        .from('customers')
        .select('id, lead_source, license_type, jurisdiction, amount');

      const { data: applications, error: appError } = await supabase
        .from('account_applications')
        .select('id, customer_id, application_data');

      if (custError || appError) throw custError || appError;

      // Process data
      const industryMap = new Map<string, { count: number; revenue: number }>();
      const nationalityMap = new Map<string, { count: number; revenue: number }>();
      const leadSourceMap = new Map<string, { count: number; revenue: number }>();
      const jurisdictionMap = new Map<string, { count: number; revenue: number }>();

      let total = customers?.length || 0;
      let revenue = 0;

      // Process customers
      customers?.forEach(customer => {
        const amt = Number(customer.amount) || 0;
        revenue += amt;

        // Lead Source
        const leadSource = customer.lead_source || 'Unknown';
        const lsData = leadSourceMap.get(leadSource) || { count: 0, revenue: 0 };
        leadSourceMap.set(leadSource, { count: lsData.count + 1, revenue: lsData.revenue + amt });

        // Jurisdiction
        const jurisdiction = customer.jurisdiction || customer.license_type || 'Unknown';
        const jData = jurisdictionMap.get(jurisdiction) || { count: 0, revenue: 0 };
        jurisdictionMap.set(jurisdiction, { count: jData.count + 1, revenue: jData.revenue + amt });
      });

      // Process applications for industry and nationality
      applications?.forEach(app => {
        const data = app.application_data as Record<string, any> | null;
        if (!data) return;

        const customer = customers?.find(c => c.id === app.customer_id);
        const amt = Number(customer?.amount) || 0;

        // Industry/Business Activity
        const industry = extractIndustry(data);
        if (industry) {
          const iData = industryMap.get(industry) || { count: 0, revenue: 0 };
          industryMap.set(industry, { count: iData.count + 1, revenue: iData.revenue + amt });
        }

        // Nationality
        const nationality = data.nationality || data.step1?.nationality || 'Unknown';
        if (nationality && nationality !== 'Unknown') {
          const nData = nationalityMap.get(nationality) || { count: 0, revenue: 0 };
          nationalityMap.set(nationality, { count: nData.count + 1, revenue: nData.revenue + amt });
        }
      });

      // Convert maps to arrays
      const toArray = (map: Map<string, { count: number; revenue: number }>, total: number): ClassificationData[] => {
        return Array.from(map.entries())
          .map(([name, data]) => ({
            name,
            count: data.count,
            revenue: data.revenue,
            percentage: total > 0 ? Math.round((data.count / total) * 100) : 0,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
      };

      setClassifications({
        industry: toArray(industryMap, industryMap.size > 0 ? Array.from(industryMap.values()).reduce((a, b) => a + b.count, 0) : 1),
        nationality: toArray(nationalityMap, nationalityMap.size > 0 ? Array.from(nationalityMap.values()).reduce((a, b) => a + b.count, 0) : 1),
        leadSource: toArray(leadSourceMap, total),
        jurisdiction: toArray(jurisdictionMap, total),
      });

      setTotalCustomers(total);
      setTotalRevenue(revenue);
    } catch (error) {
      console.error('Error fetching classification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractIndustry = (data: Record<string, any>): string => {
    // Try various fields that might contain industry info
    const activity = data.business_activity_details || 
                    data.proposed_activity || 
                    data.step2?.business_activity_details ||
                    data.step2?.proposed_activity ||
                    data.step3?.business_activity_details;

    if (!activity) return 'Other';

    const activityLower = activity.toLowerCase();
    
    // Classify into industry categories
    if (activityLower.includes('real estate') || activityLower.includes('property')) return 'Real Estate';
    if (activityLower.includes('trading') || activityLower.includes('import') || activityLower.includes('export')) return 'Trading';
    if (activityLower.includes('gold') || activityLower.includes('diamond') || activityLower.includes('jewelry') || activityLower.includes('precious')) return 'Gold & Diamonds';
    if (activityLower.includes('consult')) return 'Consulting';
    if (activityLower.includes('tech') || activityLower.includes('software') || activityLower.includes('it ')) return 'Technology';
    if (activityLower.includes('food') || activityLower.includes('restaurant') || activityLower.includes('catering')) return 'Food & Beverage';
    if (activityLower.includes('construction') || activityLower.includes('contracting')) return 'Construction';
    if (activityLower.includes('transport') || activityLower.includes('logistics')) return 'Logistics';
    if (activityLower.includes('health') || activityLower.includes('medical') || activityLower.includes('pharma')) return 'Healthcare';
    if (activityLower.includes('retail') || activityLower.includes('shop')) return 'Retail';
    if (activityLower.includes('finance') || activityLower.includes('investment')) return 'Financial Services';
    if (activityLower.includes('education') || activityLower.includes('training')) return 'Education';
    if (activityLower.includes('media') || activityLower.includes('marketing') || activityLower.includes('advertising')) return 'Media & Marketing';
    if (activityLower.includes('manufact')) return 'Manufacturing';
    if (activityLower.includes('tourism') || activityLower.includes('travel') || activityLower.includes('hotel')) return 'Tourism & Hospitality';
    
    return 'Other';
  };

  const runAIAnalysis = async () => {
    setAnalyzingAI(true);
    try {
      // Generate AI insights based on the data
      const insights: AIInsight[] = [];

      // Industry insights
      if (classifications.industry.length > 0) {
        const topIndustry = classifications.industry[0];
        insights.push({
          title: `${topIndustry.name} Dominates Your Portfolio`,
          description: `${topIndustry.percentage}% of your customers are in ${topIndustry.name}, generating AED ${topIndustry.revenue.toLocaleString()} in revenue.`,
          recommendation: `Consider developing specialized service packages for ${topIndustry.name} clients to increase retention and upsell opportunities.`,
          impact: 'high',
        });
      }

      // Lead source insights
      if (classifications.leadSource.length > 0) {
        const topSource = classifications.leadSource[0];
        const avgRevPerSource = classifications.leadSource.map(s => s.revenue / s.count);
        const highestAvgSource = classifications.leadSource.reduce((prev, curr) => 
          (curr.revenue / curr.count) > (prev.revenue / prev.count) ? curr : prev
        );
        
        insights.push({
          title: `${highestAvgSource.name} Has Highest Customer Value`,
          description: `Customers from ${highestAvgSource.name} have an average value of AED ${Math.round(highestAvgSource.revenue / highestAvgSource.count).toLocaleString()}, making it your most valuable acquisition channel.`,
          recommendation: `Increase marketing budget allocation to ${highestAvgSource.name} channel for better ROI.`,
          impact: 'high',
        });
      }

      // Nationality insights
      if (classifications.nationality.length > 0) {
        const topNationalities = classifications.nationality.slice(0, 3);
        insights.push({
          title: 'Geographic Customer Concentration',
          description: `Top nationalities: ${topNationalities.map(n => `${n.name} (${n.percentage}%)`).join(', ')}. This indicates market focus areas.`,
          recommendation: 'Consider localized marketing campaigns and multilingual support for these demographics.',
          impact: 'medium',
        });
      }

      // Diversification insight
      const industryConcentration = classifications.industry[0]?.percentage || 0;
      if (industryConcentration > 40) {
        insights.push({
          title: 'Portfolio Concentration Risk',
          description: `Over ${industryConcentration}% of revenue comes from a single industry. This creates dependency risk.`,
          recommendation: 'Diversify customer acquisition across multiple industries to reduce sector-specific risks.',
          impact: 'high',
        });
      }

      // Revenue optimization
      const lowRevenueSegments = classifications.industry.filter(i => i.count > 2 && (i.revenue / i.count) < (totalRevenue / totalCustomers * 0.5));
      if (lowRevenueSegments.length > 0) {
        insights.push({
          title: 'Underperforming Segments Identified',
          description: `${lowRevenueSegments.map(s => s.name).join(', ')} segments have below-average revenue per customer.`,
          recommendation: 'Review pricing strategy or consider upselling premium services to these segments.',
          impact: 'medium',
        });
      }

      // Channel efficiency
      const underutilizedChannels = classifications.leadSource.filter(s => s.count < totalCustomers * 0.1);
      if (underutilizedChannels.length > 0) {
        insights.push({
          title: 'Underutilized Acquisition Channels',
          description: `${underutilizedChannels.map(c => c.name).join(', ')} channels are underperforming in customer acquisition.`,
          recommendation: 'Either optimize these channels with targeted campaigns or reallocate resources to high-performing channels.',
          impact: 'low',
        });
      }

      setAiInsights(insights);
    } catch (error) {
      console.error('Error running AI analysis:', error);
    } finally {
      setAnalyzingAI(false);
    }
  };

  const formatCurrency = (value: number) => `AED ${value.toLocaleString()}`;

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
              <Tooltip formatter={(value: number) => [value, 'Customers']} />
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
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderClassificationCard('By Industry', classifications.industry, <Building2 className="h-4 w-4" />, 0)}
            {renderClassificationCard('By Nationality', classifications.nationality, <Globe className="h-4 w-4" />, 2)}
            {renderClassificationCard('By Lead Source', classifications.leadSource, <TrendingUp className="h-4 w-4" />, 4)}
            {renderClassificationCard('By Jurisdiction', classifications.jurisdiction, <MapPin className="h-4 w-4" />, 6)}
          </div>
        </TabsContent>

        <TabsContent value="industry" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Industry Revenue Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classifications.industry} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => `AED ${(v/1000).toFixed(0)}K`} />
                    <YAxis type="category" dataKey="name" width={120} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {classifications.industry.slice(0, 6).map((industry, idx) => (
              <Card key={industry.name} className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge style={{ backgroundColor: COLORS[idx % COLORS.length] }}>{industry.name}</Badge>
                    <span className="text-2xl font-bold">{industry.count}</span>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Revenue: {formatCurrency(industry.revenue)}</p>
                    <p>Avg per customer: {formatCurrency(Math.round(industry.revenue / industry.count))}</p>
                    <p>Portfolio share: {industry.percentage}%</p>
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
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Customers" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {classifications.nationality.slice(0, 10).map((nat, idx) => (
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

        <TabsContent value="ai-insights" className="space-y-4">
          {aiInsights.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">AI Analysis Not Run</h3>
                <p className="text-muted-foreground mb-4">
                  Click "Run AI Analysis" to generate insights about your customer classifications.
                </p>
                <Button onClick={runAIAnalysis} disabled={analyzingAI}>
                  {analyzingAI ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Run AI Analysis
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiInsights.map((insight, idx) => (
                <Card key={idx} className="border-border/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{insight.title}</CardTitle>
                      <Badge 
                        variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}
                      >
                        {insight.impact} impact
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <p className="text-sm font-medium text-primary">💡 Recommendation</p>
                      <p className="text-sm mt-1">{insight.recommendation}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerClassification;
