import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer } from '@/types/customer';
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

interface CustomerTableProps {
  customers: Customer[];
}

const CustomerTable: React.FC<CustomerTableProps> = ({ customers }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-status-draft text-status-draft-foreground';
      case 'Submitted': return 'bg-status-submitted text-status-submitted-foreground';
      case 'Returned': return 'bg-status-returned text-status-returned-foreground';
      case 'Sent to Bank': return 'bg-primary text-primary-foreground';
      case 'Complete': return 'bg-status-complete text-status-complete-foreground';
      case 'Rejected': return 'bg-status-rejected text-status-rejected-foreground';
      case 'Need More Info': return 'bg-severity-warning text-severity-warning-foreground';
      case 'Paid': return 'bg-severity-success text-severity-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleRowClick = (id: string) => {
    navigate(`/customers/${id}`);
  };

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer Name</TableHead>
            <TableHead>Company Name</TableHead>
            <TableHead>Manager</TableHead>
            <TableHead>Lead Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.length > 0 ? (
            customers.map((customer) => (
              <TableRow 
                key={customer.id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => handleRowClick(customer.id)}
              >
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.company}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {customer.user_id ? 'Manager' : 'System'}
                </TableCell>
                <TableCell>{customer.leadSource}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(customer.status)}>
                    {customer.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(customer.amount)}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                No customers found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CustomerTable;
