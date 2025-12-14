import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Save,
  Trash2,
  UserCheck,
  User,
  Phone,
  MessageCircle,
  Mail,
  Users,
  FileText,
  Calendar,
  Building2,
  Flame,
  ThermometerSun,
  Snowflake,
  Linkedin,
  Copy,
  Check,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLeads, useLeadActivities } from '@/hooks/useLeads';
import { useAuth } from '@/contexts/SecureAuthContext';
import {
  LEAD_SCORE_COLORS,
  LEAD_STATUS_COLORS,
  ACTIVITY_TYPES,
  LEAD_SOURCES,
  type Lead,
  type LeadScore,
  type LeadStatus,
} from '@/types/lead';
import { format, formatDistanceToNow } from 'date-fns';
import { LeadFollowupTimeline } from '@/components/Lead/LeadFollowupTimeline';
import { LeadConversionDialog, ConversionOptions } from '@/components/Lead/LeadConversionDialog';

// Workflow step configuration
const WORKFLOW_STEPS = [
  { key: 'import', label: 'Import', order: 1 },
  { key: 'qualify', label: 'Qualify', order: 2 },
  { key: 'nurture', label: 'Nurture', order: 3 },
  { key: 'propose', label: 'Propose', order: 4 },
  { key: 'convert', label: 'Convert', order: 5 },
];

// Define which sections are visible for each workflow stage
// Import: Internal data prep - add missing info, clean data (NO customer contact)
// Qualify: Internal validation - check category, product interest, fix issues (NO customer contact)
// Nurture: Actual outreach starts from Day 0 - welcome message, follow-up sequence
// Propose: Send proposal/quote
// Convert: Ready to convert to customer
const STAGE_VISIBILITY: Record<string, {
  leadInfo: boolean;
  scoreStatus: boolean;
  quickInfo: boolean;
  followupTimeline: boolean;
  logActivity: boolean;
  activityHistory: boolean;
  outreachMessages: boolean;
  convertButton: boolean;
}> = {
  import: {
    leadInfo: true, // Edit and clean lead data
    scoreStatus: false, // Not assessing yet
    quickInfo: true,
    followupTimeline: false, // No outreach yet - internal prep stage
    logActivity: true, // Log internal notes only
    activityHistory: true, // See any notes
    outreachMessages: false, // NO outreach - internal data prep only
    convertButton: false,
  },
  qualify: {
    leadInfo: true, // Fix category, product interest, etc.
    scoreStatus: true, // Assess lead fitness
    quickInfo: true,
    followupTimeline: false, // No outreach yet - internal validation stage
    logActivity: true, // Log internal notes
    activityHistory: true,
    outreachMessages: false, // NO outreach - internal validation only
    convertButton: false,
  },
  nurture: {
    leadInfo: true,
    scoreStatus: true,
    quickInfo: true,
    followupTimeline: true, // Day 0 outreach starts here!
    logActivity: true,
    activityHistory: true,
    outreachMessages: true, // Start sending outreach messages
    convertButton: false,
  },
  propose: {
    leadInfo: true,
    scoreStatus: true,
    quickInfo: true,
    followupTimeline: true,
    logActivity: true,
    activityHistory: true,
    outreachMessages: true,
    convertButton: false,
  },
  convert: {
    leadInfo: true,
    scoreStatus: true,
    quickInfo: true,
    followupTimeline: true,
    logActivity: true,
    activityHistory: true,
    outreachMessages: true,
    convertButton: true,
  },
};

