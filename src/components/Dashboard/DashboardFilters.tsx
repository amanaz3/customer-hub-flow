
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, RefreshCw, X, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvailableMonth {
  key: string;
  label: string;
}

interface DashboardFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  selectedMonths: string[];
  availableMonths: AvailableMonth[];
  onMonthToggle: (monthKey: string) => void;
  onClearAllMonths: () => void;
  onClearAllFilters: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  activeWidget?: 'applications' | 'completed' | 'pending' | 'revenue';
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  selectedMonths,
  availableMonths,
  onMonthToggle,
  onClearAllMonths,
  onClearAllFilters,
  onRefresh,
  isLoading = false,
  activeWidget = 'applications'
}) => {
  // Base status options
  const allStatusOptions = [
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

  // Filter status options based on active widget
  const getStatusOptionsForWidget = () => {
    switch (activeWidget) {
      case 'applications':
        // Active applications - exclude rejected, completed, and paid
        return allStatusOptions.filter(option => 
          option.value === 'all' || !['Rejected', 'Complete', 'Paid'].includes(option.value)
        );
      
      case 'completed':
        // Completed applications - only complete and paid
        return [
          allStatusOptions[0], // 'all'
          allStatusOptions.find(opt => opt.value === 'Complete')!,
          allStatusOptions.find(opt => opt.value === 'Paid')!
        ];
      
      case 'pending':
        // Submitted applications - exclude draft, complete, paid, and rejected
        return allStatusOptions.filter(option => 
          option.value === 'all' || !['Draft', 'Complete', 'Paid', 'Rejected'].includes(option.value)
        );
      
      case 'revenue':
        // Revenue applications - only complete and paid (revenue generating)
        return [
          allStatusOptions[0], // 'all'
          allStatusOptions.find(opt => opt.value === 'Complete')!,
          allStatusOptions.find(opt => opt.value === 'Paid')!
        ];
      
      default:
        return allStatusOptions;
    }
  };

  const statusOptions = getStatusOptionsForWidget();

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || selectedMonths.length > 0;

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

        {/* Month Filter */}
        {availableMonths.length > 0 && (
          <div className="w-full sm:w-48">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-11 w-full justify-start bg-background/50 border-border/50",
                    selectedMonths.length === 0 && "text-muted-foreground"
                  )}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {selectedMonths.length > 0 
                    ? `${selectedMonths.length} month${selectedMonths.length > 1 ? 's' : ''}`
                    : "Filter by months"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="start">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Select months:</div>
                    {selectedMonths.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onClearAllMonths}
                      >
                        Clear all
                      </Button>
                    )}
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {availableMonths.map((month) => (
                      <div key={month.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={month.key}
                          checked={selectedMonths.includes(month.key)}
                          onCheckedChange={() => onMonthToggle(month.key)}
                        />
                        <label
                          htmlFor={month.key}
                          className="text-sm font-normal leading-none cursor-pointer flex-1"
                        >
                          {month.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearAllFilters}
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
            {selectedMonths.length > 0 && selectedMonths.map(monthKey => {
              const month = availableMonths.find(m => m.key === monthKey);
              return month ? (
                <div key={monthKey} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
                  <Calendar className="h-3 w-3" />
                  <span>{month.label}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMonthToggle(monthKey)}
                    className="h-4 w-4 p-0 hover:bg-primary/20"
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardFilters;
