import { UserPlus, Users } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CustomerTypeSelectorProps {
  value: 'new' | 'existing';
  onChange: (value: 'new' | 'existing') => void;
}

export const CustomerTypeSelector = ({ value, onChange }: CustomerTypeSelectorProps) => {
  return (
    <div className="space-y-3">
      <Tabs value={value} onValueChange={onChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto bg-background border-b-2 border-border p-0">
          <TabsTrigger 
            value="new" 
            className="relative flex items-center justify-center gap-2 py-4 px-4 rounded-none border-b-4 border-transparent data-[state=active]:border-b-green-500 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <div className="flex flex-col items-center">
              <span className="font-medium">New Customer</span>
              <span className="text-xs opacity-70 hidden sm:inline">Create new record</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="existing" 
            className="relative flex items-center justify-center gap-2 py-4 px-4 rounded-none border-b-4 border-transparent data-[state=active]:border-b-green-500 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 transition-all"
          >
            <Users className="h-4 w-4" />
            <div className="flex flex-col items-center">
              <span className="font-medium">Existing Customer</span>
              <span className="text-xs opacity-70 hidden sm:inline">Select from list</span>
            </div>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
