import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard,
  Users,
  UserPlus,
  CheckSquare,
  XCircle,
  UserCog,
  Settings,
  Package,
  BarChart3,
  Shield,
  Database,
  Bell,
  Calendar,
  FileText,
  TrendingUp,
  Activity,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const currentPath = location.pathname;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'dashboard': true,
    'applications': true,
    'management': false,
    'analytics': false,
    'system': false
  });

  const toggleGroup = (groupKey: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const isActive = (path: string) => currentPath === path;
  const isGroupActive = (paths: string[]) => paths.some(path => currentPath.startsWith(path));

  const getNavCls = (isActive: boolean) =>
    isActive 
      ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" 
      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

  const dashboardItems = [
    { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
    { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
    { title: "Activity", url: "/admin/activity", icon: Activity },
  ];

  const applicationItems = [
    { title: "All Applications", url: "/customers", icon: Users },
    { title: "New Application", url: "/customers/new", icon: UserPlus },
    { title: "Completed", url: "/completed", icon: CheckSquare },
    { title: "Rejected", url: "/rejected", icon: XCircle },
    { title: "Reports", url: "/admin/reports", icon: FileText },
  ];

  const managementItems = [
    { title: "User Management", url: "/users", icon: UserCog },
    { title: "Product Management", url: "/products", icon: Package },
    { title: "Notifications", url: "/admin/notifications", icon: Bell },
    { title: "Calendar", url: "/admin/calendar", icon: Calendar },
  ];

  const analyticsItems = [
    { title: "Performance", url: "/admin/performance", icon: TrendingUp },
    { title: "User Analytics", url: "/admin/user-analytics", icon: Users },
    { title: "Revenue Analytics", url: "/admin/revenue", icon: BarChart3 },
  ];

  const systemItems = [
    { title: "Security", url: "/admin/security", icon: Shield },
    { title: "Database", url: "/admin/database", icon: Database },
    { title: "Settings", url: "/settings", icon: Settings },
  ];

  const renderMenuGroup = (
    groupKey: string,
    label: string,
    items: { title: string; url: string; icon: React.ComponentType<any> }[]
  ) => {
    const isGroupOpen = openGroups[groupKey];
    const hasActiveItem = isGroupActive(items.map(item => item.url));

    return (
      <SidebarGroup key={groupKey}>
        <Collapsible
          open={isGroupOpen}
          onOpenChange={() => toggleGroup(groupKey)}
        >
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className={cn(
              "group/label flex w-full items-center justify-between px-2 py-2 text-sm font-medium transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer",
              hasActiveItem && "text-sidebar-primary"
            )}>
              <span>{label}</span>
              {!collapsed && (
                <div className="flex items-center">
                  {hasActiveItem && (
                    <div className="h-2 w-2 rounded-full bg-sidebar-primary mr-2" />
                  )}
                  {isGroupOpen ? (
                    <ChevronDown className="h-4 w-4 transition-transform" />
                  ) : (
                    <ChevronRight className="h-4 w-4 transition-transform" />
                  )}
                </div>
              )}
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="transition-all duration-200">
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={({ isActive }) => cn(
                          "flex items-center gap-3 px-3 py-2 text-sm transition-all duration-200",
                          getNavCls(isActive),
                          "animate-fade-in"
                        )}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </Collapsible>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar className={cn(
      "transition-all duration-300 ease-in-out",
      collapsed ? "w-16" : "w-64",
      "border-r border-sidebar-border bg-sidebar"
    )}>
      <SidebarContent className="overflow-y-auto">
        {renderMenuGroup('dashboard', 'Dashboard', dashboardItems)}
        {renderMenuGroup('applications', 'Applications', applicationItems)}
        {renderMenuGroup('management', 'Management', managementItems)}
        {renderMenuGroup('analytics', 'Analytics', analyticsItems)}
        {renderMenuGroup('system', 'System', systemItems)}
      </SidebarContent>
    </Sidebar>
  );
}