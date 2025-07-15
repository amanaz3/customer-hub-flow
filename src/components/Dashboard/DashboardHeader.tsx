
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Bell } from 'lucide-react';

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

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {getGreeting()}, {userName || userEmail}
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        {notificationCount > 0 && (
          <div className="relative">
            <Button variant="outline" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </Button>
          </div>
        )}
        
        <Button onClick={onCreateCustomer} className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          New Customer
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
