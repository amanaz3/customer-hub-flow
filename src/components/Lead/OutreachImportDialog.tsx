import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Upload,
  FileSpreadsheet,
  Wand2,
  Mail,
  Linkedin,
  MessageCircle,
  Calendar,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  ArrowRight,
  Flame,
  ThermometerSun,
  Snowflake,
  Download,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OutreachImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

interface ParsedLead {
  name: string;
  company?: string;
  city?: string;
  state?: string;
  industry?: string;
  email?: string;
  phone?: string;
  dubai_setup_likelihood?: 'high' | 'medium' | 'low';
  indicator?: string;
  linkedin_profile?: string;
  preferred_contact_method?: 'email' | 'linkedin' | 'whatsapp' | 'trade_fair';
}

interface GeneratedMessages {
  email?: { subject: string; body: string };
  linkedin?: { connection_note: string; follow_up: string };
  whatsapp?: { initial: string; follow_up: string };
  priority_score?: number;
  suggested_follow_up_days?: number;
  personalization_notes?: string;
}

interface OutreachResult {
  lead: string;
  company?: string;
  dubai_setup_likelihood?: string;
  preferred_contact_method?: string;
  messages?: GeneratedMessages;
  success?: boolean;
  error?: string;
}

const LIKELIHOOD_COLORS = {
  high: 'bg-red-500/20 text-red-700 border-red-300',
  medium: 'bg-amber-500/20 text-amber-700 border-amber-300',
  low: 'bg-blue-500/20 text-blue-700 border-blue-300',
};

const LIKELIHOOD_ICONS = {
  high: <Flame className="h-3 w-3" />,
  medium: <ThermometerSun className="h-3 w-3" />,
  low: <Snowflake className="h-3 w-3" />,
};

