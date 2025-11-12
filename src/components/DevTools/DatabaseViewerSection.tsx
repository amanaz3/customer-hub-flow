import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Key, Link2, Star, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';

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
  columnTypes: Record<string, string>;
}

export function DatabaseViewerSection() {
  const [selectedTable, setSelectedTable] = useState<string>('account_applications');
  const [tableData, setTableData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [metadata, setMetadata] = useState<TableMetadata>({
    primaryKeys: [],
    foreignKeys: [],
    uniqueKeys: [],
    columnTypes: {}
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

      // Fetch column types
      const { data: typeData } = await supabase.rpc('get_table_column_types' as any, {
        p_table_name: tableName
      }) as any;

      // Extract unique key columns (only single-column unique indexes)
      const uniqueKeys = idxData
        ?.filter((idx: any) => idx.is_unique && !idx.column_names.includes(','))
        .map((idx: any) => idx.column_names.trim()) || [];

      // Build column types map
      const columnTypes: Record<string, string> = {};
      typeData?.forEach((row: any) => {
        columnTypes[row.column_name] = row.data_type;
      });

      setMetadata({
        primaryKeys: pkData?.map((row: any) => row.column_name) || [],
        foreignKeys: fkData?.map((row: any) => ({
          column: row.column_name,
          foreignTable: row.foreign_table_name,
          foreignColumn: row.foreign_column_name
        })) || [],
        uniqueKeys,
        columnTypes
      });
    } catch (error) {
      console.error('Error fetching table metadata:', error);
      setMetadata({ primaryKeys: [], foreignKeys: [], uniqueKeys: [], columnTypes: {} });
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

  const getTypeColor = (dataType: string): string => {
    const type = dataType.toLowerCase();
    if (type === 'uuid') return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
    if (type.includes('timestamp') || type.includes('date')) return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
    if (type.includes('text') || type.includes('varchar') || type.includes('char')) return 'bg-green-500/10 text-green-700 dark:text-green-400';
    if (type.includes('int') || type.includes('numeric') || type.includes('decimal') || type.includes('float')) return 'bg-orange-500/10 text-orange-700 dark:text-orange-400';
    if (type === 'boolean') return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
    if (type === 'jsonb' || type === 'json') return 'bg-pink-500/10 text-pink-700 dark:text-pink-400';
    if (type === 'user-defined') return 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400';
    return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
  };

  const formatValue = (value: any): string => {
    if (value === null) return 'NULL';
    if (value === undefined) return 'UNDEFINED';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return String(value);
  };

  const filteredData = tableData.filter(row => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return columns.some(column => {
      const value = formatValue(row[column]).toLowerCase();
      return value.includes(searchLower);
    });
  });

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

      {selectedTable && tableData.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search in table data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {selectedTable && (
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Total Rows:</span>
            <Badge variant="secondary">{rowCount.toLocaleString()}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Showing:</span>
            <Badge variant="secondary">{tableData.length.toLocaleString()} rows</Badge>
          </div>
          {searchTerm && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Filtered:</span>
              <Badge variant="secondary">{filteredData.length.toLocaleString()} rows</Badge>
            </div>
          )}
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
      ) : filteredData.length > 0 ? (
        <ScrollArea className="h-[400px] rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => {
                  const isPK = isPrimaryKey(column);
                  const fk = getForeignKey(column);
                  const isUnique = isUniqueKey(column);
                  const dataType = metadata.columnTypes[column] || 'unknown';
                  
                  return (
                    <TableHead key={column} className="font-semibold">
                      <TooltipProvider>
                        <div className="flex flex-col gap-1">
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
                          <Badge 
                            variant="outline" 
                            className={`text-xs font-mono ${getTypeColor(dataType)}`}
                          >
                            {dataType}
                          </Badge>
                        </div>
                      </TooltipProvider>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((row, rowIndex) => (
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
      ) : searchTerm && tableData.length > 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No results found for "{searchTerm}"
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Select a table to view its data
        </div>
      )}
    </div>
  );
}
