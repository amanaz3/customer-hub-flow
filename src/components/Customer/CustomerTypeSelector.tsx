import { UserPlus, Users } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CustomerTypeSelectorProps {
  value: 'new' | 'existing';
  onChange: (value: 'new' | 'existing') => void;
}

export const CustomerTypeSelector = ({ value, onChange }: CustomerTypeSelectorProps) => {
  return (
    <div className="space-y-1.5">
      <Tabs value={value} onValueChange={onChange} className="w-full relative z-50">
        <TabsList className="grid w-full grid-cols-2 h-auto bg-gradient-to-br from-muted/40 via-muted/60 to-muted/40 backdrop-blur-sm border border-border/50 rounded-lg p-1 shadow-sm">
          <TabsTrigger 
            value="new" 
            className="relative flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 sm:px-3 h-9 sm:h-10 rounded-md transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 data-[state=active]:scale-[1.02] data-[state=inactive]:opacity-50 hover:bg-background/60 group"
          >
            <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 transition-transform duration-300 group-data-[state=active]:scale-110" />
            <span className="font-semibold text-xs sm:text-sm whitespace-nowrap">New Customer</span>
          </TabsTrigger>
          <TabsTrigger 
            value="existing" 
            className="relative flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 sm:px-3 h-9 sm:h-10 rounded-md transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-accent data-[state=active]:to-accent/90 data-[state=active]:text-accent-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-accent/20 data-[state=active]:scale-[1.02] data-[state=inactive]:opacity-50 hover:bg-background/60 group"
          >
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 transition-transform duration-300 group-data-[state=active]:scale-110" />
            <span className="font-semibold text-xs sm:text-sm whitespace-nowrap">Existing Customer</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
