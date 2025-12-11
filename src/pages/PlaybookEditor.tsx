import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SecureAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import DecisionTreeVisualizer from '@/components/Playbook/DecisionTreeVisualizer';
import { 
  Plus, 
  Save, 
  Trash2, 
  BookOpen, 
  MessageSquare, 
  AlertTriangle, 
  DollarSign, 
  HelpCircle,
  Heart,
  Play,
  GripVertical,
  GitBranch,
  FileText,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Brain,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSalesAssistant } from '@/hooks/useSalesAssistant';

interface ScriptNode {
  id: string;
  stage_id: string;
  parent_id: string | null;
  node_type: 'root' | 'branch' | 'leaf';
  script_text: string;
  trigger_condition: string | null;
  order_index: number;
  metadata: Record<string, any>;
}

interface Playbook {
  id: string;
  name: string;
  description: string;
  product_id: string | null;
  call_type: string;
  target_segments: string[];
  is_active: boolean;
}

interface PlaybookStage {
  id: string;
  playbook_id: string;
  stage_name: string;
  stage_order: number;
  stage_type: string;
  duration_seconds: number;
  key_objectives: string[];
  success_criteria: string[];
  script: string | null;
  opening_lines: string[] | null;
}

interface ObjectionHandler {
  id: string;
  playbook_id: string;
  objection_type: string;
  objection_trigger: string;
  severity: string;
  response_script: string;
  follow_up_question: string;
}

interface PricingStrategy {
  id: string;
  playbook_id: string;
  customer_segment: string;
  urgency_level: string;
  discount_range_min: number;
  discount_range_max: number;
  pricing_script: string;
  negotiation_floor: number;
}

interface DiscoveryQuestion {
  id: string;
  playbook_id: string;
  stage_id?: string | null;
  question_text: string;
  question_purpose: string;
  priority: number;
}

interface EmotionalResponse {
  id: string;
  playbook_id: string;
  emotion_detected: string;
  response_strategy: string;
  tone_adjustment: string;
  suggested_phrases: string[];
}

// Script Node Editor Component for Decision Tree
interface ScriptNodeEditorProps {
  node: ScriptNode;
  allNodes: ScriptNode[];
  stageId: string;
  onUpdate: (stageId: string, nodeId: string, updates: Partial<ScriptNode>) => void;
  onSave: (node: ScriptNode) => void;
  onDelete: (stageId: string, nodeId: string) => void;
  onAddChild: (stageId: string, parentId: string) => void;
  level: number;
}

