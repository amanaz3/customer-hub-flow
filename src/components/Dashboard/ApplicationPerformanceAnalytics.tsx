import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Clock, CheckCircle2, Users, Calendar } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface StagePerformance {
  stage: string;
  avgDays: number;
  count: number;
  completionRate: number;
}

interface MonthlyTrend {
  month: string;
  total: number;
  completed: number;
  avgProcessingDays: number;
}

interface UserPerformance {
  userId: string;
  userName: string;
  totalApps: number;
  completedApps: number;
  avgDays: number;
  completionRate: number;
}

export function ApplicationPerformanceAnalytics() {
  // Fetch last 6 months of data for trends
  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ["application-trends"],
    queryFn: async () => {
      const sixMonthsAgo = subMonths(new Date(), 6);
      
      const { data, error } = await supabase
        .from("account_applications")
        .select(`
          id,
          status,
          created_at,
          completed_at
        `)
        .gte("created_at", sixMonthsAgo.toISOString())
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching trends:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Group by month
      const monthlyData: Record<string, { total: number; completed: number; totalDays: number }> = {};
      
      data.forEach((app: any) => {
        const monthKey = format(new Date(app.created_at), "MMM yyyy");
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { total: 0, completed: 0, totalDays: 0 };
        }
        monthlyData[monthKey].total++;
        
        if (app.status === "completed" && app.completed_at) {
          monthlyData[monthKey].completed++;
          const days = Math.floor(
            (new Date(app.completed_at).getTime() - new Date(app.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          monthlyData[monthKey].totalDays += days;
        }
      });

      return Object.entries(monthlyData).map(([month, stats]) => ({
        month,
        total: stats.total,
        completed: stats.completed,
        avgProcessingDays: stats.completed > 0 ? Math.round(stats.totalDays / stats.completed) : 0,
      })) as MonthlyTrend[];
    },
  });

  // Calculate stage performance
  const { data: stagePerformance, isLoading: stageLoading } = useQuery({
    queryKey: ["stage-performance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("application_status_changes")
        .select(`
          application_id,
          previous_status,
          new_status,
          created_at
        `)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching stage performance:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      const stages = ["draft", "submitted", "under_review", "approved", "paid"];
      const stageStats: Record<string, { totalDays: number; count: number; completed: number }> = {};

      stages.forEach((stage) => {
        stageStats[stage] = { totalDays: 0, count: 0, completed: 0 };
      });

      // Group changes by application
      const appChanges: Record<string, any[]> = {};
      data.forEach((change: any) => {
        if (!appChanges[change.application_id]) {
          appChanges[change.application_id] = [];
        }
        appChanges[change.application_id].push(change);
      });

      // Calculate time in each stage
      Object.values(appChanges).forEach((changes: any[]) => {
        for (let i = 0; i < changes.length - 1; i++) {
          const current = changes[i];
          const next = changes[i + 1];
          const stage = current.new_status;
          
          if (stageStats[stage]) {
            const days = Math.floor(
              (new Date(next.created_at).getTime() - new Date(current.created_at).getTime()) / (1000 * 60 * 60 * 24)
            );
            stageStats[stage].totalDays += days;
            stageStats[stage].count++;
            
            if (next.new_status === "completed") {
              stageStats[stage].completed++;
            }
          }
        }
      });

      return stages.map((stage) => ({
        stage,
        avgDays: stageStats[stage].count > 0 
          ? Math.round(stageStats[stage].totalDays / stageStats[stage].count) 
          : 0,
        count: stageStats[stage].count,
        completionRate: stageStats[stage].count > 0
          ? Math.round((stageStats[stage].completed / stageStats[stage].count) * 100)
          : 0,
      })) as StagePerformance[];
    },
  });

  // User performance breakdown
  const { data: userPerformance, isLoading: userLoading } = useQuery({
    queryKey: ["user-performance"],
    queryFn: async () => {
      const { data: appsData, error: appsError } = await supabase
        .from("account_applications")
        .select(`
          id,
          status,
          created_at,
          completed_at,
          customer_id
        `);

      if (appsError) {
        console.error("Error fetching applications:", appsError);
        throw appsError;
      }

      if (!appsData || appsData.length === 0) {
        return [];
      }

      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select("id, user_id");

      if (customersError) {
        console.error("Error fetching customers:", customersError);
        throw customersError;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name");

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }

      // Create lookup maps
      const customerMap = new Map(customersData?.map(c => [c.id, c.user_id]) || []);
      const profileMap = new Map(profilesData?.map(p => [p.id, p.name]) || []);

      const userStats: Record<string, {
        name: string;
        total: number;
        completed: number;
        totalDays: number;
      }> = {};

      appsData.forEach((app: any) => {
        const userId = customerMap.get(app.customer_id);
        if (!userId) return;

        if (!userStats[userId]) {
          userStats[userId] = {
            name: profileMap.get(userId) || "Unknown",
            total: 0,
            completed: 0,
            totalDays: 0,
          };
        }

        userStats[userId].total++;

        if (app.status === "completed" && app.completed_at) {
          userStats[userId].completed++;
          const days = Math.floor(
            (new Date(app.completed_at).getTime() - new Date(app.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          userStats[userId].totalDays += days;
        }
      });

      return Object.entries(userStats).map(([userId, stats]) => ({
        userId,
        userName: stats.name,
        totalApps: stats.total,
        completedApps: stats.completed,
        avgDays: stats.completed > 0 ? Math.round(stats.totalDays / stats.completed) : 0,
        completionRate: Math.round((stats.completed / stats.total) * 100),
      })) as UserPerformance[];
    },
  });

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trendsData && trendsData.length > 0
                ? Math.round(
                    trendsData.reduce((sum, m) => sum + m.avgProcessingDays, 0) / trendsData.length
                  )
                : 0}{" "}
              days
            </div>
            <p className="text-xs text-muted-foreground">Last 6 months average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trendsData && trendsData.length > 0
                ? Math.round(
                    (trendsData.reduce((sum, m) => sum + m.completed, 0) /
                      trendsData.reduce((sum, m) => sum + m.total, 0)) *
                      100
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Last 6 months</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trendsData?.reduce((sum, m) => sum + m.total, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last 6 months</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userPerformance?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Processing applications</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Historical Trends</TabsTrigger>
          <TabsTrigger value="stages">Stage Performance</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Volume Trends</CardTitle>
              <CardDescription>Total applications and completions over time</CardDescription>
            </CardHeader>
            <CardContent>
              {trendsLoading ? (
                <p className="text-center py-8 text-muted-foreground">Loading trends...</p>
              ) : !trendsData || trendsData.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No application data available for the last 6 months</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total Applications" />
                    <Line type="monotone" dataKey="completed" stroke="#82ca9d" name="Completed" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Average Processing Time</CardTitle>
              <CardDescription>Days to complete applications by month</CardDescription>
            </CardHeader>
            <CardContent>
              {trendsLoading ? (
                <p className="text-center py-8 text-muted-foreground">Loading trends...</p>
              ) : !trendsData || trendsData.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No completed application data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgProcessingDays" fill="#8884d8" name="Avg Days" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stage Performance Metrics</CardTitle>
              <CardDescription>Average time spent in each stage</CardDescription>
            </CardHeader>
            <CardContent>
              {stageLoading ? (
                <p className="text-center py-8 text-muted-foreground">Loading stage data...</p>
              ) : !stagePerformance || stagePerformance.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No status change data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stagePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgDays" fill="#8884d8" name="Avg Days in Stage" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stage Statistics</CardTitle>
              <CardDescription>Detailed metrics for each stage</CardDescription>
            </CardHeader>
            <CardContent>
              {stageLoading ? (
                <p className="text-center py-8 text-muted-foreground">Loading...</p>
              ) : !stagePerformance || stagePerformance.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No stage statistics available</p>
              ) : (
                <div className="space-y-3">
                  {stagePerformance.map((stage) => (
                    <div key={stage.stage} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium capitalize">{stage.stage}</p>
                        <p className="text-sm text-muted-foreground">{stage.count} applications</p>
                      </div>
                      <div className="flex gap-4 items-center">
                        <div className="text-right">
                          <p className="text-sm font-medium">{stage.avgDays} days</p>
                          <p className="text-xs text-muted-foreground">avg time</p>
                        </div>
                        <Badge variant="outline">{stage.completionRate}% completion</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance Overview</CardTitle>
              <CardDescription>Individual team member metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {userLoading ? (
                <p className="text-center py-8 text-muted-foreground">Loading team data...</p>
              ) : !userPerformance || userPerformance.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No team performance data available</p>
              ) : (
                <div className="space-y-3">
                  {userPerformance
                    .sort((a, b) => b.completionRate - a.completionRate)
                    .map((user) => (
                      <div key={user.userId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <p className="font-medium">{user.userName}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.completedApps} of {user.totalApps} completed
                          </p>
                        </div>
                        <div className="flex gap-4 items-center">
                          <div className="text-right">
                            <p className="text-sm font-medium">{user.avgDays} days</p>
                            <p className="text-xs text-muted-foreground">avg completion</p>
                          </div>
                          <Badge
                            variant={user.completionRate >= 80 ? "default" : "outline"}
                            className={
                              user.completionRate >= 80
                                ? "bg-green-500"
                                : user.completionRate >= 50
                                ? "bg-yellow-500"
                                : ""
                            }
                          >
                            {user.completionRate}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Completion Rate Distribution</CardTitle>
              <CardDescription>Team member completion rates</CardDescription>
            </CardHeader>
            <CardContent>
              {userLoading ? (
                <p className="text-center py-8 text-muted-foreground">Loading...</p>
              ) : !userPerformance || userPerformance.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No completion rate data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={userPerformance.map((u, i) => ({
                        name: u.userName,
                        value: u.completionRate,
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {userPerformance?.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
