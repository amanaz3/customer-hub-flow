import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface CustomerTypeSelectorProps {
  value: 'new' | 'existing';
  onChange: (value: 'new' | 'existing') => void;
}

export const CustomerTypeSelector = ({ value, onChange }: CustomerTypeSelectorProps) => {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div>
        <h3 className="text-lg font-semibold">Customer Type</h3>
        <p className="text-sm text-muted-foreground">
          Are you creating an application for a new customer or an existing one?
        </p>
      </div>
      
      <RadioGroup value={value} onValueChange={onChange} className="space-y-3">
        <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent/50 transition-colors">
          <RadioGroupItem value="new" id="new-customer" />
          <div className="space-y-1 leading-none">
            <Label htmlFor="new-customer" className="font-medium cursor-pointer">
              New Customer
            </Label>
            <p className="text-sm text-muted-foreground">
              Create a new customer record and application together
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent/50 transition-colors">
          <RadioGroupItem value="existing" id="existing-customer" />
          <div className="space-y-1 leading-none">
            <Label htmlFor="existing-customer" className="font-medium cursor-pointer">
              Existing Customer
            </Label>
            <p className="text-sm text-muted-foreground">
              Create an application for a customer that already exists in the system
            </p>
          </div>
        </div>
      </RadioGroup>
    </div>
  );
};
