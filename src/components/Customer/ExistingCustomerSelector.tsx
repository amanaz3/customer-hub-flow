import { useState, useEffect, useRef } from 'react';
import { Building2, Mail, Phone, Check, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    console.log('[ExistingCustomerSelector] handleSelect called:', { customerId, customer, currentValue: value });
    if (value === customerId) {
      console.log('[ExistingCustomerSelector] Deselecting customer');
      onChange(null, null);
    } else {
      console.log('[ExistingCustomerSelector] Selecting customer:', { customerId, customerData: customer });
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
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none z-10" />
        <Input
          ref={inputRef}
          placeholder="Start typing customer name, company, or email..."
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => {
            if (searchTerm.trim().length >= 2) {
              setOpen(true);
            }
          }}
          onBlur={() => {
            // Delay closing to allow click events on results
            setTimeout(() => setOpen(false), 200);
          }}
          className="pl-12 pr-12 h-12 text-base font-medium bg-white border-slate-200 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus-visible:border-slate-200 hover:border-slate-200 focus-visible:shadow-none"
        />
        {loading && hasQuery && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-primary pointer-events-none z-10" />
        )}

        {/* Dropdown Results */}
        {open && hasQuery && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl z-[9999] max-w-full">
            {filteredCustomers.length > 0 && (
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
                        "w-full text-left p-4 hover:bg-slate-100 transition-colors",
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

            {filteredCustomers.length === 0 && !loading && (
              <div className="p-6 text-center text-sm text-slate-600">
                No customers found matching "{searchTerm}"
              </div>
            )}

            {loading && (
              <div className="p-6 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-slate-600">Searching customers...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {searchTerm.trim().length > 0 && searchTerm.trim().length < 2 && (
        <p className="mt-2 text-xs text-slate-600">Type at least 2 characters to search</p>
      )}
    </div>
  );
};
