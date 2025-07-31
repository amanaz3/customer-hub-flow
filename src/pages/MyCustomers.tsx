import React, { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useCustomers } from '@/contexts/CustomerContext';
import { Customer } from '@/types/customer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Search, Users } from 'lucide-react';
import { toast } from 'sonner';

const MyCustomers = () => {
  const { user, isAdmin } = useAuth();
  const { customers, getCustomersByUserId } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');

  // Get customers based on user role
  const userCustomers = useMemo(() => {
    return isAdmin ? customers : getCustomersByUserId(user?.id || '');
  }, [customers, isAdmin, user?.id, getCustomersByUserId]);

  // Filter customers based on search term
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return userCustomers;
    
    const searchLower = searchTerm.toLowerCase();
    return userCustomers.filter(customer =>
      customer.name.toLowerCase().includes(searchLower) ||
      customer.company.toLowerCase().includes(searchLower) ||
      customer.mobile.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower)
    );
  }, [userCustomers, searchTerm]);

  const handleExportData = () => {
    if (filteredCustomers.length === 0) {
      toast.error('No customer data to export');
      return;
    }

    // Prepare CSV data
    const headers = ['Customer Name', 'Company Name', 'Phone Number', 'Email', 'Status', 'Lead Source', 'License Type', 'Amount'];
    const csvData = filteredCustomers.map(customer => [
      customer.name,
      customer.company,
      customer.mobile,
      customer.email,
      customer.status,
      customer.leadSource,
      customer.licenseType,
      customer.amount?.toString() || '0'
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `customer_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${filteredCustomers.length} customer records`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            My Customers
          </h1>
          <p className="text-muted-foreground">
            Manage and export your customer information
          </p>
        </div>
        <Button
          onClick={handleExportData}
          className="mt-4 md:mt-0"
          disabled={filteredCustomers.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Export Data ({filteredCustomers.length})
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, company, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchTerm && (
            <div className="mt-2 text-sm text-muted-foreground">
              Found {filteredCustomers.length} customer(s) matching "{searchTerm}"
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Directory</CardTitle>
          <p className="text-sm text-muted-foreground">
            Total: {filteredCustomers.length} customers
          </p>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">
                {searchTerm ? 'No customers found' : 'No customers yet'}
              </p>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Customer information will appear here once you have applications'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>License Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.company}</TableCell>
                      <TableCell>{customer.mobile}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          customer.status === 'Complete' || customer.status === 'Paid'
                            ? 'bg-green-100 text-green-800'
                            : customer.status === 'Rejected'
                            ? 'bg-red-100 text-red-800'
                            : customer.status === 'Draft'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {customer.status}
                        </span>
                      </TableCell>
                      <TableCell>{customer.licenseType}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyCustomers;