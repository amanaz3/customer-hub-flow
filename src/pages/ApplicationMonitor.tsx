import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MainLayout from "@/components/Layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Clock, TrendingUp, Bell, Activity } from "lucide-react";
import { format } from "date-fns";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { toast } from "sonner";

interface ApplicationActivity {
  id: string;
  application_id: string;
  reference_number: number;
  previous_status: string;
  new_status: string;
  changed_by: string;
  created_at: string;
  customer_name: string;
  customer_company: string;
}

interface ActiveApplication {
  id: string;
  reference_number: number;
  status: string;
  created_at: string;
  updated_at: string;
  customer: {
    name: string;
    company: string;
  };
}

export default function ApplicationMonitor() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Real-time subscription for application changes
  useRealtimeSubscription({
    table: "account_applications",
    event: "*",
    onUpdate: () => {
      setRefreshKey((prev) => prev + 1);
      toast.info("Application updated", { duration: 2000 });
    },
  });

  // Real-time subscription for status changes
  useRealtimeSubscription({
    table: "application_status_changes",
    event: "INSERT",
    onUpdate: () => {
      setRefreshKey((prev) => prev + 1);
      toast.success("New status change detected", { duration: 2000 });
    },
  });

  // Fetch recent activity (last 50 status changes)
  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ["application-activity", refreshKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("application_status_changes")
        .select(`
          id,
          application_id,
          previous_status,
          new_status,
          changed_by,
          created_at,
          account_applications!inner(
            reference_number,
            customers!inner(name, company)
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        application_id: item.application_id,
        reference_number: item.account_applications.reference_number,
        previous_status: item.previous_status,
        new_status: item.new_status,
        changed_by: item.changed_by,
        created_at: item.created_at,
        customer_name: item.account_applications.customers.name,
        customer_company: item.account_applications.customers.company,
      })) as ApplicationActivity[];
    },
  });

  // Fetch active applications (not completed or rejected)
  const { data: activeApps, isLoading: activeLoading } = useQuery({
    queryKey: ["active-applications", refreshKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("account_applications")
        .select(`
          id,
          reference_number,
          status,
          created_at,
          updated_at,
          customers!inner(name, company)
        `)
        .not("status", "in", '("completed","rejected")')
        .order("updated_at", { ascending: false })
        .limit(30);

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        reference_number: item.reference_number,
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        customer: {
          name: item.customers.name,
          company: item.customers.company,
        },
      })) as ActiveApplication[];
    },
  });

  // Calculate stuck applications (>7 days in non-completed status)
  const stuckApps = activeApps?.filter((app) => {
    const daysSinceCreation = Math.floor(
      (new Date().getTime() - new Date(app.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceCreation > 7;
  });

  // Calculate at-risk applications (>14 days)
  const atRiskApps = activeApps?.filter((app) => {
    const daysSinceCreation = Math.floor(
      (new Date().getTime() - new Date(app.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceCreation > 14;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-500",
      submitted: "bg-blue-500",
      under_review: "bg-yellow-500",
      approved: "bg-green-500",
      paid: "bg-purple-500",
      completed: "bg-emerald-500",
      rejected: "bg-red-500",
      returned: "bg-orange-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getDaysInProcess = (createdAt: string) => {
    return Math.floor(
      (new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Real-time Application Monitor</h1>
            <p className="text-muted-foreground mt-1">
              Live monitoring of application status and activity
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-2">
            <Activity className="h-4 w-4 animate-pulse text-green-500" />
            Live
          </Badge>
        </div>

        {/* Alert Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Applications</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeApps?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Currently in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stuck Applications</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stuckApps?.length || 0}</div>
              <p className="text-xs text-muted-foreground">&gt;7 days without progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">At Risk</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{atRiskApps?.length || 0}</div>
              <p className="text-xs text-muted-foreground">&gt;14 days in process</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Live Activity Feed */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Live Activity Feed
                  </CardTitle>
                  <CardDescription>Recent status changes across all applications</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                {activityLoading ? (
                  <p className="text-center text-muted-foreground py-8">Loading activity...</p>
                ) : recentActivity && recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">
                              #{activity.reference_number}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {activity.customer_company}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Badge className={getStatusColor(activity.previous_status)}>
                              {activity.previous_status}
                            </Badge>
                            <span>→</span>
                            <Badge className={getStatusColor(activity.new_status)}>
                              {activity.new_status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(activity.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No recent activity</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Urgent Action Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Urgent Action Required
              </CardTitle>
              <CardDescription>Applications needing immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                {activeLoading ? (
                  <p className="text-center text-muted-foreground py-8">Loading...</p>
                ) : atRiskApps && atRiskApps.length > 0 ? (
                  <div className="space-y-3">
                    {atRiskApps.map((app) => (
                      <div
                        key={app.id}
                        className="p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono">
                                #{app.reference_number}
                              </Badge>
                              <Badge className={getStatusColor(app.status)}>{app.status}</Badge>
                            </div>
                            <p className="text-sm font-medium">{app.customer.company}</p>
                            <p className="text-xs text-muted-foreground">{app.customer.name}</p>
                          </div>
                          <Badge variant="destructive">
                            {getDaysInProcess(app.created_at)} days
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Last updated: {format(new Date(app.updated_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-2">No urgent items</p>
                    <p className="text-sm text-muted-foreground">All applications on track</p>
                  </div>
                )}

                {stuckApps && stuckApps.length > 0 && (
                  <>
                    <div className="mt-6 mb-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        Stuck Applications (7+ days)
                      </h4>
                    </div>
                    <div className="space-y-3">
                      {stuckApps
                        .filter((app) => getDaysInProcess(app.created_at) <= 14)
                        .map((app) => (
                          <div
                            key={app.id}
                            className="p-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="font-mono">
                                    #{app.reference_number}
                                  </Badge>
                                  <Badge className={getStatusColor(app.status)}>
                                    {app.status}
                                  </Badge>
                                </div>
                                <p className="text-sm font-medium">{app.customer.company}</p>
                              </div>
                              <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900">
                                {getDaysInProcess(app.created_at)} days
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
