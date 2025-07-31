
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CheckSquare,
  XCircle,
  UserCog,
  Settings,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  FileCheck,
  FileClock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [myApplicationsExpanded, setMyApplicationsExpanded] = useState(true);
  const { isAdmin } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
      setMobileOpen(false);
    }
  }, [isMobile]);

  // Close mobile menu on route change
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [location.pathname, isMobile]);

  console.log('Sidebar render:', { isAdmin, collapsed, isMobile, mobileOpen, timestamp: new Date().toISOString() });
  console.log('Sidebar DOM mounting check - should only see this once per sidebar');

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      roles: ['admin', 'user'],
    },
    {
      name: 'My Applications',
      path: '/customers',
      icon: <FileText className="h-5 w-5" />,
      roles: ['admin', 'user'],
    },
    {
      name: 'User Management',
      path: '/users',
      icon: <UserCog className="h-5 w-5" />,
      roles: ['admin'],
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <Settings className="h-5 w-5" />,
      roles: ['admin', 'user'],
    }
  ];

  const isActiveRoute = (path: string) => {
    // Exact match for most routes
    if (path === '/completed' || path === '/rejected' || path === '/settings' || path === '/users' || path === '/dashboard') {
      return location.pathname === path;
    }
    
    // Special handling for customers - only active when exactly on /customers
    if (path === '/customers') {
      return location.pathname === '/customers';
    }
    
    // Special handling for new application - only active when on /customers/new
    if (path === '/customers/new') {
      return location.pathname === '/customers/new';
    }
    
    // For customer detail pages, don't highlight any sidebar item to avoid confusion
    return false;
  };

  if (isMobile) {
    return (
      <>
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="fixed top-4 left-4 z-50 lg:hidden bg-background/80 backdrop-blur-sm border shadow-md"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>

        {/* Mobile Overlay */}
        {mobileOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <div 
          className={cn(
            "fixed top-0 left-0 h-screen bg-sidebar border-r border-sidebar-border z-50 lg:hidden responsive-transition",
            "w-64 transform",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border">
            <div className="flex items-center space-x-2">
              <img 
                src="/lovable-uploads/5ccffe54-41ae-4fc6-9a3a-3843049b907b.png" 
                alt="Amana Corporate" 
                className="h-8 w-auto"
              />
            </div>
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => setMobileOpen(false)}
              className="touch-friendly"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {navItems.map((item) => {
                if (!isAdmin && item.roles.includes('admin') && !item.roles.includes('user')) {
                  return null;
                }

                return (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center px-3 py-3 rounded-md text-sm font-medium responsive-transition touch-friendly",
                        isActiveRoute(item.path)
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.icon}
                      <span className="ml-3">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </>
    );
  }

  return (
    <div 
      className={cn(
        "h-screen bg-sidebar flex flex-col border-r border-sidebar-border responsive-transition hidden lg:flex",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/5ccffe54-41ae-4fc6-9a3a-3843049b907b.png" 
              alt="Amana Corporate" 
              className="h-8 w-auto"
            />
          </div>
        )}
        {collapsed && (
          <img 
            src="/lovable-uploads/5ccffe54-41ae-4fc6-9a3a-3843049b907b.png" 
            alt="Amana Corporate" 
            className="h-8 w-8 object-contain mx-auto"
          />
        )}
        <Button 
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "responsive-transition touch-friendly",
            collapsed ? "ml-0" : "ml-auto"
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            // Skip items that shouldn't be visible to the current user role
            if (!isAdmin && item.roles.includes('admin') && !item.roles.includes('user')) {
              return null;
            }

            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center rounded-md text-sm font-medium responsive-transition touch-friendly",
                    "px-3 py-2.5",
                    isActiveRoute(item.path)
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    collapsed ? "justify-center px-2" : ""
                  )}
                >
                  {item.icon}
                  {!collapsed && <span className="ml-3">{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
