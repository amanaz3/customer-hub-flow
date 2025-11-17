import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, TrendingUp, Target, Award, DollarSign, FileText } from "lucide-react";
import { PeriodSelector } from "@/components/Dashboard/PeriodSelector";
import { useTargetManagement } from "@/hooks/useTargetManagement";
import { cn } from "@/lib/utils";

const TeamTargets = () => {
  const currentDate = new Date();
  const [periodType, setPeriodType] = useState<'monthly' | 'quarterly' | 'half-yearly' | 'annual'>('monthly');
  const [currentPeriod, setCurrentPeriod] = useState(() => {
    switch (periodType) {
      case 'monthly': return currentDate.getMonth() + 1;
      case 'quarterly': return Math.floor(currentDate.getMonth() / 3) + 1;
      case 'half-yearly': return currentDate.getMonth() < 6 ? 1 : 2;
      case 'annual': return 1;
    }
  });
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());

  const { data, isLoading } = useTargetManagement(periodType, currentPeriod, currentYear);

  const handlePeriodTypeChange = (newType: 'monthly' | 'quarterly' | 'half-yearly' | 'annual') => {
    setPeriodType(newType);
    switch (newType) {
      case 'monthly':
        setCurrentPeriod(currentDate.getMonth() + 1);
        break;
      case 'quarterly':
        setCurrentPeriod(Math.floor(currentDate.getMonth() / 3) + 1);
        break;
      case 'half-yearly':
        setCurrentPeriod(currentDate.getMonth() < 6 ? 1 : 2);
        break;
      case 'annual':
        setCurrentPeriod(1);
        break;
    }
  };

  const getProgressStatus = (progress: number): 'green' | 'yellow' | 'red' | 'gray' => {
    if (progress >= 80) return 'green';
    if (progress >= 50) return 'yellow';
    if (progress > 0) return 'red';
    return 'gray';
  };

  const getStatusColor = (status: 'green' | 'yellow' | 'red' | 'gray') => {
    switch (status) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-yellow-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusBadgeVariant = (status: 'green' | 'yellow' | 'red' | 'gray') => {
    switch (status) {
      case 'green': return 'default';
      case 'yellow': return 'secondary';
      case 'red': return 'destructive';
      default: return 'outline';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate team totals
  const teamTotals = data.reduce(
    (acc, user) => ({
      target_applications: acc.target_applications + user.target_applications,
      actual_applications: acc.actual_applications + user.actual_applications,
      target_revenue: acc.target_revenue + user.target_revenue,
      actual_revenue: acc.actual_revenue + user.actual_revenue,
    }),
    { target_applications: 0, actual_applications: 0, target_revenue: 0, actual_revenue: 0 }
  );

  const teamAppProgress = teamTotals.target_applications > 0
    ? (teamTotals.actual_applications / teamTotals.target_applications) * 100
    : 0;

  const teamRevenueProgress = teamTotals.target_revenue > 0
    ? (teamTotals.actual_revenue / teamTotals.target_revenue) * 100
    : 0;

  // Sort users by overall performance
  const sortedUsers = [...data].sort((a, b) => {
    const aAppProgress = a.target_applications > 0 ? (a.actual_applications / a.target_applications) * 100 : 0;
    const bAppProgress = b.target_applications > 0 ? (b.actual_applications / b.target_applications) * 100 : 0;
    return bAppProgress - aAppProgress;
  });

  const getRankIcon = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Team Targets Tracking</h2>
          <p className="text-muted-foreground">
            Monitor team performance against targets in real-time
          </p>
        </div>
        <PeriodSelector
          periodType={periodType}
          currentPeriod={currentPeriod}
          currentYear={currentYear}
          onPeriodChange={setCurrentPeriod}
          onYearChange={setCurrentYear}
        />
      </div>

      {/* Team Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.length}</div>
            <p className="text-xs text-muted-foreground">Active team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications Progress</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamTotals.actual_applications} / {teamTotals.target_applications}</div>
            <Progress value={teamAppProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">{Math.round(teamAppProgress)}% complete</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Progress</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(teamTotals.actual_revenue)}</div>
            <Progress value={teamRevenueProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round(teamRevenueProgress)}% of {formatCurrency(teamTotals.target_revenue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Status</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={cn("h-3 w-3 rounded-full", getStatusColor(getProgressStatus(teamAppProgress)))} />
              <Badge variant={getStatusBadgeVariant(getProgressStatus(teamAppProgress))}>
                {getProgressStatus(teamAppProgress).toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Based on applications</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="details">Detailed Metrics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {isLoading ? (
              <p className="col-span-2 text-center text-muted-foreground">Loading team data...</p>
            ) : data.length === 0 ? (
              <p className="col-span-2 text-center text-muted-foreground">No team members with targets for this period</p>
            ) : (
              data.map((user) => {
                const appProgress = user.target_applications > 0
                  ? (user.actual_applications / user.target_applications) * 100
                  : 0;
                const revenueProgress = user.target_revenue > 0
                  ? (user.actual_revenue / user.target_revenue) * 100
                  : 0;
                const appStatus = getProgressStatus(appProgress);
                const revenueStatus = getProgressStatus(revenueProgress);

                return (
                  <Card key={user.user_id}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {user.user_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{user.user_name}</CardTitle>
                          <CardDescription>{user.user_email}</CardDescription>
                        </div>
                        <div className={cn("h-3 w-3 rounded-full", getStatusColor(appStatus))} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Applications
                          </span>
                          <span className="text-sm font-bold">
                            {user.actual_applications} / {user.target_applications}
                          </span>
                        </div>
                        <Progress value={appProgress} />
                        <p className="text-xs text-muted-foreground mt-1">{Math.round(appProgress)}%</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Revenue
                          </span>
                          <span className="text-sm font-bold">
                            {formatCurrency(user.actual_revenue)}
                          </span>
                        </div>
                        <Progress value={revenueProgress} />
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.round(revenueProgress)}% of {formatCurrency(user.target_revenue)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Leaderboard</CardTitle>
              <CardDescription>Ranked by application completion percentage</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-muted-foreground">Loading leaderboard...</p>
              ) : sortedUsers.length === 0 ? (
                <p className="text-center text-muted-foreground">No data available</p>
              ) : (
                <div className="space-y-4">
                  {sortedUsers.map((user, index) => {
                    const appProgress = user.target_applications > 0
                      ? (user.actual_applications / user.target_applications) * 100
                      : 0;
                    const status = getProgressStatus(appProgress);

                    return (
                      <div key={user.user_id} className="flex items-center gap-4 p-4 rounded-lg border">
                        <div className="text-2xl font-bold w-12 text-center">
                          {getRankIcon(index)}
                        </div>
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>
                            {user.user_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{user.user_name}</p>
                          <p className="text-sm text-muted-foreground">{user.user_email}</p>
                        </div>
                        <div className="text-right min-w-[120px]">
                          <p className="text-sm font-medium">
                            {user.actual_applications} / {user.target_applications}
                          </p>
                          <div className="flex items-center justify-end gap-2 mt-1">
                            <Progress value={appProgress} className="w-20" />
                            <Badge variant={getStatusBadgeVariant(status)}>
                              {Math.round(appProgress)}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detailed Metrics Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Performance Metrics</CardTitle>
              <CardDescription>Complete breakdown of all team members</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-muted-foreground">Loading details...</p>
              ) : data.length === 0 ? (
                <p className="text-center text-muted-foreground">No data available</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Team Member</th>
                        <th className="text-right p-2">Target Apps</th>
                        <th className="text-right p-2">Actual Apps</th>
                        <th className="text-right p-2">Progress</th>
                        <th className="text-right p-2">Target Revenue</th>
                        <th className="text-right p-2">Actual Revenue</th>
                        <th className="text-right p-2">Progress</th>
                        <th className="text-center p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((user) => {
                        const appProgress = user.target_applications > 0
                          ? (user.actual_applications / user.target_applications) * 100
                          : 0;
                        const revenueProgress = user.target_revenue > 0
                          ? (user.actual_revenue / user.target_revenue) * 100
                          : 0;
                        const status = getProgressStatus(appProgress);

                        return (
                          <tr key={user.user_id} className="border-b hover:bg-muted/50">
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {user.user_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{user.user_name}</span>
                              </div>
                            </td>
                            <td className="text-right p-2">{user.target_applications}</td>
                            <td className="text-right p-2 font-semibold">{user.actual_applications}</td>
                            <td className="text-right p-2">
                              <Badge variant="outline">{Math.round(appProgress)}%</Badge>
                            </td>
                            <td className="text-right p-2">{formatCurrency(user.target_revenue)}</td>
                            <td className="text-right p-2 font-semibold">{formatCurrency(user.actual_revenue)}</td>
                            <td className="text-right p-2">
                              <Badge variant="outline">{Math.round(revenueProgress)}%</Badge>
                            </td>
                            <td className="text-center p-2">
                              <Badge variant={getStatusBadgeVariant(status)}>
                                {status.toUpperCase()}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamTargets;
