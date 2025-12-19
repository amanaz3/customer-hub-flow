import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Settings, 
  Scale, 
  Calendar, 
  Hash,
  DollarSign,
  FileText,
  Globe,
  AlertTriangle
} from 'lucide-react';
import { useReconciliationRules, ReconciliationRule, ConditionType } from '@/hooks/useReconciliationRules';

const CONDITION_TYPES: { value: ConditionType; label: string; icon: React.ReactNode; params: string[] }[] = [
  { value: 'amount_exact', label: 'Exact Amount Match', icon: <DollarSign className="h-4 w-4" />, params: [] },
  { value: 'amount_tolerance', label: 'Tolerance Match', icon: <Scale className="h-4 w-4" />, params: ['tolerance_percent'] },
  { value: 'date_range', label: 'Date Range', icon: <Calendar className="h-4 w-4" />, params: ['days_before', 'days_after'] },
  { value: 'duplicate_check', label: 'Duplicate Detection', icon: <AlertTriangle className="h-4 w-4" />, params: ['fields'] },
  { value: 'tax_validation', label: 'Tax Validation', icon: <FileText className="h-4 w-4" />, params: ['rate'] },
  { value: 'currency_match', label: 'Currency Match', icon: <Globe className="h-4 w-4" />, params: ['strict'] },
  { value: 'reference_match', label: 'Reference Match', icon: <Hash className="h-4 w-4" />, params: ['partial_match'] },
];

const JURISDICTIONS = ['ALL', 'UAE', 'UK', 'US', 'EU', 'SA'];

