import { useState, useCallback } from 'react';
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
  Sparkles, History, Settings, Send, Trash2, List, ArrowLeft, Eye
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

const LeadDiscoveryAnalysis = () => {
  const {
    industries,
    sessions,
    savedPrompts,
    products,
    industriesLoading,
    sessionsLoading,
    createIndustry,
    createSession,
    updateSession,
    deleteSession,
    savePrompt,
    fetchSessionResults,
    addPromptResult,
    updatePromptResult
  } = useLeadDiscovery();

  const [activeTab, setActiveTab] = useState('sessions');
  const [selectedSession, setSelectedSession] = useState<DiscoverySession | null>(null);
  const [sessionResults, setSessionResults] = useState<PromptResult[]>([]);
  const [currentData, setCurrentData] = useState<any>(null);
  const [promptText, setPromptText] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [selectedProductForApply, setSelectedProductForApply] = useState('');
  const [applyPrompt, setApplyPrompt] = useState('');
  const [showAllSessions, setShowAllSessions] = useState(false);
  
  // New session form
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionIndustry, setNewSessionIndustry] = useState('');
  // Removed: product selection now happens after filtering
  const [uploadedData, setUploadedData] = useState<any>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);

  // New industry form
  const [newIndustryName, setNewIndustryName] = useState('');
  const [newIndustryDesc, setNewIndustryDesc] = useState('');
  const [showNewIndustryDialog, setShowNewIndustryDialog] = useState(false);

  // Save prompt form
  const [savePromptName, setSavePromptName] = useState('');
  const [savePromptType, setSavePromptType] = useState<'filter' | 'curate' | 'transform' | 'apply' | 'custom'>('filter');
  const [showSavePromptDialog, setShowSavePromptDialog] = useState(false);

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

  const handleCreateSession = async () => {
    if (!newSessionName || !newSessionIndustry) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      const result = await createSession.mutateAsync({
        session_name: newSessionName,
        industry_id: newSessionIndustry,
        original_data: uploadedData,
        uploaded_file_name: uploadedFileName || undefined
      });
      
      setShowNewSessionDialog(false);
      setNewSessionName('');
      setNewSessionIndustry('');
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

  const handleRunPrompt = async () => {
    if (!selectedSession || !promptText.trim() || !currentData) {
      toast.error('Please select a session, enter a prompt, and ensure data is loaded');
      return;
    }

    setIsRunning(true);
    const stepOrder = sessionResults.length + 1;

    try {
      // Create pending result
      const resultRecord = await addPromptResult.mutateAsync({
        session_id: selectedSession.id,
        step_order: stepOrder,
        prompt_text: promptText,
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

  const handleSavePrompt = async () => {
    if (!savePromptName || !promptText) {
      toast.error('Please enter prompt name and text');
      return;
    }

    await savePrompt.mutateAsync({
      name: savePromptName,
      prompt_text: promptText,
      prompt_type: savePromptType
    });

    setShowSavePromptDialog(false);
    setSavePromptName('');
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

  const handleLoadSavedPrompt = (prompt: { prompt_text: string }) => {
    setPromptText(prompt.prompt_text);
    toast.success('Prompt loaded');
  };

  const handleApplyToService = async () => {
    if (!selectedSession || !selectedProductForApply || !currentData) {
      toast.error('Please select a service and ensure data is ready');
      return;
    }

    setIsApplying(true);
    const stepOrder = sessionResults.length + 1;
    const selectedProduct = products.find(p => p.id === selectedProductForApply);
    const finalPrompt = applyPrompt || `Apply this curated data to the ${selectedProduct?.name} service. Format and structure the data appropriately for this service.`;

    try {
      // Create pending result
      const resultRecord = await addPromptResult.mutateAsync({
        session_id: selectedSession.id,
        step_order: stepOrder,
        prompt_text: `[APPLY TO SERVICE: ${selectedProduct?.name}] ${finalPrompt}`,
        input_data: currentData,
        status: 'running'
      });

      // Call edge function with apply context
      const { data, error } = await supabase.functions.invoke('process-lead-discovery', {
        body: {
          prompt: finalPrompt,
          data: currentData,
          industry: industries.find(i => i.id === selectedSession.industry_id)?.name,
          product: selectedProduct?.name,
          isApplyStep: true
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

      // Update session with product and final result
      await updateSession.mutateAsync({
        id: selectedSession.id,
        product_id: selectedProductForApply,
        final_result: data.result,
        status: 'completed'
      });

      // Update local state
      const updatedResult = { ...resultRecord, output_data: data.result, status: 'completed' as const };
      setSessionResults(prev => [...prev, updatedResult]);
      setCurrentData(data.result);
      setShowApplyDialog(false);
      setSelectedProductForApply('');
      setApplyPrompt('');

      toast.success(`Data applied to ${selectedProduct?.name} successfully!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to apply to service');
    } finally {
      setIsApplying(false);
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
                  <p className="text-xs text-muted-foreground mt-1">
                    You'll select which service to apply after filtering your data
                  </p>
                </div>
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
        {/* Sessions & Prompts Sidebar */}
        <div className="col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="sessions" className="flex-1">Sessions</TabsTrigger>
              <TabsTrigger value="prompts" className="flex-1">Prompts</TabsTrigger>
            </TabsList>

            <TabsContent value="sessions" className="mt-4">
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
                              <div className="flex items-center gap-2 mt-1">
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
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(session.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                            {getStatusBadge(session.status)}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="prompts" className="mt-4">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-2">
                  {savedPrompts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No saved prompts yet.
                    </div>
                  ) : (
                    savedPrompts.map(prompt => (
                      <Card 
                        key={prompt.id}
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => handleLoadSavedPrompt(prompt)}
                      >
                        <CardContent className="p-3">
                          <p className="font-medium">{prompt.name}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {prompt.prompt_type}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                            {prompt.prompt_text}
                          </p>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
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

              {/* Prompt Pipeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Prompt Pipeline ({sessionResults.length} steps)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sessionResults.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No prompts executed yet. Enter a prompt below to start.</p>
                  ) : (
                    <Accordion type="multiple" className="space-y-2">
                      {sessionResults.map((result, idx) => (
                        <AccordionItem key={result.id} value={result.id} className="border rounded-lg px-4">
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3 w-full">
                              <Badge variant="outline" className="shrink-0">Step {idx + 1}</Badge>
                              <span className="truncate flex-1 text-left">{result.prompt_text}</span>
                              {getStatusBadge(result.status)}
                              {result.execution_time_ms && (
                                <span className="text-xs text-muted-foreground">{result.execution_time_ms}ms</span>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                              <div>
                                <Label className="text-xs">Input ({Array.isArray(result.input_data) ? result.input_data.length : 0} items)</Label>
                                <ScrollArea className="h-40 mt-1 border rounded p-2 bg-muted/30">
                                  <pre className="text-xs">{JSON.stringify(result.input_data, null, 2)}</pre>
                                </ScrollArea>
                              </div>
                              <div>
                                <Label className="text-xs">Output ({Array.isArray(result.output_data) ? result.output_data.length : 0} items)</Label>
                                <ScrollArea className="h-40 mt-1 border rounded p-2 bg-muted/30">
                                  <pre className="text-xs">{JSON.stringify(result.output_data, null, 2)}</pre>
                                </ScrollArea>
                              </div>
                            </div>
                            {result.error_message && (
                              <p className="text-sm text-destructive mt-2">{result.error_message}</p>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </CardContent>
              </Card>

              {/* Apply to Service Section - Only show if no product selected yet */}
              {sessionResults.length > 0 && currentData && Array.isArray(currentData) && currentData.length > 0 && !selectedSession.product_id && (
                <Card className="border-primary/50 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      Apply to Service
                    </CardTitle>
                    <CardDescription>
                      Data is ready! Select a service to apply this curated data ({currentData.length} items)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Select Service *</Label>
                        <Select value={selectedProductForApply} onValueChange={setSelectedProductForApply}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose service to apply data" />
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
                        <Label>Application Prompt (optional)</Label>
                        <Textarea
                          value={applyPrompt}
                          onChange={(e) => setApplyPrompt(e.target.value)}
                          placeholder="Add specific instructions for how to apply this data..."
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={handleApplyToService} 
                      disabled={isApplying || !selectedProductForApply}
                      className="w-full"
                    >
                      {isApplying ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Apply Data to {products.find(p => p.id === selectedProductForApply)?.name || 'Service'}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Prompt Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Run Prompt
                  </CardTitle>
                  <CardDescription>
                    Current data: {Array.isArray(currentData) ? `${currentData.length} items` : 'No data loaded'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Enter your prompt... e.g., 'Filter to only include companies with annual revenue > 1M AED and headquarters in Dubai'"
                    rows={4}
                    className="resize-none"
                  />
                  <div className="flex justify-between">
                    <Dialog open={showSavePromptDialog} onOpenChange={setShowSavePromptDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" disabled={!promptText}>
                          <Save className="h-4 w-4 mr-2" />
                          Save Prompt
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Save Prompt</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div>
                            <Label>Prompt Name</Label>
                            <Input 
                              value={savePromptName}
                              onChange={(e) => setSavePromptName(e.target.value)}
                              placeholder="e.g., Filter High Revenue Companies"
                            />
                          </div>
                          <div>
                            <Label>Prompt Type</Label>
                            <Select value={savePromptType} onValueChange={(v: any) => setSavePromptType(v)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="filter">Filter</SelectItem>
                                <SelectItem value="curate">Curate</SelectItem>
                                <SelectItem value="transform">Transform</SelectItem>
                                <SelectItem value="apply">Apply</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button onClick={handleSavePrompt} className="w-full">
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button onClick={handleRunPrompt} disabled={isRunning || !promptText || !currentData}>
                      {isRunning ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Run Prompt
                    </Button>
                  </div>
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