const ScriptNodeEditor: React.FC<ScriptNodeEditorProps> = ({
  node,
  allNodes,
  stageId,
  onUpdate,
  onSave,
  onDelete,
  onAddChild,
  level
}) => {
  const childNodes = allNodes.filter(n => n.parent_id === node.id);
  const isRoot = !node.parent_id;
  
  return (
    <div className={`${level > 0 ? 'ml-6 border-l-2 border-primary/20 pl-3' : ''}`}>
      <div className="bg-background border rounded-md p-3 space-y-2">
        <div className="flex items-start gap-2">
          <Badge variant="outline" className="text-xs shrink-0">
            {isRoot ? 'Root' : node.node_type === 'leaf' ? 'Leaf' : 'Branch'}
          </Badge>
          <div className="flex-1 space-y-2">
            {!isRoot && (
              <Input
                placeholder="Trigger condition (e.g., 'customer says interested')"
                value={node.trigger_condition || ''}
                onChange={(e) => onUpdate(stageId, node.id, { trigger_condition: e.target.value })}
                className="text-xs h-7"
              />
            )}
            <Textarea
              placeholder="What to say at this point..."
              value={node.script_text}
              onChange={(e) => onUpdate(stageId, node.id, { script_text: e.target.value })}
              className="min-h-[60px] text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onSave(node)}>
              <Save className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onAddChild(stageId, node.id)}>
              <Plus className="h-3 w-3" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDelete(stageId, node.id)}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        </div>
      </div>
      
      {childNodes.length > 0 && (
        <div className="mt-2 space-y-2">
          {childNodes.map(child => (
            <ScriptNodeEditor
              key={child.id}
              node={child}
              allNodes={allNodes}
              stageId={stageId}
              onUpdate={onUpdate}
              onSave={onSave}
              onDelete={onDelete}
              onAddChild={onAddChild}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const PlaybookEditor = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [stages, setStages] = useState<PlaybookStage[]>([]);
  const [objections, setObjections] = useState<ObjectionHandler[]>([]);
  const [pricing, setPricing] = useState<PricingStrategy[]>([]);
  const [questions, setQuestions] = useState<DiscoveryQuestion[]>([]);
  const [emotions, setEmotions] = useState<EmotionalResponse[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [scriptNodes, setScriptNodes] = useState<Record<string, ScriptNode[]>>({});
  const [stageScriptModes, setStageScriptModes] = useState<Record<string, 'simple' | 'tree'>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [callTypeFilter, setCallTypeFilter] = useState<'all' | 'outbound' | 'inbound' | 'follow_up'>('all');
  const [isPlaybookListCollapsed, setIsPlaybookListCollapsed] = useState(false);
  const [showAllPlaybooks, setShowAllPlaybooks] = useState(false);
  const [expandedStages, setExpandedStages] = useState<string[]>([]);
  
  const MAX_VISIBLE_PLAYBOOKS = 6;
  const [newPlaybook, setNewPlaybook] = useState({
    name: '',
    description: '',
    product_id: '',
    call_type: 'outbound',
    target_segments: [] as string[]
  });

  // Filter and group playbooks
  const filteredPlaybooks = playbooks.filter(pb => {
    const matchesSearch = pb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pb.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCallType = callTypeFilter === 'all' || pb.call_type === callTypeFilter;
    return matchesSearch && matchesCallType;
  });

  // Group by product/service
  const groupedPlaybooks = filteredPlaybooks.reduce((acc, pb) => {
    const productName = products.find(p => p.id === pb.product_id)?.name || 'General';
    if (!acc[productName]) acc[productName] = [];
    acc[productName].push(pb);
    return acc;
  }, {} as Record<string, Playbook[]>);

  // Auto-expand when searching and results exist
  useEffect(() => {
    if (searchTerm && filteredPlaybooks.length > 0) {
      setIsPlaybookListCollapsed(false);
    }
  }, [searchTerm, filteredPlaybooks.length]);

  useEffect(() => {
    fetchPlaybooks();
    fetchProducts();
  }, []);

  const fetchPlaybooks = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_playbooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlaybooks(data || []);
    } catch (error) {
      console.error('Error fetching playbooks:', error);
      toast({ title: 'Error', description: 'Failed to load playbooks', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('id, name').eq('is_active', true);
    setProducts(data || []);
  };

  const fetchPlaybookDetails = async (playbookId: string) => {
    const [stagesRes, objectionsRes, pricingRes, questionsRes, emotionsRes] = await Promise.all([
      supabase.from('playbook_stages').select('*').eq('playbook_id', playbookId).order('stage_order'),
      supabase.from('objection_handlers').select('*').eq('playbook_id', playbookId),
      supabase.from('pricing_strategies').select('*').eq('playbook_id', playbookId),
      supabase.from('discovery_questions').select('*').eq('playbook_id', playbookId).order('priority'),
      supabase.from('emotional_responses').select('*').eq('playbook_id', playbookId),
    ]);

    const stagesData = stagesRes.data || [];
    setStages(stagesData);
    setObjections(objectionsRes.data || []);
    setPricing(pricingRes.data || []);
    setQuestions(questionsRes.data || []);
    setEmotions(emotionsRes.data || []);

    // Fetch script nodes for all stages
    if (stagesData.length > 0) {
      const stageIds = stagesData.map(s => s.id);
      const { data: nodesData } = await supabase
        .from('script_nodes')
        .select('*')
        .in('stage_id', stageIds)
        .order('order_index');
      
      // Group nodes by stage_id
      const nodesByStage: Record<string, ScriptNode[]> = {};
      const modes: Record<string, 'simple' | 'tree'> = {};
      
      stagesData.forEach(stage => {
        const stageNodes = (nodesData || []).filter(n => n.stage_id === stage.id) as ScriptNode[];
        nodesByStage[stage.id] = stageNodes;
        modes[stage.id] = stageNodes.length > 0 ? 'tree' : 'simple';
      });
      
      setScriptNodes(nodesByStage);
      setStageScriptModes(modes);
    }
  };

  const handleSelectPlaybook = async (playbook: Playbook) => {
    setSelectedPlaybook(playbook);
    setScriptNodes({});
    setStageScriptModes({});
    setExpandedStages([]);
    await fetchPlaybookDetails(playbook.id);
  };

  const toggleScriptMode = (stageId: string) => {
    setStageScriptModes(prev => ({
      ...prev,
      [stageId]: prev[stageId] === 'simple' ? 'tree' : 'simple'
    }));
  };

  const handleAddScriptNode = async (stageId: string, parentId: string | null = null) => {
    const stageNodes = scriptNodes[stageId] || [];
    const siblingNodes = stageNodes.filter(n => n.parent_id === parentId);
    
    const newNode = {
      stage_id: stageId,
      parent_id: parentId,
      node_type: parentId ? 'branch' : 'root',
      script_text: '',
      trigger_condition: parentId ? '' : null,
      order_index: siblingNodes.length,
      metadata: {}
    };

    const { data, error } = await supabase.from('script_nodes').insert(newNode).select().single();
    if (error) {
      toast({ title: 'Error', description: 'Failed to add node', variant: 'destructive' });
      return;
    }
    
    setScriptNodes(prev => ({
      ...prev,
      [stageId]: [...(prev[stageId] || []), data as ScriptNode]
    }));
  };

  const handleSaveScriptNode = async (node: ScriptNode) => {
    const { error } = await supabase.from('script_nodes').update({
      script_text: node.script_text,
      trigger_condition: node.trigger_condition,
      node_type: node.node_type,
      order_index: node.order_index,
      metadata: node.metadata
    }).eq('id', node.id);
    
    if (error) {
      toast({ title: 'Error', description: 'Failed to save node', variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: 'Node updated' });
    }
  };

  const handleDeleteScriptNode = async (stageId: string, nodeId: string) => {
    await supabase.from('script_nodes').delete().eq('id', nodeId);
    setScriptNodes(prev => ({
      ...prev,
      [stageId]: (prev[stageId] || []).filter(n => n.id !== nodeId)
    }));
  };

  const updateScriptNode = (stageId: string, nodeId: string, updates: Partial<ScriptNode>) => {
    setScriptNodes(prev => ({
      ...prev,
      [stageId]: (prev[stageId] || []).map(n => 
        n.id === nodeId ? { ...n, ...updates } : n
      )
    }));
  };

  const handleCreatePlaybook = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_playbooks')
        .insert({
          name: newPlaybook.name,
          description: newPlaybook.description,
          product_id: newPlaybook.product_id || null,
          call_type: newPlaybook.call_type,
          target_segments: newPlaybook.target_segments,
        })
        .select()
        .single();

      if (error) throw error;

      setPlaybooks([data, ...playbooks]);
      setIsCreateDialogOpen(false);
      setNewPlaybook({ name: '', description: '', product_id: '', call_type: 'outbound', target_segments: [] });
      toast({ title: 'Success', description: 'Playbook created successfully' });
    } catch (error) {
      console.error('Error creating playbook:', error);
      toast({ title: 'Error', description: 'Failed to create playbook', variant: 'destructive' });
    }
  };

  const handleAddStage = async () => {
    if (!selectedPlaybook) return;
    
    const newStage = {
      playbook_id: selectedPlaybook.id,
      stage_name: 'New Stage',
      stage_order: stages.length + 1,
      stage_type: 'discovery',
      duration_seconds: 60,
      key_objectives: [],
      success_criteria: [],
    };

    const { data, error } = await supabase.from('playbook_stages').insert(newStage).select().single();
    if (error) {
      toast({ title: 'Error', description: 'Failed to add stage', variant: 'destructive' });
      return;
    }
    setStages([...stages, data]);
  };

  const handleAddObjection = async () => {
    if (!selectedPlaybook) return;
    
    const newObjection = {
      playbook_id: selectedPlaybook.id,
      objection_type: 'pricing',
      objection_trigger: '',
      severity: 'medium',
      response_script: '',
      follow_up_question: '',
    };

    const { data, error } = await supabase.from('objection_handlers').insert(newObjection).select().single();
    if (error) {
      toast({ title: 'Error', description: 'Failed to add objection', variant: 'destructive' });
      return;
    }
    setObjections([...objections, data]);
  };

  const handleAddQuestion = async (stageId?: string) => {
    if (!selectedPlaybook) return;
    
    const newQuestion = {
      playbook_id: selectedPlaybook.id,
      stage_id: stageId || null,
      question_text: '',
      question_purpose: 'pain_point',
      priority: questions.length + 1,
    };

    const { data, error } = await supabase.from('discovery_questions').insert(newQuestion).select().single();
    if (error) {
      toast({ title: 'Error', description: 'Failed to add question', variant: 'destructive' });
      return;
    }
    setQuestions([...questions, data]);
  };

  const handleAddEmotion = async () => {
    if (!selectedPlaybook) return;
    
    const newEmotion = {
      playbook_id: selectedPlaybook.id,
      emotion_detected: 'frustrated',
      response_strategy: '',
      tone_adjustment: 'empathetic',
      suggested_phrases: [],
    };

    const { data, error } = await supabase.from('emotional_responses').insert(newEmotion).select().single();
    if (error) {
      toast({ title: 'Error', description: 'Failed to add emotion', variant: 'destructive' });
      return;
    }
    setEmotions([...emotions, data]);
  };

  const handleAddPricing = async () => {
    if (!selectedPlaybook) return;
    
    const newPricing = {
      playbook_id: selectedPlaybook.id,
      customer_segment: 'standard',
      urgency_level: 'normal',
      discount_range_min: 0,
      discount_range_max: 10,
      pricing_script: '',
      negotiation_floor: 0,
    };

    const { data, error } = await supabase.from('pricing_strategies').insert(newPricing).select().single();
    if (error) {
      toast({ title: 'Error', description: 'Failed to add pricing', variant: 'destructive' });
      return;
    }
    setPricing([...pricing, data]);
  };

  const handleSaveStage = async (stage: PlaybookStage) => {
    const { error } = await supabase.from('playbook_stages').update(stage).eq('id', stage.id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to save stage', variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: 'Stage updated' });
    }
  };

  const handleSaveObjection = async (objection: ObjectionHandler) => {
    const { error } = await supabase.from('objection_handlers').update(objection).eq('id', objection.id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to save objection', variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: 'Objection handler updated' });
    }
  };

  const handleSaveQuestion = async (question: DiscoveryQuestion) => {
    const { error } = await supabase.from('discovery_questions').update(question).eq('id', question.id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to save question', variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: 'Question updated' });
    }
  };

  const handleSaveEmotion = async (emotion: EmotionalResponse) => {
    const { error } = await supabase.from('emotional_responses').update({
      emotion_detected: emotion.emotion_detected,
      response_strategy: emotion.response_strategy,
      tone_adjustment: emotion.tone_adjustment,
      suggested_phrases: emotion.suggested_phrases,
    }).eq('id', emotion.id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to save emotion', variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: 'Emotion response updated' });
    }
  };

  const handleSavePricing = async (pricingItem: PricingStrategy) => {
    const { error } = await supabase.from('pricing_strategies').update({
      customer_segment: pricingItem.customer_segment,
      urgency_level: pricingItem.urgency_level,
      discount_range_min: pricingItem.discount_range_min,
      discount_range_max: pricingItem.discount_range_max,
      pricing_script: pricingItem.pricing_script,
      negotiation_floor: pricingItem.negotiation_floor,
    }).eq('id', pricingItem.id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to save pricing', variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: 'Pricing strategy updated' });
    }
  };

  const handleDeleteStage = async (id: string) => {
    await supabase.from('playbook_stages').delete().eq('id', id);
    setStages(stages.filter(s => s.id !== id));
  };

  const handleDeleteObjection = async (id: string) => {
    await supabase.from('objection_handlers').delete().eq('id', id);
    setObjections(objections.filter(o => o.id !== id));
  };

  const handleDeleteQuestion = async (id: string) => {
    await supabase.from('discovery_questions').delete().eq('id', id);
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleDeleteEmotion = async (id: string) => {
    await supabase.from('emotional_responses').delete().eq('id', id);
    setEmotions(emotions.filter(e => e.id !== id));
  };

  const handleDeletePricing = async (id: string) => {
    await supabase.from('pricing_strategies').delete().eq('id', id);
    setPricing(pricing.filter(p => p.id !== id));
  };

  // Get questions for a specific stage
  const getStageQuestions = (stageId: string) => questions.filter(q => q.stage_id === stageId);
  const getGlobalQuestions = () => questions.filter(q => !q.stage_id);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground mt-2">Only admins can access the Playbook Editor.</p>
      </div>
    );
  }

  const stageTypeColors: Record<string, string> = {
    opening: 'border-l-blue-500 bg-blue-500/5',
    discovery: 'border-l-purple-500 bg-purple-500/5',
    pitch: 'border-l-amber-500 bg-amber-500/5',
    objection_handling: 'border-l-red-500 bg-red-500/5',
    negotiation: 'border-l-orange-500 bg-orange-500/5',
    closing: 'border-l-green-500 bg-green-500/5',
    follow_up: 'border-l-cyan-500 bg-cyan-500/5',
  };

  return (
    <div className="p-6 space-y-4 bg-gradient-to-br from-background via-background to-muted/20 min-h-screen">
      {/* Header - Slim & Stylish */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5 border border-primary/10 px-4 py-3">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/15 to-purple-500/10 border border-primary/20">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                Sales & Support Playbook Editor
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] px-1.5 py-0 h-5">
                  <span className="w-1 h-1 rounded-full bg-green-500 mr-1 animate-pulse" />
                  Active
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground">Configure playbooks, stages & call flow strategies</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-3 text-xs gap-1.5"
              onClick={() => navigate('/quick-notes')}
            >
              <Brain className="h-3.5 w-3.5" />
              Notes
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-3 text-xs gap-1.5"
              onClick={() => navigate('/quick-reference')}
            >
              <Lightbulb className="h-3.5 w-3.5" />
              Quick Ref
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-3 text-xs gap-1.5"
              onClick={() => navigate('/sales-guide')}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Training
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Playbook
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Playbook</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input 
                  value={newPlaybook.name}
                  onChange={(e) => setNewPlaybook({ ...newPlaybook, name: e.target.value })}
                  placeholder="e.g., Bank Account Outbound Sales"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={newPlaybook.description}
                  onChange={(e) => setNewPlaybook({ ...newPlaybook, description: e.target.value })}
                  placeholder="Describe the playbook purpose..."
                />
              </div>
              <div className="space-y-2">
                <Label>Service/Product</Label>
                <Select 
                  value={newPlaybook.product_id || "none"}
                  onValueChange={(v) => setNewPlaybook({ ...newPlaybook, product_id: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Generic)</SelectItem>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Call Type</Label>
                <Select 
                  value={newPlaybook.call_type}
                  onValueChange={(v) => setNewPlaybook({ ...newPlaybook, call_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outbound">Outbound Sales</SelectItem>
                    <SelectItem value="inbound">Inbound Support</SelectItem>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreatePlaybook} disabled={!newPlaybook.name}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Playbooks - Horizontal Section */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 bg-muted/30 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Playbooks
              <Badge variant="secondary" className="text-xs">
                {playbooks.length}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPlaybookListCollapsed(!isPlaybookListCollapsed)}
                className="h-6 w-6 p-0"
              >
                {isPlaybookListCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search playbooks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 pl-9 text-sm w-64"
                />
              </div>
              {/* Call Type Filter Tabs */}
              <div className="flex gap-1">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'outbound', label: 'Out' },
                  { value: 'inbound', label: 'In' },
                  { value: 'follow_up', label: 'F/U' }
                ].map(tab => (
                  <Button
                    key={tab.value}
                    variant={callTypeFilter === tab.value ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCallTypeFilter(tab.value as typeof callTypeFilter)}
                    className="h-7 px-2 text-xs"
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        {!isPlaybookListCollapsed && (
          <CardContent className="p-3">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Loading playbooks...</p>
            </div>
          ) : Object.keys(groupedPlaybooks).length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <BookOpen className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No playbooks found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchTerm || callTypeFilter !== 'all' ? 'Try adjusting filters' : 'Create your first playbook'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {(() => {
                const allPlaybookItems = Object.entries(groupedPlaybooks)
                  .sort(([a], [b]) => a === 'General' ? 1 : b === 'General' ? -1 : a.localeCompare(b))
                  .flatMap(([productName, pbs]) => pbs.map(pb => ({ ...pb, productName })));
                
                const visibleItems = showAllPlaybooks || searchTerm 
                  ? allPlaybookItems 
                  : allPlaybookItems.slice(0, MAX_VISIBLE_PLAYBOOKS);
                const hiddenCount = allPlaybookItems.length - MAX_VISIBLE_PLAYBOOKS;

                return (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {visibleItems.map(playbook => {
                        const isSelected = selectedPlaybook?.id === playbook.id;
                        const callTypeIcon = playbook.call_type === 'outbound' ? (
                          <MessageSquare className="h-3.5 w-3.5" />
                        ) : playbook.call_type === 'inbound' ? (
                          <Heart className="h-3.5 w-3.5" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        );
                        const callTypeColor = playbook.call_type === 'outbound' 
                          ? 'bg-blue-500/10 text-blue-700 border-blue-500/30'
                          : playbook.call_type === 'inbound'
                          ? 'bg-purple-500/10 text-purple-700 border-purple-500/30'
                          : 'bg-amber-500/10 text-amber-700 border-amber-500/30';
                        
                        return (
                          <div
                            key={playbook.id}
                            className={`group p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                              isSelected 
                                ? 'bg-primary/10 border-primary/30 shadow-sm ring-1 ring-primary/20' 
                                : 'border-border/50 hover:bg-muted/50 hover:border-border'
                            }`}
                            onClick={() => handleSelectPlaybook(playbook)}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`p-1.5 rounded-md ${isSelected ? 'bg-primary/20' : 'bg-muted/50 group-hover:bg-muted'} transition-colors`}>
                                {callTypeIcon}
                              </div>
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${callTypeColor}`}>
                                {playbook.call_type === 'outbound' ? 'Out' : playbook.call_type === 'inbound' ? 'In' : 'F/U'}
                              </Badge>
                              {playbook.is_active && (
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              )}
                            </div>
                            <div className="font-medium text-sm truncate">{playbook.name}</div>
                            <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                              {playbook.productName}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {!searchTerm && hiddenCount > 0 && (
                      <div className="flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAllPlaybooks(!showAllPlaybooks)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          {showAllPlaybooks ? (
                            <>Show Less</>
                          ) : (
                            <>...{hiddenCount} more playbook{hiddenCount > 1 ? 's' : ''}</>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </CardContent>
        )}
      </Card>

      {/* Playbook Editor - Main Content */}
      <div>
        {selectedPlaybook ? (
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-muted/30 to-transparent border-b pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-lg ${
                    selectedPlaybook.call_type === 'outbound' 
                      ? 'bg-blue-500/10 border border-blue-500/20' 
                      : selectedPlaybook.call_type === 'inbound'
                      ? 'bg-purple-500/10 border border-purple-500/20'
                      : 'bg-amber-500/10 border border-amber-500/20'
                  }`}>
                    {selectedPlaybook.call_type === 'outbound' ? (
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    ) : selectedPlaybook.call_type === 'inbound' ? (
                      <Heart className="h-5 w-5 text-purple-600" />
                    ) : (
                      <Play className="h-5 w-5 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{selectedPlaybook.name}</CardTitle>
                    <CardDescription className="mt-0.5">{selectedPlaybook.description || 'No description provided'}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${
                    selectedPlaybook.call_type === 'outbound' 
                      ? 'bg-blue-500/10 text-blue-700 border-blue-500/30' 
                      : selectedPlaybook.call_type === 'inbound'
                      ? 'bg-purple-500/10 text-purple-700 border-purple-500/30'
                      : 'bg-amber-500/10 text-amber-700 border-amber-500/30'
                  }`}>
                    {selectedPlaybook.call_type === 'outbound' ? 'Outbound Sales' : selectedPlaybook.call_type === 'inbound' ? 'Inbound Support' : 'Follow-up'}
                  </Badge>
                  {selectedPlaybook.is_active && (
                    <Badge className="bg-green-500/10 text-green-700 border-green-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                      Active
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-5 gap-3 mb-6">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <Play className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <div className="text-lg font-semibold">{stages.length}</div>
                  <div className="text-[10px] text-muted-foreground">Stages</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <HelpCircle className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                  <div className="text-lg font-semibold">{questions.length}</div>
                  <div className="text-[10px] text-muted-foreground">Questions</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <AlertTriangle className="h-4 w-4 mx-auto mb-1 text-orange-500" />
                  <div className="text-lg font-semibold">{objections.length}</div>
                  <div className="text-[10px] text-muted-foreground">Objections</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <Heart className="h-4 w-4 mx-auto mb-1 text-pink-500" />
                  <div className="text-lg font-semibold">{emotions.length}</div>
                  <div className="text-[10px] text-muted-foreground">Emotions</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <DollarSign className="h-4 w-4 mx-auto mb-1 text-green-500" />
                  <div className="text-lg font-semibold">{pricing.length}</div>
                  <div className="text-[10px] text-muted-foreground">Pricing</div>
                </div>
              </div>

              {/* Stages Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Call Flow Stages</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Each stage contains its questions, objections, emotions & pricing</p>
                  </div>
                  <Button size="sm" onClick={handleAddStage} className="shadow-sm">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Stage
                  </Button>
                </div>

                <div className="space-y-3">
                  {stages.map((stage, index) => {
                    const stageQuestions = getStageQuestions(stage.id);
                    
                    return (
                      <Card key={stage.id} className={`border-l-4 ${stageTypeColors[stage.stage_type] || 'border-l-muted'} hover:shadow-md transition-shadow`}>
                        <Accordion type="single" collapsible value={expandedStages.includes(stage.id) ? stage.id : undefined} onValueChange={(v) => {
                          if (v) {
                            setExpandedStages(prev => [...prev, v]);
                          } else {
                            setExpandedStages(prev => prev.filter(id => id !== stage.id));
                          }
                        }}>
                          <AccordionItem value={stage.id} className="border-0">
                            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 rounded-md px-2 py-1">
                                  <GripVertical className="h-4 w-4 cursor-grab" />
                                  <span className="font-mono text-sm font-medium">{stage.stage_order}</span>
                                </div>
                                <div className="flex-1 text-left">
                                  <div className="font-medium">{stage.stage_name}</div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px]">{stage.stage_type}</Badge>
                                    <span>{stage.duration_seconds}s</span>
                                    {stageQuestions.length > 0 && (
                                      <span className="text-blue-600">{stageQuestions.length} Q</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <div className="space-y-4">
                                {/* Stage Basic Info */}
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-xs">Stage Name</Label>
                                    <Input
                                      value={stage.stage_name}
                                      onChange={(e) => {
                                        const updated = stages.map(s => 
                                          s.id === stage.id ? { ...s, stage_name: e.target.value } : s
                                        );
                                        setStages(updated);
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">Type</Label>
                                    <Select
                                      value={stage.stage_type}
                                      onValueChange={(v) => {
                                        const updated = stages.map(s => 
                                          s.id === stage.id ? { ...s, stage_type: v } : s
                                        );
                                        setStages(updated);
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="opening">Opening</SelectItem>
                                        <SelectItem value="discovery">Discovery</SelectItem>
                                        <SelectItem value="pitch">Pitch</SelectItem>
                                        <SelectItem value="objection_handling">Objection Handling</SelectItem>
                                        <SelectItem value="negotiation">Negotiation</SelectItem>
                                        <SelectItem value="closing">Closing</SelectItem>
                                        <SelectItem value="follow_up">Follow Up</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">Duration (sec)</Label>
                                    <Input
                                      type="number"
                                      value={stage.duration_seconds}
                                      onChange={(e) => {
                                        const updated = stages.map(s => 
                                          s.id === stage.id ? { ...s, duration_seconds: parseInt(e.target.value) || 60 } : s
                                        );
                                        setStages(updated);
                                      }}
                                    />
                                  </div>
                                </div>

                                {/* Opening Lines */}
                                <div className="space-y-2">
                                  <Label className="text-xs">Opening Lines (one per line)</Label>
                                  <Textarea
                                    className="min-h-[60px] text-sm"
                                    value={Array.isArray(stage.opening_lines) ? stage.opening_lines.join('\n') : ''}
                                    onChange={(e) => {
                                      const lines = e.target.value.split('\n').filter(line => line.trim());
                                      const updated = stages.map(s => 
                                        s.id === stage.id ? { ...s, opening_lines: lines } : s
                                      );
                                      setStages(updated);
                                    }}
                                    placeholder="Enter suggested opening phrases for this stage..."
                                  />
                                </div>

                                {/* Script Mode Toggle & Editor */}
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs">Script / Talking Points</Label>
                                    <div className="flex items-center gap-2 text-xs">
                                      <FileText className={`h-3.5 w-3.5 ${stageScriptModes[stage.id] === 'simple' ? 'text-primary' : 'text-muted-foreground'}`} />
                                      <span className="text-muted-foreground">Simple</span>
                                      <Switch
                                        checked={stageScriptModes[stage.id] === 'tree'}
                                        onCheckedChange={() => toggleScriptMode(stage.id)}
                                      />
                                      <span className="text-muted-foreground">Tree</span>
                                      <GitBranch className={`h-3.5 w-3.5 ${stageScriptModes[stage.id] === 'tree' ? 'text-primary' : 'text-muted-foreground'}`} />
                                    </div>
                                  </div>

                                  {stageScriptModes[stage.id] === 'simple' ? (
                                    <Textarea
                                      className="min-h-[100px] text-sm"
                                      value={stage.script || ''}
                                      onChange={(e) => {
                                        const updated = stages.map(s => 
                                          s.id === stage.id ? { ...s, script: e.target.value } : s
                                        );
                                        setStages(updated);
                                      }}
                                      placeholder="Enter the script or talking points for this stage..."
                                    />
                                  ) : (
                                    <div className="border rounded-lg p-4 bg-muted/20">
                                      <DecisionTreeVisualizer
                                        nodes={scriptNodes[stage.id] || []}
                                        stageId={stage.id}
                                        onUpdate={updateScriptNode}
                                        onSave={handleSaveScriptNode}
                                        onDelete={handleDeleteScriptNode}
                                        onAddChild={handleAddScriptNode}
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Key Objectives & Success Criteria */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-xs">Key Objectives (one per line)</Label>
                                    <Textarea
                                      className="min-h-[80px] text-sm"
                                      value={Array.isArray(stage.key_objectives) ? stage.key_objectives.join('\n') : ''}
                                      onChange={(e) => {
                                        const objectives = e.target.value.split('\n').filter(line => line.trim());
                                        const updated = stages.map(s => 
                                          s.id === stage.id ? { ...s, key_objectives: objectives } : s
                                        );
                                        setStages(updated);
                                      }}
                                      placeholder="Enter objectives, one per line..."
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs">Success Criteria (one per line)</Label>
                                    <Textarea
                                      className="min-h-[80px] text-sm"
                                      value={Array.isArray(stage.success_criteria) ? stage.success_criteria.join('\n') : ''}
                                      onChange={(e) => {
                                        const criteria = e.target.value.split('\n').filter(line => line.trim());
                                        const updated = stages.map(s => 
                                          s.id === stage.id ? { ...s, success_criteria: criteria } : s
                                        );
                                        setStages(updated);
                                      }}
                                      placeholder="Enter success criteria, one per line..."
                                    />
                                  </div>
                                </div>

                                {/* Nested Accordions for Stage-Level Items */}
                                <Accordion type="multiple" className="space-y-2">
                                  {/* Stage Questions */}
                                  <AccordionItem value="questions" className="border rounded-lg bg-blue-500/5">
                                    <AccordionTrigger className="px-3 py-2 hover:no-underline">
                                      <div className="flex items-center gap-2">
                                        <HelpCircle className="h-4 w-4 text-blue-500" />
                                        <span className="text-sm font-medium">Discovery Questions</span>
                                        <Badge variant="secondary" className="text-[10px]">{stageQuestions.length}</Badge>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-3 pb-3">
                                      <div className="space-y-2">
                                        {stageQuestions.map(q => (
                                          <div key={q.id} className="flex gap-2 items-start bg-background rounded p-2 border">
                                            <Input
                                              className="flex-1 text-sm"
                                              value={q.question_text}
                                              onChange={(e) => {
                                                const updated = questions.map(qu => 
                                                  qu.id === q.id ? { ...qu, question_text: e.target.value } : qu
                                                );
                                                setQuestions(updated);
                                              }}
                                              placeholder="Enter question..."
                                            />
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleSaveQuestion(q)}>
                                              <Save className="h-3 w-3" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDeleteQuestion(q.id)}>
                                              <Trash2 className="h-3 w-3 text-destructive" />
                                            </Button>
                                          </div>
                                        ))}
                                        <Button size="sm" variant="outline" className="w-full" onClick={() => handleAddQuestion(stage.id)}>
                                          <Plus className="h-3 w-3 mr-1" />
                                          Add Question
                                        </Button>
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>

                                {/* Stage Actions */}
                                <div className="flex justify-end gap-2 pt-2 border-t">
                                  <Button size="sm" variant="outline" onClick={() => handleSaveStage(stage)}>
                                    <Save className="h-4 w-4 mr-1" />
                                    Save Stage
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDeleteStage(stage.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </Card>
                    );
                  })}
                </div>

                {/* Playbook-Level Resources */}
                <div className="mt-8 pt-6 border-t">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Playbook-Level Resources
                    <span className="text-xs text-muted-foreground font-normal">(Apply to all stages)</span>
                  </h3>
                  
                  <Accordion type="multiple" className="space-y-2">
                    {/* Global Questions */}
                    <AccordionItem value="global-questions" className="border rounded-lg bg-blue-500/5">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">Global Questions</span>
                          <Badge variant="secondary" className="text-xs">{getGlobalQuestions().length}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-2">
                          {getGlobalQuestions().map(q => (
                            <div key={q.id} className="flex gap-2 items-start bg-background rounded p-2 border">
                              <Input
                                className="flex-1 text-sm"
                                value={q.question_text}
                                onChange={(e) => {
                                  const updated = questions.map(qu => 
                                    qu.id === q.id ? { ...qu, question_text: e.target.value } : qu
                                  );
                                  setQuestions(updated);
                                }}
                                placeholder="Enter question..."
                              />
                              <Select
                                value={q.question_purpose}
                                onValueChange={(v) => {
                                  const updated = questions.map(qu => 
                                    qu.id === q.id ? { ...qu, question_purpose: v } : qu
                                  );
                                  setQuestions(updated);
                                }}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pain_point">Pain Point</SelectItem>
                                  <SelectItem value="need">Need</SelectItem>
                                  <SelectItem value="budget">Budget</SelectItem>
                                  <SelectItem value="timeline">Timeline</SelectItem>
                                  <SelectItem value="authority">Authority</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleSaveQuestion(q)}>
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDeleteQuestion(q.id)}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          ))}
                          <Button size="sm" variant="outline" className="w-full" onClick={() => handleAddQuestion()}>
                            <Plus className="h-3 w-3 mr-1" />
                            Add Global Question
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Objections */}
                    <AccordionItem value="objections" className="border rounded-lg bg-orange-500/5">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          <span className="font-medium">Objection Handlers</span>
                          <Badge variant="secondary" className="text-xs">{objections.length}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-3">
                          {objections.map(obj => (
                            <Card key={obj.id} className="p-3">
                              <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-3">
                                  <Input
                                    value={obj.objection_type || ''}
                                    onChange={(e) => {
                                      const updated = objections.map(o => 
                                        o.id === obj.id ? { ...o, objection_type: e.target.value } : o
                                      );
                                      setObjections(updated);
                                    }}
                                    placeholder="Type (e.g., Price)"
                                  />
                                  <Input
                                    value={obj.objection_trigger}
                                    onChange={(e) => {
                                      const updated = objections.map(o => 
                                        o.id === obj.id ? { ...o, objection_trigger: e.target.value } : o
                                      );
                                      setObjections(updated);
                                    }}
                                    placeholder="Trigger phrase"
                                  />
                                  <Select
                                    value={obj.severity}
                                    onValueChange={(v) => {
                                      const updated = objections.map(o => 
                                        o.id === obj.id ? { ...o, severity: v } : o
                                      );
                                      setObjections(updated);
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="low">Low</SelectItem>
                                      <SelectItem value="medium">Medium</SelectItem>
                                      <SelectItem value="high">High</SelectItem>
                                      <SelectItem value="critical">Critical</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Textarea
                                  value={obj.response_script}
                                  onChange={(e) => {
                                    const updated = objections.map(o => 
                                      o.id === obj.id ? { ...o, response_script: e.target.value } : o
                                    );
                                    setObjections(updated);
                                  }}
                                  placeholder="Response script..."
                                  rows={2}
                                />
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant="outline" onClick={() => handleSaveObjection(obj)}>
                                    <Save className="h-3 w-3 mr-1" />
                                    Save
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDeleteObjection(obj.id)}>
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                          <Button size="sm" variant="outline" className="w-full" onClick={handleAddObjection}>
                            <Plus className="h-3 w-3 mr-1" />
                            Add Objection Handler
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Emotions */}
                    <AccordionItem value="emotions" className="border rounded-lg bg-pink-500/5">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-pink-500" />
                          <span className="font-medium">Emotional Responses</span>
                          <Badge variant="secondary" className="text-xs">{emotions.length}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-3">
                          {emotions.map(emo => (
                            <Card key={emo.id} className="p-3">
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <Select
                                    value={emo.emotion_detected}
                                    onValueChange={(v) => {
                                      const updated = emotions.map(e => 
                                        e.id === emo.id ? { ...e, emotion_detected: v } : e
                                      );
                                      setEmotions(updated);
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Emotion" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="frustrated">Frustrated</SelectItem>
                                      <SelectItem value="confused">Confused</SelectItem>
                                      <SelectItem value="interested">Interested</SelectItem>
                                      <SelectItem value="skeptical">Skeptical</SelectItem>
                                      <SelectItem value="angry">Angry</SelectItem>
                                      <SelectItem value="excited">Excited</SelectItem>
                                      <SelectItem value="hesitant">Hesitant</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Select
                                    value={emo.tone_adjustment}
                                    onValueChange={(v) => {
                                      const updated = emotions.map(e => 
                                        e.id === emo.id ? { ...e, tone_adjustment: v } : e
                                      );
                                      setEmotions(updated);
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Tone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="empathetic">Empathetic</SelectItem>
                                      <SelectItem value="reassuring">Reassuring</SelectItem>
                                      <SelectItem value="professional">Professional</SelectItem>
                                      <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                                      <SelectItem value="calm">Calm</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Textarea
                                  value={emo.response_strategy}
                                  onChange={(e) => {
                                    const updated = emotions.map(em => 
                                      em.id === emo.id ? { ...em, response_strategy: e.target.value } : em
                                    );
                                    setEmotions(updated);
                                  }}
                                  placeholder="Response strategy..."
                                  rows={2}
                                />
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant="outline" onClick={() => handleSaveEmotion(emo)}>
                                    <Save className="h-3 w-3 mr-1" />
                                    Save
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDeleteEmotion(emo.id)}>
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                          <Button size="sm" variant="outline" className="w-full" onClick={handleAddEmotion}>
                            <Plus className="h-3 w-3 mr-1" />
                            Add Emotional Response
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Pricing */}
                    <AccordionItem value="pricing" className="border rounded-lg bg-green-500/5">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <span className="font-medium">Pricing Strategies</span>
                          <Badge variant="secondary" className="text-xs">{pricing.length}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-3">
                          {pricing.map(p => (
                            <Card key={p.id} className="p-3">
                              <div className="space-y-3">
                                <div className="grid grid-cols-4 gap-3">
                                  <Input
                                    value={p.customer_segment}
                                    onChange={(e) => {
                                      const updated = pricing.map(pr => 
                                        pr.id === p.id ? { ...pr, customer_segment: e.target.value } : pr
                                      );
                                      setPricing(updated);
                                    }}
                                    placeholder="Segment"
                                  />
                                  <Input
                                    type="number"
                                    value={p.discount_range_min}
                                    onChange={(e) => {
                                      const updated = pricing.map(pr => 
                                        pr.id === p.id ? { ...pr, discount_range_min: parseFloat(e.target.value) || 0 } : pr
                                      );
                                      setPricing(updated);
                                    }}
                                    placeholder="Min %"
                                  />
                                  <Input
                                    type="number"
                                    value={p.discount_range_max}
                                    onChange={(e) => {
                                      const updated = pricing.map(pr => 
                                        pr.id === p.id ? { ...pr, discount_range_max: parseFloat(e.target.value) || 0 } : pr
                                      );
                                      setPricing(updated);
                                    }}
                                    placeholder="Max %"
                                  />
                                  <Input
                                    type="number"
                                    value={p.negotiation_floor}
                                    onChange={(e) => {
                                      const updated = pricing.map(pr => 
                                        pr.id === p.id ? { ...pr, negotiation_floor: parseFloat(e.target.value) || 0 } : pr
                                      );
                                      setPricing(updated);
                                    }}
                                    placeholder="Floor"
                                  />
                                </div>
                                <Textarea
                                  value={p.pricing_script}
                                  onChange={(e) => {
                                    const updated = pricing.map(pr => 
                                      pr.id === p.id ? { ...pr, pricing_script: e.target.value } : pr
                                    );
                                    setPricing(updated);
                                  }}
                                  placeholder="Pricing script..."
                                  rows={2}
                                />
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant="outline" onClick={() => handleSavePricing(p)}>
                                    <Save className="h-3 w-3 mr-1" />
                                    Save
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDeletePricing(p.id)}>
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                          <Button size="sm" variant="outline" className="w-full" onClick={handleAddPricing}>
                            <Plus className="h-3 w-3 mr-1" />
                            Add Pricing Strategy
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed border-2 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-muted-foreground">Select a Playbook</h3>
            <p className="text-sm text-muted-foreground mt-2">Choose a playbook from above to view and edit its configuration</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PlaybookEditor;
