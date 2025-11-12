import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Key, Link2, Star } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const AVAILABLE_TABLES = [
  'account_applications',
  'application_status_changes',
  'completion_date_history',
  'customers',
  'documents',
  'comments',
  'profiles',
  'notifications',
  'products',
  'deals',
  'customer_services',
];

interface TableMetadata {
  primaryKeys: string[];
  foreignKeys: Array<{
    column: string;
    foreignTable: string;
    foreignColumn: string;
  }>;
  uniqueKeys: string[];
}

export function DatabaseViewerSection() {
  const [selectedTable, setSelectedTable] = useState<string>('account_applications');
  const [tableData, setTableData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [metadata, setMetadata] = useState<TableMetadata>({
    primaryKeys: [],
    foreignKeys: [],
    uniqueKeys: []
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

      // Fetch unique indexes
      const { data: idxData } = await supabase.rpc('get_table_indexes' as any, {
        p_table_name: tableName
      }) as any;

      // Extract unique key columns (only single-column unique indexes)
      const uniqueKeys = idxData
        ?.filter((idx: any) => idx.is_unique && !idx.column_names.includes(','))
        .map((idx: any) => idx.column_names.trim()) || [];

      setMetadata({
        primaryKeys: pkData?.map((row: any) => row.column_name) || [],
        foreignKeys: fkData?.map((row: any) => ({
          column: row.column_name,
          foreignTable: row.foreign_table_name,
          foreignColumn: row.foreign_column_name
        })) || [],
        uniqueKeys
      });
    } catch (error) {
      console.error('Error fetching table metadata:', error);
      setMetadata({ primaryKeys: [], foreignKeys: [], uniqueKeys: [] });
    }
  };

  const fetchTableData = async (tableName: string) => {
    setIsLoading(true);
    try {
      const { data, error, count } = await (supabase as any)
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(50);

      if (error) throw error;

      setTableData(data || []);
      setRowCount(count || 0);
      
      if (data && data.length > 0) {
        setColumns(Object.keys(data[0]));
      } else {
        setColumns([]);
      }

      toast({
        title: "Success",
        description: `Loaded ${data?.length || 0} rows from ${tableName}`,
      });
    } catch (error: any) {
      console.error('Error fetching table data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch table data",
        variant: "destructive",
      });
      setTableData([]);
      setColumns([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTableChange = (tableName: string) => {
    setSelectedTable(tableName);
    fetchTableMetadata(tableName);
    fetchTableData(tableName);
  };

  const handleRefresh = () => {
    fetchTableMetadata(selectedTable);
    fetchTableData(selectedTable);
  };

  const isPrimaryKey = (column: string) => metadata.primaryKeys.includes(column);
  
  const getForeignKey = (column: string) => 
    metadata.foreignKeys.find(fk => fk.column === column);

  const isUniqueKey = (column: string) => metadata.uniqueKeys.includes(column);

  const formatValue = (value: any): string => {
    if (value === null) return 'NULL';
    if (value === undefined) return 'UNDEFINED';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return String(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Select value={selectedTable} onValueChange={handleTableChange}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select a table" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-md z-50">
              {AVAILABLE_TABLES.map((table) => (
                <SelectItem key={table} value={table}>
                  {table}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isLoading}
          variant="outline"
          size="icon"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {selectedTable && (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Total Rows:</span>
            <Badge variant="secondary">{rowCount.toLocaleString()}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Showing:</span>
            <Badge variant="secondary">{tableData.length.toLocaleString()} rows</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Columns:</span>
            <Badge variant="secondary">{columns.length}</Badge>
          </div>
          {rowCount > 50 && (
            <span className="text-xs text-muted-foreground">(limited to 50 rows)</span>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : tableData.length > 0 ? (
        <ScrollArea className="h-[400px] rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => {
                  const isPK = isPrimaryKey(column);
                  const fk = getForeignKey(column);
                  const isUnique = isUniqueKey(column);
                  
                  return (
                    <TableHead key={column} className="font-semibold">
                      <TooltipProvider>
                        <div className="flex items-center gap-2">
                          <span>{column}</span>
                          {isPK && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Key className="h-3 w-3 text-yellow-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Primary Key</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {fk && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link2 className="h-3 w-3 text-blue-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Foreign Key → {fk.foreignTable}.{fk.foreignColumn}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {isUnique && !isPK && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Star className="h-3 w-3 text-purple-500" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Unique Key</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TooltipProvider>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column) => (
                    <TableCell key={column} className="max-w-xs truncate">
                      {formatValue(row[column])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Select a table to view its data
        </div>
      )}
    </div>
  );
}
