import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Workflow, 
  Code, 
  GitBranch, 
  Plus, 
  Trash2, 
  GripVertical,
  ArrowRight,
  Save,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Copy,
  Download,
  Upload
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Types
interface WebflowRule {
  id: string;
  rule_name: string;
  rule_type: 'eligibility' | 'pricing' | 'document' | 'workflow';
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface RuleCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: string | string[] | number;
  logic?: 'AND' | 'OR';
}

interface RuleAction {
  id: string;
  type: 'block' | 'allow' | 'require_document' | 'set_price' | 'show_warning' | 'set_field';
  target?: string;
  value?: any;
  message?: string;
}

// Sample rules for demo
const SAMPLE_RULES: WebflowRule[] = [
  {
    id: '1',
    rule_name: 'Block High Risk Countries',
    rule_type: 'eligibility',
    conditions: [
      { id: 'c1', field: 'country.risk_level', operator: 'equals', value: 'prohibited' }
    ],
    actions: [
      { id: 'a1', type: 'block', message: 'Applications from this country are not accepted' }
    ],
    priority: 1,
    is_active: true
  },
  {
    id: '2',
    rule_name: 'Mainland Requires Trade License',
    rule_type: 'document',
    conditions: [
      { id: 'c1', field: 'jurisdiction.type', operator: 'equals', value: 'mainland' }
    ],
    actions: [
      { id: 'a1', type: 'require_document', target: 'trade_license', message: 'Trade license required for mainland' }
    ],
    priority: 2,
    is_active: true
  },
  {
    id: '3',
    rule_name: 'Premium Plan Pricing',
    rule_type: 'pricing',
    conditions: [
      { id: 'c1', field: 'plan.code', operator: 'equals', value: 'premium' },
      { id: 'c2', field: 'jurisdiction.type', operator: 'equals', value: 'freezone', logic: 'AND' }
    ],
    actions: [
      { id: 'a1', type: 'set_price', value: 15000 }
    ],
    priority: 3,
    is_active: true
  }
];

const FIELD_OPTIONS = [
  { value: 'country.code', label: 'Country Code' },
  { value: 'country.risk_level', label: 'Country Risk Level' },
  { value: 'country.is_blocked', label: 'Country Blocked' },
  { value: 'jurisdiction.type', label: 'Jurisdiction Type' },
  { value: 'jurisdiction.emirate', label: 'Emirate' },
  { value: 'activity.risk_level', label: 'Activity Risk Level' },
  { value: 'activity.is_restricted', label: 'Activity Restricted' },
  { value: 'plan.code', label: 'Plan Code' },
  { value: 'plan.base_price', label: 'Plan Base Price' },
];

const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'in', label: 'Is In List' },
  { value: 'not_in', label: 'Is Not In List' },
];

const ACTION_OPTIONS = [
  { value: 'block', label: 'Block Application' },
  { value: 'allow', label: 'Allow Application' },
  { value: 'require_document', label: 'Require Document' },
  { value: 'set_price', label: 'Set Price' },
  { value: 'show_warning', label: 'Show Warning' },
  { value: 'set_field', label: 'Set Field Value' },
];

