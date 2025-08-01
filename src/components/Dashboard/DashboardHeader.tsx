
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Bell, Calendar, TrendingUp } from 'lucide-react';

interface DashboardHeaderProps {
  userName?: string;
  userEmail?: string;
  onCreateCustomer: () => void;
  notificationCount?: number;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  userName, 
  userEmail, 
  onCreateCustomer,
  notificationCount = 0
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {/* Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/20">
                <TrendingUp className="h-7 w-7 text-primary" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl blur opacity-30"></div>
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <div className="h-1 w-20 bg-gradient-to-r from-primary to-primary/50 rounded-full mt-2"></div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xl lg:text-2xl text-muted-foreground font-light">
              {getGreeting()}, <span className="font-medium text-foreground bg-gradient-to-r from-primary/10 to-transparent px-2 py-1 rounded-md">{userName || userEmail}</span>
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary/60" />
              <span className="font-medium">{getCurrentDate()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {notificationCount > 0 && (
            <div className="relative">
              <Button 
                variant="outline" 
                size="sm" 
                className="relative enhanced-card hover:bg-muted/50 border-primary/20 h-11 px-4"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-2 -right-2 h-6 w-6 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg ring-2 ring-background">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              </Button>
            </div>
          )}
          
          <Button 
            onClick={onCreateCustomer} 
            className="enhanced-button shadow-lg hover:shadow-xl px-8 h-11 font-medium relative overflow-hidden group"
            size="lg"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Plus className="mr-2 h-5 w-5 relative z-10" />
            <span className="relative z-10">New Customer</span>
          </Button>
        </div>
      </div>

      {/* Enhanced Divider */}
      <div className="relative">
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
        <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-sm"></div>
      </div>
    </div>
  );
};

export default DashboardHeader;
