import React, { memo, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SecureAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Mail, Phone, FileText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { formatCustomerReferenceWithPrefix } from '@/utils/referenceNumberFormatter';
import LiveAssistantPanel from '@/components/LiveAssistant/LiveAssistantPanel';

interface CustomerWithStats {
  id: string;
  name: string;
  company: string;
  email: string;
  mobile: string;
  reference_number: number;
  created_at: string;
  updated_at: string;
  application_count: number;
  last_activity: string;
}

const LiveAssistant = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [user?.id, isAdmin]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      
      // Fetch distinct customers with application counts
      let query = supabase
        .from('customers')
        .select(`
          id,
          name,
          company,
          email,
          mobile,
          reference_number,
          created_at,
          updated_at
        `)
        .order('updated_at', { ascending: false });

      // For non-admin users, filter by user_id
      if (!isAdmin && user?.id) {
        query = query.eq('user_id', user.id);
      }

      const { data: customersData, error: customersError } = await query;
      if (customersError) throw customersError;

      // Get application counts for each customer
      const customersWithStats = await Promise.all(
        (customersData || []).map(async (customer) => {
          const { count } = await supabase
            .from('account_applications')
            .select('*', { count: 'exact', head: true })
            .eq('customer_id', customer.id);

          return {
            ...customer,
            application_count: count || 0,
            last_activity: customer.updated_at
          };
        })
      );

      setCustomers(customersWithStats);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load customers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = searchTerm === '' || 
        customer.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [customers, searchTerm]);

  // Calculate max reference number for formatting
  const maxReferenceNumber = useMemo(() => 
    Math.max(...customers.map(c => c.reference_number), 0),
    [customers]
  );

  const handleReplySelected = (text: string) => {
    toast({
      title: "Reply Selected",
      description: text,
    });
  };

  const handleSaveToCRM = () => {
    toast({
      title: "Saved to CRM",
      description: "Call summary has been saved successfully.",
    });
  };

  if (loading) {
    return <div className="p-8 text-center">Loading customers...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main Content - Customer List */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {isAdmin ? 'All Customers' : 'My Customers'}
            </h1>
            <p className="text-muted-foreground">
              {isAdmin 
                ? 'Manage all customer companies' 
                : 'View and manage your customers'
              }
            </p>
          </div>
        </div>

        <Input
          placeholder="Search by company, name, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:max-w-sm"
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Customers ({filteredCustomers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead># Applications</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-mono font-bold text-sm text-primary">
                        {formatCustomerReferenceWithPrefix(customer.reference_number, maxReferenceNumber, customer.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {customer.company}
                        </div>
                      </TableCell>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {customer.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {customer.mobile}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {customer.application_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(customer.last_activity).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/customers/${customer.id}`)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Live Assistant */}
      <LiveAssistantPanel 
        onReplySelected={handleReplySelected}
        onSaveToCRM={handleSaveToCRM}
      />
    </div>
  );
};

export default memo(LiveAssistant);
