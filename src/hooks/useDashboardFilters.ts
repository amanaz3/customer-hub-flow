import { useState, useMemo } from 'react';
import { Customer } from '@/types/customer';
import { format } from 'date-fns';

interface AvailableMonth {
  key: string;
  label: string;
  year: number;
  month: number;
}

export const useDashboardFilters = (customers: Customer[], activeWidget: string, revenueSelectedMonths?: string[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

  // Generate available months from customer data
  const availableMonths = useMemo((): AvailableMonth[] => {
    const months = new Set<string>();
    
    customers.forEach(customer => {
      const dateField = customer.updated_at || customer.created_at;
      if (dateField) {
        const date = new Date(dateField);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        months.add(monthKey);
      }
    });
    
    return Array.from(months).sort().map(monthKey => {
      const [year, month] = monthKey.split('-').map(Number);
      const date = new Date(year, month);
      return {
        key: monthKey,
        label: format(date, "MMMM yyyy"),
        year,
        month
      };
    });
  }, [customers]);

  // Filter customers based on all active filters
  const filteredCustomers = useMemo(() => {
    let result = customers;

    // Apply widget-specific filtering first
    if (activeWidget === 'completed') {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      result = result.filter(c => {
        const isCompletedOrPaid = c.status === 'Complete' || c.status === 'Paid';
        if (!isCompletedOrPaid) return false;
        
        const customerDate = new Date(c.updated_at || c.created_at || '');
        const customerMonth = customerDate.getMonth();
        const customerYear = customerDate.getFullYear();
        
        return customerMonth === currentMonth && customerYear === currentYear;
      });
    } else if (activeWidget === 'pending') {
      result = result.filter(c => 
        !['Complete', 'Paid', 'Rejected', 'Draft'].includes(c.status)
      );
    } else if (activeWidget === 'revenue') {
      result = result.filter(c => {
        const isRevenueGenerating = c.status === 'Complete' || c.status === 'Paid';
        if (!isRevenueGenerating) return false;
        
        // Apply revenue month filter if provided
        if (revenueSelectedMonths && revenueSelectedMonths.length > 0) {
          const dateField = c.updated_at || c.created_at;
          if (!dateField) return false;
          
          const customerDate = new Date(dateField);
          const monthKey = `${customerDate.getFullYear()}-${customerDate.getMonth()}`;
          return revenueSelectedMonths.includes(monthKey);
        }
        
        return true;
      });
    } else if (activeWidget === 'applications') {
      // Show only active applications - exclude completed, paid, and rejected
      result = result.filter(c => !['Complete', 'Paid', 'Rejected'].includes(c.status));
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }

    // Apply month filter
    if (selectedMonths.length > 0) {
      result = result.filter(customer => {
        const dateField = customer.updated_at || customer.created_at;
        if (!dateField) return false;
        
        const customerDate = new Date(dateField);
        const monthKey = `${customerDate.getFullYear()}-${customerDate.getMonth()}`;
        return selectedMonths.includes(monthKey);
      });
    }

    // Apply search filter
    if (searchTerm) {
      result = result.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return result;
  }, [customers, activeWidget, statusFilter, selectedMonths, searchTerm, revenueSelectedMonths]);

  const toggleMonth = (monthKey: string) => {
    setSelectedMonths(prev => 
      prev.includes(monthKey) 
        ? prev.filter(m => m !== monthKey)
        : [...prev, monthKey]
    );
  };

  const clearAllMonths = () => {
    setSelectedMonths([]);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSelectedMonths([]);
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || selectedMonths.length > 0;

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedMonths,
    setSelectedMonths,
    availableMonths,
    filteredCustomers,
    toggleMonth,
    clearAllMonths,
    clearAllFilters,
    hasActiveFilters
  };
};