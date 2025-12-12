import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Medal, Award, TrendingUp, Phone, Users, Star, Sparkles, FlaskConical } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek } from 'date-fns';

interface UserPerformance {
  id: string;
  name: string;
  email: string;
  leadsAcquired: number; // Total leads assigned this week
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  leadsConverted: number;
}

interface SuccessStory {
  leadName: string;
  convertedAt: string;
  agentName: string;
  estimatedValue: number | null;
}

// Dummy data for demo
const dummyPerformances: UserPerformance[] = [
  { id: '1', name: 'Sarah Ahmed', email: 'sarah@example.com', leadsAcquired: 14, hotLeads: 5, warmLeads: 6, coldLeads: 3, leadsConverted: 3 },
  { id: '2', name: 'Mohammed Ali', email: 'mohammed@example.com', leadsAcquired: 12, hotLeads: 4, warmLeads: 5, coldLeads: 3, leadsConverted: 2 },
  { id: '3', name: 'Fatima Hassan', email: 'fatima@example.com', leadsAcquired: 9, hotLeads: 2, warmLeads: 4, coldLeads: 3, leadsConverted: 1 },
  { id: '4', name: 'Omar Khalid', email: 'omar@example.com', leadsAcquired: 7, hotLeads: 2, warmLeads: 3, coldLeads: 2, leadsConverted: 1 },
  { id: '5', name: 'Aisha Rahman', email: 'aisha@example.com', leadsAcquired: 5, hotLeads: 1, warmLeads: 2, coldLeads: 2, leadsConverted: 0 },
];

const dummySuccessStories: SuccessStory[] = [
  { leadName: 'Gulf Trading LLC', convertedAt: new Date().toISOString(), agentName: 'Sarah Ahmed', estimatedValue: 85000 },
  { leadName: 'Al Noor Properties', convertedAt: new Date(Date.now() - 86400000).toISOString(), agentName: 'Mohammed Ali', estimatedValue: 120000 },
  { leadName: 'Emirates Consulting', convertedAt: new Date(Date.now() - 172800000).toISOString(), agentName: 'Fatima Hassan', estimatedValue: 45000 },
];

