import React, { useState, useEffect, useRef } from 'react';
import { Search, UserPlus, Users, Phone, Mail, Building2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CustomerService } from '@/services/customerService';
import { Customer } from '@/types/customer';

interface CustomerLookupPanelProps {
  onCustomerFound: (customerId: string, customer: Partial<Customer>) => void;
  onNewCustomer: (searchTerm: string, searchType: 'mobile' | 'email' | 'name') => void;
}

export const CustomerLookupPanel: React.FC<CustomerLookupPanelProps> = ({
  onCustomerFound,
  onNewCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Partial<Customer>[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Fetch all customers on mount for searching
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const data = await CustomerService.fetchCustomers();
        setCustomers(data);
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  // Determine search type based on input
  const getSearchType = (term: string): 'mobile' | 'email' | 'name' => {
    const trimmed = term.trim();
    // Check if it looks like a phone number (starts with + or contains mostly digits)
    if (/^[\+]?[\d\s\-()]+$/.test(trimmed) && trimmed.replace(/\D/g, '').length >= 6) {
      return 'mobile';
    }
    // Check if it looks like an email
    if (trimmed.includes('@')) {
      return 'email';
    }
    return 'name';
  };

  // Filter customers based on search term
  const hasQuery = searchTerm.trim().length >= 2;
  const searchType = getSearchType(searchTerm);
  
  const filteredCustomers = hasQuery
    ? customers.filter(customer => {
        const term = searchTerm.toLowerCase().trim();
        const normalizedTerm = term.replace(/\D/g, ''); // Remove non-digits for phone matching
        
        if (searchType === 'mobile') {
          const customerMobile = (customer.mobile || '').replace(/\D/g, '');
          return customerMobile.includes(normalizedTerm);
        }
        if (searchType === 'email') {
          return customer.email?.toLowerCase().includes(term);
        }
        // Name search - also check company
        return (
          customer.name?.toLowerCase().includes(term) ||
          customer.company?.toLowerCase().includes(term)
        );
      })
    : [];

  const handleSearch = () => {
    setHasSearched(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && hasQuery) {
      handleSearch();
    }
  };

  const handleSelectCustomer = (customer: Partial<Customer>) => {
    if (customer.id) {
      onCustomerFound(customer.id, customer);
    }
  };

  const handleCreateNew = () => {
    onNewCustomer(searchTerm.trim(), searchType);
  };

  const getSearchIcon = () => {
    switch (searchType) {
      case 'mobile':
        return <Phone className="h-4 w-4 text-muted-foreground" />;
      case 'email':
        return <Mail className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Search className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSearchPlaceholder = () => {
    return 'Search by mobile, email, or name...';
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Search className="h-5 w-5 text-primary" />
        <div>
          <h3 className="font-semibold text-sm">Customer Lookup</h3>
          <p className="text-xs text-muted-foreground">Check if customer exists</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="space-y-2">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {getSearchIcon()}
          </div>
          <Input
            ref={inputRef}
            type="text"
            placeholder={getSearchPlaceholder()}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setHasSearched(false);
            }}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-4"
          />
        </div>
        
        {hasQuery && (
          <Badge variant="outline" className="text-xs">
            Searching by: {searchType === 'mobile' ? 'Mobile Number' : searchType === 'email' ? 'Email' : 'Name'}
          </Badge>
        )}

        <Button
          onClick={handleSearch}
          disabled={!hasQuery || loading}
          className="w-full"
          size="sm"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Search Customer
            </>
          )}
        </Button>
      </div>

      {/* Results */}
      {hasSearched && hasQuery && (
        <div className="flex-1 min-h-0">
          {filteredCustomers.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} found
                </span>
                <Badge variant="secondary" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  Existing
                </Badge>
              </div>
              
              <ScrollArea className="h-[200px]">
                <div className="space-y-2 pr-2">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer)}
                      className="p-3 rounded-lg border border-border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{customer.name}</p>
                          {customer.company && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                              <Building2 className="h-3 w-3" />
                              {customer.company}
                            </p>
                          )}
                          <div className="flex flex-col gap-0.5 mt-1">
                            {customer.mobile && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {customer.mobile}
                              </p>
                            )}
                            {customer.email && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectCustomer(customer);
                        }}
                      >
                        <Users className="h-3 w-3 mr-1" />
                        Select Existing Customer
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="space-y-4 text-center py-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">No customer found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  No existing customer matches "{searchTerm}"
                </p>
              </div>
              <Button
                onClick={handleCreateNew}
                className="w-full"
                size="sm"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create New Customer
              </Button>
              {searchType === 'mobile' && (
                <p className="text-xs text-muted-foreground">
                  Mobile number will be pre-filled in the form
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Initial state */}
      {!hasSearched && (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground py-6">
          <Search className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">Enter customer details</p>
          <p className="text-xs mt-1">
            Search by mobile number, email, or name to check if customer already exists
          </p>
        </div>
      )}
    </div>
  );
};
