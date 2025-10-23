import React, { useState, useMemo, memo, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import OptimizedCustomerTable from '@/components/Customer/OptimizedCustomerTable';
import LazyWrapper from '@/components/Performance/LazyWrapper';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useCustomers } from '@/contexts/CustomerContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ChevronDown, X, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Customer } from '@/types/customer';

const RejectedApplicationsContent = () => {
  const { user, isAdmin } = useAuth();
  const { customers, getCustomersByUserId } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  
  const currentDate = new Date();
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  const toggleMonth = (month: number) => {
    setSelectedMonths(prev => 
      prev.includes(month)
        ? prev.filter(m => m !== month)
        : [...prev, month].sort((a, b) => a - b)
    );
  };

  const selectAllMonths = () => {
    setSelectedMonths(Array.from({ length: 12 }, (_, i) => i + 1));
  };

  const clearAllMonths = () => {
    setSelectedMonths([]);
  };

  const resetToCurrentMonth = () => {
    setSelectedMonths([currentDate.getMonth() + 1]);
    setSelectedYear(currentDate.getFullYear());
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
  };
  
  const { filteredCustomers, rejectedCount } = useMemo(() => {
    const rejectedApplications = isAdmin 
      ? customers.filter(c => c.status === 'Rejected')
      : getCustomersByUserId(user?.id || '').filter(c => c.status === 'Rejected');
    
    let monthFiltered = rejectedApplications;
    if (selectedMonths.length > 0) {
      monthFiltered = rejectedApplications.filter(customer => {
        const customerDate = new Date(customer.updated_at || customer.created_at || '');
        const customerMonth = customerDate.getMonth() + 1;
        const customerYear = customerDate.getFullYear();
        
        return selectedMonths.includes(customerMonth) && customerYear === selectedYear;
      });
    }
    
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

const RejectedCustomersContent = () => {
  const { user, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectedCustomers, setRejectedCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const currentDate = new Date();
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  useEffect(() => {
    const fetchRejectedCustomers = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('customers')
          .select('*')
          .eq('status', 'Rejected')
          .order('updated_at', { ascending: false });
        
        if (!isAdmin && user?.id) {
          query = query.eq('user_id', user.id);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        setRejectedCustomers((data || []) as any);
      } catch (error) {
        console.error('Error fetching rejected customers:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRejectedCustomers();
  }, [isAdmin, user?.id]);
  
  const toggleMonth = (month: number) => {
    setSelectedMonths(prev => 
      prev.includes(month)
        ? prev.filter(m => m !== month)
        : [...prev, month].sort((a, b) => a - b)
    );
  };

  const selectAllMonths = () => {
    setSelectedMonths(Array.from({ length: 12 }, (_, i) => i + 1));
  };

  const clearAllMonths = () => {
    setSelectedMonths([]);
  };

  const resetToCurrentMonth = () => {
    setSelectedMonths([currentDate.getMonth() + 1]);
    setSelectedYear(currentDate.getFullYear());
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
  };
  
  const filteredCustomers = useMemo(() => {
    let filtered = rejectedCustomers;
    
    if (selectedMonths.length > 0) {
      filtered = filtered.filter(customer => {
        const date = new Date(customer.updated_at || customer.created_at);
        return selectedMonths.includes(date.getMonth() + 1) && 
               date.getFullYear() === selectedYear;
      });
    }
    
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [rejectedCustomers, searchTerm, selectedMonths, selectedYear]);

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <LazyWrapper className="min-h-[100px]">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <Input
            placeholder="Search by company, name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:max-w-xs"
          />
          
          <div className="flex gap-2">
            <div className="text-sm text-muted-foreground px-3 py-2 bg-muted rounded-md">
              Rejected Customers: {rejectedCustomers.length}
            </div>
          </div>
        </div>
      </LazyWrapper>
      
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
                  Filter rejected customers by selecting specific months and year
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

const Rejected = () => {
  const [activeTab, setActiveTab] = useState('applications');
  const { isAdmin } = useAuth();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rejected Items</h1>
        <p className="text-muted-foreground">
          View rejected applications and customers {!isAdmin && 'you submitted'}
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="applications">
            Applications
          </TabsTrigger>
          <TabsTrigger value="customers">
            Customers
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="applications" className="space-y-6 mt-6">
          <RejectedApplicationsContent />
        </TabsContent>
        
        <TabsContent value="customers" className="space-y-6 mt-6">
          <RejectedCustomersContent />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default memo(Rejected);