const activityIcons: Record<string, React.ReactNode> = {
  call: <Phone className="h-4 w-4" />,
  whatsapp: <MessageCircle className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  meeting: <Users className="h-4 w-4" />,
  note: <FileText className="h-4 w-4" />,
};

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const { updateLead, deleteLead, convertToCustomer } = useLeads();
  const { activities, addActivity } = useLeadActivities(id);

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [activityType, setActivityType] = useState('call');
  const [activityDescription, setActivityDescription] = useState('');
  const [loggingActivity, setLoggingActivity] = useState(false);
  const [showConversionDialog, setShowConversionDialog] = useState(false);
  const [converting, setConverting] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [messageVersion, setMessageVersion] = useState<'professional' | 'friendly' | 'custom'>('professional');
  const [regeneratingMessages, setRegeneratingMessages] = useState(false);
  const [customMessage, setCustomMessage] = useState({
    email: { subject: '', body: '' },
    linkedin: '',
    whatsapp: ''
  });
  const [savingCustom, setSavingCustom] = useState(false);
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState<string>('import');

  // Get workflow step from URL param or fetch from database
  const stageFromUrl = searchParams.get('stage');

  // Determine current stage visibility config
  const stageVisibility = useMemo(() => {
    const stage = stageFromUrl || currentWorkflowStep || 'import';
    return STAGE_VISIBILITY[stage] || STAGE_VISIBILITY.import;
  }, [stageFromUrl, currentWorkflowStep]);

  // Get current step info for display
  const currentStepInfo = useMemo(() => {
    const stage = stageFromUrl || currentWorkflowStep || 'import';
    return WORKFLOW_STEPS.find(s => s.key === stage) || WORKFLOW_STEPS[0];
  }, [stageFromUrl, currentWorkflowStep]);

  // Dummy leads data for demo mode
  const dummyLeads: Lead[] = [
    {
      id: 'dummy-1',
      reference_number: 99901,
      name: 'Ahmed Al Mansouri',
      email: 'ahmed.mansouri@example.com',
      mobile: '+971501234567',
      company: 'Gulf Trading LLC',
      source: 'Referral',
      status: 'new',
      score: 'hot',
      notes: 'Interested in company formation for import/export business',
      estimated_value: 75000,
      next_follow_up: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date().toISOString(),
      product_interest_id: null,
      assigned_to: null,
      last_contacted_at: null,
      converted_customer_id: null,
      converted_at: null,
    },
    {
      id: 'dummy-2',
      reference_number: 99902,
      name: 'Sarah Johnson',
      email: 'sarah.j@techstartup.io',
      mobile: '+971551234567',
      company: 'TechStartup DMCC',
      source: 'Website',
      status: 'contacted',
      score: 'warm',
      notes: 'Looking for home finance options for villa purchase',
      estimated_value: 45000,
      next_follow_up: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date().toISOString(),
      product_interest_id: null,
      assigned_to: null,
      last_contacted_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      converted_customer_id: null,
      converted_at: null,
    },
    {
      id: 'dummy-3',
      reference_number: 99903,
      name: 'Mohammed Rashid',
      email: 'mrashid@goldgroup.ae',
      mobile: '+971521234567',
      company: 'Gold Group Holdings',
      source: 'LinkedIn',
      status: 'qualified',
      score: 'hot',
      notes: 'Multiple bank account requirements for group companies',
      estimated_value: 120000,
      next_follow_up: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      updated_at: new Date().toISOString(),
      product_interest_id: null,
      assigned_to: null,
      last_contacted_at: new Date(Date.now() - 86400000).toISOString(),
      converted_customer_id: null,
      converted_at: null,
    },
    {
      id: 'dummy-4',
      reference_number: 99904,
      name: 'Lisa Chen',
      email: 'lisa.chen@asiainvest.com',
      mobile: '+971561234567',
      company: 'Asia Investment Partners',
      source: 'Cold Call',
      status: 'proposal',
      score: 'warm',
      notes: 'Needs corporate tax registration and VAT services',
      estimated_value: 35000,
      next_follow_up: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      updated_at: new Date().toISOString(),
      product_interest_id: null,
      assigned_to: null,
      last_contacted_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      converted_customer_id: null,
      converted_at: null,
    },
    {
      id: 'dummy-5',
      reference_number: 99905,
      name: 'Omar Khalil',
      email: 'omar@constructpro.ae',
      mobile: '+971541234567',
      company: 'ConstructPro LLC',
      source: 'Event',
      status: 'new',
      score: 'cold',
      notes: 'Met at Dubai Business Forum, initial interest in accounting services',
      estimated_value: 8000,
      next_follow_up: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      product_interest_id: null,
      assigned_to: null,
      last_contacted_at: null,
      converted_customer_id: null,
      converted_at: null,
    },
    {
      id: 'dummy-6',
      reference_number: 99906,
      name: 'Fatima Al Zaabi',
      email: 'fatima@luxuryproperties.ae',
      mobile: '+971581234567',
      company: 'Luxury Properties FZE',
      source: 'Partner',
      status: 'negotiation',
      score: 'hot',
      notes: 'Ready to proceed with full corporate services package',
      estimated_value: 95000,
      next_follow_up: new Date().toISOString().split('T')[0],
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
      updated_at: new Date().toISOString(),
      product_interest_id: null,
      assigned_to: null,
      last_contacted_at: new Date(Date.now() - 86400000).toISOString(),
      converted_customer_id: null,
      converted_at: null,
    },
  ];

  const isDummyLead = id?.startsWith('dummy-');

  useEffect(() => {
    if (!id) return;

    // Handle dummy leads
    if (isDummyLead) {
      const dummyLead = dummyLeads.find(l => l.id === id);
      if (dummyLead) {
        setLead(dummyLead);
        setLoading(false);
      } else {
        toast({
          title: 'Error',
          description: 'Lead not found',
          variant: 'destructive',
        });
        navigate('/leads');
      }
      return;
    }

    const fetchLead = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          assigned_user:profiles!leads_assigned_to_fkey(id, name, email),
          product_interest:products!leads_product_interest_id_fkey(id, name)
        `)
        .eq('id', id)
        .single();

      if (error) {
        toast({
          title: 'Error',
          description: 'Lead not found',
          variant: 'destructive',
        });
        navigate('/leads');
        return;
      }

      setLead(data as unknown as Lead);
      setLoading(false);

      // Fetch workflow step to determine current stage
      const { data: workflowSteps } = await supabase
        .from('lead_workflow_steps')
        .select('step_key, status')
        .eq('lead_id', id)
        .order('step_order', { ascending: false });

      if (workflowSteps && workflowSteps.length > 0) {
        // Find the highest completed or in_progress step
        const activeStep = workflowSteps.find(s => s.status === 'in_progress') 
          || workflowSteps.find(s => s.status === 'completed')
          || workflowSteps[workflowSteps.length - 1];
        if (activeStep) {
          setCurrentWorkflowStep(activeStep.step_key);
        }
      }
    };

    fetchLead();

    // Fetch products and users (only for real leads)
    if (!isDummyLead) {
      supabase
        .from('products')
        .select('id, name')
        .eq('is_active', true)
        .then(({ data }) => setProducts(data || []));

      supabase
        .from('profiles')
        .select('id, name')
        .eq('is_active', true)
        .then(({ data }) => setUsers(data || []));
    }
  }, [id, navigate, toast, isDummyLead]);

  // Load existing custom messages when lead changes
  useEffect(() => {
    if (lead && (lead as any).outreach_messages?.custom) {
      const custom = (lead as any).outreach_messages.custom;
      setCustomMessage({
        email: custom.email || { subject: '', body: '' },
        linkedin: custom.linkedin || '',
        whatsapp: custom.whatsapp || ''
      });
    }
  }, [lead]);

  const handleSave = async () => {
    if (!lead || !id) return;

    setSaving(true);
    const success = await updateLead(id, {
      name: lead.name,
      email: lead.email,
      mobile: lead.mobile,
      company: lead.company,
      source: lead.source,
      score: lead.score,
      status: lead.status,
      notes: lead.notes,
      product_interest_id: lead.product_interest_id,
      assigned_to: lead.assigned_to,
      estimated_value: lead.estimated_value,
      next_follow_up: lead.next_follow_up,
    });
    setSaving(false);

    if (success) {
      // Refetch lead
      const { data } = await supabase
        .from('leads')
        .select(`
          *,
          assigned_user:profiles!leads_assigned_to_fkey(id, name, email),
          product_interest:products!leads_product_interest_id_fkey(id, name)
        `)
        .eq('id', id)
        .single();
      if (data) setLead(data as unknown as Lead);
    }
  };

  const handleRegenerateMessages = async () => {
    if (!lead || !id) return;
    
    setRegeneratingMessages(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-outreach-messages', {
        body: {
          leads: [{
            name: lead.name,
            company: lead.company,
            city: (lead as any).city,
            state: (lead as any).state,
            industry: (lead as any).industry,
            email: lead.email,
            linkedin_profile: (lead as any).linkedin_profile,
            dubai_setup_likelihood: (lead as any).dubai_setup_likelihood,
            preferred_contact_method: (lead as any).preferred_contact_method,
            indicator: (lead as any).indicator,
          }]
        }
      });

      if (error) throw error;

      const result = data?.results?.[0];
      if (result?.success && result?.messages) {
        // Update lead with new messages
        const { error: updateError } = await supabase
          .from('leads')
          .update({ outreach_messages: result.messages })
          .eq('id', id);

        if (updateError) throw updateError;

        // Refetch lead to get updated data
        const { data: refreshedLead } = await supabase
          .from('leads')
          .select(`
            *,
            assigned_user:profiles!leads_assigned_to_fkey(id, name, email),
            product_interest:products!leads_product_interest_id_fkey(id, name)
          `)
          .eq('id', id)
          .single();
        
        if (refreshedLead) setLead(refreshedLead as unknown as Lead);

        toast({
          title: 'Messages Regenerated',
          description: 'Outreach messages have been updated with Professional and Friendly versions.',
        });
      } else {
        throw new Error(result?.error || 'Failed to generate messages');
      }
    } catch (error: any) {
      console.error('Error regenerating messages:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to regenerate messages',
        variant: 'destructive',
      });
    } finally {
      setRegeneratingMessages(false);
    }
  };

  const handleSaveCustomMessage = async () => {
    if (!lead || !id) return;
    
    setSavingCustom(true);
    try {
      const existingMessages = (lead as any).outreach_messages || {};
      const updatedMessages = {
        ...existingMessages,
        custom: {
          email: customMessage.email,
          linkedin: customMessage.linkedin,
          whatsapp: customMessage.whatsapp
        }
      };

      const { error } = await supabase
        .from('leads')
        .update({ outreach_messages: updatedMessages })
        .eq('id', id);

      if (error) throw error;

      // Refetch lead
      const { data: refreshedLead } = await supabase
        .from('leads')
        .select(`
          *,
          assigned_user:profiles!leads_assigned_to_fkey(id, name, email),
          product_interest:products!leads_product_interest_id_fkey(id, name)
        `)
        .eq('id', id)
        .single();
      
      if (refreshedLead) setLead(refreshedLead as unknown as Lead);

      toast({
        title: 'Custom Message Saved',
        description: 'Your custom outreach message has been saved.',
      });
    } catch (error: any) {
      console.error('Error saving custom message:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save custom message',
        variant: 'destructive',
      });
    } finally {
      setSavingCustom(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const success = await deleteLead(id);
    if (success) navigate('/leads');
  };

  const handleConvert = async (leadToConvert: Lead, options: ConversionOptions) => {
    if (!leadToConvert) return;
    setConverting(true);
    const customer = await convertToCustomer(leadToConvert, options);
    setConverting(false);
    if (customer) {
      setShowConversionDialog(false);
      navigate(`/customers/${customer.id}`);
    }
  };

  const handleLogActivity = async () => {
    if (!activityDescription.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter activity description',
        variant: 'destructive',
      });
      return;
    }

    setLoggingActivity(true);
    const success = await addActivity({
      activity_type: activityType,
      description: activityDescription,
      created_by: user?.id,
    });
    setLoggingActivity(false);

    if (success) {
      setActivityDescription('');
    }
  };

  if (loading || !lead) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const isConverted = lead.status === 'converted';

  return (
    <div className="space-y-6 py-6">
        {/* Workflow Stage Indicator */}
        <div className="flex items-center gap-1 p-3 bg-muted/30 rounded-lg overflow-x-auto">
          {WORKFLOW_STEPS.map((step, index) => {
            const isActive = step.key === currentStepInfo.key;
            const isPast = step.order < currentStepInfo.order;
            return (
              <div key={step.key} className="flex items-center">
                <button
                  onClick={() => navigate(`/leads/${id}?stage=${step.key}`)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : isPast 
                        ? 'bg-primary/20 text-primary hover:bg-primary/30' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {step.label}
                </button>
                {index < WORKFLOW_STEPS.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground mx-1 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/lead-workflow')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{lead.name}</h1>
              <p className="text-sm text-muted-foreground">
                Lead #{lead.reference_number} • Created{' '}
                {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                <Badge variant="outline" className="ml-2">{currentStepInfo.label}</Badge>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {stageVisibility.convertButton && !isConverted && (
              <Button onClick={() => setShowConversionDialog(true)} variant="outline" className="text-green-600">
                <UserCheck className="h-4 w-4 mr-2" />
                Convert to Customer
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this lead? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Outreach Messages (Primary action for contacting) */}
            <div className="lg:col-span-2 space-y-6">
            {/* Outreach Messages - visible based on stage */}
            {stageVisibility.outreachMessages && (lead as any).outreach_messages ? (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Outreach Messages
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRegenerateMessages}
                      disabled={regeneratingMessages}
                    >
                      <RefreshCw className={`h-4 w-4 ${regeneratingMessages ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Check if new format with professional/friendly versions */}
                  {(lead as any).outreach_messages.professional ? (
                    <Tabs value={messageVersion} onValueChange={(v) => setMessageVersion(v as 'professional' | 'friendly' | 'custom')}>
                      <TabsList className="grid w-full grid-cols-3 mb-3">
                        <TabsTrigger value="professional" className="text-xs">Pro</TabsTrigger>
                        <TabsTrigger value="friendly" className="text-xs">Friendly</TabsTrigger>
                        <TabsTrigger value="custom" className="text-xs">Custom</TabsTrigger>
                      </TabsList>
                      
                      {['professional', 'friendly'].map((version) => (
                        <TabsContent key={version} value={version} className="mt-0">
                          <Accordion type="single" collapsible className="w-full">
                            {/* Email */}
                            {(lead as any).outreach_messages[version]?.email && (
                              <AccordionItem value="email">
                                <AccordionTrigger className="text-sm">
                                  <span className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Email
                                  </span>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-2">
                                    <div className="text-xs text-muted-foreground font-medium">Subject:</div>
                                    <p className="text-sm bg-muted/50 p-2 rounded">{(lead as any).outreach_messages[version].email.subject}</p>
                                    <div className="text-xs text-muted-foreground font-medium mt-2">Body:</div>
                                    <p className="text-sm bg-muted/50 p-2 rounded whitespace-pre-wrap">{(lead as any).outreach_messages[version].email.body}</p>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="w-full mt-2"
                                      onClick={() => {
                                        const text = `Subject: ${(lead as any).outreach_messages[version].email.subject}\n\n${(lead as any).outreach_messages[version].email.body}`;
                                        navigator.clipboard.writeText(text);
                                        setCopiedMessage(`email-${version}`);
                                        setTimeout(() => setCopiedMessage(null), 2000);
                                      }}
                                    >
                                      {copiedMessage === `email-${version}` ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                                      {copiedMessage === `email-${version}` ? 'Copied!' : 'Copy'}
                                    </Button>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            )}
                            
                            {/* LinkedIn */}
                            {(lead as any).outreach_messages[version]?.linkedin && (
                              <AccordionItem value="linkedin">
                                <AccordionTrigger className="text-sm">
                                  <span className="flex items-center gap-2">
                                    <Linkedin className="h-4 w-4" />
                                    LinkedIn
                                  </span>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-3">
                                    {(lead as any).outreach_messages[version].linkedin.connection_note && (
                                      <div>
                                        <div className="text-xs text-muted-foreground font-medium mb-1">Connection Note:</div>
                                        <p className="text-sm bg-muted/50 p-2 rounded whitespace-pre-wrap">{(lead as any).outreach_messages[version].linkedin.connection_note}</p>
                                      </div>
                                    )}
                                    {(lead as any).outreach_messages[version].linkedin.follow_up && (
                                      <div>
                                        <div className="text-xs text-muted-foreground font-medium mb-1">Follow-up:</div>
                                        <p className="text-sm bg-muted/50 p-2 rounded whitespace-pre-wrap">{(lead as any).outreach_messages[version].linkedin.follow_up}</p>
                                      </div>
                                    )}
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full mt-2"
                                    onClick={() => {
                                      const linkedinMsg = (lead as any).outreach_messages[version].linkedin;
                                      const text = `Connection Note:\n${linkedinMsg.connection_note || ''}\n\nFollow-up:\n${linkedinMsg.follow_up || ''}`;
                                      navigator.clipboard.writeText(text);
                                      setCopiedMessage(`linkedin-${version}`);
                                      setTimeout(() => setCopiedMessage(null), 2000);
                                    }}
                                  >
                                    {copiedMessage === `linkedin-${version}` ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                                    {copiedMessage === `linkedin-${version}` ? 'Copied!' : 'Copy'}
                                  </Button>
                                </AccordionContent>
                              </AccordionItem>
                            )}
                            
                            {/* WhatsApp */}
                            {(lead as any).outreach_messages[version]?.whatsapp && (
                              <AccordionItem value="whatsapp">
                                <AccordionTrigger className="text-sm">
                                  <span className="flex items-center gap-2">
                                    <MessageCircle className="h-4 w-4" />
                                    WhatsApp
                                  </span>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-3">
                                    {(lead as any).outreach_messages[version].whatsapp.initial && (
                                      <div>
                                        <div className="text-xs text-muted-foreground font-medium mb-1">Initial:</div>
                                        <p className="text-sm bg-muted/50 p-2 rounded whitespace-pre-wrap">{(lead as any).outreach_messages[version].whatsapp.initial}</p>
                                      </div>
                                    )}
                                    {(lead as any).outreach_messages[version].whatsapp.follow_up && (
                                      <div>
                                        <div className="text-xs text-muted-foreground font-medium mb-1">Follow-up:</div>
                                        <p className="text-sm bg-muted/50 p-2 rounded whitespace-pre-wrap">{(lead as any).outreach_messages[version].whatsapp.follow_up}</p>
                                      </div>
                                    )}
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full mt-2"
                                    onClick={() => {
                                      const waMsg = (lead as any).outreach_messages[version].whatsapp;
                                      const text = `Initial:\n${waMsg.initial || ''}\n\nFollow-up:\n${waMsg.follow_up || ''}`;
                                      navigator.clipboard.writeText(text);
                                      setCopiedMessage(`whatsapp-${version}`);
                                      setTimeout(() => setCopiedMessage(null), 2000);
                                    }}
                                  >
                                    {copiedMessage === `whatsapp-${version}` ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                                    {copiedMessage === `whatsapp-${version}` ? 'Copied!' : 'Copy'}
                                  </Button>
                                </AccordionContent>
                              </AccordionItem>
                            )}
                          </Accordion>
                        </TabsContent>
                      ))}
                      
                      {/* Custom Messages Tab */}
                      <TabsContent value="custom" className="mt-0">
                        <div className="space-y-4">
                          {/* Email */}
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-sm font-medium">
                              <Mail className="h-4 w-4" />
                              Email
                            </Label>
                            <Input
                              placeholder="Subject..."
                              value={customMessage.email.subject}
                              onChange={(e) => setCustomMessage(prev => ({
                                ...prev,
                                email: { ...prev.email, subject: e.target.value }
                              }))}
                            />
                            <Textarea
                              placeholder="Write your email message..."
                              value={customMessage.email.body}
                              onChange={(e) => setCustomMessage(prev => ({
                                ...prev,
                                email: { ...prev.email, body: e.target.value }
                              }))}
                              rows={4}
                            />
                          </div>
                          
                          {/* LinkedIn */}
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-sm font-medium">
                              <Linkedin className="h-4 w-4" />
                              LinkedIn
                            </Label>
                            <Textarea
                              placeholder="Write your LinkedIn message..."
                              value={customMessage.linkedin}
                              onChange={(e) => setCustomMessage(prev => ({
                                ...prev,
                                linkedin: e.target.value
                              }))}
                              rows={3}
                            />
                          </div>
                          
                          {/* WhatsApp */}
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-sm font-medium">
                              <MessageCircle className="h-4 w-4" />
                              WhatsApp
                            </Label>
                            <Textarea
                              placeholder="Write your WhatsApp message..."
                              value={customMessage.whatsapp}
                              onChange={(e) => setCustomMessage(prev => ({
                                ...prev,
                                whatsapp: e.target.value
                              }))}
                              rows={3}
                            />
                          </div>
                          
                          <Button
                            onClick={handleSaveCustomMessage}
                            disabled={savingCustom}
                            className="w-full"
                          >
                            {savingCustom ? 'Saving...' : 'Save Custom Messages'}
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    /* Legacy format - backward compatible */
                    <Accordion type="single" collapsible className="w-full">
                      {(lead as any).outreach_messages.email && (
                        <AccordionItem value="email">
                          <AccordionTrigger className="text-sm">
                            <span className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              Email
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2">
                              <div className="text-xs text-muted-foreground font-medium">Subject:</div>
                              <p className="text-sm bg-muted/50 p-2 rounded">{(lead as any).outreach_messages.email.subject}</p>
                              <div className="text-xs text-muted-foreground font-medium mt-2">Body:</div>
                              <p className="text-sm bg-muted/50 p-2 rounded whitespace-pre-wrap">{(lead as any).outreach_messages.email.body}</p>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full mt-2"
                                onClick={() => {
                                  const text = `Subject: ${(lead as any).outreach_messages.email.subject}\n\n${(lead as any).outreach_messages.email.body}`;
                                  navigator.clipboard.writeText(text);
                                  setCopiedMessage('email');
                                  setTimeout(() => setCopiedMessage(null), 2000);
                                }}
                              >
                                {copiedMessage === 'email' ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                                {copiedMessage === 'email' ? 'Copied!' : 'Copy'}
                              </Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )}
                      {(lead as any).outreach_messages.linkedin && (
                        <AccordionItem value="linkedin">
                          <AccordionTrigger className="text-sm">
                            <span className="flex items-center gap-2">
                              <Linkedin className="h-4 w-4" />
                              LinkedIn
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            {typeof (lead as any).outreach_messages.linkedin === 'string' ? (
                              <p className="text-sm bg-muted/50 p-2 rounded whitespace-pre-wrap">{(lead as any).outreach_messages.linkedin}</p>
                            ) : (
                              <div className="space-y-3">
                                {(lead as any).outreach_messages.linkedin.connection_note && (
                                  <div>
                                    <div className="text-xs text-muted-foreground font-medium mb-1">Connection Note:</div>
                                    <p className="text-sm bg-muted/50 p-2 rounded whitespace-pre-wrap">{(lead as any).outreach_messages.linkedin.connection_note}</p>
                                  </div>
                                )}
                                {(lead as any).outreach_messages.linkedin.follow_up && (
                                  <div>
                                    <div className="text-xs text-muted-foreground font-medium mb-1">Follow-up:</div>
                                    <p className="text-sm bg-muted/50 p-2 rounded whitespace-pre-wrap">{(lead as any).outreach_messages.linkedin.follow_up}</p>
                                  </div>
                                )}
                              </div>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full mt-2"
                              onClick={() => {
                                const linkedinMsg = (lead as any).outreach_messages.linkedin;
                                const text = typeof linkedinMsg === 'string' 
                                  ? linkedinMsg 
                                  : `Connection Note:\n${linkedinMsg.connection_note || ''}\n\nFollow-up:\n${linkedinMsg.follow_up || ''}`;
                                navigator.clipboard.writeText(text);
                                setCopiedMessage('linkedin');
                                setTimeout(() => setCopiedMessage(null), 2000);
                              }}
                            >
                              {copiedMessage === 'linkedin' ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                              {copiedMessage === 'linkedin' ? 'Copied!' : 'Copy'}
                            </Button>
                          </AccordionContent>
                        </AccordionItem>
                      )}
                      {(lead as any).outreach_messages.whatsapp && (
                        <AccordionItem value="whatsapp">
                          <AccordionTrigger className="text-sm">
                            <span className="flex items-center gap-2">
                              <MessageCircle className="h-4 w-4" />
                              WhatsApp
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            {typeof (lead as any).outreach_messages.whatsapp === 'string' ? (
                              <p className="text-sm bg-muted/50 p-2 rounded whitespace-pre-wrap">{(lead as any).outreach_messages.whatsapp}</p>
                            ) : (
                              <div className="space-y-3">
                                {(lead as any).outreach_messages.whatsapp.initial && (
                                  <div>
                                    <div className="text-xs text-muted-foreground font-medium mb-1">Initial:</div>
                                    <p className="text-sm bg-muted/50 p-2 rounded whitespace-pre-wrap">{(lead as any).outreach_messages.whatsapp.initial}</p>
                                  </div>
                                )}
                                {(lead as any).outreach_messages.whatsapp.follow_up && (
                                  <div>
                                    <div className="text-xs text-muted-foreground font-medium mb-1">Follow-up:</div>
                                    <p className="text-sm bg-muted/50 p-2 rounded whitespace-pre-wrap">{(lead as any).outreach_messages.whatsapp.follow_up}</p>
                                  </div>
                                )}
                              </div>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full mt-2"
                              onClick={() => {
                                const waMsg = (lead as any).outreach_messages.whatsapp;
                                const text = typeof waMsg === 'string' 
                                  ? waMsg 
                                  : `Initial:\n${waMsg.initial || ''}\n\nFollow-up:\n${waMsg.follow_up || ''}`;
                                navigator.clipboard.writeText(text);
                                setCopiedMessage('whatsapp');
                                setTimeout(() => setCopiedMessage(null), 2000);
                              }}
                            >
                              {copiedMessage === 'whatsapp' ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                              {copiedMessage === 'whatsapp' ? 'Copied!' : 'Copy'}
                            </Button>
                          </AccordionContent>
                        </AccordionItem>
                      )}
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            ) : stageVisibility.outreachMessages ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Outreach Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6 text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm mb-3">No outreach messages generated yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateMessages}
                      disabled={regeneratingMessages}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${regeneratingMessages ? 'animate-spin' : ''}`} />
                      {regeneratingMessages ? 'Generating...' : 'Generate Messages'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Log Activity - visible from Import stage */}
            {stageVisibility.logActivity && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Log Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {ACTIVITY_TYPES.map((type) => (
                      <Button
                        key={type.value}
                        variant={activityType === type.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActivityType(type.value)}
                        className="flex items-center gap-1"
                      >
                        {activityIcons[type.value]}
                        {type.label}
                      </Button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Add notes about this activity..."
                    value={activityDescription}
                    onChange={(e) => setActivityDescription(e.target.value)}
                    rows={2}
                  />
                  <Button
                    onClick={handleLogActivity}
                    disabled={loggingActivity}
                    className="w-full"
                  >
                    {loggingActivity ? 'Logging...' : 'Log Activity'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Activity History - visible from Qualify stage */}
            {stageVisibility.activityHistory && activities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Activity History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-2 bg-muted/50 rounded"
                      >
                        <div className="mt-1">{activityIcons[activity.activity_type] || <FileText className="h-4 w-4" />}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {ACTIVITY_TYPES.find(t => t.value === activity.activity_type)?.label || activity.activity_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          {activity.description && (
                            <p className="text-sm mt-1 text-muted-foreground">{activity.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Lead Info (Compact) */}
          <div className="space-y-3">
            {/* Quick Info - moved to top */}
            <Card className="p-3">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-sm">Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(new Date(lead.created_at), 'MMM d, yyyy')}</span>
                </div>
                {lead.last_contacted_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Contacted</span>
                    <span>
                      {formatDistanceToNow(new Date(lead.last_contacted_at), { addSuffix: true })}
                    </span>
                  </div>
                )}
                {lead.next_follow_up && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next Follow-up</span>
                    <span>{format(new Date(lead.next_follow_up), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {isConverted && lead.converted_at && (
                  <div className="flex justify-between text-green-600">
                    <span>Converted</span>
                    <span>{format(new Date(lead.converted_at), 'MMM d, yyyy')}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email
                  </span>
                  <span className="truncate max-w-[120px]">{lead.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Phone
                  </span>
                  <span>{lead.mobile || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> Company
                  </span>
                  <span className="truncate max-w-[120px]">{lead.company || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="p-3">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-sm">Edit Lead</CardTitle>
              </CardHeader>
              <CardContent className="p-0 space-y-2">
                <div>
                  <Label className="text-xs">Name</Label>
                  <Input
                    className="h-8 text-sm"
                    value={lead.name}
                    onChange={(e) => setLead({ ...lead, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input
                      className="h-8 text-sm"
                      type="email"
                      value={lead.email || ''}
                      onChange={(e) => setLead({ ...lead, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Mobile</Label>
                    <Input
                      className="h-8 text-sm"
                      value={lead.mobile || ''}
                      onChange={(e) => setLead({ ...lead, mobile: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Company</Label>
                  <Input
                    className="h-8 text-sm"
                    value={lead.company || ''}
                    onChange={(e) => setLead({ ...lead, company: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Source</Label>
                    <Select
                      value={lead.source || ''}
                      onValueChange={(value) => setLead({ ...lead, source: value })}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_SOURCES.map((source) => (
                          <SelectItem key={source} value={source}>
                            {source}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Product</Label>
                    <Select
                      value={lead.product_interest_id || ''}
                      onValueChange={(value) => setLead({ ...lead, product_interest_id: value })}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Est. Value (AED)</Label>
                    <Input
                      className="h-8 text-sm"
                      type="number"
                      value={lead.estimated_value || ''}
                      onChange={(e) =>
                        setLead({
                          ...lead,
                          estimated_value: e.target.value ? parseFloat(e.target.value) : null,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Follow-up</Label>
                    <Input
                      className="h-8 text-sm"
                      type="date"
                      value={lead.next_follow_up || ''}
                      onChange={(e) => setLead({ ...lead, next_follow_up: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Notes</Label>
                  <Textarea
                    className="text-sm min-h-[60px]"
                    value={lead.notes || ''}
                    onChange={(e) => setLead({ ...lead, notes: e.target.value })}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Follow-up Sequence Timeline - visible in Qualify, Nurture, Propose, Convert */}
            {stageVisibility.followupTimeline && (
              <LeadFollowupTimeline
                leadId={id!}
                leadCreatedAt={lead.created_at}
                activities={activities}
                onLogActivity={async (type, description) => {
                  const success = await addActivity({
                    activity_type: type,
                    description,
                    created_by: user?.id,
                  });
                  return success;
                }}
              />
            )}

            {/* Activity History - visible in all stages */}
            {stageVisibility.activityHistory && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Activity History</CardTitle>
                </CardHeader>
                <CardContent>
                  {activities.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No activities logged yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                        >
                          <div className="p-2 rounded-full bg-primary/10 text-primary">
                            {activityIcons[activity.activity_type] || <FileText className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium capitalize">
                                {activity.activity_type}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                by {activity.creator?.name || 'Unknown'}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {activity.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Score & Status - visible from Qualify stage onwards */}
            {stageVisibility.scoreStatus && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Score & Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Lead Score</Label>
                    <Select
                      value={lead.score}
                      onValueChange={(value: LeadScore) => setLead({ ...lead, score: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hot">
                          <span className="flex items-center gap-2">
                            <Flame className="h-4 w-4 text-red-500" /> Hot
                          </span>
                        </SelectItem>
                        <SelectItem value="warm">
                          <span className="flex items-center gap-2">
                            <ThermometerSun className="h-4 w-4 text-amber-500" /> Warm
                          </span>
                        </SelectItem>
                        <SelectItem value="cold">
                          <span className="flex items-center gap-2">
                            <Snowflake className="h-4 w-4 text-blue-500" /> Cold
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={lead.status}
                      onValueChange={(value: LeadStatus) => setLead({ ...lead, status: value })}
                      disabled={isConverted}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
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
                  <div>
                    <Label>Assigned To</Label>
                    <Select
                      value={lead.assigned_to || ''}
                      onValueChange={(value) => setLead({ ...lead, assigned_to: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
      </div>

      <LeadConversionDialog
        open={showConversionDialog}
        onOpenChange={setShowConversionDialog}
        lead={lead}
        onConvert={handleConvert}
        isLoading={converting}
      />
    </div>
  );
}
