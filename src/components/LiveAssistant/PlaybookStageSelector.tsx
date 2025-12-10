import React, { useState, useEffect, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, BookOpen, GitBranch, FileText, ChevronRight, Phone, PhoneIncoming, PhoneForwarded, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Playbook {
  id: string;
  name: string;
  call_type: string;
  product_id: string | null;
}

interface PlaybookStage {
  id: string;
  stage_name: string;
  stage_type: string;
  stage_order: number;
  script: string | null;
  opening_lines: string[] | null;
  key_objectives: string[] | null;
}

interface ScriptNode {
  id: string;
  node_type: string;
  script_text: string;
  parent_id: string | null;
  order_index: number;
  trigger_condition: string | null;
}

interface CustomerContext {
  isNewLead?: boolean;
  hasActiveApplications?: boolean;
  hasPreviousCalls?: boolean;
  productId?: string;
}

interface PlaybookStageSelectorProps {
  selectedPlaybookId?: string;
  onPlaybookChange?: (playbookId: string) => void;
  onStageChange?: (stageId: string) => void;
  onCallTypeChange?: (callType: string) => void;
  customerContext?: CustomerContext;
  compact?: boolean;
}

type CallType = 'outbound' | 'inbound' | 'follow_up';

const CALL_TYPES: { value: CallType; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'outbound', label: 'Outbound Sales', icon: Phone, description: 'New prospect or sales call' },
  { value: 'inbound', label: 'Inbound Support', icon: PhoneIncoming, description: 'Customer support call' },
  { value: 'follow_up', label: 'Follow-up', icon: PhoneForwarded, description: 'Continuing previous conversation' },
];