export function OutreachImportDialog({ open, onOpenChange, onImportComplete }: OutreachImportDialogProps) {
  const [step, setStep] = useState<'import' | 'preview' | 'generate' | 'results'>('import');
  const [csvData, setCsvData] = useState('');
  const [parsedLeads, setParsedLeads] = useState<ParsedLead[]>([]);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<OutreachResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<OutreachResult | null>(null);

  const parseCSV = useCallback((text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      toast.error('CSV must have a header row and at least one data row');
      return;
    }

    const headers = lines[0].split(/[,\t]/).map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const leads: ParsedLead[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/[,\t]/).map(v => v.trim().replace(/['"]/g, ''));
      const lead: ParsedLead = { name: '' };

      headers.forEach((header, idx) => {
        const value = values[idx] || '';
        if (header.includes('company') || header.includes('name') && header.includes('company')) {
          lead.company = value;
        } else if (header === 'name' || header.includes('contact name')) {
          lead.name = value;
        } else if (header.includes('city')) {
          lead.city = value;
        } else if (header.includes('state')) {
          lead.state = value;
        } else if (header.includes('industry')) {
          lead.industry = value;
        } else if (header.includes('email')) {
          lead.email = value;
        } else if (header.includes('phone')) {
          lead.phone = value;
        } else if (header.includes('likely') || header.includes('dubai') || header.includes('setup')) {
          const likelihood = value.toLowerCase();
          if (['high', 'medium', 'low'].includes(likelihood)) {
            lead.dubai_setup_likelihood = likelihood as 'high' | 'medium' | 'low';
          }
        } else if (header.includes('indicator')) {
          lead.indicator = value;
        } else if (header.includes('linkedin')) {
          lead.linkedin_profile = value;
        } else if (header.includes('contact method') || header.includes('channel')) {
          const method = value.toLowerCase().replace(' ', '_');
          if (['email', 'linkedin', 'whatsapp', 'trade_fair'].includes(method)) {
            lead.preferred_contact_method = method as 'email' | 'linkedin' | 'whatsapp' | 'trade_fair';
          }
        }
      });

      // If no name but company exists, use company as name
      if (!lead.name && lead.company) {
        lead.name = lead.company;
      }

      if (lead.name) {
        leads.push(lead);
      }
    }

    if (leads.length === 0) {
      toast.error('No valid leads found in CSV');
      return;
    }

    setParsedLeads(leads);
    setStep('preview');
    toast.success(`Parsed ${leads.length} leads from CSV`);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvData(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const handlePasteData = () => {
    if (!csvData.trim()) {
      toast.error('Please paste CSV data first');
      return;
    }
    parseCSV(csvData);
  };

  const generateMessages = async () => {
    if (parsedLeads.length === 0) return;

    setGenerating(true);
    setStep('generate');

    try {
      const { data, error } = await supabase.functions.invoke('generate-outreach-messages', {
        body: { leads: parsedLeads }
      });

      if (error) throw error;

      setResults(data.results || []);
      setStep('results');
      toast.success(`Generated messages for ${data.results?.length || 0} leads`);
    } catch (error) {
      console.error('Error generating messages:', error);
      toast.error('Failed to generate messages');
      setStep('preview');
    } finally {
      setGenerating(false);
    }
  };

  const saveLeadsToDatabase = async () => {
    try {
      const leadsToInsert = parsedLeads.map((lead, idx) => {
        const result = results.find(r => r.lead === lead.name);
        return {
          name: lead.name,
          company: lead.company || null,
          email: lead.email || null,
          mobile: lead.phone || null,
          city: lead.city || null,
          state: lead.state || null,
          industry: lead.industry || null,
          dubai_setup_likelihood: lead.dubai_setup_likelihood || null,
          preferred_contact_method: lead.preferred_contact_method || null,
          linkedin_profile: lead.linkedin_profile || null,
          indicator: lead.indicator || null,
          outreach_messages: result?.messages ? JSON.parse(JSON.stringify(result.messages)) : {},
          outreach_status: 'pending',
          score: lead.dubai_setup_likelihood === 'high' ? 'hot' : lead.dubai_setup_likelihood === 'medium' ? 'warm' : 'cold',
          status: 'new',
          source: 'Apollo Import'
        };
      });

      const { error } = await supabase.from('leads').insert(leadsToInsert as any);

      if (error) throw error;

      toast.success(`Imported ${leadsToInsert.length} leads successfully`);
      onImportComplete();
      onOpenChange(false);
      resetDialog();
    } catch (error) {
      console.error('Error saving leads:', error);
      toast.error('Failed to save leads to database');
    }
  };

  const resetDialog = () => {
    setStep('import');
    setCsvData('');
    setParsedLeads([]);
    setResults([]);
    setSelectedResult(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const exportTrackingTable = () => {
    const headers = ['Company Name', 'Contact Method', 'Message Sent', 'Response Status', 'Next Action', 'Follow-up Date'];
    const rows = results.map(r => [
      r.company || r.lead,
      r.preferred_contact_method || 'email',
      'No',
      'Pending',
      'Send initial message',
      new Date(Date.now() + (r.messages?.suggested_follow_up_days || 3) * 24 * 60 * 60 * 1000).toLocaleDateString()
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'outreach-tracking.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Tracking table exported');
  };

  // Segment leads by likelihood
  const segmentedLeads = {
    high: parsedLeads.filter(l => l.dubai_setup_likelihood === 'high'),
    medium: parsedLeads.filter(l => l.dubai_setup_likelihood === 'medium'),
    low: parsedLeads.filter(l => l.dubai_setup_likelihood === 'low'),
    unknown: parsedLeads.filter(l => !l.dubai_setup_likelihood),
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetDialog(); onOpenChange(o); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Outreach Import Assistant
          </DialogTitle>
          <DialogDescription>
            Import leads from Apollo.io or ChatGPT, generate personalized messages, and track outreach
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          {['import', 'preview', 'generate', 'results'].map((s, idx) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${step === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <span>{idx + 1}</span>
                <span className="capitalize">{s}</span>
              </div>
              {idx < 3 && <ArrowRight className="h-4 w-4 text-muted-foreground mx-1" />}
            </div>
          ))}
        </div>

        {/* Preview step action buttons - always visible at top */}
        {step === 'preview' && (
          <div className="flex gap-2 justify-end pb-3 border-b mb-3">
            <Button variant="outline" onClick={() => setStep('import')}>Back</Button>
            <Button onClick={generateMessages}>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate AI Messages
            </Button>
          </div>
        )}

        <ScrollArea className="flex-1">
          {step === 'import' && (
            <div className="space-y-4 p-1">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Upload CSV file or paste data below
                </p>
                <Input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="max-w-xs mx-auto"
                />
              </div>

              <div className="space-y-2">
                <Label>Or paste CSV/text data:</Label>
                <Textarea
                  placeholder="Company Name, City, State, Industry, Email, Phone, Likely Dubai Setup, Indicator, LinkedIn Profile, Contact Method..."
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  rows={8}
                />
                <Button onClick={handlePasteData} disabled={!csvData.trim()}>
                  Parse Data
                </Button>
              </div>

              <Card className="bg-muted/50">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Expected CSV Format</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <code className="text-xs">
                    Company Name, City, State, Industry, Email, Phone, Likely Dubai Setup, Indicator, LinkedIn Profile, Contact Method
                  </code>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4 p-1">
              <div className="grid grid-cols-4 gap-3">
                <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
                  <CardContent className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Flame className="h-4 w-4 text-red-500" />
                      <span className="text-xl font-bold text-red-700">{segmentedLeads.high.length}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">High Priority</p>
                  </CardContent>
                </Card>
                <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                  <CardContent className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <ThermometerSun className="h-4 w-4 text-amber-500" />
                      <span className="text-xl font-bold text-amber-700">{segmentedLeads.medium.length}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Medium Priority</p>
                  </CardContent>
                </Card>
                <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                  <CardContent className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Snowflake className="h-4 w-4 text-blue-500" />
                      <span className="text-xl font-bold text-blue-700">{segmentedLeads.low.length}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Low Priority</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <span className="text-xl font-bold">{segmentedLeads.unknown.length}</span>
                    <p className="text-xs text-muted-foreground">Unclassified</p>
                  </CardContent>
                </Card>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Likelihood</TableHead>
                    <TableHead>Channel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedLeads.slice(0, 10).map((lead, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{lead.company || lead.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {[lead.city, lead.state].filter(Boolean).join(', ') || '-'}
                      </TableCell>
                      <TableCell className="text-sm">{lead.industry || '-'}</TableCell>
                      <TableCell>
                        {lead.dubai_setup_likelihood ? (
                          <Badge variant="outline" className={LIKELIHOOD_COLORS[lead.dubai_setup_likelihood]}>
                            {LIKELIHOOD_ICONS[lead.dubai_setup_likelihood]}
                            <span className="ml-1 capitalize">{lead.dubai_setup_likelihood}</span>
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="capitalize">{lead.preferred_contact_method?.replace('_', ' ') || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsedLeads.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  ...and {parsedLeads.length - 10} more leads
                </p>
              )}
            </div>
          )}

          {step === 'generate' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium">Generating personalized messages...</p>
              <p className="text-sm text-muted-foreground">This may take a moment</p>
            </div>
          )}

          {step === 'results' && (
            <div className="space-y-4 p-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">{results.filter(r => r.success).length} messages generated</span>
                  {results.some(r => r.error) && (
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      {results.filter(r => r.error).length} failed
                    </Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={exportTrackingTable}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Tracking Table
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm">Leads</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[300px]">
                      {results.map((result, idx) => (
                        <div
                          key={idx}
                          className={`p-3 border-b cursor-pointer hover:bg-muted/50 ${selectedResult?.lead === result.lead ? 'bg-muted' : ''}`}
                          onClick={() => setSelectedResult(result)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{result.company || result.lead}</span>
                            {result.success ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          {result.dubai_setup_likelihood && (
                            <Badge variant="outline" className={`mt-1 ${LIKELIHOOD_COLORS[result.dubai_setup_likelihood as keyof typeof LIKELIHOOD_COLORS]}`}>
                              {result.dubai_setup_likelihood}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm">Messages</CardTitle>
                  </CardHeader>
                  <CardContent className="p-2">
                    {selectedResult?.messages ? (
                      <Tabs defaultValue="email" className="w-full">
                        <TabsList className="w-full">
                          <TabsTrigger value="email" className="flex-1">
                            <Mail className="h-3 w-3 mr-1" />
                            Email
                          </TabsTrigger>
                          <TabsTrigger value="linkedin" className="flex-1">
                            <Linkedin className="h-3 w-3 mr-1" />
                            LinkedIn
                          </TabsTrigger>
                          <TabsTrigger value="whatsapp" className="flex-1">
                            <MessageCircle className="h-3 w-3 mr-1" />
                            WhatsApp
                          </TabsTrigger>
                        </TabsList>
                        <ScrollArea className="h-[220px] mt-2">
                          <TabsContent value="email" className="mt-0">
                            {selectedResult.messages.email && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">Subject</Label>
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(selectedResult.messages!.email!.subject)}>
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <p className="text-sm bg-muted p-2 rounded">{selectedResult.messages.email.subject}</p>
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">Body</Label>
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(selectedResult.messages!.email!.body)}>
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <p className="text-sm bg-muted p-2 rounded whitespace-pre-wrap">{selectedResult.messages.email.body}</p>
                              </div>
                            )}
                          </TabsContent>
                          <TabsContent value="linkedin" className="mt-0">
                            {selectedResult.messages.linkedin && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">Connection Note</Label>
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(selectedResult.messages!.linkedin!.connection_note)}>
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <p className="text-sm bg-muted p-2 rounded">{selectedResult.messages.linkedin.connection_note}</p>
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">Follow-up</Label>
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(selectedResult.messages!.linkedin!.follow_up)}>
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <p className="text-sm bg-muted p-2 rounded">{selectedResult.messages.linkedin.follow_up}</p>
                              </div>
                            )}
                          </TabsContent>
                          <TabsContent value="whatsapp" className="mt-0">
                            {selectedResult.messages.whatsapp && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">Initial Message</Label>
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(selectedResult.messages!.whatsapp!.initial)}>
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <p className="text-sm bg-muted p-2 rounded">{selectedResult.messages.whatsapp.initial}</p>
                                <div className="flex items-center justify-between">
                                  <Label className="text-xs">Follow-up</Label>
                                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(selectedResult.messages!.whatsapp!.follow_up)}>
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <p className="text-sm bg-muted p-2 rounded">{selectedResult.messages.whatsapp.follow_up}</p>
                              </div>
                            )}
                          </TabsContent>
                        </ScrollArea>
                        {selectedResult.messages.suggested_follow_up_days && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Follow-up in {selectedResult.messages.suggested_follow_up_days} days
                          </div>
                        )}
                      </Tabs>
                    ) : selectedResult?.error ? (
                      <div className="flex items-center gap-2 text-red-500 py-4">
                        <AlertCircle className="h-4 w-4" />
                        <span>{selectedResult.error}</span>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        Select a lead to view messages
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setStep('preview')}>Back</Button>
                <Button onClick={saveLeadsToDatabase}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Import {parsedLeads.length} Leads to CRM
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
