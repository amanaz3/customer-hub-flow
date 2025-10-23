import React, { memo, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SecureAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ApplicationWithCustomer {
  id: string;
  customer_id: string;
  status: string;
  application_type: string;
  created_at: string;
  updated_at: string;
  application_data: any;
  customer: {
    id: string;
    name: string;
    company: string;
    email: string;
    mobile: string;
  };
}

const ApplicationsList = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [applications, setApplications] = useState<ApplicationWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchApplications();
  }, [user?.id, isAdmin]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('account_applications')
        .select(`
          *,
          customer:customers!customer_id (
            id,
            name,
            company,
            email,
            mobile
          )
        `)
        .order('created_at', { ascending: false });

      // For non-admin users, filter by their customers
      if (!isAdmin && user?.id) {
        query = query.eq('customers.user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load applications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const matchesSearch = searchTerm === '' || 
        app.customer?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.application_type?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500',
    submitted: 'bg-blue-500',
    under_review: 'bg-yellow-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
    completed: 'bg-purple-500',
  };

  if (loading) {
    return <div className="p-8 text-center">Loading applications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isAdmin ? 'All Applications' : 'My Applications'}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? 'Manage all customer applications' 
              : 'View and manage your applications'
            }
          </p>
        </div>
        <Button
          onClick={() => navigate('/applications/new')}
          className="mt-4 md:mt-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Application
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search by company, contact, or type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Applications ({filteredApplications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application Type</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No applications found
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">
                      {app.application_type?.replace('_', ' ').toUpperCase() || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => navigate(`/customers/${app.customer?.id}`)}
                      >
                        <Building2 className="h-4 w-4 mr-1" />
                        {app.customer?.company || 'N/A'}
                      </Button>
                    </TableCell>
                    <TableCell>{app.customer?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[app.status] || 'bg-gray-500'}>
                        {app.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      ${app.application_data?.amount?.toLocaleString() || '0'}
                    </TableCell>
                    <TableCell>
                      {new Date(app.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/applications/${app.id}`)}
                      >
                        View
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
  );
};

export default memo(ApplicationsList);
