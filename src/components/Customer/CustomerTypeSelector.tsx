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
        <TabsList className="grid w-full grid-cols-2 h-auto bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-sm border-2 border-primary/20 rounded-xl p-1.5 shadow-lg">
          <TabsTrigger 
            value="new" 
            className="relative flex items-center justify-center gap-2 py-3 px-3 sm:px-4 h-11 sm:h-12 rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-primary/40 data-[state=active]:scale-[1.02] data-[state=inactive]:text-foreground data-[state=inactive]:bg-transparent hover:bg-white/80 group"
          >
            <UserPlus className="h-4 w-4 shrink-0 transition-all duration-300 group-data-[state=active]:scale-110 group-data-[state=active]:drop-shadow-md" />
            <span className="font-semibold text-sm whitespace-nowrap">New Customer</span>
          </TabsTrigger>
          <TabsTrigger 
            value="existing" 
            className="relative flex items-center justify-center gap-2 py-3 px-3 sm:px-4 h-11 sm:h-12 rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-primary/40 data-[state=active]:scale-[1.02] data-[state=inactive]:text-foreground data-[state=inactive]:bg-transparent hover:bg-white/80 group"
          >
            <Users className="h-4 w-4 shrink-0 transition-all duration-300 group-data-[state=active]:scale-110 group-data-[state=active]:drop-shadow-md" />
            <span className="font-semibold text-sm whitespace-nowrap">Existing Customer</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
