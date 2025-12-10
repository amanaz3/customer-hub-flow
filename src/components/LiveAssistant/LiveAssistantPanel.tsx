import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  MessageSquare, 
  Lightbulb, 
  AlertTriangle, 
  FileText,
  Save,
  Clock,
  Loader2,
  Sparkles,
  Settings,
  ChevronDown,
  ChevronRight,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSalesAssistant } from '@/hooks/useSalesAssistant';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SecureAuthContext';
import { supabase } from '@/integrations/supabase/client';

interface TranscriptLine {
  id: string;
  timestamp: string;
  speaker: 'agent' | 'customer';
  text: string;
}

interface PlaybookStage {
  id: string;
  stage_name: string;
  stage_order: number;
  key_objectives: string[] | null;
}

interface LiveAssistantPanelProps {
  onReplySelected?: (text: string) => void;
  onSaveToCRM?: () => void;
  fullWidth?: boolean;
  customerId?: string;
  playbookId?: string;
}

// Mock data for demo mode
const mockTranscript: TranscriptLine[] = [
  { id: '1', timestamp: '10:32:15', speaker: 'customer', text: 'Hi, I need help with my account application.' },
  { id: '2', timestamp: '10:32:22', speaker: 'agent', text: 'Of course! I\'d be happy to help. Could you provide your reference number?' },
  { id: '3', timestamp: '10:32:35', speaker: 'customer', text: 'Yes, it\'s CUST-2025-00145.' },
  { id: '4', timestamp: '10:32:42', speaker: 'agent', text: 'Thank you. I can see your application. What would you like to know?' },
  { id: '5', timestamp: '10:32:58', speaker: 'customer', text: 'What documents do I still need to submit?' },
];

const mockSuggestedReplies = [
  "I can see you need to submit your Emirates ID and proof of address.",
  "Let me check the status of your application for you.",
  "Would you like me to explain the next steps in the process?"
];

const mockSuggestedQuestions = [
  "Would you like to know the estimated completion time?",
  "Do you have any questions about the required documents?"
];

const mockAlerts = [
  { id: '1', type: 'objection', label: 'Pricing Objection', color: 'bg-amber-500/20 text-amber-700 border-amber-500/30' },
  { id: '2', type: 'compliance', label: 'ID Verification', color: 'bg-blue-500/20 text-blue-700 border-blue-500/30' },
];

const mockCallSummary = "Customer inquired about their bank account application (CUST-2025-00145). Discussed required documents including Emirates ID and proof of address. Customer expressed concern about processing time.";

