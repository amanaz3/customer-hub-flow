import { UserPlus, Users } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CustomerTypeSelectorProps {
  value: 'new' | 'existing';
  onChange: (value: 'new' | 'existing') => void;
}

export const CustomerTypeSelector = ({ value, onChange }: CustomerTypeSelectorProps) => {
  return (
    <div className="space-y-2">
      <Tabs value={value} onValueChange={onChange} className="w-full relative z-50">
        <TabsList className="grid w-full grid-cols-2 h-auto bg-slate-100/50 backdrop-blur-sm border border-slate-200/50 rounded-xl p-1 shadow-sm">
          <TabsTrigger 
            value="new" 
            className="relative flex items-center justify-center gap-2 py-3 px-3 sm:px-4 h-11 sm:h-12 rounded-lg transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] data-[state=inactive]:text-muted-foreground data-[state=inactive]:opacity-70 hover:opacity-100 hover:bg-white/50 group overflow-hidden"
          >
            {/* Active indicator bar */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-0 bg-primary transition-all duration-300 group-data-[state=active]:w-3/4 rounded-full" />
            
            <UserPlus className="h-4 w-4 shrink-0 transition-all duration-300 group-data-[state=active]:scale-110 group-data-[state=active]:text-primary group-data-[state=inactive]:text-muted-foreground" />
            <span className="font-semibold text-sm whitespace-nowrap">New Customer</span>
          </TabsTrigger>
          <TabsTrigger 
            value="existing" 
            className="relative flex items-center justify-center gap-2 py-3 px-3 sm:px-4 h-11 sm:h-12 rounded-lg transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] data-[state=inactive]:text-muted-foreground data-[state=inactive]:opacity-70 hover:opacity-100 hover:bg-white/50 group overflow-hidden"
          >
            {/* Active indicator bar */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-0 bg-primary transition-all duration-300 group-data-[state=active]:w-3/4 rounded-full" />
            
            <Users className="h-4 w-4 shrink-0 transition-all duration-300 group-data-[state=active]:scale-110 group-data-[state=active]:text-primary group-data-[state=inactive]:text-muted-foreground" />
            <span className="font-semibold text-sm whitespace-nowrap">Existing Customer</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
