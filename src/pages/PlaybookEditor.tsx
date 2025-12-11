import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SecureAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  Lightbulb,
  Users,
  Target,
  Clock,
  Brain,
  Search,
  Package
} from 'lucide-react';

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
        // If stage has script nodes, default to tree mode; otherwise simple
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

  const handleAddQuestion = async () => {
    if (!selectedPlaybook) return;
    
    const newQuestion = {
      playbook_id: selectedPlaybook.id,
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

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground mt-2">Only admins can access the Playbook Editor.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-background via-background to-muted/20 min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Sales & Support Playbook Editor</h1>
              <p className="text-muted-foreground mt-0.5">Configure playbooks, stages, objection handlers, and call flow strategies</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
              Editor Active
            </Badge>
          </div>
        </div>
      </div>

      {/* Playbook Guide Section */}
      <Collapsible>
        <Card className="border-primary/20 bg-primary/5">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Playbook Guide & Best Practices</CardTitle>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <Tabs defaultValue="stages" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 mb-4">
                  <TabsTrigger value="stages" className="text-xs">
                    <Target className="h-3 w-3 mr-1" />
                    Stages
                  </TabsTrigger>
                  <TabsTrigger value="assessment" className="text-xs">
                    <Heart className="h-3 w-3 mr-1" />
                    Assessment
                  </TabsTrigger>
                  <TabsTrigger value="personality" className="text-xs">
                    <Brain className="h-3 w-3 mr-1" />
                    Personality
                  </TabsTrigger>
                  <TabsTrigger value="objections" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Objections
                  </TabsTrigger>
                  <TabsTrigger value="closing" className="text-xs">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Closing
                  </TabsTrigger>
                  <TabsTrigger value="preparation" className="text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    Prep
                  </TabsTrigger>
                  <TabsTrigger value="faqs" className="text-xs">
                    <HelpCircle className="h-3 w-3 mr-1" />
                    FAQs
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="text-xs">
                    <Lightbulb className="h-3 w-3 mr-1" />
                    Notes
                  </TabsTrigger>
                </TabsList>

                {/* Stages Tab */}
                <TabsContent value="stages" className="space-y-4">
                  <div className="grid gap-3">
                    <div className="p-3 rounded-lg bg-background/50 border">
                      <h4 className="font-semibold text-foreground mb-2 text-sm">The 5-Stage Sales Framework</h4>
                      <div className="grid sm:grid-cols-5 gap-2 text-xs">
                        <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
                          <p className="font-medium text-blue-600">1. Opening</p>
                          <p className="text-muted-foreground">Build rapport, set agenda, establish trust</p>
                        </div>
                        <div className="p-2 rounded bg-purple-500/10 border border-purple-500/20">
                          <p className="font-medium text-purple-600">2. Discovery</p>
                          <p className="text-muted-foreground">Understand needs, pain points, goals</p>
                        </div>
                        <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
                          <p className="font-medium text-amber-600">3. Pitch</p>
                          <p className="text-muted-foreground">Present solutions, demonstrate value</p>
                        </div>
                        <div className="p-2 rounded bg-orange-500/10 border border-orange-500/20">
                          <p className="font-medium text-orange-600">4. Negotiation</p>
                          <p className="text-muted-foreground">Handle concerns, discuss terms</p>
                        </div>
                        <div className="p-2 rounded bg-green-500/10 border border-green-500/20">
                          <p className="font-medium text-green-600">5. Closing</p>
                          <p className="text-muted-foreground">Secure commitment, next steps</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-background/50 border">
                        <h4 className="font-semibold text-foreground mb-2 text-sm">When Customer Skips Stages</h4>
                        <div className="text-xs text-muted-foreground space-y-2">
                          <p><strong>Acknowledge → Brief Answer → Guide Back</strong></p>
                          <div className="p-2 bg-muted/50 rounded italic">
                            "Great question about pricing! Let me give you a quick range, then I'd love to understand your specific needs to give you an accurate quote."
                          </div>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-background/50 border">
                        <h4 className="font-semibold text-foreground mb-2 text-sm">Stage Transition Phrases</h4>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>• "Now that I understand your needs, let me show you..."</p>
                          <p>• "Based on what you've shared, I recommend..."</p>
                          <p>• "Does this sound like what you're looking for?"</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Assessment Tab */}
                <TabsContent value="assessment" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-background/50 border">
                      <h4 className="font-semibold text-foreground mb-2 text-sm flex items-center gap-2">
                        <Heart className="h-4 w-4 text-primary" />
                        Pain & Need Discovery
                      </h4>
                      <div className="text-xs space-y-2">
                        <div>
                          <p className="font-medium text-foreground">Power Questions:</p>
                          <ul className="text-muted-foreground list-disc list-inside space-y-1 mt-1">
                            <li>"What prompted you to look into this now?"</li>
                            <li>"What happens if this isn't resolved?"</li>
                            <li>"How is this affecting your business/life?"</li>
                            <li>"What have you tried before?"</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Listen for:</p>
                          <p className="text-muted-foreground">Frustration words, deadlines, compliance mentions, competitor references</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-background/50 border">
                      <h4 className="font-semibold text-foreground mb-2 text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Urgency Detection
                      </h4>
                      <div className="text-xs space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500/20 text-green-700 text-xs">Hot Lead</Badge>
                          <span className="text-muted-foreground">Timeline set, budget ready, decision-maker</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-amber-500/20 text-amber-700 text-xs">Warm Lead</Badge>
                          <span className="text-muted-foreground">Interested but no timeline, needs nurturing</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-gray-500/20 text-gray-700 text-xs">Cold Lead</Badge>
                          <span className="text-muted-foreground">"Just browsing", no urgency, vague answers</span>
                        </div>
                        <div className="p-2 bg-muted/50 rounded mt-2">
                          <p className="font-medium">Qualifier:</p>
                          <p className="italic text-muted-foreground">"If we find the right solution, what's your timeline?"</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-background/50 border md:col-span-2">
                      <h4 className="font-semibold text-foreground mb-2 text-sm">BANT Qualification Framework</h4>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="p-2 rounded bg-primary/10">
                          <p className="font-medium text-primary">Budget</p>
                          <p className="text-muted-foreground">"What's your budget range?"</p>
                        </div>
                        <div className="p-2 rounded bg-primary/10">
                          <p className="font-medium text-primary">Authority</p>
                          <p className="text-muted-foreground">"Who else is involved in this decision?"</p>
                        </div>
                        <div className="p-2 rounded bg-primary/10">
                          <p className="font-medium text-primary">Need</p>
                          <p className="text-muted-foreground">"What problem are you solving?"</p>
                        </div>
                        <div className="p-2 rounded bg-primary/10">
                          <p className="font-medium text-primary">Timeline</p>
                          <p className="text-muted-foreground">"When do you need this done?"</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Personality Tab */}
                <TabsContent value="personality" className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border bg-blue-500/5 border-blue-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-600 text-xs font-bold flex items-center justify-center">A</span>
                        <h4 className="font-semibold text-foreground text-sm">Analytical</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Data-driven, detail-oriented, methodical</p>
                      <div className="text-xs space-y-1">
                        <p><strong>Signs:</strong> "Can you send specs?" "What's the exact process?"</p>
                        <p><strong>Approach:</strong> Facts, documentation, ROI data, no pressure</p>
                        <p><strong>Avoid:</strong> Rushing, emotional appeals, vague answers</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border bg-red-500/5 border-red-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-7 h-7 rounded-full bg-red-500/20 text-red-600 text-xs font-bold flex items-center justify-center">D</span>
                        <h4 className="font-semibold text-foreground text-sm">Driver</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Results-focused, brief, decisive</p>
                      <div className="text-xs space-y-1">
                        <p><strong>Signs:</strong> "What's the bottom line?" "How fast?"</p>
                        <p><strong>Approach:</strong> Get to point, focus on outcomes, be direct</p>
                        <p><strong>Avoid:</strong> Small talk, lengthy explanations, indecision</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border bg-yellow-500/5 border-yellow-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-7 h-7 rounded-full bg-yellow-500/20 text-yellow-600 text-xs font-bold flex items-center justify-center">E</span>
                        <h4 className="font-semibold text-foreground text-sm">Expressive</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Enthusiastic, story-driven, relationship-focused</p>
                      <div className="text-xs space-y-1">
                        <p><strong>Signs:</strong> "I'm so excited!" Shares personal stories</p>
                        <p><strong>Approach:</strong> Build rapport, share success stories, show enthusiasm</p>
                        <p><strong>Avoid:</strong> Being too formal, ignoring their ideas, rushing</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border bg-green-500/5 border-green-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-7 h-7 rounded-full bg-green-500/20 text-green-600 text-xs font-bold flex items-center justify-center">A</span>
                        <h4 className="font-semibold text-foreground text-sm">Amiable</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Seeks consensus, risk-averse, patient</p>
                      <div className="text-xs space-y-1">
                        <p><strong>Signs:</strong> "Need to discuss with team" "What do others say?"</p>
                        <p><strong>Approach:</strong> Reassurance, testimonials, low-pressure, patience</p>
                        <p><strong>Avoid:</strong> Aggressive closing, creating urgency, confrontation</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Objections Tab */}
                <TabsContent value="objections" className="space-y-4">
                  <div className="grid gap-3">
                    <div className="p-3 rounded-lg bg-background/50 border">
                      <h4 className="font-semibold text-foreground mb-2 text-sm">LAER Objection Handling Framework</h4>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="p-2 rounded bg-primary/10 text-center">
                          <p className="font-bold text-primary">L</p>
                          <p className="font-medium">Listen</p>
                          <p className="text-muted-foreground">Hear them out fully</p>
                        </div>
                        <div className="p-2 rounded bg-primary/10 text-center">
                          <p className="font-bold text-primary">A</p>
                          <p className="font-medium">Acknowledge</p>
                          <p className="text-muted-foreground">"I understand..."</p>
                        </div>
                        <div className="p-2 rounded bg-primary/10 text-center">
                          <p className="font-bold text-primary">E</p>
                          <p className="font-medium">Explore</p>
                          <p className="text-muted-foreground">Ask clarifying questions</p>
                        </div>
                        <div className="p-2 rounded bg-primary/10 text-center">
                          <p className="font-bold text-primary">R</p>
                          <p className="font-medium">Respond</p>
                          <p className="text-muted-foreground">Address the concern</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-background/50 border">
                        <h4 className="font-semibold text-foreground mb-2 text-sm text-amber-600">Price Objections</h4>
                        <div className="text-xs space-y-2">
                          <div className="p-2 bg-muted/50 rounded">
                            <p className="font-medium">"It's too expensive"</p>
                            <p className="text-muted-foreground italic">"I understand budget is important. Can you help me understand what you're comparing this to? Let's look at the value you're getting..."</p>
                          </div>
                          <div className="p-2 bg-muted/50 rounded">
                            <p className="font-medium">"I need to think about it"</p>
                            <p className="text-muted-foreground italic">"Of course! What specific aspects would you like to consider? I want to make sure you have all the information you need."</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-background/50 border">
                        <h4 className="font-semibold text-foreground mb-2 text-sm text-blue-600">Trust Objections</h4>
                        <div className="text-xs space-y-2">
                          <div className="p-2 bg-muted/50 rounded">
                            <p className="font-medium">"I need to check with others"</p>
                            <p className="text-muted-foreground italic">"Absolutely! Who else should be involved? Would it help if I joined a call with your team to answer questions directly?"</p>
                          </div>
                          <div className="p-2 bg-muted/50 rounded">
                            <p className="font-medium">"We're happy with current provider"</p>
                            <p className="text-muted-foreground italic">"That's great you have something working! Out of curiosity, what made you take this call today?"</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Closing Tab */}
                <TabsContent value="closing" className="space-y-4">
                  <div className="grid gap-3">
                    <div className="p-3 rounded-lg bg-background/50 border">
                      <h4 className="font-semibold text-foreground mb-2 text-sm">Closing Techniques</h4>
                      <div className="grid md:grid-cols-3 gap-2 text-xs">
                        <div className="p-2 rounded bg-green-500/10 border border-green-500/20">
                          <p className="font-medium text-green-600">Assumptive Close</p>
                          <p className="text-muted-foreground">"When would you like to get started?"</p>
                          <p className="text-muted-foreground mt-1 italic">Best for: Warm leads showing buying signals</p>
                        </div>
                        <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20">
                          <p className="font-medium text-blue-600">Alternative Close</p>
                          <p className="text-muted-foreground">"Would you prefer Package A or B?"</p>
                          <p className="text-muted-foreground mt-1 italic">Best for: Indecisive customers</p>
                        </div>
                        <div className="p-2 rounded bg-purple-500/10 border border-purple-500/20">
                          <p className="font-medium text-purple-600">Summary Close</p>
                          <p className="text-muted-foreground">"So we've agreed on X, Y, Z. Shall we proceed?"</p>
                          <p className="text-muted-foreground mt-1 italic">Best for: Complex sales, multiple features</p>
                        </div>
                        <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
                          <p className="font-medium text-amber-600">Urgency Close</p>
                          <p className="text-muted-foreground">"This offer is valid until Friday..."</p>
                          <p className="text-muted-foreground mt-1 italic">Best for: Hot leads, time-sensitive offers</p>
                        </div>
                        <div className="p-2 rounded bg-pink-500/10 border border-pink-500/20">
                          <p className="font-medium text-pink-600">Trial Close</p>
                          <p className="text-muted-foreground">"How does this sound so far?"</p>
                          <p className="text-muted-foreground mt-1 italic">Best for: Testing readiness, mid-pitch</p>
                        </div>
                        <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/20">
                          <p className="font-medium text-cyan-600">Direct Ask</p>
                          <p className="text-muted-foreground">"Are you ready to move forward?"</p>
                          <p className="text-muted-foreground mt-1 italic">Best for: Direct personalities, clear signals</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-background/50 border">
                      <h4 className="font-semibold text-foreground mb-2 text-sm">Buying Signals to Watch For</h4>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline" className="bg-green-500/10">Asks about pricing details</Badge>
                        <Badge variant="outline" className="bg-green-500/10">Discusses implementation timeline</Badge>
                        <Badge variant="outline" className="bg-green-500/10">Asks "What happens next?"</Badge>
                        <Badge variant="outline" className="bg-green-500/10">Mentions other decision-makers approvingly</Badge>
                        <Badge variant="outline" className="bg-green-500/10">Compares options seriously</Badge>
                        <Badge variant="outline" className="bg-green-500/10">Asks about payment terms</Badge>
                        <Badge variant="outline" className="bg-green-500/10">Requests references</Badge>
                        <Badge variant="outline" className="bg-green-500/10">Nodding, leaning in, taking notes</Badge>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Preparation Tab */}
                <TabsContent value="preparation" className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-background/50 border">
                      <h4 className="font-semibold text-foreground mb-2 text-sm">Pre-Call Checklist</h4>
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border flex items-center justify-center text-primary">✓</div>
                          <span className="text-muted-foreground">Review customer history & previous interactions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border flex items-center justify-center text-primary">✓</div>
                          <span className="text-muted-foreground">Check company website/LinkedIn for context</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border flex items-center justify-center text-primary">✓</div>
                          <span className="text-muted-foreground">Prepare relevant case studies/testimonials</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border flex items-center justify-center text-primary">✓</div>
                          <span className="text-muted-foreground">Have pricing/packages ready</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border flex items-center justify-center text-primary">✓</div>
                          <span className="text-muted-foreground">Prepare discovery questions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border flex items-center justify-center text-primary">✓</div>
                          <span className="text-muted-foreground">Test audio/video if virtual call</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-background/50 border">
                      <h4 className="font-semibold text-foreground mb-2 text-sm">Post-Call Actions</h4>
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border flex items-center justify-center text-primary">✓</div>
                          <span className="text-muted-foreground">Update CRM with call notes immediately</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border flex items-center justify-center text-primary">✓</div>
                          <span className="text-muted-foreground">Send follow-up email within 24 hours</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border flex items-center justify-center text-primary">✓</div>
                          <span className="text-muted-foreground">Schedule next action/follow-up</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border flex items-center justify-center text-primary">✓</div>
                          <span className="text-muted-foreground">Send promised materials/documents</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border flex items-center justify-center text-primary">✓</div>
                          <span className="text-muted-foreground">Log deal stage if applicable</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-background/50 border md:col-span-2">
                      <h4 className="font-semibold text-foreground mb-2 text-sm">Follow-Up Email Template</h4>
                      <div className="text-xs p-3 bg-muted/50 rounded font-mono text-muted-foreground">
                        <p>Hi [Name],</p>
                        <p className="mt-2">Thank you for your time today discussing [topic]. As promised, here's [what you discussed].</p>
                        <p className="mt-2">Key points we covered:</p>
                        <p>• [Point 1]</p>
                        <p>• [Point 2]</p>
                        <p>• [Point 3]</p>
                        <p className="mt-2">Next steps: [Clear action item with date]</p>
                        <p className="mt-2">Please let me know if you have any questions.</p>
                        <p className="mt-2">Best regards,<br/>[Your name]</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* FAQs Tab */}
                <TabsContent value="faqs" className="space-y-4">
                  <Tabs defaultValue="outbound" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-3">
                      <TabsTrigger value="outbound" className="text-xs">Outbound Sales</TabsTrigger>
                      <TabsTrigger value="inbound" className="text-xs">Inbound Sales</TabsTrigger>
                      <TabsTrigger value="followup" className="text-xs">Follow-up</TabsTrigger>
                      <TabsTrigger value="support" className="text-xs">Post-Sale Support</TabsTrigger>
                    </TabsList>

                    {/* Outbound Sales FAQs */}
                    <TabsContent value="outbound" className="space-y-2">
                      <div className="space-y-2 text-xs">
                        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                          <p className="font-medium text-foreground">"Why are you calling me?"</p>
                          <p className="text-muted-foreground mt-1">"I noticed [company/situation] and thought our [service] could help. Do you have 2 minutes so I can explain how we've helped similar businesses?"</p>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                          <p className="font-medium text-foreground">"How did you get my number?"</p>
                          <p className="text-muted-foreground mt-1">"Your business is listed in [source/directory]. We reach out to companies that might benefit from our services. If now isn't a good time, when would be better?"</p>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                          <p className="font-medium text-foreground">"I'm not interested"</p>
                          <p className="text-muted-foreground mt-1">"I understand. Just curious - is it the timing, or is [service type] not something you're looking at right now? Sometimes it helps to know for future reference."</p>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                          <p className="font-medium text-foreground">"Send me an email instead"</p>
                          <p className="text-muted-foreground mt-1">"Absolutely! What's the best email? Also, what specific information would be most useful for you - pricing, case studies, or our process overview?"</p>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                          <p className="font-medium text-foreground">"What makes you different from competitors?"</p>
                          <p className="text-muted-foreground mt-1">"Great question! We specialize in [unique value]. Our clients typically see [specific benefit]. What's most important to you when choosing a provider?"</p>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                          <p className="font-medium text-foreground">"How much does it cost?"</p>
                          <p className="text-muted-foreground mt-1">"It depends on your specific needs. Our packages typically range from [range]. To give you an accurate quote, can I ask a few quick questions about what you're looking for?"</p>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Inbound Sales FAQs */}
                    <TabsContent value="inbound" className="space-y-2">
                      <div className="space-y-2 text-xs">
                        <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                          <p className="font-medium text-foreground">"I saw your ad/website. What exactly do you do?"</p>
                          <p className="text-muted-foreground mt-1">"Thanks for reaching out! We help [target audience] with [core service]. What caught your attention about us? That'll help me explain the most relevant parts."</p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                          <p className="font-medium text-foreground">"Can you give me a quick price?"</p>
                          <p className="text-muted-foreground mt-1">"Of course! To give you an accurate quote, I need to understand your situation. Are you looking at [option A] or [option B]? What's your timeline?"</p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                          <p className="font-medium text-foreground">"How long does the process take?"</p>
                          <p className="text-muted-foreground mt-1">"Typically [timeframe], but it can vary based on [factors]. When are you hoping to have this completed? We can work backward from your deadline."</p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                          <p className="font-medium text-foreground">"What documents do I need?"</p>
                          <p className="text-muted-foreground mt-1">"Good question! The basic requirements are [list]. Don't worry - I'll send you a complete checklist after our call. Do you have most of these ready?"</p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                          <p className="font-medium text-foreground">"Can I trust your company?"</p>
                          <p className="text-muted-foreground mt-1">"Absolutely valid concern! We've been operating since [year], served [X] clients, and are [licensed/certified]. Would you like references from similar businesses?"</p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                          <p className="font-medium text-foreground">"I'm comparing multiple providers"</p>
                          <p className="text-muted-foreground mt-1">"Smart approach! What criteria are most important to you? I'd love to help you understand where we might be the best fit - or not - so you can make the right decision."</p>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Follow-up Sales FAQs */}
                    <TabsContent value="followup" className="space-y-2">
                      <div className="space-y-2 text-xs">
                        <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                          <p className="font-medium text-foreground">"I haven't had time to review the proposal"</p>
                          <p className="text-muted-foreground mt-1">"No problem at all! Would it help if I walked you through the key points in 5 minutes? Or if you prefer, I can highlight the 3 most important things via email."</p>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                          <p className="font-medium text-foreground">"I need to discuss with my partner/team"</p>
                          <p className="text-muted-foreground mt-1">"Of course! When do you think you'll be able to connect with them? Would it help if I joined a call to answer any questions they might have?"</p>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                          <p className="font-medium text-foreground">"The price is higher than I expected"</p>
                          <p className="text-muted-foreground mt-1">"I understand. What range were you expecting? Let's see if there's a package that works better, or I can explain what's included that might justify the investment."</p>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                          <p className="font-medium text-foreground">"I'm waiting for [event/budget/approval]"</p>
                          <p className="text-muted-foreground mt-1">"Got it! When do you expect that to happen? I'll make a note to follow up then. In the meantime, is there anything I can prepare to help speed things along?"</p>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                          <p className="font-medium text-foreground">"We decided to go with another provider"</p>
                          <p className="text-muted-foreground mt-1">"I appreciate you letting me know. May I ask what made them a better fit? This helps us improve. If things don't work out, please keep us in mind."</p>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
                          <p className="font-medium text-foreground">"Can you match their price?"</p>
                          <p className="text-muted-foreground mt-1">"Let me understand what you're comparing. Sometimes pricing differences reflect different service levels. What exactly is included in their offer?"</p>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Post-Sale Support FAQs */}
                    <TabsContent value="support" className="space-y-2">
                      <div className="space-y-2 text-xs">
                        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                          <p className="font-medium text-foreground">"Where's my order/service status?"</p>
                          <p className="text-muted-foreground mt-1">"Let me check that for you right now. Can I have your reference number or the email you used? I'll give you a complete status update."</p>
                        </div>
                        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                          <p className="font-medium text-foreground">"This isn't what I expected/ordered"</p>
                          <p className="text-muted-foreground mt-1">"I'm sorry to hear that. Let me understand exactly what happened. Can you describe what you received vs. what you expected? I'll make this right."</p>
                        </div>
                        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                          <p className="font-medium text-foreground">"I want a refund"</p>
                          <p className="text-muted-foreground mt-1">"I understand your frustration. Before we process that, may I ask what went wrong? Sometimes we can resolve the issue - but if you still want a refund, I'll help you with that."</p>
                        </div>
                        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                          <p className="font-medium text-foreground">"Why is this taking so long?"</p>
                          <p className="text-muted-foreground mt-1">"I completely understand your concern. Let me check the exact status and explain what's happening. [After checking] The delay is due to [reason]. Here's what we're doing to expedite it."</p>
                        </div>
                        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                          <p className="font-medium text-foreground">"I need to make changes to my order"</p>
                          <p className="text-muted-foreground mt-1">"Of course! What changes do you need? Let me check if we can accommodate that at this stage. If there are any additional costs or timeline impacts, I'll let you know upfront."</p>
                        </div>
                        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                          <p className="font-medium text-foreground">"I have a complaint about your service"</p>
                          <p className="text-muted-foreground mt-1">"I'm really sorry you've had a negative experience. Your feedback is important. Please tell me exactly what happened - I want to understand and make sure we address this properly."</p>
                        </div>
                        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                          <p className="font-medium text-foreground">"Can I get a discount on my next order?"</p>
                          <p className="text-muted-foreground mt-1">"I appreciate your loyalty! Let me see what we can offer. We have [loyalty program/current promotions]. Based on your history, I can offer you [specific offer]."</p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </TabsContent>

                {/* Notes Tab - Discussion Insights */}
                <TabsContent value="notes" className="space-y-4">
                  <div className="grid gap-4">
                    {/* Playbook Tab Order Logic */}
                    <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-blue-500" />
                        Playbook Tab Order Logic
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        The playbook editor tabs follow the natural call flow sequence:
                      </p>
                      <div className="grid gap-2 text-sm">
                        <div className="flex items-start gap-3 p-2 rounded bg-background/50">
                          <Badge className="bg-blue-500/20 text-blue-700">1</Badge>
                          <div>
                            <p className="font-medium">Stages</p>
                            <p className="text-muted-foreground text-xs">Define the overall call structure first (Opening → Discovery → Pitch → Negotiation → Closing)</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-2 rounded bg-background/50">
                          <Badge className="bg-purple-500/20 text-purple-700">2</Badge>
                          <div>
                            <p className="font-medium">Questions</p>
                            <p className="text-muted-foreground text-xs">Discovery questions used early in the call to understand customer needs</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-2 rounded bg-background/50">
                          <Badge className="bg-amber-500/20 text-amber-700">3</Badge>
                          <div>
                            <p className="font-medium">Pricing</p>
                            <p className="text-muted-foreground text-xs">Negotiation strategies discussed during the pricing/negotiation phase</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-2 rounded bg-background/50">
                          <Badge className="bg-orange-500/20 text-orange-700">4</Badge>
                          <div>
                            <p className="font-medium">Objections</p>
                            <p className="text-muted-foreground text-xs">Objections typically arise during pricing/negotiation - not after closing</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-2 rounded bg-background/50">
                          <Badge className="bg-pink-500/20 text-pink-700">5</Badge>
                          <div>
                            <p className="font-medium">Emotions</p>
                            <p className="text-muted-foreground text-xs">Emotional responses can occur throughout the entire call and need handling</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Why This Order Matters */}
                    <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4 text-green-500" />
                        Why This Order Matters
                      </h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>• <strong>Questions before Objections:</strong> You ask discovery questions early in the call, objections come later during negotiation</p>
                        <p>• <strong>Pricing before Objections:</strong> Pricing discussion triggers most objections - "too expensive", "need to think about it"</p>
                        <p>• <strong>Objections after Pricing:</strong> Objections don't arise after closing - if you're at closing, objections have been handled</p>
                        <p>• <strong>Emotions throughout:</strong> Emotional responses (frustration, excitement, hesitation) can occur at any stage</p>
                      </div>
                    </div>

                    {/* Building vs Using a Playbook */}
                    <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-purple-500" />
                        Building vs Using a Playbook
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-foreground mb-2">When Building (Editor View)</p>
                          <p className="text-muted-foreground">Define stages first, then add supporting elements (questions, pricing strategies, objection handlers) that apply to those stages.</p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground mb-2">When Using (Live Call)</p>
                          <p className="text-muted-foreground">Follow the stage flow, use discovery questions during opening/discovery, handle objections during negotiation, and apply emotional intelligence throughout.</p>
                        </div>
                      </div>
                    </div>

                    {/* Key Insight */}
                    <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Key Insight
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        <strong>Objections don't come after closing.</strong> If a customer has objections after you've reached the closing stage, 
                        it means you didn't fully address their concerns during negotiation. The goal is to handle all objections 
                        BEFORE asking for commitment, not after.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>


      <div className="grid grid-cols-12 gap-6">
        {/* Playbook List - Sidebar */}
        <div className="col-span-3">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 bg-muted/30 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Playbooks
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {playbooks.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Search */}
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search playbooks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                </div>
              </div>
              
              {/* Call Type Filter Tabs */}
              <div className="p-2 border-b">
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
                      className="h-6 px-2 text-xs flex-1"
                    >
                      {tab.label}
                    </Button>
                  ))}
                </div>
              </div>

              <ScrollArea className="h-[calc(100vh-420px)]">
                <div className="p-2 space-y-3">
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
                    Object.entries(groupedPlaybooks).sort(([a], [b]) => a === 'General' ? 1 : b === 'General' ? -1 : a.localeCompare(b)).map(([productName, pbs]) => (
                      <Collapsible key={productName} defaultOpen>
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors">
                            <Package className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground flex-1 text-left">{productName}</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{pbs.length}</Badge>
                            <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform duration-200" />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-1.5 mt-1">
                          {pbs.map(playbook => {
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
                                    : 'border-transparent hover:bg-muted/50 hover:border-border/50'
                                }`}
                                onClick={() => handleSelectPlaybook(playbook)}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`p-1.5 rounded-md ${isSelected ? 'bg-primary/20' : 'bg-muted/50 group-hover:bg-muted'} transition-colors`}>
                                    {callTypeIcon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">{playbook.name}</div>
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${callTypeColor}`}>
                                        {playbook.call_type === 'outbound' ? 'Outbound' : playbook.call_type === 'inbound' ? 'Inbound' : 'Follow-up'}
                                      </Badge>
                                      {playbook.is_active && (
                                        <Badge className="text-[10px] px-1.5 py-0 bg-green-500/20 text-green-700 border-green-500/30">
                                          Active
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </CollapsibleContent>
                      </Collapsible>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Playbook Editor - Main Content */}
        <div className="col-span-9">
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
                <Tabs defaultValue="stages" className="space-y-5">
                  <TabsList className="grid grid-cols-5 w-full p-1 bg-muted/50 rounded-lg">
                    <TabsTrigger value="stages" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all">
                      <Play className="h-4 w-4" />
                      <span>Stages</span>
                      <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{stages.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="questions" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all">
                      <HelpCircle className="h-4 w-4" />
                      <span>Questions</span>
                      <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{questions.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="pricing" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all">
                      <DollarSign className="h-4 w-4" />
                      <span>Pricing</span>
                      <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{pricing.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="objections" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Objections</span>
                      <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{objections.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="emotions" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all">
                      <Heart className="h-4 w-4" />
                      <span>Emotions</span>
                      <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">{emotions.length}</Badge>
                    </TabsTrigger>
                  </TabsList>

                  {/* Stages Tab */}
                  <TabsContent value="stages" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">Call Flow Stages</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Define the structure and flow of your calls</p>
                      </div>
                      <Button size="sm" onClick={handleAddStage} className="shadow-sm">
                        <Plus className="h-4 w-4 mr-1.5" />
                        Add Stage
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {stages.map((stage, index) => {
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
                        <Card key={stage.id} className={`p-4 border-l-4 ${stageTypeColors[stage.stage_type] || 'border-l-muted'} hover:shadow-md transition-shadow`}>
                          <div className="space-y-4">
                            <div className="flex items-start gap-4">
                              <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 rounded-md px-2 py-1">
                                <GripVertical className="h-4 w-4 cursor-grab" />
                                <span className="font-mono text-sm font-medium">{stage.stage_order}</span>
                              </div>
                              <div className="flex-1 grid grid-cols-3 gap-4">
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
                              <div className="flex gap-2">
                                <Button size="icon" variant="ghost" onClick={() => handleSaveStage(stage)}>
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => handleDeleteStage(stage.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Opening Lines */}
                            <div className="pl-10 space-y-2">
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
                            <div className="pl-10 space-y-3">
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
                            <div className="grid grid-cols-2 gap-4 pl-10">
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
                          </div>
                        </Card>
                        );
                      })}
                    </div>
                  </TabsContent>

                  {/* Objections Tab */}
                  <TabsContent value="objections" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Objection Handlers</h3>
                      <Button size="sm" onClick={handleAddObjection}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Handler
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {objections.map((obj) => (
                        <Card key={obj.id} className="p-4">
                          <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label className="text-xs">Type</Label>
                                <Input
                                  value={obj.objection_type || ''}
                                  onChange={(e) => {
                                    const updated = objections.map(o => 
                                      o.id === obj.id ? { ...o, objection_type: e.target.value } : o
                                    );
                                    setObjections(updated);
                                  }}
                                  placeholder="e.g., Price, Timing, Competitor"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Trigger Phrase</Label>
                                <Input
                                  value={obj.objection_trigger}
                                  onChange={(e) => {
                                    const updated = objections.map(o => 
                                      o.id === obj.id ? { ...o, objection_trigger: e.target.value } : o
                                    );
                                    setObjections(updated);
                                  }}
                                  placeholder="e.g., 'too expensive'"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Severity</Label>
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
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Response Script</Label>
                              <Textarea
                                value={obj.response_script}
                                onChange={(e) => {
                                  const updated = objections.map(o => 
                                    o.id === obj.id ? { ...o, response_script: e.target.value } : o
                                  );
                                  setObjections(updated);
                                }}
                                placeholder="How to respond to this objection..."
                                rows={3}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleSaveObjection(obj)}>
                                <Save className="h-4 w-4 mr-1" />
                                Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteObjection(obj.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Questions Tab */}
                  <TabsContent value="questions" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Discovery Questions</h3>
                      <Button size="sm" onClick={handleAddQuestion}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Question
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {questions.map((q) => (
                        <Card key={q.id} className="p-4">
                          <div className="flex items-start gap-4">
                            <span className="font-mono text-sm text-muted-foreground">{q.priority}</span>
                            <div className="flex-1 grid grid-cols-3 gap-4">
                              <div className="col-span-2 space-y-2">
                                <Label className="text-xs">Question</Label>
                                <Input
                                  value={q.question_text}
                                  onChange={(e) => {
                                    const updated = questions.map(qu => 
                                      qu.id === q.id ? { ...qu, question_text: e.target.value } : qu
                                    );
                                    setQuestions(updated);
                                  }}
                                  placeholder="Enter the discovery question..."
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs">Purpose</Label>
                                <Input
                                  value={q.question_purpose || ''}
                                  onChange={(e) => {
                                    const updated = questions.map(qu => 
                                      qu.id === q.id ? { ...qu, question_purpose: e.target.value } : qu
                                    );
                                    setQuestions(updated);
                                  }}
                                  placeholder="e.g., Identify pain points"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="icon" variant="ghost" onClick={() => handleSaveQuestion(q)}>
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => handleDeleteQuestion(q.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Pricing Tab */}
                  <TabsContent value="pricing" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">Pricing Strategies by Segment</h3>
                        <p className="text-sm text-muted-foreground">Configure pricing rules and discount ranges for different customer segments.</p>
                      </div>
                    </div>
                    {pricing.length === 0 ? (
                      <Card className="p-8 text-center text-muted-foreground">
                        <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No pricing strategies configured for this playbook.</p>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {pricing.map((p) => (
                          <Card key={p.id} className="p-4">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="capitalize">{p.customer_segment?.replace('_', ' ')}</Badge>
                                <Badge variant={p.urgency_level === 'high' ? 'destructive' : p.urgency_level === 'medium' ? 'default' : 'secondary'}>
                                  {p.urgency_level} urgency
                                </Badge>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Discount Range</Label>
                                  <p className="font-medium">{p.discount_range_min}% - {p.discount_range_max}%</p>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Negotiation Floor</Label>
                                  <p className="font-medium">{p.negotiation_floor}%</p>
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Pricing Script</Label>
                                <p className="text-sm mt-1 bg-muted/50 p-2 rounded">{p.pricing_script}</p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Emotions Tab */}
                  <TabsContent value="emotions" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">Emotional Response Strategies</h3>
                        <p className="text-sm text-muted-foreground">Define how to respond when customers display different emotions.</p>
                      </div>
                    </div>
                    {emotions.length === 0 ? (
                      <Card className="p-8 text-center text-muted-foreground">
                        <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No emotional response strategies configured for this playbook.</p>
                      </Card>
                    ) : (
                      <div className="space-y-3">
                        {emotions.map((e) => (
                          <Card key={e.id} className="p-4">
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="capitalize">{e.emotion_detected}</Badge>
                                {e.tone_adjustment && (
                                  <span className="text-xs text-muted-foreground">• Tone: {e.tone_adjustment}</span>
                                )}
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Response Strategy</Label>
                                <p className="text-sm mt-1">{e.response_strategy}</p>
                              </div>
                              {e.suggested_phrases && e.suggested_phrases.length > 0 && (
                                <div>
                                  <Label className="text-xs text-muted-foreground">Suggested Phrases</Label>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {e.suggested_phrases.map((phrase, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs font-normal">
                                        "{phrase}"
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[calc(100vh-320px)] flex items-center justify-center border-dashed border-2 border-muted-foreground/20 bg-gradient-to-br from-muted/20 to-transparent">
              <div className="text-center max-w-md px-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 rotate-3">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No Playbook Selected</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Select a playbook from the sidebar to start editing, or create a new one to define your sales and support call strategies.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Playbook
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaybookEditor;
