import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Upload, 
  Target, 
  Heart, 
  FileText, 
  UserCheck, 
  Check,
  MessageSquare,
  Phone,
  Mail,
  ArrowRight,
  Settings,
  Users,
  TestTube,
  Flame,
  ThermometerSun,
  Snowflake,
  Plus,
  Search,
  Filter,
  Building2,
  Calendar,
  ArrowUpRight,
  TableIcon,
  LayoutGrid,
  ChevronRight,
} from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/contexts/SecureAuthContext';
import { CreateLeadDialog } from '@/components/Lead/CreateLeadDialog';
import { OutreachImportDialog } from '@/components/Lead/OutreachImportDialog';
import LeadWorkflowSettingsDialog from '@/components/Lead/LeadWorkflowSettingsDialog';
import BulkLeadWorkflowDialog from '@/components/Lead/BulkLeadWorkflowDialog';
import { DailyLeadCheckBanner } from '@/components/Lead/DailyLeadCheckBanner';
import { LEAD_SCORE_COLORS, LEAD_STATUS_COLORS, type LeadScore, type Lead } from '@/types/lead';
import { format, formatDistanceToNow } from 'date-fns';

// Map lead status to workflow step
const STATUS_TO_STEP: Record<string, string> = {
  'new': 'import',
  'contacted': 'qualify',
  'qualified': 'nurture',
  'proposal': 'propose',
  'negotiation': 'propose',
  'converted': 'convert',
  'lost': 'convert',
};

interface WorkflowStep {
  id: number;
  key: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'upcoming';
  actions: {
    icon: React.ReactNode;
    label: string;
    description: string;
  }[];
}

const scoreIcons: Record<LeadScore, React.ReactNode> = {
  hot: <Flame className="h-3 w-3" />,
  warm: <ThermometerSun className="h-3 w-3" />,
  cold: <Snowflake className="h-3 w-3" />,
};

