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
import { useToast } from '@/hooks/use-toast';
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
  GripVertical
} from 'lucide-react';

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
  const [newPlaybook, setNewPlaybook] = useState({
    name: '',
    description: '',
    product_id: '',
    call_type: 'outbound',
    target_segments: [] as string[]
  });

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

    setStages(stagesRes.data || []);
    setObjections(objectionsRes.data || []);
    setPricing(pricingRes.data || []);
    setQuestions(questionsRes.data || []);
    setEmotions(emotionsRes.data || []);
  };

  const handleSelectPlaybook = async (playbook: Playbook) => {
    setSelectedPlaybook(playbook);
    await fetchPlaybookDetails(playbook.id);
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Sales Playbook Editor
          </h1>
          <p className="text-muted-foreground mt-1">Configure sales playbooks, stages, objection handlers, and more</p>
        </div>
        
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

      <div className="grid grid-cols-12 gap-6">
        {/* Playbook List */}
        <div className="col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Playbooks</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-1 p-2">
                  {loading ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div>
                  ) : playbooks.length === 0 ? (
                    <div className="p-4 text-center">
                      <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">No playbooks yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Click "New Playbook" to create one</p>
                    </div>
                  ) : (
                    playbooks.map(playbook => (
                      <div
                        key={playbook.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedPlaybook?.id === playbook.id 
                            ? 'bg-primary/10 border border-primary/30' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleSelectPlaybook(playbook)}
                      >
                        <div className="font-medium text-sm">{playbook.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {playbook.call_type}
                          </Badge>
                          {playbook.is_active && (
                            <Badge className="text-xs bg-green-500/20 text-green-700">Active</Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Playbook Editor */}
        <div className="col-span-9">
          {selectedPlaybook ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedPlaybook.name}</CardTitle>
                    <CardDescription>{selectedPlaybook.description}</CardDescription>
                  </div>
                  <Badge variant="outline">{selectedPlaybook.call_type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="stages" className="space-y-4">
                  <TabsList className="grid grid-cols-5 w-full">
                    <TabsTrigger value="stages" className="flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      Stages
                    </TabsTrigger>
                    <TabsTrigger value="objections" className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Objections
                    </TabsTrigger>
                    <TabsTrigger value="questions" className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Questions
                    </TabsTrigger>
                    <TabsTrigger value="pricing" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Pricing
                    </TabsTrigger>
                    <TabsTrigger value="emotions" className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Emotions
                    </TabsTrigger>
                  </TabsList>

                  {/* Stages Tab */}
                  <TabsContent value="stages" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Call Flow Stages</h3>
                      <Button size="sm" onClick={handleAddStage}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Stage
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {stages.map((stage, index) => (
                        <Card key={stage.id} className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-start gap-4">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <GripVertical className="h-4 w-4" />
                                <span className="font-mono text-sm">{stage.stage_order}</span>
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
                      ))}
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
                    <h3 className="font-semibold">Pricing Strategies by Segment</h3>
                    <p className="text-sm text-muted-foreground">Configure pricing rules and discount ranges for different customer segments.</p>
                    {/* Pricing UI would go here */}
                  </TabsContent>

                  {/* Emotions Tab */}
                  <TabsContent value="emotions" className="space-y-4">
                    <h3 className="font-semibold">Emotional Response Strategies</h3>
                    <p className="text-sm text-muted-foreground">Define how to respond when customers display different emotions.</p>
                    {/* Emotions UI would go here */}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-[calc(100vh-220px)] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a playbook to edit or create a new one</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaybookEditor;
