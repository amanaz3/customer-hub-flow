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
        <TabsList className="grid w-full grid-cols-2 h-auto bg-gradient-to-br from-muted/40 via-muted/60 to-muted/40 backdrop-blur-sm border border-border/50 rounded-lg p-1 shadow-sm">
          <TabsTrigger 
            value="new" 
            className="relative flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 data-[state=active]:scale-[1.02] hover:bg-background/60 group"
          >
            <UserPlus className="h-3.5 w-3.5 transition-transform duration-300 group-data-[state=active]:scale-110" />
            <div className="flex flex-col items-center">
              <span className="font-semibold text-sm">New Customer</span>
              <span className="text-[10px] opacity-70 hidden sm:inline group-data-[state=active]:opacity-90">Create new record</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="existing" 
            className="relative flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-accent data-[state=active]:to-accent/90 data-[state=active]:text-accent-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-accent/20 data-[state=active]:scale-[1.02] hover:bg-background/60 group"
          >
            <Users className="h-3.5 w-3.5 transition-transform duration-300 group-data-[state=active]:scale-110" />
            <div className="flex flex-col items-center">
              <span className="font-semibold text-sm">Existing Customer</span>
              <span className="text-[10px] opacity-70 hidden sm:inline group-data-[state=active]:opacity-90">Select from list</span>
            </div>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
