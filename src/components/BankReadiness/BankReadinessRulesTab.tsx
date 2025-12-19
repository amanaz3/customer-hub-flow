import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, ChevronDown, ChevronUp, Code, Workflow, Save, AlertTriangle, Download, Upload, Sparkles, Building2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useBankReadinessConfig, BankReadinessRule } from '@/hooks/useBankReadinessConfig';

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
  { value: 'exclude_bank', label: 'Exclude Bank' },
  { value: 'boost_bank_score', label: 'Boost Bank Score' },
  { value: 'reduce_bank_score', label: 'Reduce Bank Score' },
  { value: 'require_document', label: 'Require Document' },
];

interface BankProfile {
  id: string;
  bank_code: string;
  bank_name: string;
  preferred_jurisdictions: string[];
  preferred_business_models: string[];
  preferred_activities: string[];
  avoid_activities: string[];
  accepts_non_residents: boolean;
  accepts_high_risk_nationalities: boolean;
  risk_tolerance: string;
  min_monthly_turnover: string;
  processing_time_days: number;
  is_active: boolean;
}

const JURISDICTION_OPTIONS = [
  'Dubai Mainland', 'Abu Dhabi Mainland', 'DMCC', 'DIFC', 'JAFZA', 'RAK FTZ', 'Sharjah FZ', 'Ajman FZ'
];

const ACTIVITY_OPTIONS = [
  'Trading', 'IT Services', 'Consulting', 'Real Estate', 'Food & Beverage', 'E-commerce', 'Manufacturing', 'Crypto', 'Professional Services'
];

