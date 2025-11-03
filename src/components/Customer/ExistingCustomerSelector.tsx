import { useState, useEffect } from 'react';
import { Building2, Mail, Phone, FileText, Check, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const [customers, setCustomers] = useState<Partial<Customer>[]>([]);
  const [loading, setLoading] = useState(true);
  const [applicationCounts, setApplicationCounts] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');

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
      <div>
        <label className="text-sm font-medium">Select Existing Customer</label>
        <p className="text-sm text-muted-foreground">
          Type customer name or company to search
        </p>
      </div>

      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Start typing customer name, company, or email..."
            value={searchTerm}
            onChange={handleInputChange}
            className="pl-9 h-12 text-base"
            disabled={loading}
          />
        </div>

        {searchTerm.trim().length > 0 && searchTerm.trim().length < 2 && (
          <p className="mt-2 text-xs text-muted-foreground">Type at least 2 characters to search</p>
        )}

        {/* Results dropdown */}
        {hasQuery && filteredCustomers.length > 0 && (
          <div className="absolute z-50 w-full mt-2 border rounded-lg shadow-lg bg-popover">
            <ScrollArea className="max-h-[300px]">
              <div className="p-1">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleSelect(customer.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-md hover:bg-muted transition-colors",
                      value === customer.id && "bg-muted"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Check
                        className={cn(
                          'mt-1 h-4 w-4 shrink-0 text-primary',
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
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* No results message */}
        {hasQuery && filteredCustomers.length === 0 && !loading && (
          <div className="absolute z-50 w-full mt-2 p-4 border rounded-lg shadow-lg bg-popover text-center text-sm text-muted-foreground">
            No customers found matching "{searchTerm}"
          </div>
        )}

        {/* Loading state */}
        {loading && hasQuery && (
          <div className="absolute z-50 w-full mt-2 p-4 border rounded-lg shadow-lg bg-popover text-center text-sm text-muted-foreground">
            Loading customers...
          </div>
        )}
      </div>

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
