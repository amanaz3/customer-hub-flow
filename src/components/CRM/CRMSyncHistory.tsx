import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { CRMSyncLog } from '@/types/crm';

interface CRMSyncHistoryProps {
  syncLogs: CRMSyncLog[];
  onRefresh: () => void;
}

export const CRMSyncHistory: React.FC<CRMSyncHistoryProps> = ({
  syncLogs,
  onRefresh
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default' as const,
      error: 'destructive' as const,
      pending: 'secondary' as const
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        <div className="flex items-center gap-1">
          {getStatusIcon(status)}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </Badge>
    );
  };

  const formatDuration = (startedAt: string, completedAt?: string) => {
    if (!completedAt) return 'In progress';
    
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const duration = Math.round((end.getTime() - start.getTime()) / 1000);
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.round(duration / 60)}m`;
    return `${Math.round(duration / 3600)}h`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sync History</CardTitle>
            <CardDescription>
              Recent synchronization operations between CRM systems
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {syncLogs.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No sync operations</h3>
            <p className="text-muted-foreground">
              Sync operations will appear here once you start syncing data
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CRM System</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Sync Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Started</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {log.crm_configurations?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {log.crm_configurations?.crm_type || 'Unknown type'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {log.entity_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {log.sync_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(log.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Processed: {log.records_processed}</div>
                        <div className="text-muted-foreground">
                          Success: {log.records_success} • Failed: {log.records_failed}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDuration(log.started_at, log.completed_at)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(log.started_at).toLocaleString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};