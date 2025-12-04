import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, Award, BarChart3, PieChart as PieChartIcon, Grid3x3, Brain } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ServicesAIInsights from './ServicesAIInsights';
interface ProductUsage {
  product_name: string;
  product_id: string;
  usage_count: number;
  percentage: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const ProductUsageAnalytics = () => {
  const [activeView, setActiveView] = useState('combo');
  const [showAIInsights, setShowAIInsights] = useState(false);

  const { data: productUsage = [], isLoading } = useQuery({
    queryKey: ['product_usage_analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          product_id,
          products!inner(name, id)
        `)
        .not('product_id', 'is', null);

      if (error) throw error;

      // Count frequency
      const counts = data.reduce((acc: Record<string, { name: string; count: number }>, curr: any) => {
        const productId = curr.product_id;
        const productName = curr.products.name;
        if (!acc[productId]) {
          acc[productId] = { name: productName, count: 0 };
        }
        acc[productId].count++;
        return acc;
      }, {});

      const total = data.length;
      const result: ProductUsage[] = Object.entries(counts).map(([id, info]) => ({
        product_id: id,
        product_name: info.name,
        usage_count: info.count,
        percentage: Number(((info.count / total) * 100).toFixed(2))
      }));

      return result.sort((a, b) => b.usage_count - a.usage_count);
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Product Analytics...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const totalApplications = productUsage.reduce((sum, p) => sum + p.usage_count, 0);

  // Option 1: Donut Chart
  const DonutChartView = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-primary" />
          Option 1: Donut Chart
        </CardTitle>
        <CardDescription>Visual distribution of product usage</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={productUsage}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={140}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="usage_count"
                label={({ product_name, percentage }) => `${product_name}: ${percentage}%`}
              >
                {productUsage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold">{payload[0].payload.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {payload[0].value} applications ({payload[0].payload.percentage}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center mt-4">
            <p className="text-3xl font-bold">{totalApplications}</p>
            <p className="text-sm text-muted-foreground">Total Applications</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Option 2: Horizontal Bar Chart
  const BarChartView = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Option 2: Horizontal Bar Chart
        </CardTitle>
        <CardDescription>Easy comparison of product usage</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={productUsage} layout="vertical" margin={{ left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="product_name" width={100} />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold">{payload[0].payload.product_name}</p>
                        <p className="text-sm">Count: {payload[0].value}</p>
                        <p className="text-sm text-muted-foreground">
                          {payload[0].payload.percentage}% of total
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="usage_count" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  // Option 3: Card Grid Dashboard
  const CardGridView = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3x3 className="h-5 w-5 text-primary" />
          Option 3: Card Grid Dashboard
        </CardTitle>
        <CardDescription>Detailed stats for each product</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {productUsage.map((product, index) => (
            <Card key={product.product_id} className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{product.product_name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Rank #{index + 1}
                    </CardDescription>
                  </div>
                  {index < 3 && (
                    <Award className={`h-5 w-5 ${
                      index === 0 ? 'text-yellow-500' : 
                      index === 1 ? 'text-gray-400' : 
                      'text-orange-600'
                    }`} />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Usage</span>
                      <span className="font-semibold">{product.usage_count} apps</span>
                    </div>
                    <Progress value={product.percentage} className="h-2" />
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="w-full justify-center text-lg font-bold"
                  >
                    {product.percentage}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // Option 4: Combo View (Recommended)
  const ComboView = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Option 4: Combo View (Recommended)
          </CardTitle>
          <CardDescription>Overview with detailed statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Donut Chart */}
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productUsage.slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={3}
                    dataKey="usage_count"
                  >
                    {productUsage.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center">
                <p className="text-2xl font-bold">{totalApplications}</p>
                <p className="text-xs text-muted-foreground">Total Apps</p>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3">
              <h3 className="font-semibold mb-3">Top Products</h3>
              {productUsage.slice(0, 5).map((product, index) => (
                <div key={product.product_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.product_name}</p>
                    <Progress value={product.percentage} className="h-1.5 mt-1" />
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm">{product.usage_count}</p>
                    <p className="text-xs text-muted-foreground">{product.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Option 5: Leaderboard Style
  const LeaderboardView = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Option 5: Leaderboard Style
        </CardTitle>
        <CardDescription>Gamified ranking of products</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {productUsage.map((product, index) => (
            <div 
              key={product.product_id} 
              className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-all"
            >
              {/* Rank Badge */}
              <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${
                index === 0 ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-500' :
                index === 1 ? 'bg-gray-100 text-gray-700 border-2 border-gray-400' :
                index === 2 ? 'bg-orange-100 text-orange-700 border-2 border-orange-500' :
                'bg-muted text-muted-foreground'
              }`}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-base mb-2">{product.product_name}</h4>
                <div className="flex items-center gap-2">
                  <Progress value={product.percentage} className="h-3 flex-1" />
                  <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    {product.percentage}%
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="text-right">
                <p className="text-2xl font-bold">{product.usage_count}</p>
                <p className="text-xs text-muted-foreground">applications</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Usage Analytics</h2>
          <p className="text-sm text-muted-foreground">Real-time insights into product popularity</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm">
            Live • Updates every 30s
          </Badge>
          <button
            onClick={() => setShowAIInsights(!showAIInsights)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              showAIInsights 
                ? 'bg-primary text-primary-foreground shadow-lg' 
                : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Brain className="h-4 w-4" />
            AI Insights
          </button>
        </div>
      </div>

      {showAIInsights ? (
        <ServicesAIInsights productUsage={productUsage} totalApplications={totalApplications} />
      ) : (
        <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="combo">Combo ⭐</TabsTrigger>
            <TabsTrigger value="donut">Donut</TabsTrigger>
            <TabsTrigger value="bar">Bar Chart</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>
          
          <TabsContent value="combo" className="mt-6">
            <ComboView />
          </TabsContent>
          
          <TabsContent value="donut" className="mt-6">
            <DonutChartView />
          </TabsContent>
          
          <TabsContent value="bar" className="mt-6">
            <BarChartView />
          </TabsContent>
          
          <TabsContent value="cards" className="mt-6">
            <CardGridView />
          </TabsContent>
          
          <TabsContent value="leaderboard" className="mt-6">
            <LeaderboardView />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ProductUsageAnalytics;
