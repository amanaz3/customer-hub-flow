
import React from 'react';
import { User } from 'lucide-react';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import NotificationDropdown from '@/components/Notifications/NotificationDropdown';

const Navbar: React.FC = () => {
  const { user, signOut, isAdmin } = useAuth();
  const isMobile = useIsMobile();

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
    <header className={cn(
      "bg-gradient-to-r from-card via-card to-card/95 border-b border-border/50 responsive-transition",
      "sticky top-0 z-30 backdrop-blur-md shadow-sm"
    )}>
      <div className={cn(
        "h-16 px-3 xs:px-4 sm:px-6 flex items-center justify-between",
        isMobile ? "ml-12" : ""
      )}>
        <div className="flex items-center space-x-3 xs:space-x-4 overflow-hidden">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80",
              "flex items-center justify-center shadow-md"
            )}>
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <h2 className={cn(
                "font-bold text-card-foreground responsive-transition",
                "text-lg xs:text-xl sm:text-2xl",
                "truncate leading-tight"
              )}>
                {isAdmin ? 'Admin Portal' : 'User Portal'}
              </h2>
              <p className="text-xs text-muted-foreground hidden xs:block">
                Welcome back, {user?.profile?.name || 'User'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 xs:space-x-4 flex-shrink-0">
          <NotificationDropdown />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={cn(
                "relative rounded-full touch-friendly responsive-transition group",
                "h-10 w-10 xs:h-11 xs:w-11 hover:scale-105",
                "ring-2 ring-transparent hover:ring-primary/20"
              )}>
                <Avatar className="h-10 w-10 xs:h-11 xs:w-11 ring-2 ring-border group-hover:ring-primary/30 transition-all">
                  <AvatarFallback className={cn(
                    "text-sm xs:text-base font-semibold",
                    "bg-gradient-to-br from-primary/10 to-primary/5",
                    "text-primary group-hover:from-primary/20 group-hover:to-primary/10"
                  )}>
                    {user?.profile?.name ? getInitials(user.profile.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={cn(
              "w-64 xs:w-72 responsive-transition",
              "bg-popover/98 backdrop-blur-md border border-border/50 shadow-xl",
              "rounded-xl"
            )} align="end" forceMount>
              <DropdownMenuLabel className="font-normal p-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className={cn(
                      "text-lg font-semibold",
                      "bg-gradient-to-br from-primary/10 to-primary/5 text-primary"
                    )}>
                      {user?.profile?.name ? getInitials(user.profile.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none truncate">
                      {user?.profile?.name || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {user?.email}
                    </p>
                    <p className="text-xs text-primary font-medium">
                      {isAdmin ? 'Administrator' : 'User'}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="mx-2" />
              <DropdownMenuItem 
                className={cn(
                  "cursor-pointer touch-friendly responsive-transition mx-2 mb-2",
                  "rounded-lg hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
                )}
                onSelect={handleLogout}
              >
                <User className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
