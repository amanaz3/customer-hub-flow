
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
  Menu,
  X,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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
      name: 'Customers',
      path: '/customers',
      icon: <Users className="h-5 w-5" />,
      roles: ['admin', 'user'],
    },
    {
      name: 'New Application',
      path: '/customers/new',
      icon: <UserPlus className="h-5 w-5" />,
      roles: ['admin', 'user'],
    },
    {
      name: 'Completed Cases',
      path: '/completed',
      icon: <CheckSquare className="h-5 w-5" />,
      roles: ['admin', 'user'],
    },
    {
      name: 'Rejected Cases',
      path: '/rejected',
      icon: <XCircle className="h-5 w-5" />,
      roles: ['admin', 'user'],
    },
    {
      name: 'User Management',
      path: '/users',
      icon: <UserCog className="h-5 w-5" />,
      roles: ['admin'],
    },
    {
      name: 'Product Management',
      path: '/products',
      icon: <Package className="h-5 w-5" />,
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
    if (path === '/completed' || path === '/rejected' || path === '/settings' || path === '/users' || path === '/dashboard' || path === '/products') {
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
            "fixed top-0 left-0 h-screen bg-gradient-to-b from-sidebar to-sidebar/95 border-r border-sidebar-border/50 z-50 lg:hidden responsive-transition shadow-2xl",
            "w-72 transform backdrop-blur-md",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border/30">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 p-2 shadow-md">
                <img 
                  src="/lovable-uploads/5ccffe54-41ae-4fc6-9a3a-3843049b907b.png" 
                  alt="Amana Corporate" 
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <h2 className="font-bold text-sidebar-foreground text-lg">Amana</h2>
                <p className="text-xs text-sidebar-foreground/70">Corporate Services</p>
              </div>
            </div>
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => setMobileOpen(false)}
              className="touch-friendly hover:bg-sidebar-accent/50 rounded-lg"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <nav className="flex-1 overflow-y-auto py-6">
            <ul className="space-y-2 px-4">
              {navItems.map((item) => {
                if (!isAdmin && item.roles.includes('admin') && !item.roles.includes('user')) {
                  return null;
                }

                return (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      className={cn(
                        "group flex items-center px-4 py-3.5 rounded-xl text-sm font-medium responsive-transition touch-friendly",
                        "border border-transparent hover:border-sidebar-border/30",
                        isActiveRoute(item.path)
                          ? "bg-gradient-to-r from-sidebar-primary to-sidebar-primary/90 text-sidebar-primary-foreground shadow-lg border-sidebar-primary/20"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground hover:shadow-md"
                      )}
                      onClick={() => setMobileOpen(false)}
                    >
                      <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        isActiveRoute(item.path)
                          ? "bg-sidebar-primary-foreground/10"
                          : "group-hover:bg-sidebar-accent-foreground/10"
                      )}>
                        {React.cloneElement(item.icon, { className: "h-5 w-5" })}
                      </div>
                      <span className="ml-3 font-medium">{item.name}</span>
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
        "h-screen bg-gradient-to-b from-sidebar to-sidebar/95 flex flex-col border-r border-sidebar-border/50 responsive-transition hidden lg:flex shadow-lg",
        collapsed ? "w-20" : "w-72"
      )}
    >
      <div className={cn(
        "flex items-center h-16 px-6 border-b border-sidebar-border/30",
        collapsed ? "justify-center px-4" : "justify-between"
      )}>
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 p-2 shadow-md">
              <img 
                src="/lovable-uploads/5ccffe54-41ae-4fc6-9a3a-3843049b907b.png" 
                alt="Amana Corporate" 
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h2 className="font-bold text-sidebar-foreground text-lg">Amana</h2>
              <p className="text-xs text-sidebar-foreground/70">Corporate Services</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 p-2 shadow-md">
            <img 
              src="/lovable-uploads/5ccffe54-41ae-4fc6-9a3a-3843049b907b.png" 
              alt="Amana Corporate" 
              className="h-full w-full object-contain"
            />
          </div>
        )}
        <Button 
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "responsive-transition touch-friendly hover:bg-sidebar-accent/50 rounded-lg",
            collapsed ? "ml-0" : "ml-auto"
          )}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-6">
        <ul className={cn("space-y-2", collapsed ? "px-2" : "px-4")}>
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
                    "group flex items-center rounded-xl text-sm font-medium responsive-transition touch-friendly",
                    "border border-transparent hover:border-sidebar-border/30",
                    isActiveRoute(item.path)
                      ? "bg-gradient-to-r from-sidebar-primary to-sidebar-primary/90 text-sidebar-primary-foreground shadow-lg border-sidebar-primary/20"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground hover:shadow-md",
                    collapsed ? "justify-center px-3 py-3" : "px-4 py-3.5"
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <div className={cn(
                    "p-2 rounded-lg transition-colors",
                    isActiveRoute(item.path)
                      ? "bg-sidebar-primary-foreground/10"
                      : "group-hover:bg-sidebar-accent-foreground/10"
                  )}>
                    {React.cloneElement(item.icon, { className: "h-5 w-5" })}
                  </div>
                  {!collapsed && <span className="ml-3 font-medium">{item.name}</span>}
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
