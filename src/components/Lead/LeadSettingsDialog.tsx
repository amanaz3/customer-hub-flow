import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Phone,
  MessageCircle,
  Mail,
  FileText,
  Plus,
  Trash2,
  Save,
  Loader2,
  Flame,
  ThermometerSun,
  Snowflake,
  Users,
  UserPlus,
  TrendingUp,
  ArrowRightCircle,
  CheckCircle,
  Upload,
  Calendar,
} from 'lucide-react';

interface FollowupStep {
  id: string;
  day_offset: number;
  action_type: 'whatsapp' | 'call' | 'email' | 'note';
  action_title: string;
  action_description: string | null;
  auto_mark_cold: boolean;
  is_enabled: boolean;
}

interface ScoringThresholds {
  hot_min: number;
  warm_min: number;
}

interface AssignmentRule {
  id: string;
  rule_type: 'round_robin' | 'load_balanced' | 'manual';
  auto_assign_new_leads: boolean;
  max_leads_per_user: number;
}

interface ConversionSettings {
  trigger_on_status_won: boolean;
  require_signed_agreement: boolean;
  prompt_document_delivery: boolean;
  prompt_onboarding_call: boolean;
  auto_create_customer: boolean;
}

const actionIcons: Record<string, React.ReactNode> = {
  call: <Phone className="h-4 w-4" />,
  whatsapp: <MessageCircle className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  note: <FileText className="h-4 w-4" />,
};

