import React, { useState, useMemo, memo } from 'react';
import OptimizedCustomerTable from '@/components/Customer/OptimizedCustomerTable';
import LazyWrapper from '@/components/Performance/LazyWrapper';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useCustomers } from '@/contexts/CustomerContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ChevronDown, X, RotateCcw } from 'lucide-react';

const RejectedApplications = () => {
  const { user, isAdmin } = useAuth();
  const { customers, getCustomersByUserId } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Month filtering state
  const currentDate = new Date();
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [isAutoRange, setIsAutoRange] = useState(false);
  
  // Helper functions for month selection
  const toggleMonth = (month: number) => {
    if (isAutoRange) return;
    
    setSelectedMonths(prev => 
      prev.includes(month)
        ? prev.filter(m => m !== month)
        : [...prev, month].sort((a, b) => a - b)
    );
  };

  const selectAllMonths = () => {
    if (isAutoRange) return;
    setSelectedMonths(Array.from({ length: 12 }, (_, i) => i + 1));
  };

  const clearAllMonths = () => {
    if (isAutoRange) return;
    setSelectedMonths([]);
  };

  const resetToCurrentMonth = () => {
    setIsAutoRange(false);
    setSelectedMonths([currentDate.getMonth() + 1]);
    setSelectedYear(currentDate.getFullYear());
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
  };
  
  const { filteredCustomers, rejectedCount } = useMemo(() => {
    // For regular users, show only their rejected applications
    // For admins, show all rejected applications
    const rejectedApplications = isAdmin 
      ? customers.filter(c => c.status === 'Rejected')
      : getCustomersByUserId(user?.id || '').filter(c => c.status === 'Rejected');
    
    // Apply month filtering if months are selected
    let monthFiltered = rejectedApplications;
    if (selectedMonths.length > 0) {
      monthFiltered = rejectedApplications.filter(customer => {
        const customerDate = new Date(customer.updated_at || customer.created_at || '');
        const customerMonth = customerDate.getMonth() + 1; // 1-based month
        const customerYear = customerDate.getFullYear();
        
        return selectedMonths.includes(customerMonth) && customerYear === selectedYear;
      });
    }
    
    // Apply search filter
    const searchFiltered = monthFiltered.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return {
      filteredCustomers: searchFiltered,
      rejectedCount: rejectedApplications.length,
    };
  }, [customers, isAdmin, user?.id, getCustomersByUserId, searchTerm, selectedMonths, selectedYear]);

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Rejected Applications</h1>
          <p className="text-muted-foreground">
            View rejected applications {!isAdmin && 'you submitted'}
          </p>
        </div>
        
        <LazyWrapper className="min-h-[100px]">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <Input
              placeholder="Search by name, company, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:max-w-xs"
            />
            
            <div className="flex gap-2">
              <div className="text-sm text-muted-foreground px-3 py-2 bg-muted rounded-md">
                Rejected: {rejectedCount}
              </div>
            </div>
          </div>
        </LazyWrapper>
        
        {/* Month Filter */}
        <Card className="shadow-sm border-0 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Filter by Month</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Filter rejected applications by selecting specific months and year
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetToCurrentMonth}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Year:</label>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = currentDate.getFullYear() - 5 + i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Selected Months ({selectedMonths.length}/12):
                </label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllMonths}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearAllMonths}>
                    Clear All
                  </Button>
                </div>
              </div>
              
              {/* Month Selection */}
              <div className="space-y-2">
                {selectedMonths.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedMonths.map(month => (
                      <Badge 
                        key={month} 
                        variant="secondary" 
                        className="flex items-center gap-1 px-3 py-1"
                      >
                        {getMonthName(month)}
                        <button
                          onClick={() => toggleMonth(month)}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No months selected - showing all data</p>
                )}
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Add Months
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4 bg-background border shadow-lg z-50">
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 12 }, (_, i) => {
                        const month = i + 1;
                        const isSelected = selectedMonths.includes(month);
                        return (
                          <Button
                            key={month}
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleMonth(month)}
                            className="justify-start"
                          >
                            {getMonthName(month)}
                          </Button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <LazyWrapper>
          <OptimizedCustomerTable customers={filteredCustomers} />
        </LazyWrapper>
      </div>
    );
  };

export default memo(RejectedApplications);