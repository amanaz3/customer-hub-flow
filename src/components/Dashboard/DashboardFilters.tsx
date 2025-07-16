
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
import { Search, Filter, RefreshCw, X } from 'lucide-react';

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
    { value: 'all', label: 'All Status', color: 'text-gray-600' },
    { value: 'Draft', label: 'Draft', color: 'text-gray-600' },
    { value: 'Submitted', label: 'Submitted', color: 'text-blue-600' },
    { value: 'Returned', label: 'Returned', color: 'text-yellow-600' },
    { value: 'Sent to Bank', label: 'Sent to Bank', color: 'text-purple-600' },
    { value: 'Complete', label: 'Complete', color: 'text-green-600' },
    { value: 'Rejected', label: 'Rejected', color: 'text-red-600' },
    { value: 'Need More Info', label: 'Need More Info', color: 'text-orange-600' },
    { value: 'Paid', label: 'Paid', color: 'text-emerald-600' }
  ];

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all';

  return (
    <div className="bg-card rounded-lg border p-4 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Status Filter */}
        <div className="w-full sm:w-56">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11 bg-background/50 border-border/50 focus:border-primary/50">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Filter by status" />
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      option.value === 'all' ? 'bg-gray-400' :
                      option.value === 'Complete' || option.value === 'Paid' ? 'bg-green-500' :
                      option.value === 'Rejected' ? 'bg-red-500' :
                      option.value === 'Returned' ? 'bg-yellow-500' :
                      option.value === 'Need More Info' ? 'bg-orange-500' :
                      'bg-blue-500'
                    }`} />
                    <span className={option.color}>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters}
              className="h-11 px-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
          
          {onRefresh && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              disabled={isLoading}
              className="h-11 px-4"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="ml-2 hidden sm:inline">Refresh</span>
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          <div className="flex flex-wrap gap-1">
            {searchTerm && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                <Search className="h-3 w-3" />
                <span>"{searchTerm}"</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="h-4 w-4 p-0 hover:bg-primary/20"
                >
                  <X className="h-2 w-2" />
                </Button>
              </div>
            )}
            {statusFilter !== 'all' && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md">
                <Filter className="h-3 w-3" />
                <span>{statusOptions.find(opt => opt.value === statusFilter)?.label}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  className="h-4 w-4 p-0 hover:bg-secondary/80"
                >
                  <X className="h-2 w-2" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardFilters;
