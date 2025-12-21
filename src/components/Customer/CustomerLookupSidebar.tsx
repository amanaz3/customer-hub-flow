import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { CustomerLookupPanel } from './CustomerLookupPanel';
import { Customer } from '@/types/customer';

interface CustomerLookupSidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onCustomerFound: (customerId: string, customer: Partial<Customer>) => void;
  onNewCustomer: (searchTerm: string, searchType: 'mobile' | 'email' | 'name') => void;
}

export const CustomerLookupSidebar: React.FC<CustomerLookupSidebarProps> = ({
  collapsed,
  onCollapsedChange,
  onCustomerFound,
  onNewCustomer,
}) => {
  const toggleCollapsed = () => {
    onCollapsedChange(!collapsed);
  };

  return (
    <div className={cn(
      "fixed right-0 top-14 sm:top-16 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] bg-card border-l shadow-lg transition-all duration-300 z-[100000] flex flex-col",
      collapsed ? "w-12" : "w-80"
    )}>
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "fixed top-20 sm:top-24 h-9 w-9 rounded-full border-2 bg-card shadow-lg hover:bg-accent transition-all duration-300 z-[100001]",
          collapsed ? "right-12" : "right-80"
        )}
        onClick={toggleCollapsed}
      >
        {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

      {/* Collapsed State */}
      {collapsed && (
        <div 
          className="flex flex-col items-center py-4 gap-3 cursor-pointer" 
          onClick={toggleCollapsed}
        >
          <div className="relative">
            <Search className="h-6 w-6 text-primary" />
            {/* Pulsing glow effect */}
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-md animate-pulse" />
          </div>
          
          {/* Vertical text indicator */}
          <span 
            className="text-[10px] font-medium text-primary tracking-wider uppercase"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            LOOKUP
          </span>
        </div>
      )}

      {/* Expanded State */}
      {!collapsed && (
        <CustomerLookupPanel
          onCustomerFound={onCustomerFound}
          onNewCustomer={onNewCustomer}
        />
      )}
    </div>
  );
};
