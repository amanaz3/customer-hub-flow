
import React, { memo, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer } from '@/contexts/CustomerContext';
import { formatCurrency } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

interface OptimizedCustomerTableProps {
  customers: Customer[];
  onDataChange?: () => void;
}

// Memoized status badge component
const StatusBadge = memo(({ status }: { status: string }) => {
  const statusColor = useMemo(() => {
    switch (status) {
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
const CustomerRow = memo(({ customer, onClick }: { 
  customer: Customer; 
  onClick: (id: string) => void;
}) => {
  const handleClick = () => onClick(customer.id);
  
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
      />
    )), 
    [customers, handleRowClick]
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