export function ReconciliationRulesAdmin() {
  const { rules, settings, loading, createRule, updateRule, deleteRule, updateSetting } = useReconciliationRules();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ReconciliationRule | null>(null);
  const [formData, setFormData] = useState({
    rule_name: '',
    description: '',
    jurisdiction: 'ALL',
    condition_type: 'amount_exact' as ConditionType,
    params: {} as Record<string, any>,
    priority: 50,
    is_active: true
  });

  const resetForm = () => {
    setFormData({
      rule_name: '',
      description: '',
      jurisdiction: 'ALL',
      condition_type: 'amount_exact',
      params: {},
      priority: 50,
      is_active: true
    });
    setEditingRule(null);
  };

  const openEditDialog = (rule: ReconciliationRule) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      description: rule.description || '',
      jurisdiction: rule.jurisdiction,
      condition_type: rule.condition_type,
      params: rule.params,
      priority: rule.priority,
      is_active: rule.is_active
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingRule) {
        await updateRule(editingRule.id, formData);
      } else {
        await createRule({
          ...formData,
          created_by: null
        });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      await deleteRule(id);
    }
  };

  const getConditionTypeInfo = (type: ConditionType) => 
    CONDITION_TYPES.find(ct => ct.value === type);

  const renderParamInputs = () => {
    const conditionInfo = getConditionTypeInfo(formData.condition_type);
    if (!conditionInfo) return null;

    return conditionInfo.params.map(param => {
      switch (param) {
        case 'tolerance_percent':
          return (
            <div key={param} className="space-y-2">
              <Label>Tolerance Percentage: {formData.params.tolerance_percent ?? 2}%</Label>
              <Slider
                value={[formData.params.tolerance_percent ?? 2]}
                onValueChange={([val]) => setFormData(prev => ({
                  ...prev,
                  params: { ...prev.params, tolerance_percent: val }
                }))}
                min={0.5}
                max={10}
                step={0.5}
              />
            </div>
          );
        case 'days_before':
        case 'days_after':
          return (
            <div key={param} className="space-y-2">
              <Label>{param === 'days_before' ? 'Days Before' : 'Days After'}</Label>
              <Input
                type="number"
                value={formData.params[param] ?? (param === 'days_before' ? 7 : 3)}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  params: { ...prev.params, [param]: parseInt(e.target.value) }
                }))}
                min={0}
                max={30}
              />
            </div>
          );
        case 'rate':
          return (
            <div key={param} className="space-y-2">
              <Label>Tax Rate: {formData.params.rate ?? 5}%</Label>
              <Slider
                value={[formData.params.rate ?? 5]}
                onValueChange={([val]) => setFormData(prev => ({
                  ...prev,
                  params: { ...prev.params, rate: val }
                }))}
                min={0}
                max={25}
                step={0.5}
              />
            </div>
          );
        case 'strict':
          return (
            <div key={param} className="flex items-center space-x-2">
              <Switch
                checked={formData.params.strict ?? true}
                onCheckedChange={val => setFormData(prev => ({
                  ...prev,
                  params: { ...prev.params, strict: val }
                }))}
              />
              <Label>Strict Matching</Label>
            </div>
          );
        case 'partial_match':
          return (
            <div key={param} className="flex items-center space-x-2">
              <Switch
                checked={formData.params.partial_match ?? true}
                onCheckedChange={val => setFormData(prev => ({
                  ...prev,
                  params: { ...prev.params, partial_match: val }
                }))}
              />
              <Label>Allow Partial Match</Label>
            </div>
          );
        case 'fields':
          return (
            <div key={param} className="space-y-2">
              <Label>Check Fields</Label>
              <div className="flex gap-2 flex-wrap">
                {['reference', 'amount', 'date', 'vendor'].map(field => (
                  <Badge
                    key={field}
                    variant={(formData.params.fields || []).includes(field) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const currentFields = formData.params.fields || [];
                      const newFields = currentFields.includes(field)
                        ? currentFields.filter((f: string) => f !== field)
                        : [...currentFields, field];
                      setFormData(prev => ({
                        ...prev,
                        params: { ...prev.params, fields: newFields }
                      }));
                    }}
                  >
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
          );
        default:
          return null;
      }
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading rules...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">Reconciliation Rules</TabsTrigger>
          <TabsTrigger value="settings">Global Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Reconciliation Rules</CardTitle>
                <CardDescription>Configure matching rules for automatic reconciliation</CardDescription>
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
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingRule ? 'Edit Rule' : 'Create New Rule'}</DialogTitle>
                    <DialogDescription>
                      Configure a reconciliation rule with conditions and parameters
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Rule Name</Label>
                      <Input
                        value={formData.rule_name}
                        onChange={e => setFormData(prev => ({ ...prev, rule_name: e.target.value }))}
                        placeholder="e.g., UAE VAT Check"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={formData.description}
                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional description"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Jurisdiction</Label>
                        <Select
                          value={formData.jurisdiction}
                          onValueChange={val => setFormData(prev => ({ ...prev, jurisdiction: val }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {JURISDICTIONS.map(j => (
                              <SelectItem key={j} value={j}>{j === 'ALL' ? 'All Jurisdictions' : j}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Priority (1-100)</Label>
                        <Input
                          type="number"
                          value={formData.priority}
                          onChange={e => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 50 }))}
                          min={1}
                          max={100}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Condition Type</Label>
                      <Select
                        value={formData.condition_type}
                        onValueChange={val => setFormData(prev => ({ 
                          ...prev, 
                          condition_type: val as ConditionType,
                          params: {} 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITION_TYPES.map(ct => (
                            <SelectItem key={ct.value} value={ct.value}>
                              <span className="flex items-center gap-2">
                                {ct.icon}
                                {ct.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {renderParamInputs()}

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={val => setFormData(prev => ({ ...prev, is_active: val }))}
                      />
                      <Label>Active</Label>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={!formData.rule_name}>
                      {editingRule ? 'Update' : 'Create'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Priority</TableHead>
                    <TableHead>Rule Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Jurisdiction</TableHead>
                    <TableHead>Parameters</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map(rule => {
                    const typeInfo = getConditionTypeInfo(rule.condition_type);
                    return (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <Badge variant="outline">{rule.priority}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{rule.rule_name}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-2">
                            {typeInfo?.icon}
                            {typeInfo?.label || rule.condition_type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={rule.jurisdiction === 'ALL' ? 'secondary' : 'default'}>
                            {rule.jurisdiction}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {JSON.stringify(rule.params)}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(rule)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Global Settings
              </CardTitle>
              <CardDescription>Configure global reconciliation thresholds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Minimum Confidence Score</Label>
                  <span className="text-sm text-muted-foreground">{(settings.min_confidence_score * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[settings.min_confidence_score * 100]}
                  onValueChange={([val]) => updateSetting('min_confidence_score', val / 100)}
                  min={50}
                  max={100}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  Matches below this score require manual review
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Default Tolerance Percentage</Label>
                  <span className="text-sm text-muted-foreground">{settings.default_tolerance_percent}%</span>
                </div>
                <Slider
                  value={[settings.default_tolerance_percent]}
                  onValueChange={([val]) => updateSetting('default_tolerance_percent', val)}
                  min={0.5}
                  max={10}
                  step={0.5}
                />
                <p className="text-xs text-muted-foreground">
                  Used when rules don't specify a tolerance
                </p>
              </div>

              <div className="flex items-center justify-between py-4 border-t">
                <div>
                  <Label>Auto-Match Enabled</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically match transactions above confidence threshold
                  </p>
                </div>
                <Switch
                  checked={settings.auto_match_enabled}
                  onCheckedChange={val => updateSetting('auto_match_enabled', val)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
