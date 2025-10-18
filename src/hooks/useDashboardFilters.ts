import { useState, useMemo } from 'react';
import { Customer } from '@/types/customer';
import { format } from 'date-fns';

interface AvailableMonth {
  key: string;
  label: string;
  year: number;
  month: number;
}

export const useDashboardFilters = (customers: Customer[], activeWidget: string, revenueSelectedMonths?: string[], isAdmin?: boolean) => {
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
        const monthKey = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
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

    // Additional filtering for completed widget (current month only)
    if (activeWidget === 'completed') {
      const currentDate = new Date();
      const currentMonth = currentDate.getUTCMonth();
      const currentYear = currentDate.getUTCFullYear();
      
      result = result.filter(c => {
        const customerDate = new Date(c.updated_at || c.created_at || '');
        const customerMonth = customerDate.getUTCMonth();
        const customerYear = customerDate.getUTCFullYear();
        
        return customerMonth === currentMonth && customerYear === currentYear;
      });
    } else if (activeWidget === 'revenue') {
      // For regular users: ALWAYS filter to current month
      if (!isAdmin) {
        const currentDate = new Date();
        const currentMonth = currentDate.getUTCMonth();
        const currentYear = currentDate.getUTCFullYear();
        
        result = result.filter(c => {
          const customerDate = new Date(c.updated_at || c.created_at || '');
          const customerMonth = customerDate.getUTCMonth();
          const customerYear = customerDate.getUTCFullYear();
          
          return customerMonth === currentMonth && customerYear === currentYear;
        });
      }
      // For admins: Apply selected months filter if provided
      else if (revenueSelectedMonths && revenueSelectedMonths.length > 0) {
        result = result.filter(c => {
          const dateField = c.updated_at || c.created_at;
          if (!dateField) return false;
          
          const customerDate = new Date(dateField);
          const monthKey = `${customerDate.getUTCFullYear()}-${customerDate.getUTCMonth()}`;
          return revenueSelectedMonths.includes(monthKey);
        });
      }
      // For admins with no selection: show all-time (no additional filtering)
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
        const monthKey = `${customerDate.getUTCFullYear()}-${customerDate.getUTCMonth()}`;
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