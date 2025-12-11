import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
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
} from 'lucide-react';
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

  useEffect(() => {
    if (!id) return;

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

    // Fetch products and users
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
  }, [id, navigate, toast]);

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

  const handleConvert = async () => {
    if (!lead) return;
    const customer = await convertToCustomer(lead);
    if (customer) {
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
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </MainLayout>
    );
  }

  const isConverted = lead.status === 'converted';

  return (
    <MainLayout>
      <div className="space-y-6">
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
              <Button onClick={handleConvert} variant="outline" className="text-green-600">
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
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
