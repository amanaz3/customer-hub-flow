import { UserPlus, Users } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CustomerTypeSelectorProps {
  value: 'new' | 'existing';
  onChange: (value: 'new' | 'existing') => void;
}

export const CustomerTypeSelector = ({ value, onChange }: CustomerTypeSelectorProps) => {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold">Customer Type</h3>
        <p className="text-sm text-muted-foreground">
          Are you creating an application for a new customer or an existing one?
        </p>
      </div>
      
      <Tabs value={value} onValueChange={onChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-auto bg-muted p-1">
          <TabsTrigger 
            value="new" 
            className="flex items-center justify-center gap-2 py-3 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <UserPlus className="h-4 w-4" />
            <div className="flex flex-col items-start">
              <span className="font-medium">New Customer</span>
              <span className="text-xs opacity-70 hidden sm:inline">Create new record</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="existing" 
            className="flex items-center justify-center gap-2 py-3 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            <Users className="h-4 w-4" />
            <div className="flex flex-col items-start">
              <span className="font-medium">Existing Customer</span>
              <span className="text-xs opacity-70 hidden sm:inline">Select from list</span>
            </div>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
