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
            customers.map((customer) => (
              <TableRow 
                key={customer.id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => handleRowClick(customer.id)}
              >
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell>{customer.mobile}</TableCell>
                <TableCell>{customer.company}</TableCell>
                <TableCell>{customer.email}</TableCell>
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

export default CustomerTable;
