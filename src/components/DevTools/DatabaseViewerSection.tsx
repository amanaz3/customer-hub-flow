import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Key, Link2, Star, Search, Database } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';

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
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(true);
  const [rowCount, setRowCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [metadata, setMetadata] = useState<TableMetadata>({
    primaryKeys: [],
    foreignKeys: [],
    uniqueKeys: [],
    columnTypes: {}
  });
  const { toast } = useToast();

  // Complete list of all public tables
  const allTables = [
    'access_management_settings', 'access_permissions', 'account_applications', 'ai_assistant_config',
    'application_assessment_history', 'application_documents', 'application_messages', 'application_owners',
    'application_status_changes', 'application_status_preferences', 'application_step_history',
    'application_workflow_steps', 'arr_performance', 'arr_targets', 'bank_profiles', 'bank_readiness_cases',
    'bank_readiness_configuration_versions', 'bank_readiness_configurations', 'bank_readiness_outcomes',
    'bank_readiness_rules', 'banks', 'bundle_products', 'call_stage_history', 'call_transcripts',
    'comments', 'completion_date_history', 'customer_services', 'customers', 'cycles', 'deals',
    'discovery_questions', 'documents', 'domains', 'emotional_responses', 'feature_flags',
    'form_configuration_versions', 'form_templates', 'lead_activities', 'lead_campaigns',
    'lead_discovery_industries', 'lead_discovery_prompt_results', 'lead_discovery_prompts',
    'lead_discovery_sessions', 'lead_followup_sequence', 'lead_reminder_schedule', 'lead_workflow_settings',
    'lead_workflow_steps', 'leads', 'logs', 'monthly_performance', 'monthly_targets',
    'notification_preferences', 'notification_role_preferences', 'notification_settings',
    'notification_user_preferences', 'notifications', 'objection_handlers', 'partner_signup_requests',
    'playbook_stages', 'pricing_strategies', 'products', 'profiles', 'projects', 'sales_call_sessions',
    'sales_playbooks', 'script_nodes', 'security_audit_log', 'service_bundles', 'service_category',
    'service_fees', 'service_form_configurations', 'service_types', 'stage_scripts', 'status_changes',
    'task_attachments', 'task_comments', 'tasks', 'user_products', 'webflow_activities',
    'webflow_configuration_versions', 'webflow_configurations', 'webflow_countries', 'webflow_documents',
    'webflow_jurisdictions', 'webflow_pricing', 'webflow_rules', 'weekly_activities'
  ];

  // Set available tables on mount
  useEffect(() => {
    setAvailableTables(allTables);
    setSelectedTable('profiles');
    fetchTableMetadata('profiles');
    fetchTableData('profiles');
    setIsLoadingTables(false);
  }, []);

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
            <SelectContent className="bg-background border shadow-md z-50 max-h-[300px] overflow-y-auto">
              <ScrollArea className="h-[280px]">
                {isLoadingTables ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  availableTables.map((table) => (
                    <SelectItem key={table} value={table}>
                      {table}
                    </SelectItem>
                  ))
                )}
              </ScrollArea>
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

      {selectedTable && columns.length > 0 && (
        <div className="space-y-4">
          {/* Table Information Panel */}
          <Alert>
            <Database className="h-4 w-4" />
            <AlertTitle>Table: {selectedTable}</AlertTitle>
            <AlertDescription>
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Total Rows:</span>
                  <Badge variant="secondary">{rowCount.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Columns:</span>
                  <Badge variant="secondary">{columns.length}</Badge>
                </div>
                {metadata.foreignKeys.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">References:</span>
                    {metadata.foreignKeys.map((fk, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {fk.foreignTable}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {/* Search Input */}
          {tableData.length > 0 && (
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

          {/* Row Count Info */}
          <div className="flex items-center gap-4 text-sm flex-wrap">
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
            {rowCount > 50 && (
              <span className="text-xs text-muted-foreground">(limited to 50 rows)</span>
            )}
          </div>

          {/* Table Data */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredData.length > 0 ? (
            <ScrollArea className="h-[500px] rounded-md border">
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
          ) : null}
        </div>
      )}

      {!selectedTable || columns.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          ) : (
            "Select a table to view its data and schema information"
          )}
        </div>
      ) : null}
    </div>
  );
}