const actionColors: Record<string, string> = {
  call: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  whatsapp: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  email: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  note: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

interface LeadSettingsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function LeadSettingsDialog({ open: controlledOpen, onOpenChange }: LeadSettingsDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [activeTab, setActiveTab] = useState('scoring');
  const { toast } = useToast();

  // Scoring state
  const [scoringThresholds, setScoringThresholds] = useState<ScoringThresholds>({
    hot_min: 50000,
    warm_min: 10000,
  });
  const [savingScoring, setSavingScoring] = useState(false);

  // Assignment state
  const [assignmentRule, setAssignmentRule] = useState<AssignmentRule>({
    id: '',
    rule_type: 'manual',
    auto_assign_new_leads: false,
    max_leads_per_user: 50,
  });
  const [salesAssistants, setSalesAssistants] = useState<{ id: string; name: string; email: string; lead_count: number }[]>([]);
  const [savingAssignment, setSavingAssignment] = useState(false);

  // Follow-up state
  const [steps, setSteps] = useState<FollowupStep[]>([]);
  const [loadingSteps, setLoadingSteps] = useState(true);
  const [editingStep, setEditingStep] = useState<FollowupStep | null>(null);
  const [savingStep, setSavingStep] = useState(false);

  // Conversion state
  const [conversionSettings, setConversionSettings] = useState<ConversionSettings>({
    trigger_on_status_won: true,
    require_signed_agreement: false,
    prompt_document_delivery: true,
    prompt_onboarding_call: true,
    auto_create_customer: false,
  });
  const [savingConversion, setSavingConversion] = useState(false);

  useEffect(() => {
    if (open) {
      fetchScoringThresholds();
      fetchAssignmentSettings();
      fetchFollowupSteps();
      fetchSalesAssistants();
      fetchConversionSettings();
    }
  }, [open]);

  const fetchScoringThresholds = async () => {
    // For now, use localStorage or default values
    // Could be extended to use a settings table
    const stored = localStorage.getItem('lead_scoring_thresholds');
    if (stored) {
      setScoringThresholds(JSON.parse(stored));
    }
  };

  const fetchAssignmentSettings = async () => {
    const stored = localStorage.getItem('lead_assignment_settings');
    if (stored) {
      setAssignmentRule(JSON.parse(stored));
    }
  };

  const fetchSalesAssistants = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Get lead counts for each user
      const { data: leads } = await supabase
        .from('leads')
        .select('assigned_to');

      const leadCounts: Record<string, number> = {};
      (leads || []).forEach(lead => {
        if (lead.assigned_to) {
          leadCounts[lead.assigned_to] = (leadCounts[lead.assigned_to] || 0) + 1;
        }
      });

      setSalesAssistants(
        (profiles || []).map(p => ({
          ...p,
          lead_count: leadCounts[p.id] || 0,
        }))
      );
    } catch (error) {
      console.error('Error fetching sales assistants:', error);
    }
  };

  const fetchFollowupSteps = async () => {
    try {
      setLoadingSteps(true);
      const { data, error } = await supabase
        .from('lead_followup_sequence')
        .select('*')
        .order('day_offset', { ascending: true });

      if (error) throw error;
      setSteps((data || []) as FollowupStep[]);
    } catch (error: any) {
      console.error('Error fetching sequence:', error);
      toast({
        title: 'Error',
        description: 'Failed to load follow-up sequence',
        variant: 'destructive',
      });
    } finally {
      setLoadingSteps(false);
    }
  };

  const handleSaveScoring = async () => {
    setSavingScoring(true);
    try {
      localStorage.setItem('lead_scoring_thresholds', JSON.stringify(scoringThresholds));
      toast({
        title: 'Success',
        description: 'Scoring thresholds saved',
      });
    } finally {
      setSavingScoring(false);
    }
  };

  const handleSaveAssignment = async () => {
    setSavingAssignment(true);
    try {
      localStorage.setItem('lead_assignment_settings', JSON.stringify(assignmentRule));
      toast({
        title: 'Success',
        description: 'Assignment settings saved',
      });
    } finally {
      setSavingAssignment(false);
    }
  };

  const fetchConversionSettings = async () => {
    const stored = localStorage.getItem('lead_conversion_settings');
    if (stored) {
      setConversionSettings(JSON.parse(stored));
    }
  };

  const handleSaveConversion = async () => {
    setSavingConversion(true);
    try {
      localStorage.setItem('lead_conversion_settings', JSON.stringify(conversionSettings));
      toast({
        title: 'Success',
        description: 'Conversion settings saved',
      });
    } finally {
      setSavingConversion(false);
    }
  };

  const handleSaveStep = async () => {
    if (!editingStep) return;

    setSavingStep(true);
    try {
      if (editingStep.id.startsWith('new-')) {
        const { error } = await supabase
          .from('lead_followup_sequence')
          .insert({
            day_offset: editingStep.day_offset,
            action_type: editingStep.action_type,
            action_title: editingStep.action_title,
            action_description: editingStep.action_description,
            auto_mark_cold: editingStep.auto_mark_cold,
            is_enabled: editingStep.is_enabled,
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lead_followup_sequence')
          .update({
            day_offset: editingStep.day_offset,
            action_type: editingStep.action_type,
            action_title: editingStep.action_title,
            action_description: editingStep.action_description,
            auto_mark_cold: editingStep.auto_mark_cold,
            is_enabled: editingStep.is_enabled,
          })
          .eq('id', editingStep.id);
        if (error) throw error;
      }

      toast({ title: 'Success', description: 'Step saved successfully' });
      setEditingStep(null);
      fetchFollowupSteps();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save step',
        variant: 'destructive',
      });
    } finally {
      setSavingStep(false);
    }
  };

  const handleDeleteStep = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lead_followup_sequence')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Step deleted' });
      fetchFollowupSteps();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete step',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStep = async (step: FollowupStep) => {
    try {
      const { error } = await supabase
        .from('lead_followup_sequence')
        .update({ is_enabled: !step.is_enabled })
        .eq('id', step.id);
      if (error) throw error;
      fetchFollowupSteps();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update step',
        variant: 'destructive',
      });
    }
  };

  const addNewStep = () => {
    const maxDay = steps.length > 0 ? Math.max(...steps.map(s => s.day_offset)) + 1 : 0;
    setEditingStep({
      id: `new-${Date.now()}`,
      day_offset: maxDay,
      action_type: 'whatsapp',
      action_title: '',
      action_description: '',
      auto_mark_cold: false,
      is_enabled: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Lead Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Lead Management Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scoring" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Scoring
            </TabsTrigger>
            <TabsTrigger value="assignment" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Assignment
            </TabsTrigger>
            <TabsTrigger value="followup" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Follow-ups
            </TabsTrigger>
            <TabsTrigger value="conversion" className="flex items-center gap-2">
              <ArrowRightCircle className="h-4 w-4" />
              Conversion
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            {/* Scoring Tab */}
            <TabsContent value="scoring" className="space-y-4 m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Auto-Scoring Thresholds</CardTitle>
                  <CardDescription>
                    Leads are automatically scored based on estimated value
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Flame className="h-5 w-5 text-red-500" />
                          <span className="font-medium">Hot Lead</span>
                        </div>
                        <div>
                          <Label className="text-xs">Min Value (AED)</Label>
                          <Input
                            type="number"
                            value={scoringThresholds.hot_min}
                            onChange={(e) =>
                              setScoringThresholds({
                                ...scoringThresholds,
                                hot_min: parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ≥ {scoringThresholds.hot_min.toLocaleString()} AED
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <ThermometerSun className="h-5 w-5 text-amber-500" />
                          <span className="font-medium">Warm Lead</span>
                        </div>
                        <div>
                          <Label className="text-xs">Min Value (AED)</Label>
                          <Input
                            type="number"
                            value={scoringThresholds.warm_min}
                            onChange={(e) =>
                              setScoringThresholds({
                                ...scoringThresholds,
                                warm_min: parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ≥ {scoringThresholds.warm_min.toLocaleString()} AED
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Snowflake className="h-5 w-5 text-blue-500" />
                          <span className="font-medium">Cold Lead</span>
                        </div>
                        <div className="h-[60px] flex items-center">
                          <p className="text-sm text-muted-foreground">
                            Below {scoringThresholds.warm_min.toLocaleString()} AED
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Button onClick={handleSaveScoring} disabled={savingScoring} className="w-full">
                    {savingScoring && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Save Scoring Rules
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assignment Tab */}
            <TabsContent value="assignment" className="space-y-4 m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Assignment Rules</CardTitle>
                  <CardDescription>
                    Configure how leads are assigned to sales assistants
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label>Assignment Method</Label>
                      <Select
                        value={assignmentRule.rule_type}
                        onValueChange={(v) =>
                          setAssignmentRule({ ...assignmentRule, rule_type: v as any })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual Assignment</SelectItem>
                          <SelectItem value="round_robin">Round Robin</SelectItem>
                          <SelectItem value="load_balanced">Load Balanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        {assignmentRule.rule_type === 'manual' && 'Leads must be manually assigned'}
                        {assignmentRule.rule_type === 'round_robin' && 'Leads are assigned in rotation'}
                        {assignmentRule.rule_type === 'load_balanced' && 'Assigns to user with fewest leads'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <Label>Auto-assign new leads</Label>
                        <p className="text-xs text-muted-foreground">
                          Automatically assign when leads are created
                        </p>
                      </div>
                      <Switch
                        checked={assignmentRule.auto_assign_new_leads}
                        onCheckedChange={(v) =>
                          setAssignmentRule({ ...assignmentRule, auto_assign_new_leads: v })
                        }
                      />
                    </div>

                    <div>
                      <Label>Max Leads per User</Label>
                      <Input
                        type="number"
                        value={assignmentRule.max_leads_per_user}
                        onChange={(e) =>
                          setAssignmentRule({
                            ...assignmentRule,
                            max_leads_per_user: parseInt(e.target.value) || 50,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Users won't receive new leads above this limit
                      </p>
                    </div>
                  </div>

                  <Button onClick={handleSaveAssignment} disabled={savingAssignment} className="w-full">
                    {savingAssignment && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Save Assignment Rules
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Sales Assistants
                  </CardTitle>
                  <CardDescription>Current lead distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {salesAssistants.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2 rounded-lg border"
                      >
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge variant="secondary">
                          {user.lead_count} leads
                        </Badge>
                      </div>
                    ))}
                    {salesAssistants.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No active users found
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Follow-up Tab */}
            <TabsContent value="followup" className="space-y-4 m-0">
              {loadingSteps ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : editingStep ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {editingStep.id.startsWith('new-') ? 'Add Step' : 'Edit Step'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Day Offset</Label>
                        <Input
                          type="number"
                          min={0}
                          value={editingStep.day_offset}
                          onChange={(e) =>
                            setEditingStep({
                              ...editingStep,
                              day_offset: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                        <p className="text-xs text-muted-foreground mt-1">Days after lead creation</p>
                      </div>
                      <div>
                        <Label>Action Type</Label>
                        <Select
                          value={editingStep.action_type}
                          onValueChange={(v) =>
                            setEditingStep({ ...editingStep, action_type: v as any })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            <SelectItem value="call">Call</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="note">Note / Review</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Action Title</Label>
                      <Input
                        value={editingStep.action_title}
                        onChange={(e) =>
                          setEditingStep({ ...editingStep, action_title: e.target.value })
                        }
                        placeholder="e.g., Send Welcome Message"
                      />
                    </div>
                    <div>
                      <Label>Description (Optional)</Label>
                      <Textarea
                        value={editingStep.action_description || ''}
                        onChange={(e) =>
                          setEditingStep({ ...editingStep, action_description: e.target.value })
                        }
                        placeholder="Detailed instructions..."
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editingStep.auto_mark_cold}
                        onCheckedChange={(v) =>
                          setEditingStep({ ...editingStep, auto_mark_cold: v })
                        }
                      />
                      <Label className="text-sm">Auto-mark lead as Cold if no response</Label>
                    </div>
                    <div className="flex gap-2 justify-end pt-4 border-t">
                      <Button variant="outline" onClick={() => setEditingStep(null)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveStep}
                        disabled={savingStep || !editingStep.action_title}
                      >
                        {savingStep && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        <Save className="h-4 w-4 mr-2" />
                        Save Step
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Follow-up Sequence</CardTitle>
                    <CardDescription>
                      Automated follow-up steps for new leads
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {steps.map((step) => (
                      <div
                        key={step.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-opacity ${
                          !step.is_enabled ? 'opacity-50' : ''
                        }`}
                      >
                        <Badge variant="outline" className="font-mono min-w-[60px] justify-center">
                          Day {step.day_offset}
                        </Badge>
                        <div className={`p-2 rounded-full ${actionColors[step.action_type]}`}>
                          {actionIcons[step.action_type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{step.action_title}</p>
                          {step.action_description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {step.action_description}
                            </p>
                          )}
                        </div>
                        {step.auto_mark_cold && (
                          <Badge variant="secondary" className="text-xs">
                            Auto Cold
                          </Badge>
                        )}
                        <Switch
                          checked={step.is_enabled}
                          onCheckedChange={() => handleToggleStep(step)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingStep(step)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteStep(step.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button onClick={addNewStep} variant="outline" className="w-full mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Step
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Conversion Tab */}
            <TabsContent value="conversion" className="space-y-4 m-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Conversion Triggers</CardTitle>
                  <CardDescription>
                    Configure when and how leads are converted to customers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-green-50/50 dark:bg-green-950/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <Label>Auto-prompt on "Won" status</Label>
                        <p className="text-xs text-muted-foreground">
                          Show conversion dialog when lead status changes to "won"
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={conversionSettings.trigger_on_status_won}
                      onCheckedChange={(v) =>
                        setConversionSettings({ ...conversionSettings, trigger_on_status_won: v })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Conversion Requirements</CardTitle>
                  <CardDescription>
                    What must be completed before conversion
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label>Require signed agreement</Label>
                        <p className="text-xs text-muted-foreground">
                          Block conversion until agreement is uploaded
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={conversionSettings.require_signed_agreement}
                      onCheckedChange={(v) =>
                        setConversionSettings({ ...conversionSettings, require_signed_agreement: v })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Conversion Dialog Options</CardTitle>
                  <CardDescription>
                    What options to show in the conversion dialog
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label>Document delivery options</Label>
                        <p className="text-xs text-muted-foreground">
                          Show portal access and document checklist options
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={conversionSettings.prompt_document_delivery}
                      onCheckedChange={(v) =>
                        setConversionSettings({ ...conversionSettings, prompt_document_delivery: v })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label>Onboarding call scheduling</Label>
                        <p className="text-xs text-muted-foreground">
                          Show option to schedule onboarding call
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={conversionSettings.prompt_onboarding_call}
                      onCheckedChange={(v) =>
                        setConversionSettings({ ...conversionSettings, prompt_onboarding_call: v })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label>Auto-create customer record</Label>
                        <p className="text-xs text-muted-foreground">
                          Skip dialog and create customer immediately
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={conversionSettings.auto_create_customer}
                      onCheckedChange={(v) =>
                        setConversionSettings({ ...conversionSettings, auto_create_customer: v })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleSaveConversion} disabled={savingConversion} className="w-full">
                {savingConversion && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Save Conversion Settings
              </Button>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
