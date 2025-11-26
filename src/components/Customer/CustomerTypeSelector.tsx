import { UserPlus, Users } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CustomerTypeSelectorProps {
  value: 'new' | 'existing';
  onChange: (value: 'new' | 'existing') => void;
}

export const CustomerTypeSelector = ({ value, onChange }: CustomerTypeSelectorProps) => {
  return (
    <div className="w-full">
      <Tabs value={value} onValueChange={onChange} className="w-full relative z-50">
        <TabsList className="grid w-full grid-cols-2 h-auto bg-transparent p-0 gap-0">
          <TabsTrigger 
            value="new" 
            className="flex items-center justify-center gap-2 py-3 px-4 border-b-2 rounded-none transition-all duration-200 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:border-muted-foreground/30 bg-transparent"
          >
            <UserPlus className="h-4 w-4 shrink-0" />
            <span className="font-medium text-sm whitespace-nowrap">New Customer</span>
          </TabsTrigger>
          <TabsTrigger 
            value="existing" 
            className="flex items-center justify-center gap-2 py-3 px-4 border-b-2 rounded-none transition-all duration-200 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:border-muted-foreground/30 bg-transparent"
          >
            <Users className="h-4 w-4 shrink-0" />
            <span className="font-medium text-sm whitespace-nowrap">Existing Customer</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
