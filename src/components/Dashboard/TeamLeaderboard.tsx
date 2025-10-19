import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, TrendingUp, Award, Medal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UserPerformance {
  user_id: string;
  user_name: string;
  target_applications: number;
  target_completed: number;
  target_revenue: number;
  actual_applications: number;
  actual_completed: number;
  actual_revenue: number;
  applications_progress: number;
  completed_progress: number;
  revenue_progress: number;
  overall_progress: number;
}

export const TeamLeaderboard = () => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['team-leaderboard', currentMonth, currentYear],
    queryFn: async () => {
      // Get all targets for current month
      const { data: targets, error: targetsError } = await supabase
        .from('monthly_targets')
        .select('*, profiles(name)')
        .eq('month', currentMonth)
        .eq('year', currentYear);

      if (targetsError) throw targetsError;

      // Calculate performance for each user
      const performances: UserPerformance[] = await Promise.all(
        (targets || []).map(async (target) => {
          const { data: performance } = await supabase.rpc('calculate_monthly_performance', {
            p_user_id: target.user_id,
            p_month: currentMonth,
            p_year: currentYear,
          });

          const perf = performance?.[0] || { actual_applications: 0, actual_completed: 0, actual_revenue: 0 };

          const applicationsProgress = target.target_applications > 0
            ? (perf.actual_applications / target.target_applications) * 100
            : 0;
          const completedProgress = target.target_completed > 0
            ? (perf.actual_completed / target.target_completed) * 100
            : 0;
          const revenueProgress = target.target_revenue > 0
            ? (Number(perf.actual_revenue) / target.target_revenue) * 100
            : 0;

          const overall = (applicationsProgress + completedProgress + revenueProgress) / 3;

          return {
            user_id: target.user_id,
            user_name: (target.profiles as any)?.name || 'Unknown',
            target_applications: target.target_applications,
            target_completed: target.target_completed,
            target_revenue: target.target_revenue,
            actual_applications: perf.actual_applications,
            actual_completed: perf.actual_completed,
            actual_revenue: Number(perf.actual_revenue),
            applications_progress: applicationsProgress,
            completed_progress: completedProgress,
            revenue_progress: revenueProgress,
            overall_progress: overall,
          };
        })
      );

      // Sort by overall progress
      return performances.sort((a, b) => b.overall_progress - a.overall_progress);
    },
    staleTime: 2 * 60 * 1000,
  });

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-600" />;
    return null;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-emerald-600';
    if (progress >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Team Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading leaderboard...</div>
        </CardContent>
      </Card>
    );
  }

  const totalTeamTarget = leaderboard?.reduce((sum, u) => sum + u.target_applications, 0) || 0;
  const totalTeamActual = leaderboard?.reduce((sum, u) => sum + u.actual_applications, 0) || 0;
  const teamProgress = totalTeamTarget > 0 ? (totalTeamActual / totalTeamTarget) * 100 : 0;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Team Leaderboard
        </CardTitle>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Team Progress</span>
            <span className="text-sm font-bold">{totalTeamActual} / {totalTeamTarget}</span>
          </div>
          <Progress value={teamProgress} className="h-3" />
          <p className="text-xs text-muted-foreground mt-1">
            {teamProgress.toFixed(2)}% of team target achieved
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {!leaderboard || leaderboard.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No targets set yet. Encourage team members to set their monthly targets!
          </div>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((user, index) => (
              <div
                key={user.user_id}
                className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                      {getRankIcon(index) || <span className="text-sm font-bold">#{index + 1}</span>}
                    </div>
                    <div>
                      <h4 className="font-semibold">{user.user_name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {user.actual_applications} / {user.target_applications} applications
                      </p>
                    </div>
                  </div>
                  <Badge className={getProgressColor(user.overall_progress)}>
                    {user.overall_progress.toFixed(0)}%
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Applications</span>
                      <span>{user.applications_progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={user.applications_progress} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Completed</span>
                      <span>{user.completed_progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={user.completed_progress} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Revenue</span>
                      <span>{user.revenue_progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={user.revenue_progress} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
