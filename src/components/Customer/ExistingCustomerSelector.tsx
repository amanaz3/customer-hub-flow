import { useState, useEffect } from 'react';
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
    setSearchTerm(e.target.value);
    // Clear selection if user modifies the search
    if (value && e.target.value !== selectedCustomer?.company && e.target.value !== selectedCustomer?.name) {
      onChange(null, null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Start typing customer name, company, or email..."
            value={searchTerm}
            onChange={handleInputChange}
            className="pl-12 pr-12 h-12 text-base font-medium bg-white/80 backdrop-blur-sm border-slate-200/60 focus-visible:border-primary/50"
            autoFocus
          />
          {loading && hasQuery && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-primary" />
          )}
        </div>

        {searchTerm.trim().length > 0 && searchTerm.trim().length < 2 && (
          <p className="mt-2 text-xs text-muted-foreground">Type at least 2 characters to search</p>
        )}

        {/* Results dropdown - appears above input */}
        {hasQuery && filteredCustomers.length > 0 && (
          <div className="absolute z-[100000] w-full bottom-full mb-2 border border-slate-200/60 rounded-xl shadow-2xl bg-white backdrop-blur-xl">
            <ScrollArea className="max-h-[400px]">
              <div className="p-2">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleSelect(customer.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-md hover:bg-muted transition-colors",
                      value === customer.id && "bg-muted"
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
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                          <span className="font-semibold text-base">{customer.company}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
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
          </div>
        )}

        {/* No results message - appears above input */}
        {hasQuery && filteredCustomers.length === 0 && !loading && (
          <div className="absolute z-[100000] w-full bottom-full mb-2 p-4 border rounded-lg shadow-2xl bg-white backdrop-blur-sm text-center text-sm text-slate-600">
            No customers found matching "{searchTerm}"
          </div>
        )}

        {/* Loading state - appears above input */}
        {loading && hasQuery && (
          <div className="absolute z-[100000] w-full bottom-full mb-2 p-6 border rounded-lg shadow-2xl bg-white backdrop-blur-sm">
            <div className="flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Searching customers...</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