export default function RulesTab() {
  const [activeView, setActiveView] = useState<'visual' | 'json' | 'tree'>('visual');
  const [rules, setRules] = useState<WebflowRule[]>(SAMPLE_RULES);
  const [selectedRule, setSelectedRule] = useState<WebflowRule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [jsonContent, setJsonContent] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    setJsonContent(JSON.stringify(rules, null, 2));
  }, [rules]);

  const handleJsonChange = (value: string) => {
    setJsonContent(value);
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch (e) {
      setJsonError('Invalid JSON syntax');
    }
  };

  const applyJsonChanges = () => {
    try {
      const parsed = JSON.parse(jsonContent);
      setRules(parsed);
      toast({ title: 'Success', description: 'Rules updated from JSON' });
    } catch (e) {
      toast({ title: 'Error', description: 'Invalid JSON', variant: 'destructive' });
    }
  };

  const exportRules = () => {
    const blob = new Blob([JSON.stringify(rules, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'webflow-rules.json';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: 'Rules downloaded as JSON' });
  };

  const importRules = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          setRules(imported);
          setJsonContent(JSON.stringify(imported, null, 2));
          toast({ title: 'Imported', description: 'Rules loaded successfully' });
        } catch (err) {
          toast({ title: 'Error', description: 'Invalid JSON file', variant: 'destructive' });
        }
      };
      reader.readAsText(file);
    }
  };

  const addNewRule = () => {
    const newRule: WebflowRule = {
      id: `rule-${Date.now()}`,
      rule_name: 'New Rule',
      rule_type: 'eligibility',
      conditions: [],
      actions: [],
      priority: rules.length + 1,
      is_active: true
    };
    setSelectedRule(newRule);
    setIsDialogOpen(true);
  };

  const saveRule = (rule: WebflowRule) => {
    const existingIndex = rules.findIndex(r => r.id === rule.id);
    if (existingIndex >= 0) {
      const updated = [...rules];
      updated[existingIndex] = rule;
      setRules(updated);
    } else {
      setRules([...rules, rule]);
    }
    setIsDialogOpen(false);
    toast({ title: 'Saved', description: 'Rule saved successfully' });
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
    toast({ title: 'Deleted', description: 'Rule removed' });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Decision Rules Engine
          </CardTitle>
          <CardDescription>Configure business logic rules with visual builder, JSON editor, or decision tree</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportRules}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <label>
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </span>
            </Button>
            <input type="file" accept=".json" className="hidden" onChange={importRules} />
          </label>
          <Button onClick={addNewRule}>
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="visual" className="flex items-center gap-2">
              <Workflow className="h-4 w-4" />
              Visual Builder
            </TabsTrigger>
            <TabsTrigger value="json" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              JSON Editor
            </TabsTrigger>
            <TabsTrigger value="tree" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Decision Tree
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="space-y-4">
            <VisualRuleBuilder 
              rules={rules} 
              onEdit={(rule) => { setSelectedRule(rule); setIsDialogOpen(true); }}
              onDelete={deleteRule}
              onToggle={(id) => {
                setRules(rules.map(r => r.id === id ? { ...r, is_active: !r.is_active } : r));
              }}
            />
          </TabsContent>

          <TabsContent value="json" className="space-y-4">
            <JsonEditor 
              content={jsonContent}
              onChange={handleJsonChange}
              error={jsonError}
              onApply={applyJsonChanges}
            />
          </TabsContent>

          <TabsContent value="tree" className="space-y-4">
            <DecisionTreeView rules={rules} />
          </TabsContent>
        </Tabs>

        <RuleEditorDialog 
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          rule={selectedRule}
          onSave={saveRule}
        />
      </CardContent>
    </Card>
  );
}

