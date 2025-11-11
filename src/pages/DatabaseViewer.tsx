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
import { Loader2, Search, Database, RefreshCw, Download, Key, Link as LinkIcon, Zap } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TableMetadata {
  primaryKeys: string[];
  foreignKeys: Array<{
    column: string;
    foreignTable: string;
    foreignColumn: string;
  }>;
  indexes: Array<{
    name: string;
    columns: string[];
    isUnique: boolean;
  }>;
}

const AVAILABLE_TABLES = [
  'account_applications',
  'application_documents',
  'application_messages',
  'application_owners',
  'application_status_changes',
  'completion_date_history',
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
  const [metadata, setMetadata] = useState<TableMetadata>({
    primaryKeys: [],
    foreignKeys: [],
    indexes: []
  });
  const { toast } = useToast();

  const fetchTableMetadata = async (tableName: string) => {
    try {
      // Fetch primary keys
      const { data: pkData } = await supabase.rpc('get_table_primary_keys' as any, {
        p_table_name: tableName
      }) as any;

      // Fetch foreign keys
      const { data: fkData } = await supabase.rpc('get_table_foreign_keys' as any, {
        p_table_name: tableName
      }) as any;

      // Fetch indexes
      const { data: indexData } = await supabase.rpc('get_table_indexes' as any, {
        p_table_name: tableName
      }) as any;

      setMetadata({
        primaryKeys: pkData?.map((row: any) => row.column_name) || [],
        foreignKeys: fkData?.map((row: any) => ({
          column: row.column_name,
          foreignTable: row.foreign_table_name,
          foreignColumn: row.foreign_column_name
        })) || [],
        indexes: indexData?.map((row: any) => ({
          name: row.index_name,
          columns: row.column_names ? row.column_names.split(',') : [],
          isUnique: row.is_unique
        })) || []
      });
    } catch (error) {
      console.error('Error fetching metadata:', error);
      // Fallback: try to infer from column names
      setMetadata({
        primaryKeys: columns.filter(col => col === 'id'),
        foreignKeys: columns
          .filter(col => col.endsWith('_id') && col !== 'id')
          .map(col => ({
            column: col,
            foreignTable: col.replace('_id', '') + 's',
            foreignColumn: 'id'
          })),
        indexes: []
      });
    }
  };

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

  useEffect(() => {
    if (selectedTable && columns.length > 0) {
      fetchTableMetadata(selectedTable);
    }
  }, [selectedTable, columns.length]);

  const handleRefresh = () => {
    fetchTableData(selectedTable);
    if (columns.length > 0) {
      fetchTableMetadata(selectedTable);
    }
    toast({
      title: 'Refreshed',
      description: 'Table data has been refreshed',
    });
  };

  const isColumnPrimaryKey = (columnName: string): boolean => {
    return metadata.primaryKeys.includes(columnName);
  };

  const getColumnForeignKey = (columnName: string) => {
    return metadata.foreignKeys.find(fk => fk.column === columnName);
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
          <Tabs defaultValue="data" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="data">Data</TabsTrigger>
              <TabsTrigger value="structure">Structure</TabsTrigger>
              <TabsTrigger value="indexes">Indexes</TabsTrigger>
            </TabsList>

            <TabsContent value="data" className="mt-4">
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
                        {columns.map((col) => {
                          const isPK = isColumnPrimaryKey(col);
                          const fk = getColumnForeignKey(col);
                          
                          return (
                            <TableHead key={col} className="font-semibold whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {col}
                                {isPK && (
                                  <span title="Primary Key">
                                    <Key className="h-3 w-3 text-yellow-500" />
                                  </span>
                                )}
                                {fk && (
                                  <span title={`Foreign Key: ${fk.foreignTable}.${fk.foreignColumn}`}>
                                    <LinkIcon className="h-3 w-3 text-blue-500" />
                                  </span>
                                )}
                              </div>
                            </TableHead>
                          );
                        })}
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
            </TabsContent>

            <TabsContent value="structure" className="mt-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Key className="h-5 w-5 text-yellow-500" />
                    Primary Keys
                  </h3>
                  {metadata.primaryKeys.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {metadata.primaryKeys.map(pk => (
                        <Badge key={pk} variant="secondary" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                          {pk}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No primary keys detected</p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <LinkIcon className="h-5 w-5 text-blue-500" />
                    Foreign Keys
                  </h3>
                  {metadata.foreignKeys.length > 0 ? (
                    <div className="space-y-2">
                      {metadata.foreignKeys.map((fk, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                          <Badge variant="outline">{fk.column}</Badge>
                          <span className="text-muted-foreground">→</span>
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/20">
                            {fk.foreignTable}.{fk.foreignColumn}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No foreign keys detected</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="indexes" className="mt-4">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-green-500" />
                  Indexes
                </h3>
                {metadata.indexes.length > 0 ? (
                  <div className="space-y-3">
                    {metadata.indexes.map((index, idx) => (
                      <div key={idx} className="p-3 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{index.name}</span>
                          {index.isUnique && (
                            <Badge variant="secondary" className="bg-green-500/10 text-green-700 border-green-500/20">
                              UNIQUE
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {index.columns.map(col => (
                            <Badge key={col} variant="outline" className="text-xs">
                              {col}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No indexes detected</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseViewer;
