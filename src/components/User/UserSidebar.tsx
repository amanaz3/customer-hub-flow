import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard,
  Users,
  UserPlus,
  CheckSquare,
  XCircle,
  Settings,
  FileText,
  Calendar,
  BarChart3,
  Bell
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
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export function UserSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  const getNavCls = (isActive: boolean) =>
    isActive 
      ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" 
      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

  const mainItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "My Applications", url: "/customers", icon: Users },
    { title: "New Application", url: "/customers/new", icon: UserPlus },
  ];

  const applicationItems = [
    { title: "Completed", url: "/completed", icon: CheckSquare },
    { title: "Rejected", url: "/rejected", icon: XCircle },
    { title: "Documents", url: "/user/documents", icon: FileText },
  ];

  const toolsItems = [
    { title: "Calendar", url: "/user/calendar", icon: Calendar },
    { title: "Reports", url: "/user/reports", icon: BarChart3 },
    { title: "Notifications", url: "/user/notifications", icon: Bell },
    { title: "Settings", url: "/settings", icon: Settings },
  ];

  const renderMenuGroup = (
    label: string,
    items: { title: string; url: string; icon: React.ComponentType<any> }[]
  ) => (
    <SidebarGroup>
      <SidebarGroupLabel className="px-2 py-2 text-sm font-medium text-sidebar-foreground/70">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink 
                  to={item.url} 
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200",
                    getNavCls(isActive),
                    "animate-fade-in hover-scale"
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
    </SidebarGroup>
  );

  return (
    <Sidebar className={cn(
      "transition-all duration-300 ease-in-out",
      collapsed ? "w-16" : "w-64",
      "border-r border-sidebar-border bg-sidebar"
    )}>
      <SidebarContent className="overflow-y-auto space-y-4">
        {renderMenuGroup('Main', mainItems)}
        {renderMenuGroup('Applications', applicationItems)}
        {renderMenuGroup('Tools', toolsItems)}
      </SidebarContent>
    </Sidebar>
  );
}