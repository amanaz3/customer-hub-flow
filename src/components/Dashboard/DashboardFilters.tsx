
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, RefreshCw } from 'lucide-react';

interface DashboardFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  onRefresh,
  isLoading = false
}) => {
  const statusOptions = [
    { value: 'all', label: 'All Status', count: null },
    { value: 'Draft', label: 'Draft', count: null },
    { value: 'Submitted', label: 'Submitted', count: null },
    { value: 'Returned', label: 'Returned', count: null },
    { value: 'Sent to Bank', label: 'Sent to Bank', count: null },
    { value: 'Complete', label: 'Complete', count: null },
    { value: 'Rejected', label: 'Rejected', count: null },
    { value: 'Need More Info', label: 'Need More Info', count: null },
    { value: 'Paid', label: 'Paid', count: null }
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers by name, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <div className="w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {onRefresh && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            disabled={isLoading}
            className="h-10 px-3"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default DashboardFilters;
