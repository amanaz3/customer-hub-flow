import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Download, RefreshCw, Filter, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface LogEntry {
  id: string;
  message: string;
  level: string;
  component?: string | null;
  user_id?: string | null;
  user_email?: string | null;
  stack_trace?: string | null;
  created_at: string;
  source: 'frontend' | 'backend' | 'database';
}

interface DatabaseLogEntry {
  id: string;
  error_severity: string;
  event_message: string;
  identifier: string;
  timestamp: number;
}

interface ErrorSummary {
  totalErrors: number;
  errorsByLevel: Record<string, number>;
  errorsBySource: Record<string, number>;
  recentErrors: number;
  topErrors: Array<{ message: string; count: number }>;
}

const ErrorLogCollector: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [dbLogs, setDbLogs] = useState<DatabaseLogEntry[]>([]);
  const [summary, setSummary] = useState<ErrorSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    level: 'all',
    source: 'all',
    timeRange: '24h',
    search: ''
  });
  const { toast } = useToast();

  const loadApplicationLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const mappedLogs: LogEntry[] = data?.map(log => ({
        ...log,
        source: 'frontend' as const
      })) || [];

      return mappedLogs;
    } catch (error) {
      console.error('Error loading application logs:', error);
      return [];
    }
  };

  const loadDatabaseLogs = async () => {
    try {
      // For now, return empty array since postgres_logs table doesn't exist in current schema
      // In production, this would query Supabase analytics or postgres logs
      console.log('Database logs collection not implemented yet');
      return [];
    } catch (error) {
      console.warn('Database logs not accessible:', error);
      return [];
    }
  };

  const loadAllLogs = async () => {
    setLoading(true);
    try {
      const [appLogs, databaseLogs] = await Promise.all([
        loadApplicationLogs(),
        loadDatabaseLogs()
      ]);

      setLogs(appLogs);
      setDbLogs(databaseLogs as DatabaseLogEntry[]);
      generateSummary(appLogs, databaseLogs as DatabaseLogEntry[]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = (appLogs: LogEntry[], databaseLogs: DatabaseLogEntry[]) => {
    const now = Date.now();
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };
    
    const cutoff = now - timeRanges[filters.timeRange as keyof typeof timeRanges];

    const recentAppLogs = appLogs.filter(log => 
      new Date(log.created_at).getTime() > cutoff
    );

    const recentDbLogs = databaseLogs.filter(log => 
      log.timestamp > cutoff * 1000 // Convert to microseconds
    );

    const errorsByLevel = recentAppLogs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorsBySource = {
      frontend: recentAppLogs.length,
      backend: 0, // Can be enhanced with actual backend logs
      database: recentDbLogs.filter(log => 
        log.error_severity === 'ERROR' || log.error_severity === 'FATAL'
      ).length
    };

    const topErrors = Object.entries(
      recentAppLogs.reduce((acc, log) => {
        const shortMessage = log.message.substring(0, 100);
        acc[shortMessage] = (acc[shortMessage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([message, count]) => ({ message, count }));

    setSummary({
      totalErrors: recentAppLogs.length + recentDbLogs.length,
      errorsByLevel,
      errorsBySource,
      recentErrors: recentAppLogs.filter(log => 
        new Date(log.created_at).getTime() > (now - 60 * 60 * 1000)
      ).length,
      topErrors
    });
  };

  const getFilteredLogs = () => {
    let filtered = logs;

    if (filters.level !== 'all') {
      filtered = filtered.filter(log => log.level === filters.level);
    }

    if (filters.source !== 'all') {
      filtered = filtered.filter(log => log.source === filters.source);
    }

    if (filters.search) {
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.component?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    const now = Date.now();
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      'all': Infinity
    };
    
    const cutoff = now - timeRanges[filters.timeRange as keyof typeof timeRanges];
    filtered = filtered.filter(log => 
      new Date(log.created_at).getTime() > cutoff
    );

    return filtered;
  };

  const exportLogs = () => {
    const filteredLogs = getFilteredLogs();
    const exportData = {
      summary,
      applicationLogs: filteredLogs,
      databaseLogs: dbLogs,
      exportedAt: new Date().toISOString(),
      filters
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Error logs exported successfully"
    });
  };

  const getLevelBadgeVariant = (level: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (level.toLowerCase()) {
      case 'fatal':
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
      case 'debug':
        return 'outline';
      default:
        return 'outline';
    }
  };

  useEffect(() => {
    loadAllLogs();
  }, []);

  useEffect(() => {
    if (logs.length > 0 || dbLogs.length > 0) {
      generateSummary(logs, dbLogs);
    }
  }, [filters.timeRange]);

  const filteredLogs = getFilteredLogs();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-destructive">
                {summary.totalErrors}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Errors ({filters.timeRange})
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-500">
                {summary.recentErrors}
              </div>
              <div className="text-sm text-muted-foreground">
                Last Hour
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-1">
                {Object.entries(summary.errorsBySource).map(([source, count]) => (
                  <div key={source} className="flex justify-between text-sm">
                    <span className="capitalize">{source}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="space-y-1">
                {Object.entries(summary.errorsByLevel).map(([level, count]) => (
                  <div key={level} className="flex justify-between text-sm">
                    <span className="capitalize">{level}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Error Log Collector
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                onClick={loadAllLogs} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={exportLogs}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Select value={filters.level} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, level: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="fatal">Fatal</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.source} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, source: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="frontend">Frontend</SelectItem>
                <SelectItem value="backend">Backend</SelectItem>
                <SelectItem value="database">Database</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.timeRange} onValueChange={(value) => 
              setFilters(prev => ({ ...prev, timeRange: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          {/* Log Entries */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading logs...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No logs found matching the current filters
              </div>
            ) : (
              filteredLogs.map((log) => (
                <Card key={log.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={getLevelBadgeVariant(log.level)}>
                          {log.level.toUpperCase()}
                        </Badge>
                        {log.component && (
                          <Badge variant="outline">
                            {log.component}
                          </Badge>
                        )}
                        <Badge variant="secondary">
                          {log.source}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                        </span>
                      </div>
                      
                      <div className="text-sm">
                        <strong>Message:</strong> {log.message}
                      </div>
                      
                      {log.user_email && (
                        <div className="text-sm text-muted-foreground">
                          <strong>User:</strong> {log.user_email}
                        </div>
                      )}
                      
                      {log.stack_trace && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground">
                            Stack trace
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                            {log.stack_trace}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Errors */}
      {summary?.topErrors && summary.topErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Errors ({filters.timeRange})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.topErrors.map((error, index) => (
                <div key={index} className="flex justify-between items-center p-2 border rounded">
                  <span className="text-sm truncate flex-1 mr-4">
                    {error.message}
                  </span>
                  <Badge variant="outline">
                    {error.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ErrorLogCollector;