
import React, { memo, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Customer } from '@/contexts/CustomerContext';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';


interface OptimizedCustomerTableProps {
  customers: Customer[];
  onDataChange?: () => void;
}

// Hook to fetch user information
const useUserInfo = (userId?: string) => {
  return useQuery({
    queryKey: ['user-info', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', userId)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!userId
  });
};

// Component to display submitted by information
const SubmittedByCell = memo(({ userId }: { userId?: string }) => {
  const { data: userInfo } = useUserInfo(userId);
  
  if (!userInfo) {
    return <span className="text-muted-foreground text-sm">Unknown</span>;
  }
  
  return (
    <div className="text-sm">
      <div className="font-medium">{userInfo.name}</div>
      <div className="text-muted-foreground text-xs">{userInfo.email}</div>
    </div>
  );
});

SubmittedByCell.displayName = 'SubmittedByCell';

// Product selector component for inline editing
const ProductSelector = memo(({ customer, onUpdate }: { 
  customer: Customer; 
  onUpdate: () => void;
}) => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch all active products
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });
  
  // Get product name for display
  const selectedProduct = products.find(p => p.id === customer.product_id);
  
  const updateProductMutation = useMutation({
    mutationFn: async (productId: string | null) => {
      const { error } = await supabase
        .from('customers')
        .update({ 
          product_id: productId === 'none' ? null : productId,
          updated_at: new Date().toISOString()
        })
        .eq('id', customer.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onUpdate();
      toast({
        title: "Success",
        description: "Product updated successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update product: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  const handleProductChange = (value: string) => {
    updateProductMutation.mutate(value === 'none' ? null : value);
  };
  
  // Stop event propagation to prevent row click
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  
  if (!isAdmin) {
    return (
      <div className="text-sm">
        {selectedProduct ? selectedProduct.name : 'No product'}
      </div>
    );
  }
  
  return (
    <div onClick={handleClick} className="min-w-[120px]">
      <Select
        value={customer.product_id || 'none'}
        onValueChange={handleProductChange}
        disabled={updateProductMutation.isPending}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Select product" />
        </SelectTrigger>
        <SelectContent className="bg-popover/95 backdrop-blur-sm border border-border z-50">
          <SelectItem value="none">No product</SelectItem>
          {products.map((product) => (
            <SelectItem key={product.id} value={product.id}>
              <div className="flex flex-col">
                <span className="font-medium">{product.name}</span>
                {product.description && (
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {product.description}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

ProductSelector.displayName = 'ProductSelector';

// Memoized status badge component
const StatusBadge = memo(({ status }: { status: string }) => {
  const statusColor = useMemo(() => {
    switch (status) {
      case 'Draft': return 'bg-gray-500 text-white';
      case 'Submitted': return 'bg-blue-500 text-white';
      case 'Returned': return 'bg-orange-500 text-white';
      case 'Sent to Bank': return 'bg-purple-500 text-white';
      case 'Complete': return 'bg-green-500 text-white';
      case 'Rejected': return 'bg-red-500 text-white';
      case 'Need More Info': return 'bg-yellow-500 text-white';
      case 'Paid': return 'bg-emerald-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  }, [status]);

  return (
    <Badge className={statusColor}>
      {status}
    </Badge>
  );
});

StatusBadge.displayName = 'StatusBadge';

// Memoized table row component
const CustomerRow = memo(({ customer, onClick, onUpdate }: { 
  customer: Customer; 
  onClick: (id: string) => void;
  onUpdate: () => void;
}) => {
  const handleClick = (e: React.MouseEvent) => {
    onClick(customer.id);
  };
  
  return (
    <TableRow 
      className="cursor-pointer hover:bg-slate-50"
      onClick={handleClick}
    >
      <TableCell className="font-medium">{customer.name}</TableCell>
      <TableCell>
        <ProductSelector customer={customer} onUpdate={onUpdate} />
      </TableCell>
      <TableCell>{customer.mobile}</TableCell>
      <TableCell>{customer.company}</TableCell>
      <TableCell>
        <SubmittedByCell userId={customer.user_id} />
      </TableCell>
      <TableCell>
        <StatusBadge status={customer.status} />
      </TableCell>
      <TableCell className="text-right">
        {formatCurrency(customer.amount)}
      </TableCell>
    </TableRow>
  );
});

CustomerRow.displayName = 'CustomerRow';

const OptimizedCustomerTable: React.FC<OptimizedCustomerTableProps> = ({ customers, onDataChange }) => {
  const navigate = useNavigate();

  const handleRowClick = useMemo(() => 
    (id: string) => navigate(`/customers/${id}`), 
    [navigate]
  );

  // Set up real-time subscription for customer updates
  useRealtimeSubscription({
    table: 'customers',
    onUpdate: () => {
      console.log('Customer data updated, refreshing...');
      if (onDataChange) {
        onDataChange();
      }
    }
  });

  const tableRows = useMemo(() => 
    customers.map((customer) => (
      <CustomerRow 
        key={customer.id}
        customer={customer}
        onClick={handleRowClick}
        onUpdate={() => onDataChange && onDataChange()}
      />
    )), 
    [customers, handleRowClick, onDataChange]
  );

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer Name</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Mobile</TableHead>
            <TableHead>Company Name</TableHead>
            <TableHead>Submitted by</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.length > 0 ? (
            tableRows
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                No customers found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default memo(OptimizedCustomerTable);
