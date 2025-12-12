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
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <CardTitle className="text-sm">Weekly Leaderboard</CardTitle>
            <span className="text-xs text-muted-foreground">
              ({format(weekRange.start, 'MMM d')} - {format(weekRange.end, 'MMM d')})
            </span>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Hot</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-muted-foreground">Warm</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">Cold</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-3 w-3 text-amber-500" />
            <span className="text-xs text-muted-foreground">Demo</span>
            <Switch checked={showDummy} onCheckedChange={toggleDummy} className="scale-90" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-4 pb-4">
        <div className="flex flex-col gap-2">
          {performances.slice(0, 5).map((user, index) => (
            <div 
              key={user.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                index === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' : 
                index === 1 ? 'bg-muted/60' : 
                index === 2 ? 'bg-amber-500/10' : 
                'bg-muted/30'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                index === 0 ? 'bg-yellow-500 text-yellow-950' :
                index === 1 ? 'bg-gray-400 text-white' :
                index === 2 ? 'bg-amber-600 text-white' :
                'bg-muted-foreground/30 text-muted-foreground'
              }`}>
                {index + 1}
              </div>
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium flex-1">{user.name.split(' ')[0]}</span>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-red-500">{user.hotLeads}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-yellow-600">{user.warmLeads}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-blue-500">{user.coldLeads}</span>
              </div>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-primary/10 text-primary font-bold">
                {user.leadsAcquired} total
              </Badge>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 text-green-500" />
            <span>Recent Conversions:</span>
          </div>
          {successStories.length > 0 ? (
            successStories.slice(0, 3).map((story, index) => (
              <Badge key={index} variant="secondary" className="bg-green-500/10 text-green-600 text-[10px]">
                {story.leadName.split(' ')[0]} → {story.agentName.split(' ')[0]}
                {story.estimatedValue && ` (${(story.estimatedValue / 1000).toFixed(0)}K)`}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground italic">No conversions this week</span>
          )}
        </div>

        {performances.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No leads this week</p>
        )}
      </CardContent>
    </Card>
  );
};
