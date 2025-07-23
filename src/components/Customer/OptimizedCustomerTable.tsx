
import React, { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer } from '@/contexts/CustomerContext';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useCustomers } from '@/contexts/CustomerContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { toast } from "sonner";

interface OptimizedCustomerTableProps {
  customers: Customer[];
  onDataChange?: () => void;
}

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
const CustomerRow = memo(({ customer, onClick, onDelete, showActions }: { 
  customer: Customer; 
  onClick: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}) => {
  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onClick(customer.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && window.confirm(`Are you sure you want to delete ${customer.name}'s application? This action cannot be undone.`)) {
      onDelete(customer.id);
    }
  };
  
  return (
    <TableRow 
      className="cursor-pointer hover:bg-slate-50"
      onClick={handleClick}
    >
      <TableCell className="font-medium">{customer.name}</TableCell>
      <TableCell>{customer.mobile}</TableCell>
      <TableCell>{customer.company}</TableCell>
      <TableCell>{customer.email}</TableCell>
      <TableCell>{customer.leadSource}</TableCell>
      <TableCell>
        <StatusBadge status={customer.status} />
      </TableCell>
      <TableCell className="text-right">
        {formatCurrency(customer.amount)}
      </TableCell>
      {showActions && (
        <TableCell className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-destructive hover:text-destructive"
            aria-label={`Delete ${customer.name}'s application`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
});

CustomerRow.displayName = 'CustomerRow';

const OptimizedCustomerTable: React.FC<OptimizedCustomerTableProps> = ({ customers, onDataChange }) => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { deleteCustomer } = useCustomers();

  const handleRowClick = useMemo(() => 
    (id: string) => navigate(`/customers/${id}`), 
    [navigate]
  );

  const handleDelete = async (id: string) => {
    try {
      await deleteCustomer(id);
      toast.success("Application deleted successfully");
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error("Failed to delete application");
    }
  };

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
        onDelete={isAdmin ? handleDelete : undefined}
        showActions={isAdmin}
      />
    )), 
    [customers, handleRowClick, handleDelete, isAdmin]
  );

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer Name</TableHead>
            <TableHead>Mobile</TableHead>
            <TableHead>Company Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Lead Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            {isAdmin && <TableHead className="text-center">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.length > 0 ? (
            tableRows
          ) : (
            <TableRow>
              <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-6 text-muted-foreground">
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