export const LeadPerformanceLeaderboard = () => {
  const [performances, setPerformances] = useState<UserPerformance[]>([]);
  const [successStories, setSuccessStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDummy, setShowDummy] = useState(() => {
    const saved = localStorage.getItem('leadLeaderboardDummy');
    return saved ? JSON.parse(saved) : true;
  });
  const [weekRange] = useState({ start: startOfWeek(new Date()), end: endOfWeek(new Date()) });

  useEffect(() => {
    if (showDummy) {
      setPerformances(dummyPerformances);
      setSuccessStories(dummySuccessStories);
      setLoading(false);
    } else {
      fetchPerformanceData();
    }
  }, [showDummy]);

  const toggleDummy = (value: boolean) => {
    setShowDummy(value);
    localStorage.setItem('leadLeaderboardDummy', JSON.stringify(value));
  };

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
          score,
          converted_at,
          estimated_value,
          created_at
        `);

      const { data: activities } = await supabase
        .from('lead_activities')
        .select('lead_id, created_by, activity_type, created_at')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString());

      // Calculate performance per user - leads acquired this week
      const userPerformance: UserPerformance[] = users.map(user => {
        // Filter leads assigned to this user that were created this week
        const userLeadsThisWeek = leads?.filter(l => 
          l.assigned_to === user.id && 
          new Date(l.created_at) >= weekStart &&
          new Date(l.created_at) <= weekEnd
        ) || [];
        
        const hotLeads = userLeadsThisWeek.filter(l => l.score === 'hot').length;
        const warmLeads = userLeadsThisWeek.filter(l => l.score === 'warm').length;
        const coldLeads = userLeadsThisWeek.filter(l => l.score === 'cold').length;
        const leadsConverted = userLeadsThisWeek.filter(l => l.status === 'converted').length;
        
        return {
          id: user.id,
          name: user.name || user.email.split('@')[0],
          email: user.email,
          leadsAcquired: userLeadsThisWeek.length,
          hotLeads,
          warmLeads,
          coldLeads,
          leadsConverted
        };
      });

      // Sort by leads acquired (most leads first)
      const sorted = userPerformance
        .filter(p => p.leadsAcquired > 0)
        .sort((a, b) => {
          if (b.leadsAcquired !== a.leadsAcquired) return b.leadsAcquired - a.leadsAcquired;
          return b.hotLeads - a.hotLeads; // Secondary: most hot leads
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
    if (index === 0) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (index === 1) return <Medal className="h-4 w-4 text-gray-400" />;
    if (index === 2) return <Award className="h-4 w-4 text-amber-600" />;
    return <span className="w-4 h-4 flex items-center justify-center text-muted-foreground text-xs">{index + 1}</span>;
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
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Trophy className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <CardTitle className="text-base">Weekly Leaderboard</CardTitle>
              <p className="text-xs text-muted-foreground">
                {format(weekRange.start, 'MMM d')} - {format(weekRange.end, 'MMM d')} • Leads Acquired
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">Demo</span>
            <Switch
              checked={showDummy}
              onCheckedChange={toggleDummy}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Top Performers Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {performances.slice(0, 5).map((user, index) => (
            <div 
              key={user.id}
              className={`relative p-4 rounded-xl transition-all ${
                index === 0 ? 'bg-gradient-to-br from-yellow-500/15 to-yellow-500/5 border border-yellow-500/30 shadow-sm' : 
                index === 1 ? 'bg-gradient-to-br from-muted/80 to-muted/40 border border-border/50' : 
                index === 2 ? 'bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20' : 
                'bg-muted/30 border border-border/30'
              }`}
            >
              {/* Rank Badge */}
              <div className={`absolute -top-2 -left-2 w-7 h-7 rounded-full flex items-center justify-center shadow-md ${
                index === 0 ? 'bg-yellow-500 text-yellow-950' :
                index === 1 ? 'bg-gray-400 text-white' :
                index === 2 ? 'bg-amber-600 text-white' :
                'bg-muted-foreground/20 text-muted-foreground'
              }`}>
                {index === 0 ? <Trophy className="h-4 w-4" /> :
                 index === 1 ? <Medal className="h-4 w-4" /> :
                 index === 2 ? <Award className="h-4 w-4" /> :
                 <span className="text-xs font-bold">{index + 1}</span>}
              </div>
              
              <div className="flex flex-col items-center text-center pt-2">
                <Avatar className={`h-12 w-12 mb-2 ${index === 0 ? 'ring-2 ring-yellow-500/50' : ''}`}>
                  <AvatarFallback className={`text-sm font-semibold ${
                    index === 0 ? 'bg-yellow-500/20 text-yellow-700' : 
                    index === 1 ? 'bg-gray-200 text-gray-700' :
                    index === 2 ? 'bg-amber-100 text-amber-700' :
                    'bg-primary/10 text-primary'
                  }`}>
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                
                <p className="font-semibold text-sm truncate w-full">{user.name}</p>
                
                <div className="flex items-center gap-2 mt-2">
                  <Badge 
                    variant="secondary" 
                    className={`text-sm px-3 py-1 font-bold ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-700' : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {user.leadsAcquired} leads
                  </Badge>
                </div>
                
                {/* Score Breakdown */}
                <div className="flex items-center gap-3 mt-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="font-medium">{user.hotLeads}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="font-medium">{user.warmLeads}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-medium">{user.coldLeads}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Wins */}
        {successStories.length > 0 && (
          <div className="pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Recent Conversions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {successStories.map((story, index) => (
                <Badge 
                  key={index}
                  variant="secondary" 
                  className="bg-green-500/10 text-green-600 text-xs px-3 py-1"
                >
                  {story.leadName} → {story.agentName}
                  {story.estimatedValue && (
                    <span className="ml-1 opacity-70">
                      • {(story.estimatedValue / 1000).toFixed(0)}K
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {performances.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No leads acquired this week yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
