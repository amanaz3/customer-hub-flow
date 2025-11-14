import { UserPlus, Users } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CustomerTypeSelectorProps {
  value: 'new' | 'existing';
  onChange: (value: 'new' | 'existing') => void;
}

export const CustomerTypeSelector = ({ value, onChange }: CustomerTypeSelectorProps) => {
  return (
    <div className="space-y-2">
      <Tabs value={value} onValueChange={onChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto bg-gradient-to-br from-muted/40 via-muted/60 to-muted/40 backdrop-blur-sm border border-border/50 rounded-lg p-1.5 shadow-sm">
          {value === 'existing' ? (
            <>
              <TabsTrigger 
                value="existing" 
                className="relative flex items-center justify-center gap-3 py-3.5 px-4 h-14 rounded-md transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 data-[state=active]:scale-[1.02] data-[state=inactive]:opacity-50 hover:bg-background/60 group"
              >
                <Users className="h-5 w-5 shrink-0 transition-transform duration-300 group-data-[state=active]:scale-110" />
                <span className="font-semibold text-base whitespace-nowrap">Existing Customer</span>
              </TabsTrigger>
              <TabsTrigger 
                value="new" 
                className="relative flex items-center justify-center gap-3 py-3.5 px-4 h-14 rounded-md transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 data-[state=active]:scale-[1.02] data-[state=inactive]:opacity-50 hover:bg-background/60 group"
              >
                <UserPlus className="h-5 w-5 shrink-0 transition-transform duration-300 group-data-[state=active]:scale-110" />
                <span className="font-semibold text-base whitespace-nowrap">New Customer</span>
              </TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger 
                value="new" 
                className="relative flex items-center justify-center gap-3 py-3.5 px-4 h-14 rounded-md transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 data-[state=active]:scale-[1.02] data-[state=inactive]:opacity-50 hover:bg-background/60 group"
              >
                <UserPlus className="h-5 w-5 shrink-0 transition-transform duration-300 group-data-[state=active]:scale-110" />
                <span className="font-semibold text-base whitespace-nowrap">New Customer</span>
              </TabsTrigger>
              <TabsTrigger 
                value="existing" 
                className="relative flex items-center justify-center gap-3 py-3.5 px-4 h-14 rounded-md transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 data-[state=active]:scale-[1.02] data-[state=inactive]:opacity-50 hover:bg-background/60 group"
              >
                <Users className="h-5 w-5 shrink-0 transition-transform duration-300 group-data-[state=active]:scale-110" />
                <span className="font-semibold text-base whitespace-nowrap">Existing Customer</span>
              </TabsTrigger>
            </>
          )}
        </TabsList>
      </Tabs>
    </div>
  );
};
