import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Building2, Mail, Phone, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CustomerService } from '@/services/customerService';
import { ApplicationService } from '@/services/applicationService';
import type { Customer } from '@/types/customer';

interface ExistingCustomerSelectorProps {
  userId: string;
  value: string | null;
  onChange: (customerId: string | null, customer: Partial<Customer> | null) => void;
}

export const ExistingCustomerSelector = ({ 
  userId, 
  value, 
  onChange 
}: ExistingCustomerSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<Partial<Customer>[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicationCounts, setApplicationCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const data = await CustomerService.fetchUserCustomers(userId);
        setCustomers(data);
        
        // Fetch application counts for each customer
        const counts: Record<string, number> = {};
        for (const customer of data) {
          const apps = await ApplicationService.fetchApplicationsByCustomerId(customer.id);
          counts[customer.id] = apps.length;
        }
        setApplicationCounts(counts);
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [userId]);

  const selectedCustomer = customers.find(c => c.id === value);

  const handleSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (value === customerId) {
      onChange(null, null);
    } else {
      onChange(customerId, customer || null);
    }
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Select Existing Customer</label>
        <p className="text-sm text-muted-foreground">
          Choose a customer from your list to create a new application for them
        </p>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[44px]"
          >
            {selectedCustomer ? (
              <div className="flex items-center gap-2 text-left">
                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="font-medium">{selectedCustomer.company}</span>
                  <span className="text-xs text-muted-foreground">
                    {selectedCustomer.name} • {selectedCustomer.email}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">Select a customer...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[600px] p-0 bg-popover border shadow-lg" 
          align="start" 
          side="bottom"
          sideOffset={4}
          avoidCollisions={false}
          sticky="always"
          style={{ zIndex: 9999 }}
        >
          <Command>
            <CommandInput placeholder="Search by company or email..." />
            <CommandEmpty>
              {loading ? 'Loading customers...' : 'No customers found.'}
            </CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {customers.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={`${customer.company} ${customer.email} ${customer.name}`}
                  onSelect={() => handleSelect(customer.id)}
                  className="flex items-start gap-3 py-3"
                >
                  <Check
                    className={cn(
                      'mt-1 h-4 w-4 shrink-0',
                      value === customer.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{customer.company}</span>
                      {applicationCounts[customer.id] > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                          <FileText className="h-3 w-3 mr-1" />
                          {applicationCounts[customer.id]} app{applicationCounts[customer.id] !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {customer.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {customer.mobile}
                      </span>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedCustomer && (
        <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
          <p className="text-sm font-medium">Selected Customer Details</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span>
              <p className="font-medium">{selectedCustomer.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Company:</span>
              <p className="font-medium">{selectedCustomer.company}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span>
              <p className="font-medium">{selectedCustomer.email}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Mobile:</span>
              <p className="font-medium">{selectedCustomer.mobile}</p>
            </div>
          </div>
          {applicationCounts[selectedCustomer.id] > 0 && (
            <p className="text-xs text-muted-foreground pt-2 border-t">
              This customer has {applicationCounts[selectedCustomer.id]} existing application(s)
            </p>
          )}
        </div>
      )}
    </div>
  );
};
