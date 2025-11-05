import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Database, RefreshCw, Download } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const AVAILABLE_TABLES = [
  'account_applications',
  'application_documents',
  'application_messages',
  'application_owners',
  'customers',
  'documents',
  'status_changes',
  'comments',
  'profiles',
  'notifications',
  'products',
  'service_types',
  'deals',
  'customer_services',
  'banks',
  'crm_configurations',
  'crm_sync_logs',
  'monthly_targets',
  'arr_targets',
  'logs',
];

const DatabaseViewer: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<string>('account_applications');
  const [tableData, setTableData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [rowCount, setRowCount] = useState(0);
  const [limit] = useState(50);
  const { toast } = useToast();

  const fetchTableData = async (tableName: string) => {
    setIsLoading(true);
    try {
      // Fetch data with limit
      const { data, error, count } = await supabase
        .from(tableName as any)
        .select('*', { count: 'exact' })
        .limit(limit)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTableData(data || []);
      setRowCount(count || 0);

      // Extract column names from first row
      if (data && data.length > 0) {
        setColumns(Object.keys(data[0]));
      } else {
        setColumns([]);
      }
    } catch (error: any) {
      console.error('Error fetching table data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch table data',
        variant: 'destructive',
      });
      setTableData([]);
      setColumns([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable);
    }
  }, [selectedTable]);

  const handleRefresh = () => {
    fetchTableData(selectedTable);
    toast({
      title: 'Refreshed',
      description: 'Table data has been refreshed',
    });
  };

  const handleExportCSV = () => {
    if (tableData.length === 0) {
      toast({
        title: 'No Data',
        description: 'There is no data to export',
        variant: 'destructive',
      });
      return;
    }

    // Create CSV content
    const headers = columns.join(',');
    const rows = tableData.map(row => 
      columns.map(col => {
        const value = row[col];
        // Escape commas and quotes in values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Exported',
      description: `${selectedTable} data exported successfully`,
    });
  };

  const filteredData = tableData.filter(row =>
    searchTerm === '' || 
    Object.values(row).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    return String(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Database className="h-8 w-8" />
          Database Viewer
        </h1>
        <p className="text-muted-foreground">
          Browse and explore database tables (Admin only)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Table Selection</CardTitle>
          <CardDescription>
            Select a table to view its data. Showing up to {limit} most recent records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Select a table" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_TABLES.map((table) => (
                  <SelectItem key={table} value={table}>
                    {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search in table..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>

              <Button
                variant="outline"
                onClick={handleExportCSV}
                disabled={isLoading || tableData.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Badge variant="secondary">
              Total Rows: {rowCount}
            </Badge>
            <Badge variant="secondary">
              Showing: {filteredData.length}
            </Badge>
            <Badge variant="secondary">
              Columns: {columns.length}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{selectedTable}</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading data...' : `Viewing ${filteredData.length} record(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No data found in this table
            </div>
          ) : (
            <ScrollArea className="h-[600px] w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead key={col} className="font-semibold whitespace-nowrap">
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {columns.map((col) => (
                        <TableCell key={col} className="font-mono text-xs whitespace-nowrap">
                          {formatValue(row[col])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseViewer;
