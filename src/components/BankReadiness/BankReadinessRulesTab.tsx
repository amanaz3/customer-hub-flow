import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Json } from '@/integrations/supabase/types';

interface RuleCondition {
  field: string;
  operator: string;
  value: string | number | boolean | string[];
}

interface RuleAction {
  type: string;
  value?: number | string;
  message?: string;
}

interface BankReadinessRule {
  id: string;
  rule_name: string;
  rule_type: string;
  description: string | null;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  is_active: boolean;
  created_at: string;
}

const FIELD_OPTIONS = [
  { value: 'applicant_nationality', label: 'Applicant Nationality' },
  { value: 'uae_residency', label: 'UAE Residency' },
  { value: 'company_jurisdiction', label: 'Company Jurisdiction' },
  { value: 'license_activity', label: 'License Activity' },
  { value: 'business_model', label: 'Business Model' },
  { value: 'expected_monthly_inflow', label: 'Expected Monthly Inflow' },
  { value: 'source_of_funds', label: 'Source of Funds' },
  { value: 'incoming_payment_countries', label: 'Incoming Payment Countries' },
  { value: 'previous_rejection', label: 'Previous Rejection' },
];

const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'in', label: 'In List' },
  { value: 'not_in', label: 'Not In List' },
  { value: 'contains', label: 'Contains' },
  { value: 'contains_any', label: 'Contains Any' },
  { value: 'has_any', label: 'Has Any (for arrays)' },
];

const ACTION_TYPE_OPTIONS = [
  { value: 'add_score', label: 'Add Risk Score' },
  { value: 'add_flag', label: 'Add Warning Flag' },
];

