import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  useSidebar,
} from '@/components/ui/sidebar';
import { Users, Activity, FileText } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface ActivityItem {
  id: string;
  type: string;
  user_name: string;
  user_id: string;
  description: string;
  created_at: string;
}

interface TeamSidebarProps {
  teamMembers: TeamMember[];
  recentActivity: ActivityItem[];
  activeToday: number;
}

export const TeamSidebar: React.FC<TeamSidebarProps> = ({
  teamMembers,
  recentActivity,
  activeToday,
}) => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-80'} collapsible="icon">
      <SidebarContent>
        {/* Stats */}
        <SidebarGroup>
          <SidebarGroupLabel>Team Stats</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className={collapsed ? 'space-y-2 px-1' : 'grid grid-cols-1 gap-2'}>
              <div className={collapsed ? 'p-2 rounded-lg border bg-card flex flex-col items-center' : 'p-3 rounded-lg border bg-card'}>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {!collapsed && <span className="text-xs text-muted-foreground">Members</span>}
                </div>
                <div className="text-xl font-bold">{teamMembers.length}</div>
              </div>
              
              <div className={collapsed ? 'p-2 rounded-lg border bg-card flex flex-col items-center' : 'p-3 rounded-lg border bg-card'}>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  {!collapsed && <span className="text-xs text-muted-foreground">Active</span>}
                </div>
                <div className="text-xl font-bold">{activeToday}</div>
              </div>
              
              <div className={collapsed ? 'p-2 rounded-lg border bg-card flex flex-col items-center' : 'p-3 rounded-lg border bg-card'}>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {!collapsed && <span className="text-xs text-muted-foreground">Admins</span>}
                </div>
                <div className="text-xl font-bold">
                  {teamMembers.filter((m) => m.role === 'admin').length}
                </div>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <>
            <Separator />

            {/* Team Members */}
            <SidebarGroup>
              <SidebarGroupLabel>Team Members ({teamMembers.length})</SidebarGroupLabel>
              <SidebarGroupContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2 pr-4">
                    {teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{member.name}</p>
                          <Badge
                            variant={member.role === 'admin' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {member.role}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </SidebarGroupContent>
            </SidebarGroup>

            <Separator />

            {/* Recent Activity */}
            <SidebarGroup>
              <SidebarGroupLabel>Recent Activity</SidebarGroupLabel>
              <SidebarGroupContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2 pr-4">
                    {recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="p-2 rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <div className="p-1.5 rounded bg-primary/10 mt-0.5">
                            <FileText className="h-3 w-3 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {activity.user_name}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {activity.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(activity.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {recentActivity.length === 0 && (
                      <div className="text-center py-4 text-xs text-muted-foreground">
                        No recent activity
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
};
