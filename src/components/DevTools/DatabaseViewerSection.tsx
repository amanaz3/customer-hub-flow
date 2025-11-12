import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

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

export function DatabaseViewerSection() {
  const [selectedTable, setSelectedTable] = useState<string>('account_applications');
  const [tableData, setTableData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const { toast } = useToast();

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
    fetchTableData(tableName);
  };

  const handleRefresh = () => {
    fetchTableData(selectedTable);
  };

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

      {rowCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">
            Showing {tableData.length} of {rowCount} rows
          </Badge>
          {rowCount > 50 && (
            <span className="text-xs">(limited to 50 rows)</span>
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
                {columns.map((column) => (
                  <TableHead key={column} className="font-semibold">
                    {column}
                  </TableHead>
                ))}
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