export function BankReadinessRulesTab() {
  const { rules, bankProfiles, loading, updateRules, updateBankProfiles, versionNumber, addMissingRules, getMissingRulesCount } = useBankReadinessConfig();
  const [activeTab, setActiveTab] = useState<'rules' | 'banks'>('rules');
  const [activeView, setActiveView] = useState<'visual' | 'json'>('visual');
  const [localRules, setLocalRules] = useState<BankReadinessRule[]>([]);
  const [localBanks, setLocalBanks] = useState<BankProfile[]>([]);
  const [editingRule, setEditingRule] = useState<BankReadinessRule | null>(null);
  const [editingBank, setEditingBank] = useState<BankProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  const [jsonContent, setJsonContent] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const missingRulesCount = getMissingRulesCount();

  // Form state for rules
  const [formData, setFormData] = useState({
    rule_name: '',
    rule_type: 'risk_scoring',
    description: '',
    priority: 100,
    is_active: true,
    conditions: [{ field: '', operator: 'equals', value: '' }] as RuleCondition[],
    actions: [{ type: 'add_score', value: 0, message: '' }] as RuleAction[],
  });

  // Form state for banks
  const [bankFormData, setBankFormData] = useState<BankProfile>({
    id: '',
    bank_code: '',
    bank_name: '',
    preferred_jurisdictions: [],
    preferred_business_models: [],
    preferred_activities: [],
    avoid_activities: [],
    accepts_non_residents: false,
    accepts_high_risk_nationalities: false,
    risk_tolerance: 'medium',
    min_monthly_turnover: 'AED 50,000',
    processing_time_days: 14,
    is_active: true,
  });

  // Sync with config rules and banks
  useEffect(() => {
    setLocalRules(rules);
    setLocalBanks(bankProfiles);
    setJsonContent(JSON.stringify(rules, null, 2));
  }, [rules, bankProfiles]);

  const handleJsonChange = (value: string) => {
    setJsonContent(value);
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch (e) {
      setJsonError('Invalid JSON syntax');
    }
  };

  const applyJsonChanges = async () => {
    if (jsonError) {
      toast.error('Please fix JSON errors first');
      return;
    }
    try {
      const parsed = JSON.parse(jsonContent);
      await updateRules(parsed);
      setLocalRules(parsed);
    } catch (e) {
      toast.error('Failed to apply JSON changes');
    }
  };

  const exportRules = () => {
    const blob = new Blob([JSON.stringify(localRules, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bank-readiness-rules.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Rules exported');
  };

  const importRules = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          await updateRules(imported);
          toast.success('Rules imported successfully');
        } catch (err) {
          toast.error('Failed to import rules');
        }
      };
      reader.readAsText(file);
    }
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

      const newRule: BankReadinessRule = {
        id: editingRule?.id || `rule-${Date.now()}`,
        rule_name: formData.rule_name,
        rule_type: formData.rule_type,
        description: formData.description || null,
        priority: formData.priority,
        is_active: formData.is_active,
        conditions: processedConditions,
        actions: formData.actions.filter(a => a.type),
      };

      let updatedRules: BankReadinessRule[];
      if (editingRule) {
        updatedRules = localRules.map(r => r.id === editingRule.id ? newRule : r);
      } else {
        updatedRules = [...localRules, newRule];
      }

      // Sort by priority
      updatedRules.sort((a, b) => a.priority - b.priority);
      
      await updateRules(updatedRules);
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save rule');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    const updatedRules = localRules.filter(r => r.id !== id);
    await updateRules(updatedRules);
  };

  const handleToggleActive = async (rule: BankReadinessRule) => {
    const updatedRules = localRules.map(r => 
      r.id === rule.id ? { ...r, is_active: !r.is_active } : r
    );
    await updateRules(updatedRules);
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

  const resetBankForm = () => {
    setBankFormData({
      id: '',
      bank_code: '',
      bank_name: '',
      preferred_jurisdictions: [],
      preferred_business_models: [],
      preferred_activities: [],
      avoid_activities: [],
      accepts_non_residents: false,
      accepts_high_risk_nationalities: false,
      risk_tolerance: 'medium',
      min_monthly_turnover: 'AED 50,000',
      processing_time_days: 14,
      is_active: true,
    });
    setEditingBank(null);
  };

  const handleSaveBank = async () => {
    try {
      const newBank: BankProfile = {
        ...bankFormData,
        id: editingBank?.id || `bank-${Date.now()}`,
      };

      let updatedBanks: BankProfile[];
      if (editingBank) {
        updatedBanks = localBanks.map(b => b.id === editingBank.id ? newBank : b);
      } else {
        updatedBanks = [...localBanks, newBank];
      }

      await updateBankProfiles(updatedBanks);
      setIsBankDialogOpen(false);
      resetBankForm();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save bank');
    }
  };

  const handleDeleteBank = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bank?')) return;
    const updatedBanks = localBanks.filter(b => b.id !== id);
    await updateBankProfiles(updatedBanks);
  };

  const handleToggleBankActive = async (bank: BankProfile) => {
    const updatedBanks = localBanks.map(b => 
      b.id === bank.id ? { ...b, is_active: !b.is_active } : b
    );
    await updateBankProfiles(updatedBanks);
  };

  const openEditBankDialog = (bank: BankProfile) => {
    setEditingBank(bank);
    setBankFormData(bank);
    setIsBankDialogOpen(true);
  };

  const toggleArrayItem = (array: string[], item: string): string[] => {
    return array.includes(item) ? array.filter(i => i !== item) : [...array, item];
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
      {/* Main Tabs: Rules vs Banks */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'rules' | 'banks')}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <Workflow className="h-4 w-4" />
              Rules ({localRules.length})
            </TabsTrigger>
            <TabsTrigger value="banks" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Bank Profiles ({localBanks.length})
            </TabsTrigger>
          </TabsList>
          <Badge variant="outline">v{versionNumber}</Badge>
        </div>

        {/* RULES TAB */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">
                {localRules.filter(r => r.is_active).length} active rules
              </p>
            </div>
            <div className="flex gap-2">
              {missingRulesCount > 0 && (
                <Button variant="outline" size="sm" onClick={addMissingRules} className="text-amber-600 border-amber-300 hover:bg-amber-50">
                  <Sparkles className="h-4 w-4 mr-1" />
                  Add {missingRulesCount} Rules
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={exportRules}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <label>
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-1" />
                    Import
                  </span>
                </Button>
                <input type="file" accept=".json" onChange={importRules} className="hidden" />
              </label>
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
          </div>

          {/* Visual / JSON Toggle for Rules */}
          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="space-y-4">
            <TabsList>
              <TabsTrigger value="visual" className="flex items-center gap-2">
                <Workflow className="h-4 w-4" />
                Visual
              </TabsTrigger>
              <TabsTrigger value="json" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                JSON
              </TabsTrigger>
            </TabsList>

            <TabsContent value="visual" className="space-y-2">
              {localRules.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No rules configured. Click "Add Rule" to create your first rule.</p>
                  </CardContent>
                </Card>
              ) : (
                localRules.map((rule) => (
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
                        <CardContent className="pt-0 pb-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-medium mb-2">Conditions:</p>
                              <ul className="space-y-1">
                                {rule.conditions.map((c, i) => (
                                  <li key={i} className="text-muted-foreground">
                                    {FIELD_OPTIONS.find(f => f.value === c.field)?.label || c.field} {c.operator} {Array.isArray(c.value) ? c.value.join(', ') : String(c.value)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="font-medium mb-2">Actions:</p>
                              <ul className="space-y-1">
                                {rule.actions.map((a, i) => (
                                  <li key={i} className="text-muted-foreground">
                                    {a.type === 'add_score' && `Add ${a.value} to risk score`}
                                    {a.type === 'add_flag' && `Flag: ${a.message}`}
                                    {a.type === 'exclude_bank' && `Exclude: ${a.value}`}
                                    {a.type === 'boost_bank_score' && `Boost: ${a.value}`}
                                    {a.type === 'reduce_bank_score' && `Reduce: ${a.value}`}
                                    {a.type === 'require_document' && `Require: ${a.value}`}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                ))
              )}
            </TabsContent>

            <TabsContent value="json" className="space-y-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {jsonError && (
                      <div className="flex items-center gap-2 text-destructive text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        {jsonError}
                      </div>
                    )}
                    <ScrollArea className="h-[400px] w-full rounded border">
                      <Textarea
                        value={jsonContent}
                        onChange={(e) => handleJsonChange(e.target.value)}
                        className="min-h-[400px] font-mono text-sm border-0 focus-visible:ring-0"
                        placeholder="JSON rules configuration..."
                      />
                    </ScrollArea>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setJsonContent(JSON.stringify(localRules, null, 2))}
                      >
                        Reset
                      </Button>
                      <Button onClick={applyJsonChanges} disabled={!!jsonError}>
                        <Save className="h-4 w-4 mr-2" />
                        Apply Changes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* BANKS TAB */}
        <TabsContent value="banks" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {localBanks.filter(b => b.is_active).length} active bank profiles
            </p>
            <Dialog open={isBankDialogOpen} onOpenChange={(open) => {
              setIsBankDialogOpen(open);
              if (!open) resetBankForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bank
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingBank ? 'Edit Bank Profile' : 'Add New Bank'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Input
                        value={bankFormData.bank_name}
                        onChange={(e) => setBankFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                        placeholder="e.g., Emirates NBD"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bank Code</Label>
                      <Input
                        value={bankFormData.bank_code}
                        onChange={(e) => setBankFormData(prev => ({ ...prev, bank_code: e.target.value.toUpperCase() }))}
                        placeholder="e.g., ENBD"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Risk Tolerance</Label>
                      <Select
                        value={bankFormData.risk_tolerance}
                        onValueChange={(value) => setBankFormData(prev => ({ ...prev, risk_tolerance: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low (Conservative)</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High (Flexible)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Processing Time (Days)</Label>
                      <Input
                        type="number"
                        value={bankFormData.processing_time_days}
                        onChange={(e) => setBankFormData(prev => ({ ...prev, processing_time_days: parseInt(e.target.value) || 14 }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Min Monthly Turnover</Label>
                    <Select
                      value={bankFormData.min_monthly_turnover}
                      onValueChange={(value) => setBankFormData(prev => ({ ...prev, min_monthly_turnover: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Below AED 50,000">Below AED 50,000</SelectItem>
                        <SelectItem value="AED 50,000">AED 50,000</SelectItem>
                        <SelectItem value="AED 100,000">AED 100,000</SelectItem>
                        <SelectItem value="AED 500,000">AED 500,000</SelectItem>
                        <SelectItem value="AED 1,000,000">AED 1,000,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred Jurisdictions</Label>
                    <div className="flex flex-wrap gap-2">
                      {JURISDICTION_OPTIONS.map(j => (
                        <Badge
                          key={j}
                          variant={bankFormData.preferred_jurisdictions.includes(j) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => setBankFormData(prev => ({
                            ...prev,
                            preferred_jurisdictions: toggleArrayItem(prev.preferred_jurisdictions, j)
                          }))}
                        >
                          {j}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred Activities</Label>
                    <div className="flex flex-wrap gap-2">
                      {ACTIVITY_OPTIONS.map(a => (
                        <Badge
                          key={a}
                          variant={bankFormData.preferred_activities.includes(a) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => setBankFormData(prev => ({
                            ...prev,
                            preferred_activities: toggleArrayItem(prev.preferred_activities, a)
                          }))}
                        >
                          {a}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Avoid Activities</Label>
                    <div className="flex flex-wrap gap-2">
                      {ACTIVITY_OPTIONS.map(a => (
                        <Badge
                          key={a}
                          variant={bankFormData.avoid_activities.includes(a) ? 'destructive' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => setBankFormData(prev => ({
                            ...prev,
                            avoid_activities: toggleArrayItem(prev.avoid_activities, a)
                          }))}
                        >
                          {a}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={bankFormData.accepts_non_residents}
                        onCheckedChange={(checked) => setBankFormData(prev => ({ ...prev, accepts_non_residents: checked }))}
                      />
                      <Label>Accepts Non-Residents</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={bankFormData.accepts_high_risk_nationalities}
                        onCheckedChange={(checked) => setBankFormData(prev => ({ ...prev, accepts_high_risk_nationalities: checked }))}
                      />
                      <Label>Accepts High-Risk Nationalities</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={bankFormData.is_active}
                        onCheckedChange={(checked) => setBankFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                      <Label>Bank is Active</Label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsBankDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveBank}>
                      {editingBank ? 'Update Bank' : 'Add Bank'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Bank Profiles List */}
          {localBanks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No bank profiles configured. Click "Add Bank" to create your first bank profile.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {localBanks.map((bank) => (
                <Card key={bank.id} className={!bank.is_active ? 'opacity-60' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {bank.bank_name}
                          <Badge variant="outline" className="text-xs">{bank.bank_code}</Badge>
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={bank.is_active}
                          onCheckedChange={() => handleToggleBankActive(bank)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => openEditBankDialog(bank)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteBank(bank.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="flex gap-4">
                      <span className="text-muted-foreground">Risk Tolerance:</span>
                      <Badge variant={bank.risk_tolerance === 'high' ? 'default' : bank.risk_tolerance === 'low' ? 'secondary' : 'outline'}>
                        {bank.risk_tolerance}
                      </Badge>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-muted-foreground">Min Turnover:</span>
                      <span>{bank.min_monthly_turnover}</span>
                    </div>
                    <div className="flex gap-4">
                      <span className="text-muted-foreground">Processing:</span>
                      <span>{bank.processing_time_days} days</span>
                    </div>
                    {bank.preferred_jurisdictions.length > 0 && (
                      <div>
                        <span className="text-muted-foreground">Jurisdictions: </span>
                        <span className="text-xs">{bank.preferred_jurisdictions.join(', ')}</span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      {bank.accepts_non_residents && <Badge variant="outline" className="text-xs">Non-Residents OK</Badge>}
                      {bank.accepts_high_risk_nationalities && <Badge variant="outline" className="text-xs">High-Risk OK</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
