
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SecureAuthContext';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CheckSquare,
  UserCog,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { isAdmin } = useAuth();
  const location = useLocation();

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
      name: 'Add Customer',
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
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div 
      className={cn(
        "h-screen bg-sidebar flex flex-col border-r border-gray-200 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200">
        {!collapsed && (
          <h1 className="text-lg font-semibold text-gray-800">Amana Corporate</h1>
        )}
        <Button 
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
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
                    "flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors",
                    isActiveRoute(item.path)
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-gray-600 hover:bg-gray-100",
                    collapsed ? "justify-center" : ""
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