const PlaybookStageSelector: React.FC<PlaybookStageSelectorProps> = ({
  selectedPlaybookId,
  onPlaybookChange,
  onStageChange,
  onCallTypeChange,
  customerContext,
  compact = false
}) => {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [stages, setStages] = useState<PlaybookStage[]>([]);
  const [scriptNodes, setScriptNodes] = useState<ScriptNode[]>([]);
  const [activePlaybook, setActivePlaybook] = useState<string>(selectedPlaybookId || '');
  const [activeStage, setActiveStage] = useState<string>('');
  const [selectedCallType, setSelectedCallType] = useState<CallType>('outbound');
  const [loading, setLoading] = useState(true);
  const [recommendedPlaybookId, setRecommendedPlaybookId] = useState<string | null>(null);
  const [recommendedCallType, setRecommendedCallType] = useState<CallType | null>(null);

  // Auto-detect recommended call type based on customer context
  useEffect(() => {
    if (!customerContext) return;
    
    let detected: CallType = 'outbound';
    
    if (customerContext.hasPreviousCalls) {
      detected = 'follow_up';
    } else if (customerContext.hasActiveApplications && !customerContext.isNewLead) {
      detected = 'inbound';
    } else if (customerContext.isNewLead) {
      detected = 'outbound';
    }
    
    setRecommendedCallType(detected);
    setSelectedCallType(detected);
    onCallTypeChange?.(detected);
  }, [customerContext]);

  // Fetch playbooks
  useEffect(() => {
    const fetchPlaybooks = async () => {
      const { data, error } = await supabase
        .from('sales_playbooks')
        .select('id, name, call_type, product_id')
        .eq('is_active', true)
        .order('name');
      
      if (!error && data) {
        setPlaybooks(data);
      }
      setLoading(false);
    };
    fetchPlaybooks();
  }, []);

  // Filter playbooks by selected call type
  const filteredPlaybooks = useMemo(() => {
    return playbooks.filter(pb => pb.call_type === selectedCallType);
  }, [playbooks, selectedCallType]);

  // Auto-select recommended playbook when call type changes
  useEffect(() => {
    if (filteredPlaybooks.length === 0) {
      setActivePlaybook('');
      setRecommendedPlaybookId(null);
      return;
    }

    // Find best matching playbook
    let recommended = filteredPlaybooks[0];
    
    // If customer has a product, prefer playbook matching that product
    if (customerContext?.productId) {
      const productMatch = filteredPlaybooks.find(pb => pb.product_id === customerContext.productId);
      if (productMatch) {
        recommended = productMatch;
      }
    }
    
    setRecommendedPlaybookId(recommended.id);
    
    // Only auto-select if no playbook is currently selected or selected one isn't in filtered list
    if (!activePlaybook || !filteredPlaybooks.find(pb => pb.id === activePlaybook)) {
      setActivePlaybook(recommended.id);
    }
  }, [filteredPlaybooks, customerContext?.productId]);

  // Fetch stages when playbook changes
  useEffect(() => {
    if (!activePlaybook) return;
    
    const fetchStages = async () => {
      const { data, error } = await supabase
        .from('playbook_stages')
        .select('id, stage_name, stage_type, stage_order, script, opening_lines, key_objectives')
        .eq('playbook_id', activePlaybook)
        .order('stage_order');
      
      if (!error && data) {
        setStages(data);
        if (data.length > 0) {
          setActiveStage(data[0].id);
        }
      }
    };
    fetchStages();
    onPlaybookChange?.(activePlaybook);
  }, [activePlaybook]);

  // Fetch script nodes when stage changes
  useEffect(() => {
    if (!activeStage) return;
    
    const fetchScriptNodes = async () => {
      const { data, error } = await supabase
        .from('script_nodes')
        .select('id, node_type, script_text, parent_id, order_index, trigger_condition')
        .eq('stage_id', activeStage)
        .order('order_index');
      
      if (!error && data) {
        setScriptNodes(data);
      }
    };
    fetchScriptNodes();
    onStageChange?.(activeStage);
  }, [activeStage]);

  const handleCallTypeChange = (value: CallType) => {
    setSelectedCallType(value);
    onCallTypeChange?.(value);
  };

  const currentStage = stages.find(s => s.id === activeStage);
  const hasDecisionTree = scriptNodes.length > 0;

  // Build tree structure from flat nodes
  const buildTree = (nodes: ScriptNode[], parentId: string | null = null): ScriptNode[] => {
    return nodes
      .filter(n => n.parent_id === parentId)
      .sort((a, b) => a.order_index - b.order_index);
  };

  const renderNode = (node: ScriptNode, depth: number = 0) => {
    const children = buildTree(scriptNodes, node.id);
    const isRoot = node.node_type === 'root';
    const isQuestion = node.node_type === 'question';
    const isResponse = node.node_type === 'response';
    const isAction = node.node_type === 'action';

    return (
      <div key={node.id} className={cn("relative", depth > 0 && "ml-4 pl-3 border-l-2 border-border/50")}>
        <div className={cn(
          "p-2 rounded-lg mb-2 text-sm",
          isRoot && "bg-primary/10 border border-primary/20",
          isQuestion && "bg-blue-500/10 border border-blue-500/20",
          isResponse && "bg-amber-500/10 border border-amber-500/20",
          isAction && "bg-green-500/10 border border-green-500/20"
        )}>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {node.node_type}
            </Badge>
            {node.trigger_condition && (
              <span className="text-xs text-muted-foreground italic">
                if: "{node.trigger_condition}"
              </span>
            )}
          </div>
          <p className="text-foreground">{node.script_text}</p>
        </div>
        {children.length > 0 && (
          <div className="space-y-1">
            {children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-sm bg-muted/30">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          Playbook Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-3">
        {/* Call Type Selector */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            Call Type
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {CALL_TYPES.map(({ value, label, icon: Icon }) => {
              const isSelected = selectedCallType === value;
              const isRecommended = recommendedCallType === value;
              
              return (
                <button
                  key={value}
                  onClick={() => handleCallTypeChange(value)}
                  className={cn(
                    "relative flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all",
                    isSelected 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-background hover:bg-muted border-border"
                  )}
                >
                  {isRecommended && !isSelected && (
                    <Badge 
                      className="absolute -top-1.5 -right-1.5 h-4 px-1 text-[8px] bg-amber-500 text-amber-950"
                    >
                      <Sparkles className="h-2 w-2 mr-0.5" />
                      Rec
                    </Badge>
                  )}
                  <Icon className="h-4 w-4" />
                  <span className="text-[10px] font-medium text-center leading-tight">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Playbook Selector */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            Playbook
          </p>
          {filteredPlaybooks.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">
              No playbooks for this call type.
            </p>
          ) : (
            <Select value={activePlaybook} onValueChange={setActivePlaybook}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select playbook" />
              </SelectTrigger>
              <SelectContent>
                {filteredPlaybooks.map(pb => {
                  const isRecommended = pb.id === recommendedPlaybookId;
                  return (
                    <SelectItem key={pb.id} value={pb.id} className="text-xs">
                      <div className="flex items-center gap-2">
                        <span>{pb.name}</span>
                        {isRecommended && (
                          <Badge variant="secondary" className="text-[9px] px-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            <Sparkles className="h-2 w-2 mr-0.5" />
                            Recommended
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Stage Tabs */}
        {stages.length > 0 && (
          <Tabs value={activeStage} onValueChange={setActiveStage} className="w-full">
            <ScrollArea className="w-full">
              <TabsList className="w-full h-auto flex-wrap justify-start bg-transparent gap-1 p-0">
                {stages.map((stage, idx) => (
                  <TabsTrigger
                    key={stage.id}
                    value={stage.id}
                    className={cn(
                      "text-[10px] px-2 py-1 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                      "flex items-center gap-1"
                    )}
                  >
                    <span className="font-bold">{idx + 1}</span>
                    <span className="hidden sm:inline">{stage.stage_name}</span>
                    {idx < stages.length - 1 && (
                      <ChevronRight className="h-3 w-3 text-muted-foreground ml-1" />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>

            {/* Stage Content */}
            {stages.map(stage => (
              <TabsContent key={stage.id} value={stage.id} className="mt-3 space-y-3">
                {/* Key Objectives */}
                {stage.key_objectives && stage.key_objectives.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Objectives
                    </p>
                    <ul className="space-y-1">
                      {stage.key_objectives.map((obj, i) => (
                        <li key={i} className="text-xs text-foreground flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {obj}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Opening Lines */}
                {stage.opening_lines && stage.opening_lines.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Opening Lines
                    </p>
                    <div className="space-y-1">
                      {stage.opening_lines.map((line, i) => (
                        <p key={i} className="text-xs italic text-muted-foreground bg-muted/50 p-2 rounded">
                          "{line}"
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Script or Decision Tree */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {hasDecisionTree ? (
                      <GitBranch className="h-3 w-3 text-primary" />
                    ) : (
                      <FileText className="h-3 w-3 text-primary" />
                    )}
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                      {hasDecisionTree ? 'Decision Tree' : 'Script'}
                    </p>
                  </div>
                  
                  <ScrollArea className={cn(compact ? "h-[120px]" : "h-[160px]")}>
                    {hasDecisionTree ? (
                      <div className="space-y-2 pr-2">
                        {buildTree(scriptNodes, null).map(node => renderNode(node))}
                      </div>
                    ) : stage.script ? (
                      <div className="text-xs text-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
                        {stage.script}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        No script configured for this stage.
                      </p>
                    )}
                  </ScrollArea>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default PlaybookStageSelector;