const LiveAssistantPanel: React.FC<LiveAssistantPanelProps> = ({ 
  onReplySelected,
  onSaveToCRM,
  fullWidth = false,
  customerId,
  playbookId
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [useAI, setUseAI] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptLine[]>(mockTranscript);
  const [callSummary, setCallSummary] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [stages, setStages] = useState<PlaybookStage[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [showObjectives, setShowObjectives] = useState(false);
  const [callType, setCallType] = useState<'outbound' | 'inbound'>('outbound');
  const [activePlaybookId, setActivePlaybookId] = useState<string | null>(null);
  const [playbookName, setPlaybookName] = useState<string>('');
  const {
    isLoading,
    suggestions,
    getSuggestions,
    analyzeCall
  } = useSalesAssistant({ customerId });

  // Auto-select playbook based on call type and product
  useEffect(() => {
    const fetchPlaybook = async () => {
      // Map call type to playbook call_type
      const playbookCallType = callType === 'inbound' ? 'inbound_support' : 'outbound_sales';
      
      // Try to find playbook matching call type (and product if provided)
      let query = supabase
        .from('sales_playbooks')
        .select('id, name')
        .eq('is_active', true)
        .eq('call_type', playbookCallType);
      
      // If we have a playbookId prop, use it directly
      if (playbookId) {
        const { data } = await supabase
          .from('sales_playbooks')
          .select('id, name')
          .eq('id', playbookId)
          .single();
        if (data) {
          setActivePlaybookId(data.id);
          setPlaybookName(data.name);
          return;
        }
      }
      
      const { data } = await query.limit(1);
      if (data && data.length > 0) {
        setActivePlaybookId(data[0].id);
        setPlaybookName(data[0].name);
      }
    };
    fetchPlaybook();
  }, [callType, playbookId]);

  // Fetch stages when playbook changes
  useEffect(() => {
    if (!activePlaybookId) return;

    const fetchStages = async () => {
      const { data } = await supabase
        .from('playbook_stages')
        .select('id, stage_name, stage_order, key_objectives')
        .eq('playbook_id', activePlaybookId)
        .order('stage_order');
      
      if (data) {
        setStages(data);
        setCurrentStageIndex(0);
      }
    };
    fetchStages();
  }, [activePlaybookId]);

  // Auto-scroll transcript
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  // Fetch AI suggestions
  useEffect(() => {
    if (useAI && transcript.length > 0) {
      const transcriptTexts = transcript.map(t => `${t.speaker}: ${t.text}`);
      const currentStage = stages[currentStageIndex]?.stage_name || 'discovery';
      getSuggestions(transcriptTexts, currentStage);
    }
  }, [useAI, transcript.length, currentStageIndex]);

  const handleReplyClick = (text: string) => {
    onReplySelected?.(text);
  };

  const handleAnalyzeCall = async () => {
    const transcriptTexts = transcript.map(t => `${t.speaker}: ${t.text}`);
    const result = await analyzeCall(transcriptTexts);
    if (result?.summary) {
      setCallSummary(result.summary);
      setShowSummary(true);
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500/20 text-red-700 border-red-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-700 border-amber-500/30';
      default: return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
    }
  };

  const displaySuggestions = useAI && suggestions?.suggestedReplies 
    ? suggestions.suggestedReplies : mockSuggestedReplies;
  const displayQuestions = useAI && suggestions?.suggestedQuestions
    ? suggestions.suggestedQuestions : mockSuggestedQuestions;
  const displayAlerts = useAI && suggestions?.alerts
    ? suggestions.alerts.map((alert, idx) => ({
        id: String(idx), type: alert.type, label: alert.label, color: getAlertColor(alert.severity)
      }))
    : mockAlerts;
  const displaySummary = callSummary || mockCallSummary;
  const currentStage = stages[currentStageIndex];

  return (
    <div className={cn(
      "bg-card flex flex-col h-full overflow-hidden",
      fullWidth ? "w-full" : "w-[380px] flex-shrink-0 border-l border-border"
    )}>
      {/* Header */}
      <div className="p-3 border-b border-border bg-primary/5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <h2 className="text-sm font-semibold">Live Assistant</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-muted/50 rounded-full px-2 py-0.5">
              <span className="text-[10px] text-muted-foreground">{useAI ? 'AI' : 'Demo'}</span>
              <Switch id="ai-mode" checked={useAI} onCheckedChange={setUseAI} className="scale-[0.55]" />
            </div>
            {isAdmin && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigate('/playbook-editor')}>
                <Settings className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Call Type Toggle */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex bg-muted rounded-lg p-0.5 text-[10px]">
            <button
              onClick={() => setCallType('outbound')}
              className={cn(
                "px-2 py-1 rounded-md transition-all",
                callType === 'outbound' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Outbound
            </button>
            <button
              onClick={() => setCallType('inbound')}
              className={cn(
                "px-2 py-1 rounded-md transition-all",
                callType === 'inbound' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Inbound
            </button>
          </div>
          {playbookName && (
            <span className="text-[10px] text-muted-foreground">
              → {playbookName}
            </span>
          )}
        </div>

        {/* Stage Progress Indicator */}
        {stages.length > 0 && (
          <div className="mt-2">
            <div className="flex items-center gap-1">
              {stages.map((stage, idx) => (
                <button
                  key={stage.id}
                  onClick={() => setCurrentStageIndex(idx)}
                  className={cn(
                    "flex-1 h-1.5 rounded-full transition-all",
                    idx <= currentStageIndex ? "bg-primary" : "bg-muted"
                  )}
                  title={stage.stage_name}
                />
              ))}
            </div>
            <Collapsible open={showObjectives} onOpenChange={setShowObjectives}>
              <CollapsibleTrigger className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground hover:text-foreground">
                {showObjectives ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                <span className="font-medium">{currentStage?.stage_name}</span>
                <span className="text-muted-foreground">• Stage {currentStageIndex + 1}/{stages.length}</span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {currentStage?.key_objectives && (
                  <div className="mt-1.5 pl-4 space-y-0.5">
                    {currentStage.key_objectives.map((obj, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                        <Target className="h-2.5 w-2.5 mt-0.5 text-primary shrink-0" />
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Alerts */}
          {displayAlerts.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {displayAlerts.map((alert) => (
                <Badge key={alert.id} variant="outline" className={cn("text-[10px] py-0 border", alert.color)}>
                  <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                  {alert.label}
                </Badge>
              ))}
            </div>
          )}

          {/* AI Suggestions - Primary Focus */}
          <Card className="border border-primary/20 shadow-none bg-primary/5">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium">Say This</span>
                {isLoading && useAI && <Loader2 className="h-3 w-3 animate-spin ml-auto text-primary" />}
              </div>
              <div className="space-y-1.5">
                {displaySuggestions.slice(0, 3).map((reply: string, index: number) => (
                  <button
                    key={index}
                    className="w-full text-left text-xs p-2.5 rounded-lg bg-background border border-border hover:border-primary/50 hover:bg-primary/5 transition-all leading-relaxed"
                    onClick={() => handleReplyClick(reply)}
                  >
                    {reply}
                  </button>
                ))}
              </div>
              
              {/* Quick Follow-up Questions */}
              <div className="mt-3 pt-2 border-t border-border/50">
                <span className="text-[10px] text-muted-foreground">Then Ask</span>
                <div className="mt-1 space-y-1">
                  {displayQuestions.slice(0, 2).map((q: string, i: number) => (
                    <button
                      key={i}
                      className="w-full text-left text-[11px] p-1.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 transition-all"
                      onClick={() => handleReplyClick(q)}
                    >
                      → {q}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transcript - Collapsed by Default */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground w-full">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Transcript</span>
              <ChevronDown className="h-3 w-3 ml-auto" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="border border-border/50 shadow-none mt-2">
                <CardContent className="p-2">
                  <div ref={scrollRef} className="h-[140px] overflow-y-auto space-y-1.5 pr-1">
                    {transcript.map((line) => (
                      <div 
                        key={line.id} 
                        className={cn(
                          "text-[11px] p-2 rounded-lg",
                          line.speaker === 'agent' ? 'bg-primary/10 ml-3' : 'bg-muted mr-3'
                        )}
                      >
                        <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                          <Clock className="h-2 w-2" />
                          <span className="font-mono text-[9px]">{line.timestamp}</span>
                          <span className="font-semibold text-[9px]">
                            {line.speaker === 'agent' ? 'You' : 'Customer'}
                          </span>
                        </div>
                        <p className="text-foreground">{line.text}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Summary Section */}
          <Collapsible open={showSummary} onOpenChange={setShowSummary}>
            <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground w-full">
              <FileText className="h-3.5 w-3.5" />
              <span>Call Summary</span>
              <ChevronDown className="h-3 w-3 ml-auto" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="border border-border/50 shadow-none mt-2">
                <CardContent className="p-3 space-y-2">
                  <p className="text-[11px] text-muted-foreground leading-relaxed bg-muted/30 rounded p-2">
                    {displaySummary}
                  </p>
                  <div className="flex gap-2">
                    {useAI && (
                      <Button variant="outline" size="sm" className="flex-1 text-[10px] h-7" onClick={handleAnalyzeCall} disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                        Analyze
                      </Button>
                    )}
                    <Button size="sm" className="flex-1 text-[10px] h-7" onClick={onSaveToCRM}>
                      <Save className="h-3 w-3 mr-1" />
                      Save to CRM
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );
};

export default LiveAssistantPanel;
