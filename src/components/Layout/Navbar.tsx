
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
      "bg-card/95 backdrop-blur-md border-b border-border/50 transition-all duration-300",
      "sticky top-0 z-30 shadow-sm"
    )}>
      <div className={cn(
        "h-14 sm:h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all duration-300",
        isMobile ? "ml-12 sm:ml-14" : ""
      )}>
        <div className="flex items-center space-x-3 sm:space-x-4 overflow-hidden min-w-0 flex-1">
          <h2 className={cn(
            "font-semibold text-card-foreground transition-all duration-300",
            "text-sm sm:text-base md:text-lg lg:text-xl",
            "truncate"
          )}>
            {isAdmin ? 'Admin Portal' : 'User Portal'}
          </h2>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 flex-shrink-0">
          <NotificationDropdown />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={cn(
                "relative rounded-full transition-all duration-200 hover:scale-105",
                "h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10",
                "touch-friendly"
              )}>
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10">
                  <AvatarFallback className="text-xs sm:text-sm lg:text-base font-medium">
                    {user?.profile?.name ? getInitials(user.profile.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={cn(
              "w-56 sm:w-64 lg:w-72 transition-all duration-200",
              "bg-popover/95 backdrop-blur-md border border-border/50 shadow-lg"
            )} align="end" forceMount>
              <DropdownMenuLabel className="font-normal p-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none truncate">
                    {user?.profile?.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer touch-friendly responsive-transition p-3" 
                onSelect={handleLogout}
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
