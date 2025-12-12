import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Medal, Award, TrendingUp, Phone, Users, Star, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';

interface UserPerformance {
  id: string;
  name: string;
  email: string;
  leadsContacted: number;
  leadsConverted: number;
  conversionRate: number;
  totalLeads: number;
}

interface SuccessStory {
  leadName: string;
  convertedAt: string;
  agentName: string;
  estimatedValue: number | null;
}

export const LeadPerformanceLeaderboard = () => {
  const [performances, setPerformances] = useState<UserPerformance[]>([]);
  const [successStories, setSuccessStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekRange, setWeekRange] = useState({ start: startOfWeek(new Date()), end: endOfWeek(new Date()) });

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      // Fetch all users
      const { data: users } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('is_active', true);

      if (!users) return;

      // Fetch leads with activities for this week
      const weekStart = startOfWeek(new Date());
      const weekEnd = endOfWeek(new Date());

      const { data: leads } = await supabase
        .from('leads')
        .select(`
          id,
          name,
          assigned_to,
          status,
          converted_at,
          estimated_value,
          last_contacted_at
        `);

      const { data: activities } = await supabase
        .from('lead_activities')
        .select('lead_id, created_by, activity_type, created_at')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString());

      // Calculate performance per user
      const userPerformance: UserPerformance[] = users.map(user => {
        const userLeads = leads?.filter(l => l.assigned_to === user.id) || [];
        const userActivities = activities?.filter(a => a.created_by === user.id) || [];
        
        // Count unique leads contacted (via activities)
        const contactedLeadIds = new Set(
          userActivities
            .filter(a => ['call', 'whatsapp', 'email', 'meeting'].includes(a.activity_type))
            .map(a => a.lead_id)
        );
        
        const leadsConverted = userLeads.filter(l => l.status === 'converted').length;
        const totalLeads = userLeads.length;
        
        return {
          id: user.id,
          name: user.name || user.email.split('@')[0],
          email: user.email,
          leadsContacted: contactedLeadIds.size,
          leadsConverted,
          conversionRate: totalLeads > 0 ? (leadsConverted / totalLeads) * 100 : 0,
          totalLeads
        };
      });

      // Sort by conversion rate, then by leads contacted
      const sorted = userPerformance
        .filter(p => p.totalLeads > 0 || p.leadsContacted > 0)
        .sort((a, b) => {
          if (b.conversionRate !== a.conversionRate) return b.conversionRate - a.conversionRate;
          return b.leadsContacted - a.leadsContacted;
        });

      setPerformances(sorted);

      // Get recent success stories (conversions this week)
      const recentConversions = leads
        ?.filter(l => l.status === 'converted' && l.converted_at)
        .filter(l => new Date(l.converted_at!) >= weekStart)
        .slice(0, 3)
        .map(l => ({
          leadName: l.name,
          convertedAt: l.converted_at!,
          agentName: users.find(u => u.id === l.assigned_to)?.name || 'Unknown',
          estimatedValue: l.estimated_value
        })) || [];

      setSuccessStories(recentConversions);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-muted-foreground text-sm">{index + 1}</span>;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Weekly Leaderboard */}
      <Card className="border-border/50 bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Trophy className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Weekly Leaderboard</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {format(weekRange.start, 'MMM d')} - {format(weekRange.end, 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <Sparkles className="h-3 w-3 mr-1" />
              Top Performers
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {performances.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No activity this week yet</p>
          ) : (
            <div className="space-y-3">
              {performances.slice(0, 5).map((user, index) => (
                <div 
                  key={user.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    index === 0 ? 'bg-yellow-500/5 border border-yellow-500/20' : 
                    index === 1 ? 'bg-muted/30' : 
                    index === 2 ? 'bg-amber-500/5' : 'hover:bg-muted/30'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getRankIcon(index)}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={`text-xs ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-700' : 'bg-primary/10 text-primary'
                    }`}>
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{user.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {user.leadsContacted} contacted
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {user.leadsConverted} converted
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${
                        user.conversionRate >= 50 ? 'bg-green-500/10 text-green-600' :
                        user.conversionRate >= 25 ? 'bg-yellow-500/10 text-yellow-600' :
                        'bg-muted text-muted-foreground'
                      }`}
                    >
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {user.conversionRate.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Success Stories */}
      {successStories.length > 0 && (
        <Card className="border-border/50 bg-gradient-to-br from-green-500/5 to-background">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Star className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Recent Wins</CardTitle>
                <p className="text-xs text-muted-foreground">Celebrate our conversions!</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {successStories.map((story, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-green-500/10"
                >
                  <div>
                    <p className="font-medium text-sm">{story.leadName}</p>
                    <p className="text-xs text-muted-foreground">
                      Converted by <span className="text-primary font-medium">{story.agentName}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    {story.estimatedValue && (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                        AED {story.estimatedValue.toLocaleString()}
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(story.convertedAt), 'MMM d')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Encouragement Card */}
      <Card className="border-border/50 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Keep Up the Great Work!</p>
              <p className="text-xs text-muted-foreground mt-1">
                Log every call, WhatsApp, and meeting to track your progress and climb the leaderboard.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
