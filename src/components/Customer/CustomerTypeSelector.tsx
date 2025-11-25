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
        <TabsList className="grid w-full grid-cols-2 h-auto bg-muted/30 backdrop-blur-sm border border-border/40 rounded-xl p-1.5 shadow-sm">
          <TabsTrigger 
            value="new" 
            className="relative flex items-center justify-center gap-2 py-2.5 px-4 h-11 rounded-lg transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:font-semibold data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground hover:bg-white/50 group"
          >
            <UserPlus className="h-4 w-4 shrink-0 transition-transform duration-300 group-data-[state=active]:scale-110" />
            <span className="font-medium text-sm whitespace-nowrap">New Customer</span>
          </TabsTrigger>
          <TabsTrigger 
            value="existing" 
            className="relative flex items-center justify-center gap-2 py-2.5 px-4 h-11 rounded-lg transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-md data-[state=active]:font-semibold data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground hover:bg-white/50 group"
          >
            <Users className="h-4 w-4 shrink-0 transition-transform duration-300 group-data-[state=active]:scale-110" />
            <span className="font-medium text-sm whitespace-nowrap">Existing Customer</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
