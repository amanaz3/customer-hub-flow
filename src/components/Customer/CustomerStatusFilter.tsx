import React, { useState } from 'react';
import { Customer } from '@/types/customer';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, X } from 'lucide-react';

interface CustomerStatusFilterProps {
  customers: Customer[];
  onFilteredCustomers: (customers: Customer[]) => void;
}

// Available status options based on the database
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Submitted', label: 'Submitted' },
  { value: 'Sent to Bank', label: 'Sent to Bank' },
  { value: 'Need More Info', label: 'Need More Info' },
  { value: 'Complete', label: 'Complete' },
  { value: 'Paid', label: 'Paid' },
  { value: 'Rejected', label: 'Rejected' },
];

const CustomerStatusFilter: React.FC<CustomerStatusFilterProps> = ({
  customers,
  onFilteredCustomers,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    
    if (status === 'all') {
      onFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer => customer.status === status);
      onFilteredCustomers(filtered);
    }
  };

  const clearFilters = () => {
    setSelectedStatus('all');
    onFilteredCustomers(customers);
  };

  const hasActiveFilter = selectedStatus !== 'all';

  return (
    <Card className="border-l-4 border-l-primary/20 bg-gradient-to-r from-card/50 to-card">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Filter Applications</span>
            </div>
            
            {hasActiveFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className={cn(
                  "w-[180px] h-9 bg-background border-border/50",
                  "focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                  "transition-all duration-200"
                )}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover border-border shadow-xl backdrop-blur-sm">
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      className="hover:bg-accent focus:bg-accent transition-colors cursor-pointer"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
              {hasActiveFilter 
                ? `${customers.filter(c => c.status === selectedStatus).length} of ${customers.length}` 
                : `${customers.length} total`
              }
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerStatusFilter;