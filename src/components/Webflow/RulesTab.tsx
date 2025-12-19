import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  Upload,
  PlayCircle,
  Calculator,
  Building
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Types
interface WebflowRule {
  id: string;
  rule_name: string;
  rule_type: 'eligibility' | 'pricing' | 'document' | 'workflow' | string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  is_active: boolean;
  description?: string | null;
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
  type: 'block' | 'allow' | 'require_document' | 'set_price' | 'show_warning' | 'set_field' | 'set_processing_time' | 'recommend_bank' | 'assign_agent' | 'add_risk_score' | 'auto_approve' | 'require_manual_review';
  target?: string;
  value?: any;
  message?: string;
  // Advanced document requirements
  documents?: DocumentRequirement[];
  // Processing time in days
  processingDays?: number;
  // Recommended banks
  banks?: string[];
  // Agent assignment
  agentId?: string;
  agentName?: string;
  // Risk score adjustment
  riskPoints?: number;
}

interface DocumentRequirement {
  id: string;
  name: string;
  category: 'mandatory' | 'edd' | 'optional';
  description?: string;
}

interface RulesTabProps {
  rules: WebflowRule[];
  onUpdate: (rules: WebflowRule[]) => Promise<void>;
}

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
  { value: 'set_price', label: 'Set Price (Fixed Amount)' },
  { value: 'multiply_price', label: 'Multiply Price (%)' },
  { value: 'add_fee', label: 'Add Fee' },
  { value: 'show_warning', label: 'Show Warning' },
  { value: 'set_field', label: 'Set Field Value' },
  { value: 'set_processing_time', label: 'Set Processing Time' },
  { value: 'recommend_bank', label: 'Recommend Banks' },
  { value: 'assign_agent', label: 'Assign to Agent' },
  { value: 'add_risk_score', label: 'Add Risk Score' },
  { value: 'auto_approve', label: 'Auto-Approve' },
  { value: 'require_manual_review', label: 'Require Manual Review' },
  { value: 'skip_step', label: 'Skip Step' },
  { value: 'show_step', label: 'Show Step' },
  { value: 'apply_discount', label: 'Apply Discount (%)' },
];

export default function RulesTab({ rules: propRules, onUpdate }: RulesTabProps) {
  const [activeView, setActiveView] = useState<'visual' | 'json' | 'tree'>('visual');
  const [rules, setRules] = useState<WebflowRule[]>(propRules || []);
  const [selectedRule, setSelectedRule] = useState<WebflowRule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [jsonContent, setJsonContent] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Fetch rules from webflow_rules table and merge with prop rules
  useEffect(() => {
    const fetchRulesFromTable = async () => {
      try {
        const { data, error } = await supabase
          .from('webflow_rules')
          .select('*')
          .eq('is_active', true)
          .order('priority');
        
        if (error) {
          console.error('Error fetching webflow_rules:', error);
          setRules(propRules || []);
          return;
        }
        
        // Map database records to WebflowRule type
        const dbRules: WebflowRule[] = (data || []).map(r => ({
          id: r.id,
          rule_name: r.rule_name,
          rule_type: r.rule_type as WebflowRule['rule_type'],
          description: r.description,
          conditions: (r.conditions as unknown as RuleCondition[]) || [],
          actions: (r.actions as unknown as RuleAction[]) || [],
          priority: r.priority,
          is_active: r.is_active,
          created_at: r.created_at,
          updated_at: r.updated_at
        }));
        
        // Merge prop rules with database rules, avoiding duplicates by id
        const propRuleIds = new Set((propRules || []).map(r => r.id));
        const uniqueDbRules = dbRules.filter(r => !propRuleIds.has(r.id));
        const mergedRules = [...(propRules || []), ...uniqueDbRules];
        setRules(mergedRules);
      } catch (err) {
        console.error('Error in fetchRulesFromTable:', err);
        setRules(propRules || []);
      }
    };
    
    fetchRulesFromTable();
  }, [propRules]);

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

  const applyJsonChanges = async () => {
    try {
      const parsed = JSON.parse(jsonContent);
      await onUpdate(parsed);
      toast({ title: 'Success', description: 'Rules updated from JSON' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to apply JSON changes', variant: 'destructive' });
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

  const importRules = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          await onUpdate(imported);
          toast({ title: 'Imported', description: 'Rules loaded successfully' });
        } catch (err) {
          toast({ title: 'Error', description: 'Failed to import rules', variant: 'destructive' });
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

  const saveRule = async (rule: WebflowRule) => {
    try {
      const existingIndex = rules.findIndex(r => r.id === rule.id);
      let updatedRules: WebflowRule[];
      
      if (existingIndex === -1) {
        // New rule
        updatedRules = [...rules, rule];
      } else {
        // Update existing
        updatedRules = rules.map(r => r.id === rule.id ? rule : r);
      }
      
      await onUpdate(updatedRules);
      setIsDialogOpen(false);
      toast({ title: 'Saved', description: 'Rule saved successfully' });
    } catch (error) {
      console.error('Error saving rule:', error);
      toast({ title: 'Error', description: 'Failed to save rule', variant: 'destructive' });
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const updatedRules = rules.filter(r => r.id !== id);
      await onUpdate(updatedRules);
      toast({ title: 'Deleted', description: 'Rule removed' });
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({ title: 'Error', description: 'Failed to delete rule', variant: 'destructive' });
    }
  };

  const toggleRule = async (id: string) => {
    try {
      const updatedRules = rules.map(r => 
        r.id === id ? { ...r, is_active: !r.is_active } : r
      );
      await onUpdate(updatedRules);
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast({ title: 'Error', description: 'Failed to toggle rule', variant: 'destructive' });
    }
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
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="visual" className="flex items-center gap-2">
              <Workflow className="h-4 w-4" />
              Visual
            </TabsTrigger>
            <TabsTrigger value="json" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              JSON
            </TabsTrigger>
            <TabsTrigger value="tree" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Tree
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4" />
              Test
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="space-y-4">
            <VisualRuleBuilder 
              rules={rules} 
              onEdit={(rule) => { setSelectedRule(rule); setIsDialogOpen(true); }}
              onDelete={deleteRule}
              onToggle={toggleRule}
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

          <TabsContent value="test" className="space-y-4">
            <RuleTester rules={rules} />
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
                    {rule.actions.map((action) => {
                      // Handle advanced document requirements
                      if (action.type === 'require_document' && action.documents && action.documents.length > 0) {
                        return (
                          <div key={action.id} className="flex flex-wrap gap-1">
                            {action.documents.map((doc, idx) => (
                              <Badge 
                                key={idx} 
                                variant="outline" 
                                className={cn(
                                  "text-xs",
                                  doc.category === 'mandatory' && "border-red-500 text-red-700 dark:text-red-400",
                                  doc.category === 'edd' && "border-amber-500 text-amber-700 dark:text-amber-400",
                                  doc.category === 'optional' && "border-blue-500 text-blue-700 dark:text-blue-400"
                                )}
                              >
                                📄 {doc.name || 'Unnamed'} ({doc.category})
                              </Badge>
                            ))}
                          </div>
                        );
                      }
                      
                      // Legacy single document or other actions
                      let actionDetail = '';
                      let actionClass = 'text-xs';
                      if (action.type === 'require_document') {
                        actionDetail = action.target || action.value || '(no document specified)';
                      } else if (action.type === 'set_price' || action.type === 'set_field') {
                        actionDetail = action.target ? `${action.target}: ${action.value}` : String(action.value || '');
                      } else if (action.type === 'set_processing_time') {
                        actionDetail = `${action.processingDays || action.value || '?'} days`;
                      } else if (action.type === 'add_risk_score') {
                        actionDetail = `+${action.riskPoints || action.value || 0} points`;
                        actionClass = 'text-xs border-amber-500 text-amber-700 dark:text-amber-400';
                      } else if (action.type === 'auto_approve') {
                        actionDetail = action.message || 'Low risk';
                        actionClass = 'text-xs border-green-500 text-green-700 dark:text-green-400';
                      } else if (action.type === 'require_manual_review') {
                        actionDetail = action.message || 'Needs review';
                        actionClass = 'text-xs border-orange-500 text-orange-700 dark:text-orange-400';
                      } else if (action.message) {
                        actionDetail = action.message.length > 30 ? `${action.message.substring(0, 30)}...` : action.message;
                      }
                      
                      return (
                        <Badge key={action.id} variant="outline" className={actionClass}>
                          {action.type.replace(/_/g, ' ')}
                          {actionDetail && `: "${actionDetail}"`}
                        </Badge>
                      );
                    })}
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
                <SelectContent className="bg-background z-[9999]" position="popper" sideOffset={4}>
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
                      <SelectContent className="bg-background z-[9999]" position="popper" sideOffset={4}>
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
                    <SelectContent className="bg-background z-[9999]" position="popper" sideOffset={4}>
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
                    <SelectContent className="bg-background z-[9999]" position="popper" sideOffset={4}>
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
                <div key={action.id} className="p-3 border rounded-lg bg-muted/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <Select
                      value={action.type}
                      onValueChange={(v) => updateAction(index, { type: v as any })}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-[9999]" position="popper" sideOffset={4}>
                        {ACTION_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {action.type !== 'require_document' && action.type !== 'set_processing_time' && action.type !== 'recommend_bank' && action.type !== 'assign_agent' && action.type !== 'add_risk_score' && (
                      <Input
                        value={action.message || action.target || ''}
                        onChange={(e) => updateAction(index, { message: e.target.value })}
                        placeholder={action.type === 'set_price' ? 'Price value' : 'Message or reason'}
                        className="flex-1"
                      />
                    )}
                    
                    {action.type === 'set_processing_time' && (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="number"
                          min={1}
                          value={action.processingDays || ''}
                          onChange={(e) => updateAction(index, { processingDays: parseInt(e.target.value) || undefined })}
                          placeholder="Days"
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">business days</span>
                      </div>
                    )}
                    
                    {action.type === 'add_risk_score' && (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="number"
                          value={action.riskPoints || ''}
                          onChange={(e) => updateAction(index, { riskPoints: parseInt(e.target.value) || 0 })}
                          placeholder="Points"
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">risk points (thresholds: &lt;30 auto-approve, 30-70 review, &gt;70 block)</span>
                      </div>
                    )}
                    
                    <Button variant="ghost" size="sm" onClick={() => removeAction(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  
                  {/* Advanced Document Requirements UI */}
                  {action.type === 'require_document' && (
                    <DocumentRequirementsEditor
                      documents={action.documents || []}
                      onChange={(docs) => updateAction(index, { documents: docs })}
                    />
                  )}
                  
                  {/* Bank Recommendations UI */}
                  {action.type === 'recommend_bank' && (
                    <BankRecommendationsEditor
                      banks={action.banks || []}
                      onChange={(banks) => updateAction(index, { banks })}
                    />
                  )}
                  
                  {/* Agent Assignment UI */}
                  {action.type === 'assign_agent' && (
                    <AgentSelectorEditor
                      agentId={action.agentId || ''}
                      agentName={action.agentName || ''}
                      onChange={(agentId, agentName) => updateAction(index, { agentId, agentName })}
                    />
                  )}
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

// Document Requirements Editor Component
function DocumentRequirementsEditor({
  documents,
  onChange
}: {
  documents: DocumentRequirement[];
  onChange: (docs: DocumentRequirement[]) => void;
}) {
  const addDocument = () => {
    onChange([
      ...documents,
      { id: `doc-${Date.now()}`, name: '', category: 'mandatory' }
    ]);
  };

  const updateDocument = (index: number, updates: Partial<DocumentRequirement>) => {
    const newDocs = [...documents];
    newDocs[index] = { ...newDocs[index], ...updates };
    onChange(newDocs);
  };

  const removeDocument = (index: number) => {
    onChange(documents.filter((_, i) => i !== index));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'mandatory': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'edd': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
      case 'optional': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-2 pl-4 border-l-2 border-primary/30">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Required Documents</span>
        <Button variant="outline" size="sm" onClick={addDocument}>
          <Plus className="h-3 w-3 mr-1" />
          Add Document
        </Button>
      </div>
      
      {documents.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-2">
          No documents specified. Click "Add Document" to require specific documents.
        </p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc, index) => (
            <div key={doc.id} className="flex items-center gap-2 p-2 bg-background rounded border">
              <Input
                value={doc.name}
                onChange={(e) => updateDocument(index, { name: e.target.value })}
                placeholder="Document name (e.g., Passport Copy)"
                className="flex-1 h-8 text-sm"
              />
              <Select
                value={doc.category}
                onValueChange={(v) => updateDocument(index, { category: v as any })}
              >
                <SelectTrigger className="w-28 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-[9999]" position="popper" sideOffset={4}>
                  <SelectItem value="mandatory">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Mandatory
                    </span>
                  </SelectItem>
                  <SelectItem value="edd">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      EDD
                    </span>
                  </SelectItem>
                  <SelectItem value="optional">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Optional
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={doc.description || ''}
                onChange={(e) => updateDocument(index, { description: e.target.value })}
                placeholder="Description (optional)"
                className="flex-1 h-8 text-sm"
              />
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => removeDocument(index)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex gap-2 pt-1">
        <Badge className={getCategoryColor('mandatory')} variant="outline">
          Mandatory = Required
        </Badge>
        <Badge className={getCategoryColor('edd')} variant="outline">
          EDD = Enhanced Due Diligence
        </Badge>
        <Badge className={getCategoryColor('optional')} variant="outline">
          Optional = If Available
        </Badge>
      </div>
    </div>
  );
}

// Bank Recommendations Editor Component
function BankRecommendationsEditor({
  banks,
  onChange
}: {
  banks: string[];
  onChange: (banks: string[]) => void;
}) {
  const [newBank, setNewBank] = useState('');
  const [availableBanks, setAvailableBanks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch banks from database
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const { data, error } = await supabase
          .from('banks')
          .select('name')
          .eq('is_active', true)
          .order('name');
        
        if (error) throw error;
        setAvailableBanks(data?.map(b => b.name) || []);
      } catch (err) {
        console.error('Failed to fetch banks:', err);
        // Fallback to empty array - admin can still type custom banks
        setAvailableBanks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBanks();
  }, []);

  const addBank = (bank: string) => {
    if (bank && !banks.includes(bank)) {
      onChange([...banks, bank]);
      setNewBank('');
    }
  };

  const removeBank = (index: number) => {
    onChange(banks.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2 pl-4 border-l-2 border-blue-300">
      <div className="flex items-center gap-2">
        <Building className="h-4 w-4 text-blue-600" />
        <Label className="text-sm font-medium">Recommended Banks</Label>
      </div>
      
      {banks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {banks.map((bank, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
              <Building className="h-3 w-3" />
              {bank}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-blue-200 dark:hover:bg-blue-800"
                onClick={() => removeBank(index)}
              >
                <XCircle className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
      
      <div className="flex gap-2">
        <Select value={newBank} onValueChange={(v) => addBank(v)}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select or add a bank..." />
          </SelectTrigger>
          <SelectContent className="bg-background z-[9999]" position="popper" sideOffset={4}>
            {loading ? (
              <SelectItem value="_loading" disabled>Loading banks...</SelectItem>
            ) : availableBanks.length === 0 ? (
              <SelectItem value="_empty" disabled>No banks configured</SelectItem>
            ) : (
              availableBanks.filter(b => !banks.includes(b)).map(bank => (
                <SelectItem key={bank} value={bank}>{bank}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Banks suitable for this activity risk level will be suggested to customers.
      </p>
    </div>
  );
}

// Agent Selector Editor Component
function AgentSelectorEditor({
  agentId,
  agentName,
  onChange
}: {
  agentId: string;
  agentName: string;
  onChange: (agentId: string, agentName: string) => void;
}) {
  const [agents, setAgents] = useState<{ id: string; name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch agents from profiles table
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, email')
          .order('name');
        
        if (error) throw error;
        setAgents(data?.map(a => ({ 
          id: a.id, 
          name: a.name || a.email || 'Unknown',
          email: a.email || ''
        })) || []);
      } catch (err) {
        console.error('Failed to fetch agents:', err);
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  const handleAgentChange = (selectedId: string) => {
    const agent = agents.find(a => a.id === selectedId);
    onChange(selectedId, agent?.name || '');
  };

  return (
    <div className="space-y-2 pl-4 border-l-2 border-green-300">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">Assign to Agent</Label>
      </div>
      
      <Select value={agentId} onValueChange={handleAgentChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an agent..." />
        </SelectTrigger>
        <SelectContent className="bg-background z-[9999]" position="popper" sideOffset={4}>
          {loading ? (
            <SelectItem value="_loading" disabled>Loading agents...</SelectItem>
          ) : agents.length === 0 ? (
            <SelectItem value="_empty" disabled>No agents available</SelectItem>
          ) : (
            agents.map(agent => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.name} {agent.email && `(${agent.email})`}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      
      {agentId && agentName && (
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          Will assign to: {agentName}
        </Badge>
      )}
      
      <p className="text-xs text-muted-foreground">
        Applications matching this rule will be automatically assigned to the selected agent.
      </p>
    </div>
  );
}

// Rule Tester Component
function RuleTester({ rules }: { rules: WebflowRule[] }) {
  const [testContext, setTestContext] = useState({
    emirate: '',
    locationType: '',
    activityRiskLevel: '',
    planCode: '',
  });

  const testResults = useMemo(() => {
    const results = {
      priceMultiplier: 1,
      additionalFees: 0,
      appliedRules: [] as string[],
      warnings: [] as string[],
      blocked: false,
      blockMessage: '',
      requiredDocuments: [] as { name: string; category: string }[],
      processingTimeDays: null as number | null,
      recommendedBanks: [] as string[],
    };

    const evaluateCondition = (condition: RuleCondition): boolean => {
      const fieldMap: Record<string, string> = {
        'jurisdiction.type': testContext.locationType,
        'jurisdiction_type': testContext.locationType,
        'location_type': testContext.locationType,
        'jurisdiction.emirate': testContext.emirate,
        'emirate': testContext.emirate,
        'activity.risk_level': testContext.activityRiskLevel,
        'risk_level': testContext.activityRiskLevel,
        'plan.code': testContext.planCode,
        'plan_code': testContext.planCode,
      };

      const fieldValue = fieldMap[condition.field] || '';
      const condValue = String(condition.value);

      switch (condition.operator) {
        case 'equals':
          return fieldValue.toLowerCase() === condValue.toLowerCase();
        case 'not_equals':
          return fieldValue.toLowerCase() !== condValue.toLowerCase();
        case 'contains':
          return fieldValue.toLowerCase().includes(condValue.toLowerCase());
        case 'in':
          const inList = Array.isArray(condition.value) ? condition.value : condValue.split(',').map(s => s.trim());
          return inList.some(v => v.toLowerCase() === fieldValue.toLowerCase());
        case 'not_in':
          const notInList = Array.isArray(condition.value) ? condition.value : condValue.split(',').map(s => s.trim());
          return !notInList.some(v => v.toLowerCase() === fieldValue.toLowerCase());
        default:
          return false;
      }
    };

    for (const rule of rules) {
      if (!rule.is_active) continue;

      const allConditionsMatch = rule.conditions.length === 0 || 
        rule.conditions.every(cond => evaluateCondition(cond));

      if (allConditionsMatch) {
        results.appliedRules.push(rule.rule_name);

        for (const action of rule.actions) {
          switch (action.type) {
            case 'set_price':
              if (action.value && typeof action.value === 'number') {
                if (action.value > 1) {
                  results.additionalFees += action.value;
                } else {
                  results.priceMultiplier *= action.value;
                }
              }
              break;
            case 'show_warning':
              if (action.message) results.warnings.push(action.message);
              break;
            case 'block':
              results.blocked = true;
              results.blockMessage = action.message || 'Blocked';
              break;
            case 'require_document':
              // Handle advanced document requirements
              if (action.documents && action.documents.length > 0) {
                action.documents.forEach(doc => {
                  results.requiredDocuments.push({ name: doc.name, category: doc.category });
                });
              } else if (action.target) {
                // Legacy single document
                results.requiredDocuments.push({ name: action.target, category: 'mandatory' });
              }
              break;
            case 'set_processing_time':
              const days = action.processingDays ?? (typeof action.value === 'number' ? action.value : null);
              if (days !== null) {
                results.processingTimeDays = results.processingTimeDays 
                  ? Math.max(results.processingTimeDays, days)
                  : days;
              }
              break;
            case 'recommend_bank':
              if (action.banks && action.banks.length > 0) {
                action.banks.forEach(bank => {
                  if (!results.recommendedBanks.includes(bank)) {
                    results.recommendedBanks.push(bank);
                  }
                });
              }
              break;
          }
        }
      }
    }

    return results;
  }, [rules, testContext]);

  const hasAnyInput = testContext.emirate || testContext.locationType || 
                      testContext.activityRiskLevel || testContext.planCode;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <PlayCircle className="h-5 w-5 text-muted-foreground" />
        <span className="font-medium">Rule Tester</span>
        <span className="text-sm text-muted-foreground">— Simulate selections to see which rules fire</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Emirate</Label>
          <Select value={testContext.emirate} onValueChange={(v) => setTestContext(prev => ({ ...prev, emirate: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select emirate" />
            </SelectTrigger>
            <SelectContent className="bg-background z-[9999]" position="popper" sideOffset={4}>
              <SelectItem value="dubai">Dubai</SelectItem>
              <SelectItem value="abu_dhabi">Abu Dhabi</SelectItem>
              <SelectItem value="sharjah">Sharjah</SelectItem>
              <SelectItem value="ajman">Ajman</SelectItem>
              <SelectItem value="rak">RAK</SelectItem>
              <SelectItem value="fujairah">Fujairah</SelectItem>
              <SelectItem value="umm_al_quwain">Umm Al Quwain</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Location Type</Label>
          <Select value={testContext.locationType} onValueChange={(v) => setTestContext(prev => ({ ...prev, locationType: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="bg-background z-[9999]" position="popper" sideOffset={4}>
              <SelectItem value="mainland">Mainland</SelectItem>
              <SelectItem value="freezone">Freezone</SelectItem>
              <SelectItem value="offshore">Offshore</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Activity Risk Level</Label>
          <Select value={testContext.activityRiskLevel} onValueChange={(v) => setTestContext(prev => ({ ...prev, activityRiskLevel: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select risk" />
            </SelectTrigger>
            <SelectContent className="bg-background z-[9999]" position="popper" sideOffset={4}>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Plan Code</Label>
          <Select value={testContext.planCode} onValueChange={(v) => setTestContext(prev => ({ ...prev, planCode: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select plan" />
            </SelectTrigger>
            <SelectContent className="bg-background z-[9999]" position="popper" sideOffset={4}>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <span className="font-medium">Test Results</span>
        </div>

        {!hasAnyInput ? (
          <p className="text-muted-foreground text-sm">Select values above to test which rules would fire.</p>
        ) : (
          <div className="space-y-4">
            {/* Applied Rules */}
            <div>
              <Label className="text-muted-foreground">Applied Rules ({testResults.appliedRules.length})</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {testResults.appliedRules.length === 0 ? (
                  <span className="text-sm text-muted-foreground italic">No rules matched</span>
                ) : (
                  testResults.appliedRules.map((rule, i) => (
                    <Badge key={i} variant="default">{rule}</Badge>
                  ))
                )}
              </div>
            </div>

            {/* Price Adjustments */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground">Price Multiplier</Label>
                <p className={cn(
                  "text-lg font-bold",
                  testResults.priceMultiplier !== 1 && "text-amber-600"
                )}>
                  {testResults.priceMultiplier === 1 ? '×1.00 (no change)' : `×${testResults.priceMultiplier.toFixed(2)}`}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Additional Fees</Label>
                <p className={cn(
                  "text-lg font-bold",
                  testResults.additionalFees > 0 && "text-amber-600"
                )}>
                  {testResults.additionalFees === 0 ? 'AED 0' : `+AED ${testResults.additionalFees.toLocaleString()}`}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Processing Time</Label>
                <p className={cn(
                  "text-lg font-bold",
                  testResults.processingTimeDays && "text-blue-600"
                )}>
                  {testResults.processingTimeDays ? `${testResults.processingTimeDays} days` : 'Default'}
                </p>
              </div>
            </div>

            {/* Blocked */}
            {testResults.blocked && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="font-medium text-destructive">BLOCKED: {testResults.blockMessage}</span>
                </div>
              </div>
            )}

            {/* Warnings */}
            {testResults.warnings.length > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Warnings</Label>
                {testResults.warnings.map((warning, i) => (
                  <div key={i} className="p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm">{warning}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Required Documents */}
            {testResults.requiredDocuments.length > 0 && (
              <div>
                <Label className="text-muted-foreground">Required Documents</Label>
                <div className="mt-2 space-y-1">
                  {testResults.requiredDocuments.map((doc, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        doc.category === 'mandatory' && "bg-red-500",
                        doc.category === 'edd' && "bg-amber-500",
                        doc.category === 'optional' && "bg-blue-500"
                      )} />
                      <span>{doc.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {doc.category}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Banks */}
            {testResults.recommendedBanks.length > 0 && (
              <div>
                <Label className="text-muted-foreground">Recommended Banks</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {testResults.recommendedBanks.map((bank, i) => (
                    <Badge key={i} variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                      <Building className="h-3 w-3" />
                      {bank}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
