import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLeadDiscovery, DiscoverySession, PromptResult } from '@/hooks/useLeadDiscovery';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Upload, Play, Save, Plus, FileSpreadsheet, Building2, 
  Package, ChevronRight, Clock, CheckCircle, XCircle, Loader2,
  Sparkles, History, Settings, Send, Trash2, List, ArrowLeft, Eye, Download, User
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { UserSelector } from '@/components/Customer/UserSelector';

const LeadDiscoveryAnalysis = () => {
  const {
    industries,
    sessions,
    products,
    industriesLoading,
    sessionsLoading,
    createIndustry,
    createSession,
    updateSession,
    deleteSession,
    fetchSessionResults,
    addPromptResult,
    updatePromptResult
  } = useLeadDiscovery();

  const [selectedSession, setSelectedSession] = useState<DiscoverySession | null>(null);
  const [sessionResults, setSessionResults] = useState<PromptResult[]>([]);
  const [currentData, setCurrentData] = useState<any>(null);
  const [promptText, setPromptText] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [stepType, setStepType] = useState<'prompt' | 'tag'>('prompt');
  const [selectedServiceForTag, setSelectedServiceForTag] = useState('');
  const [tagPromptText, setTagPromptText] = useState('');
  const [tagPromptName, setTagPromptName] = useState('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [savedPrompts, setSavedPrompts] = useState<any[]>([]);
  const [selectedSavedPrompt, setSelectedSavedPrompt] = useState('');
  const [promptName, setPromptName] = useState('');
  
  // New session form
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionIndustry, setNewSessionIndustry] = useState('');
  const [newSessionCampaignName, setNewSessionCampaignName] = useState('');
  const [newSessionAssignedTo, setNewSessionAssignedTo] = useState('');
  // Removed: product selection now happens after filtering
  const [uploadedData, setUploadedData] = useState<any>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);

  // New industry form
  const [newIndustryName, setNewIndustryName] = useState('');
  const [newIndustryDesc, setNewIndustryDesc] = useState('');
  const [showNewIndustryDialog, setShowNewIndustryDialog] = useState(false);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        setUploadedData(jsonData);
        setUploadedFileName(file.name);
        toast.success(`Loaded ${jsonData.length} rows from ${file.name}`);
      } catch (error) {
        toast.error('Failed to parse file');
      }
    };
    reader.readAsBinaryString(file);
  }, []);

  const exportData = useCallback((data: any, filename: string, format: 'csv' | 'xlsx') => {
    if (!data || (Array.isArray(data) && data.length === 0)) {
      toast.error('No data to export');
      return;
    }

    try {
      const dataArray = Array.isArray(data) ? data : [data];
      const worksheet = XLSX.utils.json_to_sheet(dataArray);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      
      const extension = format === 'csv' ? '.csv' : '.xlsx';
      const bookType = format === 'csv' ? 'csv' : 'xlsx';
      
      XLSX.writeFile(workbook, `${filename}${extension}`, { bookType });
      toast.success(`Exported ${dataArray.length} rows as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export data');
    }
  }, []);

  const ExportButton = ({ data, label }: { data: any; label: string }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={!data || (Array.isArray(data) && data.length === 0)}>
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => exportData(data, label, 'csv')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportData(data, label, 'xlsx')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const handleCreateSession = async () => {
    if (!newSessionName || !newSessionIndustry) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      const result = await createSession.mutateAsync({
        session_name: newSessionName,
        industry_id: newSessionIndustry,
        campaign_name: newSessionCampaignName || undefined,
        assigned_to: newSessionAssignedTo || undefined,
        original_data: uploadedData,
        uploaded_file_name: uploadedFileName || undefined
      });
      
      setShowNewSessionDialog(false);
      setNewSessionName('');
      setNewSessionIndustry('');
      setNewSessionCampaignName('');
      setNewSessionAssignedTo('');
      setUploadedData(null);
      setUploadedFileName('');
      
      // Auto-select the new session
      setSelectedSession(result as any);
      setCurrentData(uploadedData);
      setSessionResults([]);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSelectSession = async (session: DiscoverySession) => {
    setSelectedSession(session);
    setCurrentData(session.original_data);
    
    try {
      const results = await fetchSessionResults(session.id);
      setSessionResults(results);
      
      // Set current data to the last successful output
      const lastSuccessful = [...results].reverse().find(r => r.status === 'completed' && r.output_data);
      if (lastSuccessful) {
        setCurrentData(lastSuccessful.output_data);
      }
    } catch (error) {
      toast.error('Failed to load session results');
    }
  };

  // Fetch saved prompts on mount
  const fetchSavedPrompts = async () => {
    const { data, error } = await supabase
      .from('lead_discovery_prompts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setSavedPrompts(data);
    }
  };

  // Load saved prompts when component mounts
  useEffect(() => {
    fetchSavedPrompts();
  }, []);

  const handleSelectSavedPrompt = (promptId: string) => {
    const prompt = savedPrompts.find(p => p.id === promptId);
    if (prompt) {
      setPromptText(prompt.prompt_text);
      setSelectedSavedPrompt(promptId);
    }
  };

  const savePromptAsTemplate = async (name: string, text: string, type: string = 'filter') => {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('lead_discovery_prompts')
      .insert({
        name,
        prompt_text: text,
        prompt_type: type,
        is_template: true,
        created_by: userData.user?.id
      })
      .select()
      .single();
    
    if (error) {
      toast.error('Failed to save prompt template');
      return null;
    }
    
    toast.success('Prompt saved as template');
    fetchSavedPrompts();
    return data;
  };

  const handleRunPrompt = async () => {
    if (!selectedSession || !promptText.trim() || !currentData) {
      toast.error('Please select a session, enter a prompt, and ensure data is loaded');
      return;
    }

    setIsRunning(true);
    const stepOrder = sessionResults.length + 1;
    const promptNameToUse = promptName.trim() || `Prompt ${stepOrder}`;

    try {
      // Save as template if checkbox is checked
      if (saveAsTemplate && promptNameToUse) {
        await savePromptAsTemplate(promptNameToUse, promptText, 'filter');
      }

      // Create pending result with name prefix
      const fullPromptText = `[${promptNameToUse}] ${promptText}`;
      
      const resultRecord = await addPromptResult.mutateAsync({
        session_id: selectedSession.id,
        step_order: stepOrder,
        prompt_text: fullPromptText,
        input_data: currentData,
        status: 'running'
      });

      // Call edge function
      const { data, error } = await supabase.functions.invoke('process-lead-discovery', {
        body: {
          prompt: promptText,
          data: currentData,
          industry: industries.find(i => i.id === selectedSession.industry_id)?.name,
          product: products.find(p => p.id === selectedSession.product_id)?.name
        }
      });

      if (error) throw error;

      // Update result with output
      await updatePromptResult.mutateAsync({
        id: resultRecord.id,
        output_data: data.result,
        status: 'completed',
        execution_time_ms: data.execution_time_ms
      });

      // Update local state
      const updatedResult = { ...resultRecord, output_data: data.result, status: 'completed' as const };
      setSessionResults(prev => [...prev, updatedResult]);
      setCurrentData(data.result);
      setPromptText('');
      setPromptName('');
      setSaveAsTemplate(false);
      setSelectedSavedPrompt('');

      // Update session with final result
      await updateSession.mutateAsync({
        id: selectedSession.id,
        final_result: data.result,
        status: 'processing'
      });

      toast.success('Prompt executed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to run prompt');
      
      // Mark as failed if we created a result record
      if (sessionResults.length > 0) {
        const lastResult = sessionResults[sessionResults.length - 1];
        if (lastResult.status === 'running') {
          await updatePromptResult.mutateAsync({
            id: lastResult.id,
            status: 'failed',
            error_message: error.message
          });
        }
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleCreateIndustry = async () => {
    if (!newIndustryName) {
      toast.error('Please enter industry name');
      return;
    }

    await createIndustry.mutateAsync({
      name: newIndustryName,
      description: newIndustryDesc || undefined
    });

    setShowNewIndustryDialog(false);
    setNewIndustryName('');
    setNewIndustryDesc('');
  };

  const handleTagServiceWithPrompt = async () => {
    if (!selectedSession || !selectedServiceForTag || !tagPromptText.trim()) {
      toast.error('Please select a service and enter a prompt');
      return;
    }

    if (!currentData) {
      toast.error('No data loaded');
      return;
    }

    setIsRunning(true);
    const selectedProduct = products.find(p => p.id === selectedServiceForTag);
    
    try {
      // First, tag the service
      await updateSession.mutateAsync({
        id: selectedSession.id,
        product_id: selectedServiceForTag
      });
      
      setSelectedSession(prev => prev ? { 
        ...prev, 
        product_id: selectedServiceForTag,
        product: selectedProduct
      } : null);

      // Run prompt as a step
      const stepOrder = sessionResults.length + 1;
      const promptLabel = tagPromptName.trim() 
        ? `[${tagPromptName.trim()}] [SERVICE: ${selectedProduct?.name}]` 
        : `[SERVICE: ${selectedProduct?.name}]`;
      const fullPromptText = `${promptLabel} ${tagPromptText}`;
      
      const resultRecord = await addPromptResult.mutateAsync({
        session_id: selectedSession.id,
        step_order: stepOrder,
        prompt_text: fullPromptText,
        input_data: currentData,
        status: 'running'
      });

      const { data, error } = await supabase.functions.invoke('process-lead-discovery', {
        body: {
          prompt: tagPromptText,
          data: currentData,
          industry: industries.find(i => i.id === selectedSession.industry_id)?.name,
          product: selectedProduct?.name
        }
      });

      if (error) throw error;

      await updatePromptResult.mutateAsync({
        id: resultRecord.id,
        output_data: data.result,
        status: 'completed',
        execution_time_ms: data.execution_time_ms
      });

      const updatedResult = { ...resultRecord, output_data: data.result, status: 'completed' as const };
      setSessionResults(prev => [...prev, updatedResult]);
      setCurrentData(data.result);

      await updateSession.mutateAsync({
        id: selectedSession.id,
        final_result: data.result,
        status: 'processing'
      });

      toast.success(`Tagged with ${selectedProduct?.name} and ran prompt`);
      setSelectedServiceForTag('');
      setTagPromptText('');
      setTagPromptName('');
      setStepType('prompt');
    } catch (error: any) {
      toast.error(error.message || 'Failed to run prompt');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500/20 text-emerald-400"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500/20 text-blue-400"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case 'running':
        return <Badge className="bg-blue-500/20 text-blue-400"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Running</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/20 text-destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'draft':
        return <Badge className="bg-muted text-muted-foreground"><Clock className="h-3 w-3 mr-1" />Draft</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  // All Sessions Table View
  if (showAllSessions) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setShowAllSessions(false)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">All Sessions</h1>
              <p className="text-muted-foreground">View all past discovery sessions</p>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                      Loading sessions...
                    </TableCell>
                  </TableRow>
                ) : sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No sessions found
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map(session => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.session_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{session.industry?.name || 'Unknown'}</Badge>
                      </TableCell>
                      <TableCell>
                        {session.product ? (
                          <Badge variant="secondary">
                            <Package className="h-3 w-3 mr-1" />
                            {session.product.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(session.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(session.created_at), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        {session.uploaded_file_name ? (
                          <span className="text-sm flex items-center gap-1">
                            <FileSpreadsheet className="h-3 w-3" />
                            {session.uploaded_file_name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              handleSelectSession(session);
                              setShowAllSessions(false);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={async () => {
                              if (confirm('Delete this session and all its data?')) {
                                await deleteSession.mutateAsync(session.id);
                              }
                            }}
                            disabled={deleteSession.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lead Discovery Analysis</h1>
          <p className="text-muted-foreground">Upload data, run AI prompts, and apply to services</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAllSessions(true)}>
            <List className="h-4 w-4 mr-2" />
            All Sessions
          </Button>
          
          <Dialog open={showNewIndustryDialog} onOpenChange={setShowNewIndustryDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Building2 className="h-4 w-4 mr-2" />
                Add Industry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Industry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Industry Name</Label>
                  <Input 
                    value={newIndustryName} 
                    onChange={(e) => setNewIndustryName(e.target.value)}
                    placeholder="e.g., Fintech"
                  />
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Textarea 
                    value={newIndustryDesc} 
                    onChange={(e) => setNewIndustryDesc(e.target.value)}
                    placeholder="Brief description of the industry"
                  />
                </div>
                <Button onClick={handleCreateIndustry} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Industry
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Session
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Discovery Session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Session Name *</Label>
                  <Input 
                    value={newSessionName} 
                    onChange={(e) => setNewSessionName(e.target.value)}
                    placeholder="e.g., Real Estate Q1 2025 Discovery"
                  />
                </div>
                <div>
                  <Label>Campaign Name</Label>
                  <Input 
                    value={newSessionCampaignName} 
                    onChange={(e) => setNewSessionCampaignName(e.target.value)}
                    placeholder="e.g., Q1 Real Estate Outreach"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Industry *</Label>
                    <Select value={newSessionIndustry} onValueChange={setNewSessionIndustry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map(ind => (
                          <SelectItem key={ind.id} value={ind.id}>{ind.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Assign To</Label>
                    <UserSelector
                      value={newSessionAssignedTo}
                      onValueChange={setNewSessionAssignedTo}
                      placeholder="Select user"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  You'll select which service to apply after filtering your data
                </p>
                <div>
                  <Label>Upload Data (Excel/CSV)</Label>
                  <div className="mt-2">
                    <Input 
                      type="file" 
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                    />
                    {uploadedData && (
                      <p className="text-sm text-muted-foreground mt-2">
                        <FileSpreadsheet className="h-4 w-4 inline mr-1" />
                        {uploadedFileName} - {uploadedData.length} rows
                      </p>
                    )}
                  </div>
                </div>
                <Button onClick={handleCreateSession} className="w-full" disabled={createSession.isPending}>
                  {createSession.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Create Session
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sessions Sidebar */}
        <div className="col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Sessions</h3>
          </div>
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-2">
              {sessionsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No sessions yet. Create one to start.
                </div>
              ) : (
                sessions.map(session => (
                  <Card 
                    key={session.id}
                    className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                      selectedSession?.id === session.id ? 'border-primary bg-accent/30' : ''
                    }`}
                    onClick={() => handleSelectSession(session)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{session.session_name}</p>
                          {session.campaign_name && (
                            <p className="text-xs text-muted-foreground truncate">
                              {session.campaign_name}
                            </p>
                          )}
                          <div className="flex items-center flex-wrap gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {session.industry?.name || 'Unknown'}
                            </Badge>
                            {session.product && (
                              <Badge variant="secondary" className="text-xs">
                                <Package className="h-3 w-3 mr-1" />
                                {session.product.name}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{format(new Date(session.created_at), 'MMM d, yyyy')}</span>
                            {session.assigned_user && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {session.assigned_user.name}
                              </span>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(session.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="col-span-9 space-y-4">
          {!selectedSession ? (
            <Card className="h-[calc(100vh-200px)] flex items-center justify-center">
              <CardContent className="text-center">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Select or Create a Session</h3>
                <p className="text-muted-foreground mt-2">
                  Choose an existing session from the sidebar or create a new one to start analyzing leads.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Session Header */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedSession.session_name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{selectedSession.industry?.name}</Badge>
                        {selectedSession.product && (
                          <>
                            <ChevronRight className="h-4 w-4" />
                            <Badge variant="secondary">
                              <Package className="h-3 w-3 mr-1" />
                              {selectedSession.product.name}
                            </Badge>
                          </>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedSession.status)}
                      {selectedSession.status !== 'completed' && sessionResults.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            await updateSession.mutateAsync({
                              id: selectedSession.id,
                              status: 'completed',
                              final_result: currentData
                            });
                            setSelectedSession(prev => prev ? { ...prev, status: 'completed' } : null);
                            toast.success('Session marked as completed');
                          }}
                          disabled={updateSession.isPending}
                        >
                          {updateSession.isPending ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          )}
                          Mark as Done
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={async () => {
                          if (confirm('Delete this session and all its data?')) {
                            await deleteSession.mutateAsync(selectedSession.id);
                            setSelectedSession(null);
                            setSessionResults([]);
                            setCurrentData(null);
                          }
                        }}
                        disabled={deleteSession.isPending}
                      >
                        {deleteSession.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Initial Data Export */}
              {selectedSession.original_data && Array.isArray(selectedSession.original_data) && selectedSession.original_data.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileSpreadsheet className="h-5 w-5" />
                          Initial Data ({selectedSession.original_data.length} rows)
                        </CardTitle>
                        {selectedSession.uploaded_file_name && (
                          <p className="text-sm text-muted-foreground mt-1">Source: {selectedSession.uploaded_file_name}</p>
                        )}
                      </div>
                      <ExportButton data={selectedSession.original_data} label={`${selectedSession.session_name}-initial-data`} />
                    </div>
                  </CardHeader>
                </Card>
              )}

              {/* Prompt Pipeline */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Prompt Pipeline ({sessionResults.length} steps)
                    </CardTitle>
                    {currentData && Array.isArray(currentData) && currentData.length > 0 && (
                      <ExportButton data={currentData} label={`${selectedSession.session_name}-current-data`} />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {sessionResults.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No prompts executed yet. Enter a prompt below to start.</p>
                  ) : (
                    <Accordion type="multiple" className="space-y-2">
                      {sessionResults.map((result, idx) => {
                        // Extract name from prompt if it has [Name] prefix
                        const promptMatch = result.prompt_text.match(/^\[([^\]]+)\]\s*(.*)$/);
                        const promptLabel = promptMatch ? promptMatch[1] : `Step ${idx + 1}`;
                        const promptContent = promptMatch ? promptMatch[2] : result.prompt_text;
                        const exportLabel = promptMatch 
                          ? promptMatch[1].toLowerCase().replace(/\s+/g, '-')
                          : `step-${idx + 1}`;
                        
                        return (
                          <AccordionItem key={result.id} value={result.id} className="border rounded-lg px-4">
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-3 w-full">
                                <Badge variant="outline" className="shrink-0">Step {idx + 1}</Badge>
                                {promptMatch && (
                                  <Badge variant="secondary" className="shrink-0">{promptLabel}</Badge>
                                )}
                                <span className="truncate flex-1 text-left">{promptContent}</span>
                                {getStatusBadge(result.status)}
                                {result.execution_time_ms && (
                                  <span className="text-xs text-muted-foreground">{result.execution_time_ms}ms</span>
                                )}
                                {result.status === 'completed' && result.output_data && (
                                  <ExportButton data={result.output_data} label={`${selectedSession.session_name}-${exportLabel}`} />
                                )}
                              </div>
                            </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <Label className="text-xs">Input ({Array.isArray(result.input_data) ? result.input_data.length : 0} items)</Label>
                                  <ExportButton data={result.input_data} label={`step-${idx + 1}-input`} />
                                </div>
                                <ScrollArea className="h-40 border rounded p-2 bg-muted/30">
                                  <pre className="text-xs">{JSON.stringify(result.input_data, null, 2)}</pre>
                                </ScrollArea>
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <Label className="text-xs">Output ({Array.isArray(result.output_data) ? result.output_data.length : 0} items)</Label>
                                  <ExportButton data={result.output_data} label={`step-${idx + 1}-output`} />
                                </div>
                                <ScrollArea className="h-40 border rounded p-2 bg-muted/30">
                                  <pre className="text-xs">{JSON.stringify(result.output_data, null, 2)}</pre>
                                </ScrollArea>
                              </div>
                            </div>
                            {result.error_message && (
                              <p className="text-sm text-destructive mt-2">{result.error_message}</p>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                        );
                      })}
                    </Accordion>
                  )}
                </CardContent>
              </Card>

              {/* Add Step - Unified section for both prompt and tag+prompt */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Add Step
                      </CardTitle>
                      <CardDescription>
                        Current data: {Array.isArray(currentData) ? `${currentData.length} items` : 'No data loaded'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs value={stepType} onValueChange={(v) => setStepType(v as 'prompt' | 'tag')}>
                    <TabsList className="w-full">
                      <TabsTrigger value="prompt" className="flex-1">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Run Prompt
                      </TabsTrigger>
                      <TabsTrigger value="tag" className="flex-1">
                        <Package className="h-4 w-4 mr-2" />
                        Tag Service & Run Prompt
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="prompt" className="mt-4 space-y-4">
                      {/* Saved Prompts Dropdown */}
                      {savedPrompts.length > 0 && (
                        <div>
                          <Label>Use Saved Prompt</Label>
                          <Select value={selectedSavedPrompt} onValueChange={handleSelectSavedPrompt}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a saved prompt..." />
                            </SelectTrigger>
                            <SelectContent>
                              {savedPrompts.map(prompt => (
                                <SelectItem key={prompt.id} value={prompt.id}>
                                  <div className="flex items-center gap-2">
                                    <Save className="h-4 w-4" />
                                    {prompt.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div>
                        <Label>Prompt Name *</Label>
                        <Input
                          value={promptName}
                          onChange={(e) => setPromptName(e.target.value)}
                          placeholder="e.g., 'Filter high-value leads', 'Remove duplicates'..."
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Prompt *</Label>
                        <Textarea
                          value={promptText}
                          onChange={(e) => setPromptText(e.target.value)}
                          placeholder="Enter your prompt... e.g., 'Filter to only include companies with annual revenue > 1M AED'"
                          rows={4}
                          className="resize-none mt-1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="saveAsTemplate"
                          checked={saveAsTemplate}
                          onChange={(e) => setSaveAsTemplate(e.target.checked)}
                          className="h-4 w-4 rounded border-border"
                        />
                        <Label htmlFor="saveAsTemplate" className="text-sm cursor-pointer">
                          Save this prompt as a reusable template
                        </Label>
                      </div>
                      <div className="flex justify-end">
                        <Button onClick={handleRunPrompt} disabled={isRunning || !promptText || !promptName || !currentData}>
                          {isRunning ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4 mr-2" />
                          )}
                          Run Prompt
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="tag" className="mt-4 space-y-4">
                      <div>
                        <Label>Select Service *</Label>
                        <Select value={selectedServiceForTag} onValueChange={setSelectedServiceForTag}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a service to tag..." />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(prod => (
                              <SelectItem key={prod.id} value={prod.id}>
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4" />
                                  {prod.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Prompt Name (for tagging)</Label>
                        <Input
                          value={tagPromptName}
                          onChange={(e) => setTagPromptName(e.target.value)}
                          placeholder="e.g., 'Service-specific filter', 'Qualify for product'..."
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Prompt *</Label>
                        <Textarea
                          value={tagPromptText}
                          onChange={(e) => setTagPromptText(e.target.value)}
                          placeholder="Enter your prompt... e.g., 'Filter leads that are suitable for this service'"
                          rows={3}
                          className="resize-none mt-1"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button 
                          onClick={handleTagServiceWithPrompt} 
                          disabled={isRunning || !selectedServiceForTag || !tagPromptText.trim() || !currentData}
                        >
                          {isRunning ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4 mr-2" />
                          )}
                          Run Prompt
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Current Data Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Current Data Preview</CardTitle>
                  <CardDescription>
                    {Array.isArray(currentData) ? `${currentData.length} items` : 'No data'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64 border rounded p-3 bg-muted/20">
                    <pre className="text-xs">{JSON.stringify(currentData, null, 2)}</pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadDiscoveryAnalysis;
