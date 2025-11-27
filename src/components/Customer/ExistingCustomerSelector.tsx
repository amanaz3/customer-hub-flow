import { useState, useEffect, useRef } from 'react';
import { Building2, Mail, Phone, Check, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CustomerService } from '@/services/customerService';
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
  const [customers, setCustomers] = useState<Partial<Customer>[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the search input when component mounts (tab switches)
  useEffect(() => {
    // Use requestAnimationFrame + timeout to ensure DOM is ready after tab switch
    const raf = requestAnimationFrame(() => {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const data = await CustomerService.fetchUserCustomers(userId);
        setCustomers(data);
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [userId]);

  const selectedCustomer = customers.find(c => c.id === value);

  // Filter customers based on search term
  const hasQuery = searchTerm.trim().length >= 2;
  const filteredCustomers = hasQuery
    ? customers.filter(customer => 
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];


  const handleSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (value === customerId) {
      onChange(null, null);
    } else {
      onChange(customerId, customer || null);
    }
    // Clear search after selection so list doesn't open on click
    setSearchTerm('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setOpen(newValue.trim().length >= 2);
    // Clear selection if user modifies the search
    if (value && newValue !== selectedCustomer?.company && newValue !== selectedCustomer?.name) {
      onChange(null, null);
    }
  };

  return (
    <div className="space-y-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <Input
              ref={inputRef}
              placeholder="Start typing customer name, company, or email..."
              value={searchTerm}
              onChange={handleInputChange}
              className="pl-12 pr-12 h-12 text-base font-medium bg-white border-slate-200 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus-visible:border-slate-200 hover:border-slate-200 focus-visible:shadow-none"
            />
            {loading && hasQuery && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-primary" />
            )}
          </div>
        </PopoverTrigger>

        {searchTerm.trim().length > 0 && searchTerm.trim().length < 2 && (
          <p className="mt-2 text-xs text-slate-600">Type at least 2 characters to search</p>
        )}

        <PopoverContent 
          className="w-[600px] p-0 bg-white border-slate-200 shadow-2xl"
          align="start"
          side="top"
          sideOffset={8}
        >
          {hasQuery && filteredCustomers.length > 0 && (
            <ScrollArea className="max-h-[400px]">
              <div className="p-2">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => {
                      handleSelect(customer.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full text-left p-4 rounded-md hover:bg-slate-100 transition-colors",
                      value === customer.id && "bg-slate-100"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Check
                        className={cn(
                          'mt-1 h-5 w-5 shrink-0 text-primary',
                          value === customer.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-slate-500" />
                          <span className="font-semibold text-base text-slate-900">{customer.company}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <Mail className="h-4 w-4" />
                            {customer.email}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-4 w-4" />
                            {customer.mobile}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}

          {hasQuery && filteredCustomers.length === 0 && !loading && (
            <div className="p-6 text-center text-sm text-slate-600">
              No customers found matching "{searchTerm}"
            </div>
          )}

          {loading && hasQuery && (
            <div className="p-6 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-slate-600">Searching customers...</p>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};
