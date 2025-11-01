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
        <TabsList className="grid w-full grid-cols-2 h-auto bg-background border-b-2 border-border p-0">
          <TabsTrigger 
            value="new" 
            className="relative flex items-center justify-center gap-2 py-4 px-4 rounded-none border-b-3 border-transparent data-[state=active]:border-b-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <div className="flex flex-col items-center">
              <span className="font-medium">New Customer</span>
              <span className="text-xs opacity-70 hidden sm:inline">Create new record</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="existing" 
            className="relative flex items-center justify-center gap-2 py-4 px-4 rounded-none border-b-3 border-transparent data-[state=active]:border-b-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary transition-all"
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
