import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  ShoppingCart, 
  Lightbulb, 
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Users,
  Package,
  Zap,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProductUsage {
  product_name: string;
  product_id: string;
  usage_count: number;
  percentage: number;
}

interface ServicesAIInsightsProps {
  productUsage: ProductUsage[];
  totalApplications: number;
}

interface AIInsights {
  marketInsights: {
    summary: string;
    topPerformers: string[];
    underperformers: string[];
    marketTrends: string[];
  };
  actionPlan: {
    immediate: Array<{ action: string; priority: string; expectedImpact: string }>;
    shortTerm: Array<{ action: string; timeline: string; resources: string }>;
    longTerm: Array<{ action: string; timeline: string; strategicGoal: string }>;
  };
  salesStrategy: {
    focusProducts: string[];
    crossSellOpportunities: Array<{ from: string; to: string; rationale: string }>;
    bundlingRecommendations: Array<{ products: string[]; targetSegment: string; value: string }>;
    pricingInsights: string[];
  };
  salesInsights: {
    conversionTips: string[];
    customerSegments: Array<{ segment: string; preferredProducts: string[]; approach: string }>;
    objectionHandling: Array<{ objection: string; response: string }>;
    upsellTriggers: string[];
  };
  riskAssessment: {
    concentrationRisk: string;
    diversificationScore: string;
    recommendations: string[];
  };
}

