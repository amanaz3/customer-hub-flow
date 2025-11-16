import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, DollarSign, TrendingUp, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QuickAddApplicationDialog } from './QuickAddApplicationDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Application } from '@/types/application';

interface ApplicationsListProps {
  applications: Application[];
  customerId: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500',
  submitted: 'bg-blue-500',
  under_review: 'bg-yellow-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  completed: 'bg-purple-500',
};

export const ApplicationsList = ({ applications, customerId }: ApplicationsListProps) => {
  const navigate = useNavigate();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const stats = {
    total: applications.length,
    draft: applications.filter(a => a.status === 'draft').length,
    active: applications.filter(a => ['submitted', 'under_review', 'approved'].includes(a.status)).length,
    completed: applications.filter(a => a.status === 'completed').length,
    totalRevenue: applications
      .filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + (a.application_data.amount || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Applications</CardTitle>
              <CardDescription>
                All applications for this customer
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setQuickAddOpen(true)}>
                <Zap className="h-4 w-4 mr-2" />
                Quick Add
              </Button>
              <Button onClick={() => navigate(`/customers/new?customer=${customerId}`)}>
                New Application
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No applications yet</p>
              <p className="text-sm">Create the first application for this customer</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>License Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">
                      {app.application_type.replace('_', ' ').toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[app.status] || 'bg-gray-500'}>
                        {app.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      ${app.application_data.amount?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>{app.application_data.license_type || '-'}</TableCell>
                    <TableCell>
                      {new Date(app.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(app.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/applications/${app.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <QuickAddApplicationDialog
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        customerId={customerId}
      />
    </div>
  );
};
