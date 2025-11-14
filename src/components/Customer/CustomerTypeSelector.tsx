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
        <TabsList className="grid w-full grid-cols-2 h-auto bg-white border-2 border-gray-200 rounded-xl p-2 shadow-md">
          {value === 'existing' ? (
            <>
              <TabsTrigger 
                value="existing" 
                className="relative flex items-center justify-center gap-3 py-3.5 px-4 h-14 rounded-lg transition-all duration-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-blue-600/30 data-[state=active]:scale-[1.02] data-[state=inactive]:opacity-60 data-[state=inactive]:bg-gray-50 hover:bg-gray-100 data-[state=inactive]:text-gray-700 group"
              >
                <Users className="h-5 w-5 shrink-0 transition-transform duration-300 group-data-[state=active]:scale-110" />
                <span className="font-semibold text-base whitespace-nowrap">Existing Customer</span>
              </TabsTrigger>
              <TabsTrigger 
                value="new" 
                className="relative flex items-center justify-center gap-3 py-3.5 px-4 h-14 rounded-lg transition-all duration-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-blue-600/30 data-[state=active]:scale-[1.02] data-[state=inactive]:opacity-60 data-[state=inactive]:bg-gray-50 hover:bg-gray-100 data-[state=inactive]:text-gray-700 group"
              >
                <UserPlus className="h-5 w-5 shrink-0 transition-transform duration-300 group-data-[state=active]:scale-110" />
                <span className="font-semibold text-base whitespace-nowrap">New Customer</span>
              </TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger 
                value="new" 
                className="relative flex items-center justify-center gap-3 py-3.5 px-4 h-14 rounded-lg transition-all duration-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-blue-600/30 data-[state=active]:scale-[1.02] data-[state=inactive]:opacity-60 data-[state=inactive]:bg-gray-50 hover:bg-gray-100 data-[state=inactive]:text-gray-700 group"
              >
                <UserPlus className="h-5 w-5 shrink-0 transition-transform duration-300 group-data-[state=active]:scale-110" />
                <span className="font-semibold text-base whitespace-nowrap">New Customer</span>
              </TabsTrigger>
              <TabsTrigger 
                value="existing" 
                className="relative flex items-center justify-center gap-3 py-3.5 px-4 h-14 rounded-lg transition-all duration-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:shadow-blue-600/30 data-[state=active]:scale-[1.02] data-[state=inactive]:opacity-60 data-[state=inactive]:bg-gray-50 hover:bg-gray-100 data-[state=inactive]:text-gray-700 group"
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
