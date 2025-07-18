import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Filter, AlertTriangle, Bug, Wifi, Database, User, Clock, Download } from 'lucide-react';
import ErrorTracker from '@/utils/errorTracking';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  source?: string;
  stack?: string;
  user?: string;
  context?: any;
}

const ErrorLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('24h');

  // Get tracked errors from ErrorTracker
  const trackedErrors = ErrorTracker.exportData();

  // Simulate console logs (in a real app, you'd get these from your logging service)
  const consoleLogs: LogEntry[] = useMemo(() => [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'ProtectedRoute check: Authentication successful',
      source: 'src/components/Security/ProtectedRoute.tsx',
      user: 'support@amanafinanz.com',
      context: { isAuthenticated: true, isAdmin: true }
    },
    {
      id: '2', 
      timestamp: new Date(Date.now() - 300000).toISOString(),
      level: 'info',
      message: 'MainLayout DOM mounting check - component rendered',
      source: 'src/components/Layout/MainLayout.tsx',
      user: 'support@amanafinanz.com'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      level: 'info',
      message: 'Auth state changed: SIGNED_IN',
      source: 'src/hooks/useAuthOptimized.ts',
      user: 'support@amanafinanz.com'
    }
  ], []);

  // Simulate Supabase logs (from the network requests we can see)
  const supabaseLogs: LogEntry[] = useMemo(() => [
    {
      id: 'sb-1',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      level: 'info',
      message: 'Database query successful: status_changes',
      source: 'Supabase REST API',
      context: { table: 'status_changes', operation: 'SELECT', status: 200 }
    },
    {
      id: 'sb-2',
      timestamp: new Date(Date.now() - 180000).toISOString(),
      level: 'info', 
      message: 'Database query successful: comments',
      source: 'Supabase REST API',
      context: { table: 'comments', operation: 'SELECT', status: 200 }
    },
    {
      id: 'sb-3',
      timestamp: new Date(Date.now() - 240000).toISOString(),
      level: 'info',
      message: 'Database query successful: documents',
      source: 'Supabase REST API',
      context: { table: 'documents', operation: 'SELECT', status: 200 }
    }
  ], []);

  // Convert tracked errors to log format
  const trackedErrorLogs: LogEntry[] = trackedErrors.errors.map((error, index) => ({
    id: `tracked-${index}`,
    timestamp: new Date(error.timestamp).toISOString(),
    level: 'error' as const,
    message: error.message,
    source: error.context.page || 'Unknown',
    user: error.context.userId,
    context: error.context
  }));

  // Combine all logs
  const allLogs = [...consoleLogs, ...supabaseLogs, ...trackedErrorLogs]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filter logs based on search and filters
  const filteredLogs = allLogs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    
    const now = Date.now();
    const logTime = new Date(log.timestamp).getTime();
    let matchesDate = true;
    
    switch (dateRange) {
      case '1h':
        matchesDate = (now - logTime) <= (60 * 60 * 1000);
        break;
      case '24h':
        matchesDate = (now - logTime) <= (24 * 60 * 60 * 1000);
        break;
      case '7d':
        matchesDate = (now - logTime) <= (7 * 24 * 60 * 60 * 1000);
        break;
    }
    
    return matchesSearch && matchesLevel && matchesDate;
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Bug className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getLevelBadge = (level: string) => {
    const variants: Record<string, any> = {
      'error': 'destructive',
      'warning': 'secondary',
      'info': 'outline'
    };
    return <Badge variant={variants[level] || 'outline'}>{level.toUpperCase()}</Badge>;
  };

  const getSourceIcon = (source?: string) => {
    if (source?.includes('Supabase')) return <Database className="h-4 w-4" />;
    if (source?.includes('API') || source?.includes('network')) return <Wifi className="h-4 w-4" />;
    return <User className="h-4 w-4" />;
  };

  const exportLogs = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      totalLogs: filteredLogs.length,
      logs: filteredLogs,
      trackedErrorSummary: trackedErrors.summary
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Error Logs Dashboard</h1>
          <p className="text-muted-foreground">Monitor application errors and system logs</p>
        </div>
        <Button onClick={exportLogs} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Errors</p>
                <p className="text-2xl font-bold text-destructive">{trackedErrors.summary.totalErrors}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recent (1h)</p>
                <p className="text-2xl font-bold text-yellow-500">{trackedErrors.summary.recentErrors}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Console Logs</p>
                <p className="text-2xl font-bold">{consoleLogs.length}</p>
              </div>
              <Bug className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">DB Queries</p>
                <p className="text-2xl font-bold text-green-500">{supabaseLogs.length}</p>
              </div>
              <Database className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <Input 
                placeholder="Search logs..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Level</label>
              <select 
                className="w-full p-2 border rounded-md bg-background"
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
              >
                <option value="all">All Levels</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Time Range</label>
              <select 
                className="w-full p-2 border rounded-md bg-background"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Display */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Logs ({filteredLogs.length})</TabsTrigger>
          <TabsTrigger value="errors">Errors ({filteredLogs.filter(l => l.level === 'error').length})</TabsTrigger>
          <TabsTrigger value="console">Console ({consoleLogs.length})</TabsTrigger>
          <TabsTrigger value="database">Database ({supabaseLogs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-2">
          {filteredLogs.length === 0 ? (
            <Alert>
              <AlertDescription>No logs found matching the current filters.</AlertDescription>
            </Alert>
          ) : (
            filteredLogs.map((log) => (
              <Card key={log.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {getLevelIcon(log.level)}
                      {getLevelBadge(log.level)}
                      <span className="text-sm text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      {log.user && (
                        <Badge variant="outline">{log.user}</Badge>
                      )}
                    </div>
                    
                    <p className="font-medium">{log.message}</p>
                    
                    {log.source && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {getSourceIcon(log.source)}
                        <span>{log.source}</span>
                      </div>
                    )}
                    
                    {log.context && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-muted-foreground">Context</summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                          {JSON.stringify(log.context, null, 2)}
                        </pre>
                      </details>
                    )}
                    
                    {log.stack && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-muted-foreground">Stack Trace</summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                          {log.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="errors">
          {/* Same structure but filtered for errors only */}
          {filteredLogs.filter(l => l.level === 'error').map((log) => (
            <Card key={log.id} className="p-4 border-destructive">
              {/* Same log display structure */}
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {getLevelIcon(log.level)}
                    {getLevelBadge(log.level)}
                    <span className="text-sm text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    {log.user && <Badge variant="outline">{log.user}</Badge>}
                  </div>
                  <p className="font-medium">{log.message}</p>
                  {log.source && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {getSourceIcon(log.source)}
                      <span>{log.source}</span>
                    </div>
                  )}
                  {log.context && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground">Context</summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                        {JSON.stringify(log.context, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="console">
          {consoleLogs.map((log) => (
            <Card key={log.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {getLevelIcon(log.level)}
                    {getLevelBadge(log.level)}
                    <span className="text-sm text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    {log.user && <Badge variant="outline">{log.user}</Badge>}
                  </div>
                  <p className="font-medium">{log.message}</p>
                  {log.source && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{log.source}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="database">
          {supabaseLogs.map((log) => (
            <Card key={log.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {getLevelIcon(log.level)}
                    {getLevelBadge(log.level)}
                    <span className="text-sm text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="font-medium">{log.message}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Database className="h-4 w-4" />
                    <span>{log.source}</span>
                  </div>
                  {log.context && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-muted-foreground">Query Details</summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                        {JSON.stringify(log.context, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Top Errors Summary */}
      {trackedErrors.summary.topErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Errors (Last Hour)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {trackedErrors.summary.topErrors.map((error, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="font-medium truncate">{error.message}</span>
                  <Badge variant="destructive">{error.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ErrorLogs;