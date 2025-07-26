
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
      "bg-card border-b border-border responsive-transition",
      "sticky top-0 z-30 backdrop-blur-sm bg-card/80"
    )}>
      <div className={cn(
        "h-14 px-3 xs:px-4 sm:px-6 flex items-center justify-between",
        isMobile ? "ml-12" : ""
      )}>
        <div className="flex items-center space-x-2 xs:space-x-4 overflow-hidden">
          <h2 className={cn(
            "font-semibold text-card-foreground responsive-transition",
            "text-base xs:text-lg sm:text-xl",
            "truncate"
          )}>
            {isAdmin ? 'Admin Portal' : 'User Portal'}
          </h2>
        </div>
        
        <div className="flex items-center space-x-2 xs:space-x-3 sm:space-x-4 flex-shrink-0">
          <NotificationDropdown />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={cn(
                "relative rounded-full touch-friendly responsive-transition",
                "h-8 w-8 xs:h-9 xs:w-9"
              )}>
                <Avatar className="h-8 w-8 xs:h-9 xs:w-9">
                  <AvatarFallback className="text-xs xs:text-sm">
                    {user?.profile?.name ? getInitials(user.profile.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={cn(
              "w-48 xs:w-56 responsive-transition",
              "bg-popover/95 backdrop-blur-sm border border-border"
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
