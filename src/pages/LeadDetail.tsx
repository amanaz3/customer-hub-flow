import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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

const activityIcons: Record<string, React.ReactNode> = {
  call: <Phone className="h-4 w-4" />,
  whatsapp: <MessageCircle className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  meeting: <Users className="h-4 w-4" />,
  note: <FileText className="h-4 w-4" />,
};

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/leads')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{lead.name}</h1>
              <p className="text-sm text-muted-foreground">
                Lead #{lead.reference_number} • Created{' '}
                {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isConverted && (
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
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact & Company */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lead Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Name</Label>
                  <Input
                    value={lead.name}
                    onChange={(e) => setLead({ ...lead, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={lead.email || ''}
                    onChange={(e) => setLead({ ...lead, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Mobile</Label>
                  <Input
                    value={lead.mobile || ''}
                    onChange={(e) => setLead({ ...lead, mobile: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Company</Label>
                  <Input
                    value={lead.company || ''}
                    onChange={(e) => setLead({ ...lead, company: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Lead Source</Label>
                  <Select
                    value={lead.source || ''}
                    onValueChange={(value) => setLead({ ...lead, source: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
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
                  <Label>Product Interest</Label>
                  <Select
                    value={lead.product_interest_id || ''}
                    onValueChange={(value) => setLead({ ...lead, product_interest_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
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
                <div>
                  <Label>Estimated Value (AED)</Label>
                  <Input
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
                  <Label>Next Follow-up</Label>
                  <Input
                    type="date"
                    value={lead.next_follow_up || ''}
                    onChange={(e) => setLead({ ...lead, next_follow_up: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={lead.notes || ''}
                    onChange={(e) => setLead({ ...lead, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Follow-up Sequence Timeline */}
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

            {/* Log Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Log Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {ACTIVITY_TYPES.map((type) => (
                    <Button
                      key={type.value}
                      variant={activityType === type.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActivityType(type.value)}
                    >
                      {activityIcons[type.value]}
                      <span className="ml-1">{type.label}</span>
                    </Button>
                  ))}
                </div>
                <Textarea
                  placeholder="Enter activity details..."
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                  rows={2}
                />
                <Button onClick={handleLogActivity} disabled={loggingActivity}>
                  {loggingActivity ? 'Logging...' : 'Log Activity'}
                </Button>
              </CardContent>
            </Card>

            {/* Activity History */}
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Score & Status */}
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

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
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
              </CardContent>
            </Card>

            {/* Outreach Messages */}
            {(lead as any).outreach_messages && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Outreach Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                          <p className="text-sm bg-muted/50 p-2 rounded whitespace-pre-wrap">{(lead as any).outreach_messages.linkedin}</p>
                          <div className="flex gap-2 mt-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => {
                                navigator.clipboard.writeText((lead as any).outreach_messages.linkedin);
                                setCopiedMessage('linkedin');
                                setTimeout(() => setCopiedMessage(null), 2000);
                              }}
                            >
                              {copiedMessage === 'linkedin' ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                              {copiedMessage === 'linkedin' ? 'Copied!' : 'Copy'}
                            </Button>
                            {(lead as any).linkedin_profile && (
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => window.open((lead as any).linkedin_profile, '_blank')}
                              >
                                <Linkedin className="h-3 w-3 mr-1" />
                                Open LinkedIn
                              </Button>
                            )}
                          </div>
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
                          <p className="text-sm bg-muted/50 p-2 rounded whitespace-pre-wrap">{(lead as any).outreach_messages.whatsapp}</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-2"
                            onClick={() => {
                              navigator.clipboard.writeText((lead as any).outreach_messages.whatsapp);
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
