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
        <TabsList className="grid w-full grid-cols-2 h-auto bg-muted/50 border border-border p-1 rounded-none">
          <TabsTrigger 
            value="new" 
            className="flex items-center justify-center gap-2 py-2.5 px-4 h-10 rounded-none transition-colors duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted"
          >
            <UserPlus className="h-4 w-4 shrink-0" />
            <span className="font-medium text-sm whitespace-nowrap">New Customer</span>
          </TabsTrigger>
          <TabsTrigger 
            value="existing" 
            className="flex items-center justify-center gap-2 py-2.5 px-4 h-10 rounded-none transition-colors duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted"
          >
            <Users className="h-4 w-4 shrink-0" />
            <span className="font-medium text-sm whitespace-nowrap">Existing Customer</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