const ServicesAIInsights: React.FC<ServicesAIInsightsProps> = ({ productUsage, totalApplications }) => {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const fetchInsights = async () => {
    if (productUsage.length === 0) {
      toast.error("No product data available for analysis");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-services-insights', {
        body: { productUsage, totalApplications }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setInsights(data.insights);
      setGeneratedAt(data.generatedAt);
      toast.success("AI insights generated successfully");
    } catch (error) {
      console.error("Error fetching insights:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate insights");
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'low': return 'bg-green-500/10 text-green-600 border-green-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (!insights) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Brain className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">AI-Powered Insights</h3>
          <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
            Get AI-generated market insights, action plans, sales strategies, and risk assessments based on your product usage data.
          </p>
          <Button onClick={fetchInsights} disabled={isLoading} size="lg">
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Generate AI Insights
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI-Powered Analysis</h3>
          {generatedAt && (
            <Badge variant="outline" className="text-xs">
              Generated {new Date(generatedAt).toLocaleTimeString()}
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetchInsights} disabled={isLoading}>
          <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="insights" className="text-xs py-2">
            <Lightbulb className="h-3 w-3 mr-1" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="action" className="text-xs py-2">
            <Target className="h-3 w-3 mr-1" />
            Action Plan
          </TabsTrigger>
          <TabsTrigger value="strategy" className="text-xs py-2">
            <TrendingUp className="h-3 w-3 mr-1" />
            Strategy
          </TabsTrigger>
          <TabsTrigger value="sales" className="text-xs py-2">
            <ShoppingCart className="h-3 w-3 mr-1" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="risk" className="text-xs py-2">
            <Shield className="h-3 w-3 mr-1" />
            Risk
          </TabsTrigger>
        </TabsList>

        {/* Market Insights Tab */}
        <TabsContent value="insights" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Market Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm">{insights.marketInsights.summary}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    Top Performers
                  </h4>
                  <ul className="space-y-1">
                    {insights.marketInsights.topPerformers.map((item, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                        <span className="text-green-500 mt-0.5">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                    Need Attention
                  </h4>
                  <ul className="space-y-1">
                    {insights.marketInsights.underperformers.map((item, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                        <span className="text-orange-500 mt-0.5">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Market Trends</h4>
                <div className="flex flex-wrap gap-2">
                  {insights.marketInsights.marketTrends.map((trend, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {trend}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Action Plan Tab */}
        <TabsContent value="action" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Action Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible defaultValue="immediate">
                <AccordionItem value="immediate">
                  <AccordionTrigger className="text-sm">
                    <span className="flex items-center gap-2">
                      <Zap className="h-3 w-3 text-red-500" />
                      Immediate Actions
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {insights.actionPlan.immediate.map((item, i) => (
                        <div key={i} className="p-2 border rounded-lg">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium">{item.action}</p>
                            <Badge className={`text-xs ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Impact: {item.expectedImpact}
                          </p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="shortTerm">
                  <AccordionTrigger className="text-sm">
                    <span className="flex items-center gap-2">
                      <ArrowRight className="h-3 w-3 text-yellow-500" />
                      Short-Term (1-3 months)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {insights.actionPlan.shortTerm.map((item, i) => (
                        <div key={i} className="p-2 border rounded-lg">
                          <p className="text-sm font-medium">{item.action}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>Timeline: {item.timeline}</span>
                            <span>•</span>
                            <span>Resources: {item.resources}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="longTerm">
                  <AccordionTrigger className="text-sm">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      Long-Term (3-12 months)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {insights.actionPlan.longTerm.map((item, i) => (
                        <div key={i} className="p-2 border rounded-lg">
                          <p className="text-sm font-medium">{item.action}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>Timeline: {item.timeline}</span>
                            <span>•</span>
                            <span>Goal: {item.strategicGoal}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Strategy Tab */}
        <TabsContent value="strategy" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Sales Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Focus Products</h4>
                <div className="flex flex-wrap gap-2">
                  {insights.salesStrategy.focusProducts.map((product, i) => (
                    <Badge key={i} className="bg-primary/10 text-primary border-primary/20">
                      {product}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Cross-Sell Opportunities</h4>
                <div className="space-y-2">
                  {insights.salesStrategy.crossSellOpportunities.map((opp, i) => (
                    <div key={i} className="p-2 bg-muted/50 rounded-lg flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{opp.from}</Badge>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="outline" className="text-xs">{opp.to}</Badge>
                      <span className="text-xs text-muted-foreground ml-auto">{opp.rationale}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Bundle Recommendations</h4>
                <div className="space-y-2">
                  {insights.salesStrategy.bundlingRecommendations.map((bundle, i) => (
                    <div key={i} className="p-2 border rounded-lg">
                      <div className="flex flex-wrap gap-1 mb-1">
                        {bundle.products.map((p, j) => (
                          <Badge key={j} variant="secondary" className="text-xs">{p}</Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Target:</span> {bundle.targetSegment}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Value:</span> {bundle.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Pricing Insights</h4>
                <ul className="space-y-1">
                  {insights.salesStrategy.pricingInsights.map((insight, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                      <span className="text-primary mt-0.5">•</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Insights Tab */}
        <TabsContent value="sales" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-green-500" />
                Sales Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Conversion Tips</h4>
                <div className="grid gap-2">
                  {insights.salesInsights.conversionTips.map((tip, i) => (
                    <div key={i} className="p-2 bg-green-500/5 border border-green-500/20 rounded-lg flex items-start gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Customer Segments</h4>
                <div className="space-y-2">
                  {insights.salesInsights.customerSegments.map((seg, i) => (
                    <div key={i} className="p-2 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-3 w-3 text-primary" />
                        <span className="text-sm font-medium">{seg.segment}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {seg.preferredProducts.map((p, j) => (
                          <Badge key={j} variant="outline" className="text-xs">{p}</Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{seg.approach}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Objection Handling</h4>
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2 pr-4">
                    {insights.salesInsights.objectionHandling.map((obj, i) => (
                      <div key={i} className="p-2 bg-muted/50 rounded-lg">
                        <p className="text-xs font-medium text-destructive mb-1">"{obj.objection}"</p>
                        <p className="text-xs text-muted-foreground">→ {obj.response}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Upsell Triggers</h4>
                <div className="flex flex-wrap gap-2">
                  {insights.salesInsights.upsellTriggers.map((trigger, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      <Zap className="h-2 w-2 mr-1" />
                      {trigger}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Assessment Tab */}
        <TabsContent value="risk" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-orange-500" />
                Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                <h4 className="text-sm font-medium mb-1">Concentration Risk</h4>
                <p className="text-xs text-muted-foreground">{insights.riskAssessment.concentrationRisk}</p>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div>
                  <h4 className="text-sm font-medium">Diversification Score</h4>
                  <p className="text-xs text-muted-foreground">{insights.riskAssessment.diversificationScore}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                <div className="space-y-2">
                  {insights.riskAssessment.recommendations.map((rec, i) => (
                    <div key={i} className="p-2 bg-muted/50 rounded-lg flex items-start gap-2">
                      <AlertTriangle className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServicesAIInsights;
