import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Crown, Heart, Star, UserPlus, AlertTriangle, Moon, TrendingUp, Users, DollarSign, Clock } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from "recharts";

interface CustomerRFM {
  id: string;
  name: string;
  company: string;
  email: string;
  recency: number; // days since last activity
  frequency: number; // number of applications
  monetary: number; // total revenue
  rScore: number; // 1-5
  fScore: number; // 1-5
  mScore: number; // 1-5
  rfmScore: number; // combined
  segment: string;
}

interface RFMSegment {
  name: string;
  description: string;
  customers: CustomerRFM[];
  icon: React.ElementType;
  color: string;
  bgColor: string;
  action: string;
}

const RFMAnalysis = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [customers, setCustomers] = useState<CustomerRFM[]>([]);
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
      fetchCustomerData();
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/');
    }
  };

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      
      // Fetch customers with their applications
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
            status
          )
        `);

      if (customersError) throw customersError;

      const now = new Date();
      
      // Calculate RFM scores for each customer
      const rfmCustomers: CustomerRFM[] = (customersData || []).map(customer => {
        const applications = customer.account_applications || [];
        
        // Recency: days since last activity (application or update)
        const lastActivity = applications.length > 0 
          ? new Date(Math.max(...applications.map(a => new Date(a.created_at).getTime())))
          : new Date(customer.updated_at || customer.created_at);
        const recency = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
        
        // Frequency: number of applications
        const frequency = applications.length;
        
        // Monetary: total amount
        const monetary = customer.amount || 0;

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
          segment: ''
        };
      });

      // Calculate quintiles for scoring (1-5)
      const recencies = rfmCustomers.map(c => c.recency).sort((a, b) => a - b);
      const frequencies = rfmCustomers.map(c => c.frequency).sort((a, b) => a - b);
      const monetaries = rfmCustomers.map(c => c.monetary).sort((a, b) => a - b);

      const getQuintile = (value: number, sortedArray: number[], inverse: boolean = false) => {
        if (sortedArray.length === 0) return 3;
        const index = sortedArray.findIndex(v => v >= value);
        const position = index === -1 ? sortedArray.length : index;
        const quintile = Math.ceil(((position + 1) / sortedArray.length) * 5);
        return inverse ? 6 - quintile : quintile; // For recency, lower is better
      };

      // Assign scores and segments
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
    // Champions: High R, F, M
    if (r >= 4 && f >= 4 && m >= 4) return 'Champions';
    // Loyal: High F, decent R and M
    if (f >= 4 && r >= 3) return 'Loyal';
    // Potential Loyalists: Recent, moderate F
    if (r >= 4 && f >= 2 && f <= 3) return 'Potential Loyalists';
    // New Customers: Very recent, low F
    if (r >= 4 && f <= 2) return 'New Customers';
    // At Risk: Was good, now declining
    if (r <= 2 && f >= 3) return 'At Risk';
    // Hibernating: Low across all
    if (r <= 2 && f <= 2) return 'Hibernating';
    // Need Attention: Medium across all
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
        action: 'Reward them. Can be early adopters. Will promote your brand.'
      },
      'Loyal': {
        name: 'Loyal',
        description: 'Spend good money. Responsive to promotions.',
        customers: [],
        icon: Heart,
        color: 'text-red-600',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        action: 'Upsell higher value products. Ask for reviews.'
      },
      'Potential Loyalists': {
        name: 'Potential Loyalists',
        description: 'Recent customers with average frequency.',
        customers: [],
        icon: Star,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        action: 'Offer membership/loyalty programs. Recommend other products.'
      },
      'New Customers': {
        name: 'New Customers',
        description: 'Bought most recently, but not often.',
        customers: [],
        icon: UserPlus,
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        action: 'Provide onboarding support. Give early success.'
      },
      'At Risk': {
        name: 'At Risk',
        description: 'Spent big money and purchased often. But long time ago.',
        customers: [],
        icon: AlertTriangle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        action: 'Send personalized emails. Offer renewals. Provide value.'
      },
      'Hibernating': {
        name: 'Hibernating',
        description: 'Last purchase was long time ago. Low spenders.',
        customers: [],
        icon: Moon,
        color: 'text-slate-600',
        bgColor: 'bg-slate-100 dark:bg-slate-900/30',
        action: 'Offer special discounts. Recreate brand value.'
      },
      'Need Attention': {
        name: 'Need Attention',
        description: 'Above average recency, frequency & monetary values.',
        customers: [],
        icon: TrendingUp,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        action: 'Make limited time offers. Recommend based on past purchases.'
      }
    };

    customers.forEach(customer => {
      if (segmentMap[customer.segment]) {
        segmentMap[customer.segment].customers.push(customer);
      }
    });

    return Object.values(segmentMap).filter(s => s.customers.length > 0);
  }, [customers]);

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