const LeadWorkflow = () => {
  const navigate = useNavigate();
  const { leads, loading, showDummyData, toggleDummyData } = useLeads();
  const { isAdmin } = useAuth();
  
  // Workflow state
  const [currentStep, setCurrentStep] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  
  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showOutreachDialog, setShowOutreachDialog] = useState(false);
  const [tableDrawerOpen, setTableDrawerOpen] = useState(false);
  
  // Table filters
  const [search, setSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Stats calculation
  const stats = useMemo(() => {
    const total = leads.length;
    const hot = leads.filter((l) => l.score === 'hot').length;
    const warm = leads.filter((l) => l.score === 'warm').length;
    const cold = leads.filter((l) => l.score === 'cold').length;
    const converted = leads.filter((l) => l.status === 'converted').length;
    const conversionRate = total > 0 ? ((converted / total) * 100).toFixed(1) : '0';
    return { total, hot, warm, cold, converted, conversionRate };
  }, [leads]);

  // Filtered leads for table
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(search.toLowerCase()) ||
        lead.email?.toLowerCase().includes(search.toLowerCase()) ||
        lead.company?.toLowerCase().includes(search.toLowerCase()) ||
        lead.mobile?.includes(search);
      const matchesScore = scoreFilter === 'all' || lead.score === scoreFilter;
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      return matchesSearch && matchesScore && matchesStatus;
    });
  }, [leads, search, scoreFilter, statusFilter]);

  // Count leads per workflow step
  const getLeadsPerStep = (stepKey: string): Lead[] => {
    return leads?.filter(lead => {
      const leadStep = STATUS_TO_STEP[lead.status] || 'import';
      return leadStep === stepKey;
    }) || [];
  };

  // Workflow steps definition
  const steps: WorkflowStep[] = [
    {
      id: 1,
      key: 'import',
      name: 'Import',
      description: 'Data entry from CSV, API, or manual',
      icon: <Upload className="h-5 w-5" />,
      status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'current' : 'upcoming',
      actions: [
        { icon: <Upload className="h-4 w-4" />, label: 'CSV Upload', description: 'Import from spreadsheet' },
        { icon: <ArrowRight className="h-4 w-4" />, label: 'API Sync', description: 'Apollo.io, LinkedIn' },
        { icon: <FileText className="h-4 w-4" />, label: 'Manual Entry', description: 'Add lead manually' },
      ]
    },
    {
      id: 2,
      key: 'qualify',
      name: 'Qualify',
      description: 'Score leads and assign to agents',
      icon: <Target className="h-5 w-5" />,
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'current' : 'upcoming',
      actions: [
        { icon: <Target className="h-4 w-4" />, label: 'Auto-Score', description: 'Hot/Warm/Cold based on value' },
        { icon: <UserCheck className="h-4 w-4" />, label: 'Assign Agent', description: 'Round-robin or manual' },
        { icon: <FileText className="h-4 w-4" />, label: 'Set Interest', description: 'Product/service interest' },
      ]
    },
    {
      id: 3,
      key: 'nurture',
      name: 'Nurture',
      description: 'Follow-up sequence over multiple days',
      icon: <Heart className="h-5 w-5" />,
      status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'current' : 'upcoming',
      actions: [
        { icon: <MessageSquare className="h-4 w-4" />, label: 'Day 0: WhatsApp', description: 'Welcome message' },
        { icon: <Phone className="h-4 w-4" />, label: 'Day 1: Call', description: 'Initial contact call' },
        { icon: <Mail className="h-4 w-4" />, label: 'Day 3: Email', description: 'Send proposal/portal link' },
      ]
    },
    {
      id: 4,
      key: 'propose',
      name: 'Propose',
      description: 'Send offers and negotiate terms',
      icon: <FileText className="h-5 w-5" />,
      status: currentStep > 4 ? 'completed' : currentStep === 4 ? 'current' : 'upcoming',
      actions: [
        { icon: <FileText className="h-4 w-4" />, label: 'Generate Offer', description: 'AI-powered messaging' },
        { icon: <MessageSquare className="h-4 w-4" />, label: 'Send Proposal', description: 'Email or portal' },
        { icon: <Phone className="h-4 w-4" />, label: 'Negotiate', description: 'Handle objections' },
      ]
    },
    {
      id: 5,
      key: 'convert',
      name: 'Convert',
      description: 'Transform lead into customer',
      icon: <UserCheck className="h-5 w-5" />,
      status: currentStep > 5 ? 'completed' : currentStep === 5 ? 'current' : 'upcoming',
      actions: [
        { icon: <UserCheck className="h-4 w-4" />, label: 'Create Customer', description: 'New customer record' },
        { icon: <FileText className="h-4 w-4" />, label: 'Select Services', description: 'Products purchased' },
        { icon: <Mail className="h-4 w-4" />, label: 'Onboarding', description: 'Portal access & docs' },
      ]
    },
  ];

  const getStepStyles = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-primary text-primary-foreground';
      case 'current':
        return 'bg-primary/20 text-primary border-2 border-primary';
      case 'upcoming':
        return 'bg-muted text-muted-foreground';
    }
  };

  const getConnectorStyles = (status: WorkflowStep['status']) => {
    return status === 'completed' ? 'bg-primary' : 'bg-muted';
  };

  const currentStepData = steps.find(s => s.id === currentStep);
  const currentStepLeads = currentStepData ? getLeadsPerStep(currentStepData.key) : [];

  return (
    <>
      <div className="space-y-4 pb-6">
        {/* Daily Lead Check Banner */}
        <DailyLeadCheckBanner 
          hotCount={stats.hot} 
          warmCount={stats.warm} 
          coldCount={stats.cold}
          convertedCount={stats.converted}
        />

        {/* Header with Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Lead Workflow
            </h1>
            <p className="text-muted-foreground text-sm">
              From import to customer conversion
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-md border">
                <TestTube className="h-4 w-4 text-amber-500" />
                <Label htmlFor="demo-mode" className="text-xs text-muted-foreground cursor-pointer">Demo</Label>
                <Switch
                  id="demo-mode"
                  checked={showDummyData}
                  onCheckedChange={toggleDummyData}
                  className="scale-75"
                />
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => setTableDrawerOpen(true)}>
              <TableIcon className="h-4 w-4 mr-2" />
              Table View
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowOutreachDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* Stats Row - Compact */}
        <div className="grid grid-cols-5 gap-3">
          <Card className="p-3">
            <div className="text-xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </Card>
          <Card className="p-3 border-red-200 bg-red-50/50 dark:bg-red-950/20">
            <div className="flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-red-500" />
              <span className="text-xl font-bold text-red-700 dark:text-red-400">{stats.hot}</span>
            </div>
            <div className="text-xs text-muted-foreground">Hot</div>
          </Card>
          <Card className="p-3 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
            <div className="flex items-center gap-1.5">
              <ThermometerSun className="h-4 w-4 text-amber-500" />
              <span className="text-xl font-bold text-amber-700 dark:text-amber-400">{stats.warm}</span>
            </div>
            <div className="text-xs text-muted-foreground">Warm</div>
          </Card>
          <Card className="p-3 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
            <div className="flex items-center gap-1.5">
              <Snowflake className="h-4 w-4 text-blue-500" />
              <span className="text-xl font-bold text-blue-700 dark:text-blue-400">{stats.cold}</span>
            </div>
            <div className="text-xs text-muted-foreground">Cold</div>
          </Card>
          <Card className="p-3 border-green-200 bg-green-50/50 dark:bg-green-950/20">
            <div className="text-xl font-bold text-green-700 dark:text-green-400">{stats.conversionRate}%</div>
            <div className="text-xs text-muted-foreground">Converted</div>
          </Card>
        </div>

        {/* Workflow Pipeline */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LayoutGrid className="h-5 w-5 text-primary" />
                <span className="font-semibold">Pipeline Stages</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setBulkDialogOpen(true)}>
                  <Users className="h-4 w-4 mr-1" />
                  Bulk Move
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stepper */}
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                        getStepStyles(step.status),
                        "group-hover:scale-110"
                      )}
                    >
                      {step.status === 'completed' ? <Check className="h-5 w-5" /> : step.icon}
                    </div>
                    <div className="text-center">
                      <p className={cn(
                        "text-sm font-medium",
                        step.status === 'current' ? 'text-primary' : 'text-muted-foreground'
                      )}>
                        {step.name}
                      </p>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-xs",
                          getLeadsPerStep(step.key).length > 0 
                            ? "bg-primary/10 text-primary" 
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {getLeadsPerStep(step.key).length}
                      </Badge>
                    </div>
                  </button>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "flex-1 h-1 mx-2 rounded-full",
                      getConnectorStyles(steps[index + 1].status === 'completed' || steps[index + 1].status === 'current' ? 'completed' : 'upcoming')
                    )} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Current Step Details */}
            {currentStepData && (
              <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {currentStepData.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold">{currentStepData.name}</h4>
                    <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {currentStepData.actions.map((action, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-background rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-primary/10 text-primary">
                          {action.icon}
                        </div>
                        <div>
                          <span className="text-sm font-medium">{action.label}</span>
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Leads in this step */}
                {currentStepLeads.length > 0 && (
                  <div className="pt-3 border-t border-border/50">
                    <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {currentStepLeads.length} Lead{currentStepLeads.length !== 1 ? 's' : ''} in {currentStepData.name}
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {currentStepLeads.slice(0, 8).map((lead) => (
                        <div 
                          key={lead.id}
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          className="p-2 bg-background rounded-lg border border-border/50 hover:border-primary/30 cursor-pointer transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium truncate">{lead.name}</span>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs capitalize ml-1",
                                lead.score === 'hot' && "bg-destructive/10 text-destructive border-destructive/30",
                                lead.score === 'warm' && "bg-amber-500/10 text-amber-600 border-amber-300",
                                lead.score === 'cold' && "bg-blue-500/10 text-blue-600 border-blue-300"
                              )}
                            >
                              {lead.score}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{lead.company}</p>
                          {lead.estimated_value && (
                            <p className="text-xs text-primary font-medium mt-0.5">
                              AED {lead.estimated_value.toLocaleString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    {currentStepLeads.length > 8 && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        +{currentStepLeads.length - 8} more leads
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              <Button
                size="sm"
                onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
                disabled={currentStep === 5}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table View Drawer */}
      <Sheet open={tableDrawerOpen} onOpenChange={setTableDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <TableIcon className="h-5 w-5" />
              All Leads ({filteredLeads.length})
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-4 space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={scoreFilter} onValueChange={setScoreFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scores</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No leads found.</div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lead</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <TableRow
                        key={lead.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setTableDrawerOpen(false);
                          navigate(`/leads/${lead.id}`);
                        }}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">{lead.name}</div>
                            {lead.company && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {lead.company}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(LEAD_SCORE_COLORS[lead.score], "flex items-center gap-1 w-fit")}
                          >
                            {scoreIcons[lead.score]}
                            <span className="capitalize">{lead.score}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(LEAD_STATUS_COLORS[lead.status], "capitalize")}>
                            {lead.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {lead.estimated_value ? (
                            <span className="text-sm font-medium text-primary">
                              AED {lead.estimated_value.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialogs */}
      <CreateLeadDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      <OutreachImportDialog 
        open={showOutreachDialog} 
        onOpenChange={setShowOutreachDialog}
        onImportComplete={() => window.location.reload()}
      />
      <LeadWorkflowSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <BulkLeadWorkflowDialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen} leads={leads} />
    </>
  );
};

export default LeadWorkflow;
