import { UserPlus, Users, Circle, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerTypeSelectorProps {
  value: 'new' | 'existing';
  onChange: (value: 'new' | 'existing') => void;
}

export const CustomerTypeSelector = ({ value, onChange }: CustomerTypeSelectorProps) => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange('new')}
          className={cn(
            "flex items-center gap-3 p-3 border rounded-lg transition-all duration-200 bg-card",
            value === 'new' 
              ? "border-primary bg-primary/10 text-primary shadow-sm" 
              : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-muted/50"
          )}
        >
          {value === 'new' ? (
            <CircleDot className="h-4 w-4 shrink-0 text-primary" />
          ) : (
            <Circle className="h-4 w-4 shrink-0" />
          )}
          <UserPlus className="h-4 w-4 shrink-0" />
          <span className="font-medium text-sm whitespace-nowrap">New Customer</span>
        </button>
        
        <button
          type="button"
          onClick={() => onChange('existing')}
          className={cn(
            "flex items-center gap-3 p-3 border rounded-lg transition-all duration-200 bg-card",
            value === 'existing' 
              ? "border-primary bg-primary/10 text-primary shadow-sm" 
              : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-muted/50"
          )}
        >
          {value === 'existing' ? (
            <CircleDot className="h-4 w-4 shrink-0 text-primary" />
          ) : (
            <Circle className="h-4 w-4 shrink-0" />
          )}
          <Users className="h-4 w-4 shrink-0" />
          <span className="font-medium text-sm whitespace-nowrap">Existing Customer</span>
        </button>
      </div>
    </div>
  );
};