export function BankReadinessRulesTab() {
  const [rules, setRules] = useState<BankReadinessRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<BankReadinessRule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

  // Form state
  const [formData, setFormData] = useState({
    rule_name: '',
    rule_type: 'risk_scoring',
    description: '',
    priority: 100,
    is_active: true,
    conditions: [{ field: '', operator: 'equals', value: '' }] as RuleCondition[],
    actions: [{ type: 'add_score', value: 0, message: '' }] as RuleAction[],
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bank_readiness_rules')
      .select('*')
      .order('priority', { ascending: true });

    if (error) {
      toast.error('Failed to fetch rules');
      console.error(error);
    } else {
      const parsedRules = (data || []).map(r => ({
        id: r.id,
        rule_name: r.rule_name,
        rule_type: r.rule_type,
        description: r.description,
        conditions: (Array.isArray(r.conditions) ? r.conditions : []) as unknown as RuleCondition[],
        actions: (Array.isArray(r.actions) ? r.actions : []) as unknown as RuleAction[],
        priority: r.priority,
        is_active: r.is_active,
        created_at: r.created_at
      }));
      setRules(parsedRules);
    }
    setLoading(false);
  };

  const handleSaveRule = async () => {
    try {
      // Parse conditions value if it's a comma-separated string for array operators
      const processedConditions = formData.conditions.map(c => {
        if (['in', 'not_in', 'contains_any', 'has_any'].includes(c.operator) && typeof c.value === 'string') {
          return {
            ...c,
            value: c.value.split(',').map(v => v.trim()).filter(v => v)
          };
        }
        if (c.field === 'uae_residency' || c.field === 'previous_rejection') {
          return { ...c, value: c.value === 'true' || c.value === true };
        }
        return c;
      });

      const ruleData = {
        rule_name: formData.rule_name,
        rule_type: formData.rule_type,
        description: formData.description || null,
        priority: formData.priority,
        is_active: formData.is_active,
        conditions: processedConditions as unknown as Json,
        actions: formData.actions.filter(a => a.type) as unknown as Json,
      };

      if (editingRule) {
        const { error } = await supabase
          .from('bank_readiness_rules')
          .update(ruleData)
          .eq('id', editingRule.id);

        if (error) throw error;
        toast.success('Rule updated successfully');
      } else {
        const { error } = await supabase
          .from('bank_readiness_rules')
          .insert(ruleData);

        if (error) throw error;
        toast.success('Rule created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchRules();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save rule');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    const { error } = await supabase
      .from('bank_readiness_rules')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete rule');
    } else {
      toast.success('Rule deleted');
      fetchRules();
    }
  };

  const handleToggleActive = async (rule: BankReadinessRule) => {
    const { error } = await supabase
      .from('bank_readiness_rules')
      .update({ is_active: !rule.is_active })
      .eq('id', rule.id);

    if (error) {
      toast.error('Failed to update rule');
    } else {
      fetchRules();
    }
  };

  const resetForm = () => {
    setFormData({
      rule_name: '',
      rule_type: 'risk_scoring',
      description: '',
      priority: 100,
      is_active: true,
      conditions: [{ field: '', operator: 'equals', value: '' }],
      actions: [{ type: 'add_score', value: 0, message: '' }],
    });
    setEditingRule(null);
  };

  const openEditDialog = (rule: BankReadinessRule) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      rule_type: rule.rule_type,
      description: rule.description || '',
      priority: rule.priority,
      is_active: rule.is_active,
      conditions: rule.conditions.map(c => ({
        ...c,
        value: Array.isArray(c.value) ? c.value.join(', ') : String(c.value)
      })),
      actions: rule.actions,
    });
    setIsDialogOpen(true);
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRules(newExpanded);
  };

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: '', operator: 'equals', value: '' }]
    }));
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const updateCondition = (index: number, updates: Partial<RuleCondition>) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((c, i) => i === index ? { ...c, ...updates } : c)
    }));
  };

  const addAction = () => {
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, { type: 'add_score', value: 0, message: '' }]
    }));
  };

  const removeAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  const updateAction = (index: number, updates: Partial<RuleAction>) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map((a, i) => i === index ? { ...a, ...updates } : a)
    }));
  };

  if (loading) {
    return <div className="p-4">Loading rules...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Bank Readiness Rules</h3>
          <p className="text-sm text-muted-foreground">
            {rules.length} rules configured • {rules.filter(r => r.is_active).length} active
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRule ? 'Edit Rule' : 'Create New Rule'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rule Name</Label>
                  <Input
                    value={formData.rule_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, rule_name: e.target.value }))}
                    placeholder="e.g., High-Risk Nationality"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 100 }))}
                    placeholder="Lower = higher priority"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this rule does..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label>Rule is active</Label>
              </div>

              {/* Conditions */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold">Conditions (ALL must match)</Label>
                  <Button variant="outline" size="sm" onClick={addCondition}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                {formData.conditions.map((condition, index) => (
                  <div key={index} className="flex gap-2 items-start p-2 border rounded">
                    <Select
                      value={condition.field}
                      onValueChange={(value) => updateCondition(index, { field: value })}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Field" />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={condition.operator}
                      onValueChange={(value) => updateCondition(index, { operator: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Operator" />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATOR_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={String(condition.value)}
                      onChange={(e) => updateCondition(index, { value: e.target.value })}
                      placeholder="Value (comma-separated for lists)"
                      className="flex-1"
                    />
                    {formData.conditions.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeCondition(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold">Actions</Label>
                  <Button variant="outline" size="sm" onClick={addAction}>
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                {formData.actions.map((action, index) => (
                  <div key={index} className="flex gap-2 items-start p-2 border rounded">
                    <Select
                      value={action.type}
                      onValueChange={(value) => updateAction(index, { type: value })}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Action Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTION_TYPE_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {action.type === 'add_score' && (
                      <Input
                        type="number"
                        value={action.value || 0}
                        onChange={(e) => updateAction(index, { value: parseInt(e.target.value) || 0 })}
                        placeholder="Score points"
                        className="w-24"
                      />
                    )}
                    {action.type === 'add_flag' && (
                      <Input
                        value={action.message || ''}
                        onChange={(e) => updateAction(index, { message: e.target.value })}
                        placeholder="Warning message"
                        className="flex-1"
                      />
                    )}
                    {formData.actions.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeAction(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveRule}>
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rules List */}
      <div className="space-y-2">
        {rules.map((rule) => (
          <Collapsible key={rule.id} open={expandedRules.has(rule.id)}>
            <Card className={!rule.is_active ? 'opacity-60' : ''}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => toggleExpanded(rule.id)}>
                        {expandedRules.has(rule.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-medium">{rule.rule_name}</CardTitle>
                        <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">Priority: {rule.priority}</Badge>
                      </div>
                      {rule.description && (
                        <p className="text-xs text-muted-foreground mt-1">{rule.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={() => handleToggleActive(rule)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(rule)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteRule(rule.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="pt-0 pb-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Conditions
                      </p>
                      <ul className="space-y-1 text-muted-foreground">
                        {(rule.conditions as RuleCondition[]).map((c, i) => (
                          <li key={i} className="font-mono text-xs bg-muted px-2 py-1 rounded">
                            {c.field} {c.operator} {Array.isArray(c.value) ? c.value.join(', ') : String(c.value)}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium mb-2 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Actions
                      </p>
                      <ul className="space-y-1 text-muted-foreground">
                        {(rule.actions as RuleAction[]).map((a, i) => (
                          <li key={i} className="font-mono text-xs bg-muted px-2 py-1 rounded">
                            {a.type}: {a.type === 'add_score' ? `+${a.value} pts` : a.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}
