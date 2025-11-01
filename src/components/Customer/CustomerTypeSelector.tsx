import { UserPlus, Users, CheckCircle2 } from 'lucide-react';
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
        <TabsList className="grid w-full grid-cols-2 h-auto bg-muted/50 p-1 border">
          <TabsTrigger 
            value="new" 
            className="relative flex items-center justify-center gap-2 py-3 border-2 border-transparent text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md"
          >
            <UserPlus className="h-4 w-4" />
            <div className="flex flex-col items-start">
              <span className="font-medium">New Customer</span>
              <span className="text-xs opacity-70 hidden sm:inline">Create new record</span>
            </div>
            {value === 'new' && (
              <CheckCircle2 className="h-5 w-5 absolute top-2 right-2" />
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="existing" 
            className="relative flex items-center justify-center gap-2 py-3 border-2 border-transparent text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md"
          >
            <Users className="h-4 w-4" />
            <div className="flex flex-col items-start">
              <span className="font-medium">Existing Customer</span>
              <span className="text-xs opacity-70 hidden sm:inline">Select from list</span>
            </div>
            {value === 'existing' && (
              <CheckCircle2 className="h-5 w-5 absolute top-2 right-2" />
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
