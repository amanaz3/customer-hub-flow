import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SecureAuthContext';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/Admin/AdminSidebar';
import { UserSidebar } from '@/components/User/UserSidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import NotificationDropdown from '@/components/Notifications/NotificationDropdown';
import { Crown, User, LogOut, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user' | 'any';
}

export function AppLayout({ children, requiredRole = 'any' }: AppLayoutProps) {
  const { isAuthenticated, isAdmin, user, signOut } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role-based access control
  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogout = async () => {
    await signOut();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-full bg-background">
        {/* Sidebar - Role-based */}
        {isAdmin ? <AdminSidebar /> : <UserSidebar />}

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
            <SidebarTrigger className="hover-scale" />
            
            <div className="flex flex-1 items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <img 
                    src="/lovable-uploads/5ccffe54-41ae-4fc6-9a3a-3843049b907b.png" 
                    alt="Amana Corporate" 
                    className="h-8 w-auto"
                  />
                  <div className="hidden sm:block">
                    <h1 className="text-lg font-semibold text-foreground">
                      Amana Corporate Services
                    </h1>
                    <div className="flex items-center gap-2">
                      {isAdmin ? (
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                          <Crown className="h-3 w-3 mr-1" />
                          Admin Portal
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <User className="h-3 w-3 mr-1" />
                          User Portal
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <NotificationDropdown />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="relative h-10 w-10 rounded-full hover-scale"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {user?.profile?.name ? getInitials(user.profile.name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    className="w-64 animate-scale-in" 
                    align="end" 
                    forceMount
                  >
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {user?.profile?.name ? getInitials(user.profile.name) : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-none truncate">
                              {user?.profile?.name || 'User'}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground truncate mt-1">
                              {user?.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAdmin ? (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                              <Crown className="h-3 w-3 mr-1" />
                              Administrator
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              <User className="h-3 w-3 mr-1" />
                              User
                            </Badge>
                          )}
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.href = '/settings'}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      className="cursor-pointer text-destructive focus:text-destructive" 
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-muted/20">
            <div className="container mx-auto p-6 space-y-6 animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}