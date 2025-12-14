import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
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
  Building2,
  ArrowUpRight,
  LayoutGrid,
  ChevronRight,
  FolderKanban,
  List,
} from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { useLeadCampaigns } from '@/hooks/useLeadCampaigns';
import { useAuth } from '@/contexts/SecureAuthContext';
import { CreateLeadDialog } from '@/components/Lead/CreateLeadDialog';
import { CreateCampaignDialog } from '@/components/Lead/CreateCampaignDialog';
import { CampaignCard } from '@/components/Lead/CampaignCard';
import { CampaignLeadsView } from '@/components/Lead/CampaignLeadsView';
import { OutreachImportDialog } from '@/components/Lead/OutreachImportDialog';

import BulkLeadWorkflowDialog from '@/components/Lead/BulkLeadWorkflowDialog';
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
  const { 
    campaigns, 
    isLoading: campaignsLoading, 
    createCampaign, 
    updateCampaign,
    uploadExcelFile,
    saveOutreachTemplate 
  } = useLeadCampaigns();
  const { isAdmin } = useAuth();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'pipeline' | 'campaigns'>('pipeline');
  const [campaignView, setCampaignView] = useState<'cards' | 'list'>('cards');
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  
  // Workflow state
  const [currentStep, setCurrentStep] = useState(1);
  
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  
  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showOutreachDialog, setShowOutreachDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  
  
  // Table filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const leadsPerPage = 10;
  

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
    <div className="w-full min-h-[calc(100vh-8rem)] py-6 px-4 sm:px-6 bg-muted/30">
      <Card className="p-6">
        <div className="space-y-4">

          {/* Header */}
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
          </div>

          {/* Floating Action Buttons */}
          <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full shadow-lg bg-background hover:bg-muted h-12 w-12 p-0"
              onClick={() => setShowOutreachDialog(true)}
              title="Import"
            >
              <Upload className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full shadow-lg bg-background hover:bg-muted h-12 w-12 p-0"
              onClick={() => setShowCampaignDialog(true)}
              title="New Campaign"
            >
              <FolderKanban className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              className="rounded-full shadow-lg h-14 w-14 p-0"
              onClick={() => setShowCreateDialog(true)}
              title="Add Lead"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>

          {/* Main Tabs: Pipeline & Campaigns */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pipeline' | 'campaigns')}>
          <TabsList>
            <TabsTrigger value="pipeline" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2">
              <FolderKanban className="h-4 w-4" />
              Campaigns
              <Badge variant="secondary" className="ml-1">{campaigns.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Pipeline Tab */}
          <TabsContent value="pipeline" className="mt-4">
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

                {/* Leads in this step - Table View */}
                <div className="pt-3 border-t border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {currentStepLeads.length} Lead{currentStepLeads.length !== 1 ? 's' : ''} in {currentStepData.name}
                    </h5>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Search..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="pl-8 h-8 w-40 text-sm"
                        />
                      </div>
                      {currentStepData?.key !== 'import' && (
                        <Select value={scoreFilter} onValueChange={setScoreFilter}>
                          <SelectTrigger className="h-8 w-[90px] text-sm">
                            <SelectValue placeholder="Score" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="hot">Hot</SelectItem>
                            <SelectItem value="warm">Warm</SelectItem>
                            <SelectItem value="cold">Cold</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-8 w-[100px] text-sm">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
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
                  </div>
                  
                  {(() => {
                    const filteredLeads = currentStepLeads.filter((lead) => {
                      const matchesSearch =
                        lead.name.toLowerCase().includes(search.toLowerCase()) ||
                        lead.email?.toLowerCase().includes(search.toLowerCase()) ||
                        lead.company?.toLowerCase().includes(search.toLowerCase());
                      const matchesScore = scoreFilter === 'all' || lead.score === scoreFilter;
                      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
                      return matchesSearch && matchesScore && matchesStatus;
                    });
                    
                    // Pagination
                    const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);
                    const paginatedLeads = filteredLeads.slice(
                      (currentPage - 1) * leadsPerPage,
                      currentPage * leadsPerPage
                    );
                    
                    if (paginatedLeads.length === 0) {
                      return (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          No leads found matching filters
                        </div>
                      );
                    }
                    
                    return (
                      <>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[150px]">Lead</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Mobile</TableHead>
                                <TableHead>Product Interest</TableHead>
                                {currentStepData?.key !== 'import' && <TableHead>Score</TableHead>}
                                <TableHead>Status</TableHead>
                                <TableHead>Last Contact</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedLeads.map((lead) => (
                                <TableRow 
                                  key={lead.id} 
                                  className="cursor-pointer hover:bg-muted/50"
                                  onClick={() => navigate(`/lead/${lead.id}`)}
                                >
                                  <TableCell>
                                    <p className="font-medium">{lead.name}</p>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1.5">
                                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="text-sm">{lead.company || '-'}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm text-muted-foreground">{lead.email || '-'}</span>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm text-muted-foreground">{lead.mobile || '-'}</span>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm">{lead.product_interest?.name || '-'}</span>
                                  </TableCell>
                                  {currentStepData?.key !== 'import' && (
                                    <TableCell>
                                      {lead.score && (
                                        <Badge className={cn("text-xs", LEAD_SCORE_COLORS[lead.score])}>
                                          {scoreIcons[lead.score]}
                                          <span className="ml-1 capitalize">{lead.score}</span>
                                        </Badge>
                                      )}
                                    </TableCell>
                                  )}
                                  <TableCell>
                                    {lead.status && (
                                      <Badge variant="outline" className={cn("text-xs capitalize", LEAD_STATUS_COLORS[lead.status])}>
                                        {lead.status}
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-xs text-muted-foreground">
                                      {lead.last_contacted_at 
                                        ? formatDistanceToNow(new Date(lead.last_contacted_at), { addSuffix: true })
                                        : 'Never'}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        
                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="flex justify-center mt-4">
                            <Pagination>
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                  />
                                </PaginationItem>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                  <PaginationItem key={page}>
                                    <PaginationLink
                                      onClick={() => setCurrentPage(page)}
                                      isActive={currentPage === page}
                                      className="cursor-pointer"
                                    >
                                      {page}
                                    </PaginationLink>
                                  </PaginationItem>
                                ))}
                                <PaginationItem>
                                  <PaginationNext 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                  />
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
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
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="mt-4">
            {selectedCampaign ? (
              <CampaignLeadsView
                campaign={campaigns.find(c => c.id === selectedCampaign)!}
                onBack={() => setSelectedCampaign(null)}
              />
            ) : (
              <div className="space-y-4">
                {/* View Toggle */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
                  </p>
                  <div className="flex items-center gap-1 bg-muted rounded-md p-1">
                    <Button
                      variant={campaignView === 'cards' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => setCampaignView('cards')}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={campaignView === 'list' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => setCampaignView('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Campaigns Grid/List */}
                {campaignView === 'cards' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {campaigns.map((campaign) => (
                      <CampaignCard
                        key={campaign.id}
                        campaign={campaign}
                        onClick={() => setSelectedCampaign(campaign.id)}
                        onStatusChange={(status) => updateCampaign(campaign.id, { status })}
                        onGenerateOutreach={() => {
                          // TODO: Open outreach generation dialog for campaign
                        }}
                      />
                    ))}
                    {campaigns.length === 0 && (
                      <div className="col-span-full text-center py-12 text-muted-foreground">
                        <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No campaigns yet</p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => setShowCampaignDialog(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Campaign
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campaign</TableHead>
                          <TableHead>Agent</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Leads</TableHead>
                          <TableHead>Progress</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>Expected</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaigns.map((campaign) => (
                          <TableRow
                            key={campaign.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setSelectedCampaign(campaign.id)}
                          >
                            <TableCell className="font-medium">{campaign.name}</TableCell>
                            <TableCell>{campaign.assigned_user?.name || 'Unassigned'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">{campaign.status}</Badge>
                            </TableCell>
                            <TableCell>{campaign.lead_count}</TableCell>
                            <TableCell>
                              {campaign.lead_count > 0 
                                ? `${Math.round((campaign.converted_count / campaign.lead_count) * 100)}%`
                                : '0%'}
                            </TableCell>
                            <TableCell>{format(new Date(campaign.start_date), 'MMM d, yyyy')}</TableCell>
                            <TableCell>
                              {campaign.expected_completion_date 
                                ? format(new Date(campaign.expected_completion_date), 'MMM d, yyyy')
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
          </Tabs>

        </div>
      </Card>


      {/* Dialogs */}
      <CreateLeadDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      <CreateCampaignDialog
        open={showCampaignDialog}
        onOpenChange={setShowCampaignDialog}
        onCreateCampaign={createCampaign}
        onUploadFile={uploadExcelFile}
      />
      <OutreachImportDialog 
        open={showOutreachDialog} 
        onOpenChange={setShowOutreachDialog}
        onImportComplete={() => window.location.reload()}
      />
      
      <BulkLeadWorkflowDialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen} leads={leads} />
    </div>
  );
};

export default LeadWorkflow;