// Visual Rule Builder Component
function VisualRuleBuilder({ 
  rules, 
  onEdit, 
  onDelete,
  onToggle 
}: { 
  rules: WebflowRule[];
  onEdit: (rule: WebflowRule) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case 'eligibility': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'pricing': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'document': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'workflow': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-3">
      {rules.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No rules configured. Click "Add Rule" to create your first rule.</p>
        </div>
      ) : (
        rules.map((rule, index) => (
          <div 
            key={rule.id}
            className={cn(
              "border rounded-lg p-4 transition-all hover:shadow-md",
              !rule.is_active && "opacity-60 bg-muted/50"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="flex items-center gap-2 text-muted-foreground cursor-grab">
                  <GripVertical className="h-5 w-5" />
                  <span className="text-sm font-medium">#{index + 1}</span>
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{rule.rule_name}</h4>
                    <Badge className={getRuleTypeColor(rule.rule_type)}>
                      {rule.rule_type}
                    </Badge>
                    {!rule.is_active && (
                      <Badge variant="secondary">Disabled</Badge>
                    )}
                  </div>
                  
                  {/* Conditions preview */}
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-muted-foreground">IF</span>
                    {rule.conditions.map((cond, i) => (
                      <React.Fragment key={cond.id}>
                        {i > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {cond.logic || 'AND'}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="font-mono text-xs">
                          {cond.field} {cond.operator} "{String(cond.value)}"
                        </Badge>
                      </React.Fragment>
                    ))}
                    {rule.conditions.length === 0 && (
                      <span className="text-muted-foreground italic">No conditions</span>
                    )}
                  </div>

                  {/* Actions preview */}
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-muted-foreground">THEN</span>
                    {rule.actions.map((action) => (
                      <Badge key={action.id} variant="outline" className="text-xs">
                        {action.type}
                        {action.message && `: "${action.message.substring(0, 30)}..."`}
                      </Badge>
                    ))}
                    {rule.actions.length === 0 && (
                      <span className="text-muted-foreground italic">No actions</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onToggle(rule.id)}
                >
                  {rule.is_active ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onEdit(rule)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(rule.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// JSON Editor Component
function JsonEditor({ 
  content, 
  onChange, 
  error, 
  onApply 
}: { 
  content: string;
  onChange: (value: string) => void;
  error: string | null;
  onApply: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">Raw JSON Configuration</span>
          {error && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {error}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigator.clipboard.writeText(content)}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button size="sm" onClick={onApply} disabled={!!error}>
            <Save className="h-4 w-4 mr-2" />
            Apply Changes
          </Button>
        </div>
      </div>
      
      <Textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono text-sm min-h-[500px] resize-none bg-muted/50"
        placeholder="Enter JSON configuration..."
      />
    </div>
  );
}

// Decision Tree Visualizer Component
function DecisionTreeView({ rules }: { rules: WebflowRule[] }) {
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'block': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'allow': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'show_warning': return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      default: return <ArrowRight className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="h-5 w-5 text-muted-foreground" />
        <span className="font-medium">Decision Flow Visualization</span>
      </div>

      <div className="border rounded-lg p-6 bg-muted/20 overflow-x-auto">
        <div className="flex flex-col gap-6 min-w-[600px]">
          {/* Start node */}
          <div className="flex items-center gap-4">
            <div className="w-24 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
              START
            </div>
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
          </div>

          {/* Rules as decision branches */}
          {rules.filter(r => r.is_active).map((rule, index) => (
            <div key={rule.id} className="ml-12 flex items-start gap-4">
              {/* Condition box */}
              <div className="relative">
                <div className="absolute -left-12 top-1/2 -translate-y-1/2 w-8 h-px bg-border" />
                <div className="absolute -left-12 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 rounded-full bg-border" />
                
                <div className="border-2 border-primary rounded-lg p-3 bg-background min-w-[200px]">
                  <div className="text-xs text-muted-foreground mb-1">Rule #{index + 1}</div>
                  <div className="font-medium text-sm mb-2">{rule.rule_name}</div>
                  <div className="space-y-1">
                    {rule.conditions.map((cond, i) => (
                      <div key={cond.id} className="text-xs text-muted-foreground">
                        {i > 0 && <span className="text-primary font-medium">{cond.logic || 'AND'} </span>}
                        <span className="font-mono bg-muted px-1 rounded">{cond.field}</span>
                        <span className="mx-1">{cond.operator}</span>
                        <span className="font-mono bg-muted px-1 rounded">"{String(cond.value)}"</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center gap-2 self-center">
                <ArrowRight className="h-5 w-5 text-green-600" />
                <span className="text-xs text-green-600 font-medium">TRUE</span>
              </div>

              {/* Action box */}
              <div className="border rounded-lg p-3 bg-accent/50 min-w-[180px] self-center">
                {rule.actions.map((action) => (
                  <div key={action.id} className="flex items-center gap-2 text-sm">
                    {getActionIcon(action.type)}
                    <span className="capitalize">{action.type.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>

              {/* False path continues */}
              <div className="flex items-center gap-2 self-center text-muted-foreground">
                <ArrowRight className="h-5 w-5" />
                <span className="text-xs font-medium">FALSE → next rule</span>
              </div>
            </div>
          ))}

          {/* End node */}
          <div className="ml-12 flex items-center gap-4">
            <div className="w-24 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium">
              END
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-primary" />
          <span>Start/End</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-primary bg-background" />
          <span>Condition</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-accent" />
          <span>Action</span>
        </div>
      </div>
    </div>
  );
}

// Rule Editor Dialog
function RuleEditorDialog({ 
  open, 
  onOpenChange, 
  rule, 
  onSave 
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: WebflowRule | null;
  onSave: (rule: WebflowRule) => void;
}) {
  const [formData, setFormData] = useState<WebflowRule>({
    id: '',
    rule_name: '',
    rule_type: 'eligibility',
    conditions: [],
    actions: [],
    priority: 1,
    is_active: true
  });

  useEffect(() => {
    if (rule) {
      setFormData(rule);
    } else {
      setFormData({
        id: `rule-${Date.now()}`,
        rule_name: '',
        rule_type: 'eligibility',
        conditions: [],
        actions: [],
        priority: 1,
        is_active: true
      });
    }
  }, [rule, open]);

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [
        ...formData.conditions,
        { id: `cond-${Date.now()}`, field: '', operator: 'equals', value: '', logic: 'AND' }
      ]
    });
  };

  const updateCondition = (index: number, updates: Partial<RuleCondition>) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    setFormData({ ...formData, conditions: newConditions });
  };

  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index)
    });
  };

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [
        ...formData.actions,
        { id: `action-${Date.now()}`, type: 'block', message: '' }
      ]
    });
  };

  const updateAction = (index: number, updates: Partial<RuleAction>) => {
    const newActions = [...formData.actions];
    newActions[index] = { ...newActions[index], ...updates };
    setFormData({ ...formData, actions: newActions });
  };

  const removeAction = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule?.rule_name ? 'Edit Rule' : 'Create New Rule'}</DialogTitle>
          <DialogDescription>
            Define conditions and actions for this business rule
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input
                value={formData.rule_name}
                onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                placeholder="Enter rule name"
              />
            </div>
            <div className="space-y-2">
              <Label>Rule Type</Label>
              <Select
                value={formData.rule_type}
                onValueChange={(v) => setFormData({ ...formData, rule_type: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="eligibility">Eligibility</SelectItem>
                  <SelectItem value="pricing">Pricing</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="workflow">Workflow</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conditions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Conditions (IF)</Label>
              <Button variant="outline" size="sm" onClick={addCondition}>
                <Plus className="h-4 w-4 mr-1" />
                Add Condition
              </Button>
            </div>
            
            {formData.conditions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                No conditions. This rule will always apply.
              </p>
            ) : (
              formData.conditions.map((cond, index) => (
                <div key={cond.id} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                  {index > 0 && (
                    <Select
                      value={cond.logic || 'AND'}
                      onValueChange={(v) => updateCondition(index, { logic: v as 'AND' | 'OR' })}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        <SelectItem value="AND">AND</SelectItem>
                        <SelectItem value="OR">OR</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Select
                    value={cond.field}
                    onValueChange={(v) => updateCondition(index, { field: v })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {FIELD_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={cond.operator}
                    onValueChange={(v) => updateCondition(index, { operator: v as any })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {OPERATOR_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={String(cond.value)}
                    onChange={(e) => updateCondition(index, { value: e.target.value })}
                    placeholder="Value"
                    className="flex-1"
                  />
                  <Button variant="ghost" size="sm" onClick={() => removeCondition(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Actions (THEN)</Label>
              <Button variant="outline" size="sm" onClick={addAction}>
                <Plus className="h-4 w-4 mr-1" />
                Add Action
              </Button>
            </div>
            
            {formData.actions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                No actions defined.
              </p>
            ) : (
              formData.actions.map((action, index) => (
                <div key={action.id} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                  <Select
                    value={action.type}
                    onValueChange={(v) => updateAction(index, { type: v as any })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {ACTION_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={action.message || ''}
                    onChange={(e) => updateAction(index, { message: e.target.value })}
                    placeholder="Message or value"
                    className="flex-1"
                  />
                  <Button variant="ghost" size="sm" onClick={() => removeAction(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSave(formData)}>
            <Save className="h-4 w-4 mr-2" />
            Save Rule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
