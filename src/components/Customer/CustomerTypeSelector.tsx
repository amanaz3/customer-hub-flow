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
        <TabsList className="grid w-full grid-cols-2 h-auto bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-1.5 shadow-md">
          <TabsTrigger 
            value="new" 
            className="relative flex items-center justify-center gap-2 py-3 px-3 sm:px-4 h-11 sm:h-12 rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-blue-500/30 data-[state=active]:scale-[1.02] data-[state=inactive]:text-slate-500 data-[state=inactive]:bg-transparent hover:bg-slate-50 group"
          >
            <UserPlus className="h-4 w-4 shrink-0 transition-all duration-300 group-data-[state=active]:scale-110" />
            <span className="font-semibold text-sm whitespace-nowrap">New Customer</span>
          </TabsTrigger>
          <TabsTrigger 
            value="existing" 
            className="relative flex items-center justify-center gap-2 py-3 px-3 sm:px-4 h-11 sm:h-12 rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-blue-500/30 data-[state=active]:scale-[1.02] data-[state=inactive]:text-slate-500 data-[state=inactive]:bg-transparent hover:bg-slate-50 group"
          >
            <Users className="h-4 w-4 shrink-0 transition-all duration-300 group-data-[state=active]:scale-110" />
            <span className="font-semibold text-sm whitespace-nowrap">Existing Customer</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
