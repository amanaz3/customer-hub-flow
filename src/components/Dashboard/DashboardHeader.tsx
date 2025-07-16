
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
    <div className="space-y-6">
      {/* Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Dashboard
            </h1>
          </div>
          <div className="space-y-1">
            <p className="text-xl text-muted-foreground">
              {getGreeting()}, <span className="font-medium text-foreground">{userName || userEmail}</span>
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{getCurrentDate()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {notificationCount > 0 && (
            <div className="relative">
              <Button variant="outline" size="sm" className="relative hover:bg-muted/50 transition-colors">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              </Button>
            </div>
          )}
          
          <Button 
            onClick={onCreateCustomer} 
            className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 px-6"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            New Customer
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
};

export default DashboardHeader;
