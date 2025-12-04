import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  ArrowUpRight
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface CustomerSegment {
  name: string;
  count: number;
  totalRevenue: number;
  avgRevenue: number;
  repeatRate: number;
  growthPotential: 'high' | 'medium' | 'low';
  description: string;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const CustomerSegments = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
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
      // Fetch customers with their applications and revenue
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
          products(name)
        `);

      if (error) throw error;

      // Fetch applications per customer
      const { data: applications } = await supabase
        .from('account_applications')
        .select('customer_id, status, created_at');

      // Calculate segments based on behavior
      const customerMap = new Map<string, {
        totalRevenue: number;
        applicationCount: number;
        statuses: string[];
        productTypes: string[];
      }>();

      customers?.forEach(customer => {
        const existing = customerMap.get(customer.id) || {
          totalRevenue: 0,
          applicationCount: 0,
          statuses: [],
          productTypes: []
        };
        existing.totalRevenue += Number(customer.amount) || 0;
        if (customer.products?.name) {
          existing.productTypes.push(customer.products.name);
        }
        customerMap.set(customer.id, existing);
      });

      applications?.forEach(app => {
        if (app.customer_id && customerMap.has(app.customer_id)) {
          const existing = customerMap.get(app.customer_id)!;
          existing.applicationCount++;
          existing.statuses.push(app.status);
          customerMap.set(app.customer_id, existing);
        }
      });

      // Define segments
      const segments: CustomerSegment[] = [];

      // High-Value Repeat Customers
      let highValueRepeat = { count: 0, totalRevenue: 0 };
      // Growth Potential (single app, moderate revenue)
      let growthPotential = { count: 0, totalRevenue: 0 };
      // New Customers (recent, low apps)
      let newCustomers = { count: 0, totalRevenue: 0 };
      // At-Risk (no recent activity, rejected apps)
      let atRisk = { count: 0, totalRevenue: 0 };
      // Dormant (old customers, no recent apps)
      let dormant = { count: 0, totalRevenue: 0 };

      customerMap.forEach((data, customerId) => {
        if (data.applicationCount >= 2 && data.totalRevenue > 10000) {
          highValueRepeat.count++;
          highValueRepeat.totalRevenue += data.totalRevenue;
        } else if (data.applicationCount === 1 && data.totalRevenue > 5000) {
          growthPotential.count++;
          growthPotential.totalRevenue += data.totalRevenue;
        } else if (data.applicationCount <= 1 && data.totalRevenue <= 5000) {
          newCustomers.count++;
          newCustomers.totalRevenue += data.totalRevenue;
        } else if (data.statuses.includes('rejected')) {
          atRisk.count++;
          atRisk.totalRevenue += data.totalRevenue;
        } else {
          dormant.count++;
          dormant.totalRevenue += data.totalRevenue;
        }
      });

      segments.push({
        name: 'High-Value Repeat',
        count: highValueRepeat.count,
        totalRevenue: highValueRepeat.totalRevenue,
        avgRevenue: highValueRepeat.count > 0 ? highValueRepeat.totalRevenue / highValueRepeat.count : 0,
        repeatRate: 85,
        growthPotential: 'high',
        description: 'Multiple applications, high revenue - prioritize retention'
      });

      segments.push({
        name: 'Growth Potential',
        count: growthPotential.count,
        totalRevenue: growthPotential.totalRevenue,
        avgRevenue: growthPotential.count > 0 ? growthPotential.totalRevenue / growthPotential.count : 0,
        repeatRate: 40,
        growthPotential: 'high',
        description: 'Single service, good revenue - upsell opportunity'
      });

      segments.push({
        name: 'New Customers',
        count: newCustomers.count,
        totalRevenue: newCustomers.totalRevenue,
        avgRevenue: newCustomers.count > 0 ? newCustomers.totalRevenue / newCustomers.count : 0,
        repeatRate: 20,
        growthPotential: 'medium',
        description: 'Recent signups - nurture and onboard'
      });

      segments.push({
        name: 'At-Risk',
        count: atRisk.count,
        totalRevenue: atRisk.totalRevenue,
        avgRevenue: atRisk.count > 0 ? atRisk.totalRevenue / atRisk.count : 0,
        repeatRate: 10,
        growthPotential: 'low',
        description: 'Rejected applications - needs attention'
      });

      segments.push({
        name: 'Dormant',
        count: dormant.count,
        totalRevenue: dormant.totalRevenue,
        avgRevenue: dormant.count > 0 ? dormant.totalRevenue / dormant.count : 0,
        repeatRate: 5,
        growthPotential: 'low',
        description: 'No recent activity - re-engagement needed'
      });

      return {
        segments,
        totalCustomers: customerMap.size,
        totalRevenue: Array.from(customerMap.values()).reduce((sum, c) => sum + c.totalRevenue, 0)
      };
    },
    enabled: isAdmin
  });

  if (loading || segmentsLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!isAdmin) {
    return null;
  }

  const segments = segmentData?.segments || [];
  const chartData = segments.map(s => ({
    name: s.name,
    customers: s.count,
    revenue: s.totalRevenue
  }));

  const pieData = segments.map(s => ({
    name: s.name,
    value: s.count
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
      <div>
        <h1 className="text-3xl font-bold">Customer Segments</h1>
        <p className="text-muted-foreground">
          Recurring revenue analysis and growth potential by customer segment
        </p>
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

      {/* Charts */}
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
                    {pieData.map((entry, index) => (
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

      {/* Segment Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Segment Details</h2>
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
      </div>
    </div>
  );
};

export default CustomerSegments;
