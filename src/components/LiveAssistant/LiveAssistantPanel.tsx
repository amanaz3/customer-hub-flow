import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  BookOpen,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Headphones,
  UserCheck,
  ChevronRight,
  Check,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSalesAssistant } from '@/hooks/useSalesAssistant';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SecureAuthContext';
import { supabase } from '@/integrations/supabase/client';
import PlaybookStageSelector from './PlaybookStageSelector';

interface TranscriptLine {
  id: string;
  timestamp: string;
  speaker: 'agent' | 'customer';
  text: string;
}

interface CustomerContext {
  isNewLead?: boolean;
  hasActiveApplications?: boolean;
  hasPreviousCalls?: boolean;
  productId?: string;
}

interface LiveAssistantPanelProps {
  onReplySelected?: (text: string) => void;
  onSaveToCRM?: () => void;
  fullWidth?: boolean;
  customerId?: string;
  playbookId?: string;
  customerContext?: CustomerContext;
}

// Call type definitions
type CallTypeKey = 'inbound_sales' | 'outbound_sales' | 'inbound_support' | 'outbound_followup';

const CALL_TYPES: { key: CallTypeKey; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'inbound_sales', label: 'Inbound Sales', icon: PhoneIncoming, color: 'text-green-600 bg-green-500/10 border-green-500/30' },
  { key: 'outbound_sales', label: 'Outbound Sales', icon: PhoneOutgoing, color: 'text-blue-600 bg-blue-500/10 border-blue-500/30' },
  { key: 'inbound_support', label: 'Customer Support', icon: Headphones, color: 'text-purple-600 bg-purple-500/10 border-purple-500/30' },
  { key: 'outbound_followup', label: 'Follow-up', icon: UserCheck, color: 'text-amber-600 bg-amber-500/10 border-amber-500/30' },
];

// Stage definitions per call type
const CALL_STAGES: Record<CallTypeKey, string[]> = {
  inbound_sales: ['Greeting', 'Discovery', 'Qualification', 'Proposal', 'Closing'],
  outbound_sales: ['Intro', 'Discovery', 'Demo', 'Negotiation', 'Closing'],
  inbound_support: ['Greeting', 'Issue ID', 'Resolution', 'Confirm', 'Follow-up'],
  outbound_followup: ['Reconnect', 'Status Check', 'Address Concerns', 'Next Steps', 'Close'],
};

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
  { id: '2', type: 'compliance', label: 'ID Verification Pending', color: 'bg-blue-500/20 text-blue-700 border-blue-500/30' },
];

const mockCallSummary = "Customer inquired about their bank account application (CUST-2025-00145). Discussed required documents including Emirates ID and proof of address. Customer expressed concern about processing time. Recommended expedited processing option.";

const LiveAssistantPanel: React.FC<LiveAssistantPanelProps> = ({ 
  onReplySelected,
  onSaveToCRM,
  fullWidth = false,
  customerId,
  playbookId,
  customerContext
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [useAI, setUseAI] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptLine[]>(mockTranscript);
  const [callSummary, setCallSummary] = useState<string | null>(null);
  const [activePlaybookId, setActivePlaybookId] = useState<string | undefined>(playbookId);
  const [activePlaybookName, setActivePlaybookName] = useState<string | null>(null);
  const [playbookStages, setPlaybookStages] = useState<{ id: string; name: string; order: number }[]>([]);
  const [activeStageId, setActiveStageId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('call');
  const [selectedCallType, setSelectedCallType] = useState<CallTypeKey>('outbound_sales');
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [stageJumpAlert, setStageJumpAlert] = useState<{ skipped: string[]; direction: 'forward' | 'backward' } | null>(null);
  
  // Map to legacy call type for useSalesAssistant
  const callType = selectedCallType.includes('outbound') 
    ? (selectedCallType === 'outbound_followup' ? 'follow_up' : 'outbound') 
    : 'inbound';
  
  const {
    isLoading,
    suggestions,
    getSuggestions,
    analyzeCall
  } = useSalesAssistant({ 
    customerId, 
    productId: customerContext?.productId,
    callType 
  });

  // Use playbook stages if available, otherwise fall back to default stages
  const hasPlaybookStages = playbookStages.length > 0;
  const currentStages = hasPlaybookStages 
    ? playbookStages.map(s => s.name)
    : CALL_STAGES[selectedCallType];
  const progressPercent = currentStages.length > 0 
    ? ((currentStageIndex + 1) / currentStages.length) * 100 
    : 0;

  // Fetch playbook name and stages when activePlaybookId changes
  useEffect(() => {
    const fetchPlaybookData = async () => {
      if (!activePlaybookId) {
        setActivePlaybookName(null);
        setPlaybookStages([]);
        return;
      }
      
      // Fetch playbook name
      const { data: playbook } = await supabase
        .from('sales_playbooks')
        .select('name')
        .eq('id', activePlaybookId)
        .single();
      
      if (playbook) {
        setActivePlaybookName(playbook.name);
      }
      
      // Fetch playbook stages
      const { data: stages } = await supabase
        .from('playbook_stages')
        .select('id, stage_name, stage_order')
        .eq('playbook_id', activePlaybookId)
        .order('stage_order', { ascending: true });
      
      if (stages && stages.length > 0) {
        setPlaybookStages(stages.map(s => ({ 
          id: s.id, 
          name: s.stage_name, 
          order: s.stage_order 
        })));
        setCurrentStageIndex(0);
      } else {
        setPlaybookStages([]);
      }
    };
    
    fetchPlaybookData();
  }, [activePlaybookId]);

  // Update stage index when activeStageId changes
  useEffect(() => {
    if (activeStageId && playbookStages.length > 0) {
      const idx = playbookStages.findIndex(s => s.id === activeStageId);
      if (idx !== -1) {
        setCurrentStageIndex(idx);
      }
    }
  }, [activeStageId, playbookStages]);

  // Auto-scroll to bottom when new transcript lines arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  // Fetch AI suggestions when AI mode is enabled
  useEffect(() => {
    if (useAI && transcript.length > 0) {
      const transcriptTexts = transcript.map(t => `${t.speaker}: ${t.text}`);
      getSuggestions(transcriptTexts, 'discovery');
    }
  }, [useAI, transcript.length]);

  const handleReplyClick = (text: string) => {
    onReplySelected?.(text);
  };

  const handleAnalyzeCall = async () => {
    const transcriptTexts = transcript.map(t => `${t.speaker}: ${t.text}`);
    const result = await analyzeCall(transcriptTexts);
    if (result?.summary) {
      setCallSummary(result.summary);
      setActiveTab('summary');
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500/20 text-red-700 border-red-500/30';
      case 'medium':
        return 'bg-amber-500/20 text-amber-700 border-amber-500/30';
      default:
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
    }
  };

  // Determine what to display based on mode
  const displaySuggestions = useAI && suggestions?.suggestedReplies 
    ? suggestions.suggestedReplies
    : mockSuggestedReplies;

  const displayQuestions = useAI && suggestions?.suggestedQuestions
    ? suggestions.suggestedQuestions
    : mockSuggestedQuestions;

  const displayAlerts = useAI && suggestions?.alerts
    ? suggestions.alerts.map((alert, idx) => ({
        id: String(idx),
        type: alert.type,
        label: alert.label,
        color: getAlertColor(alert.severity)
      }))
    : mockAlerts;

  const displaySummary = useAI && callSummary
    ? callSummary
    : mockCallSummary;

  const selectedCallTypeConfig = CALL_TYPES.find(t => t.key === selectedCallType)!;

  return (
    <div className={cn(
      "bg-card flex flex-col h-full overflow-hidden",
      fullWidth ? "w-full" : "w-[380px] flex-shrink-0 border-l border-border"
    )}>
      {/* Compact Header */}
      <div className="p-3 border-b border-border bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <h2 className="text-base font-semibold">Live Assistant</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-muted/50 rounded-full px-2 py-1">
              <span className="text-[10px] text-muted-foreground">
                {useAI ? 'AI' : 'Demo'}
              </span>
              <Switch
                id="ai-mode"
                checked={useAI}
                onCheckedChange={setUseAI}
                className="scale-[0.6]"
              />
            </div>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => navigate('/playbook-editor')}
                title="Configure Playbooks"
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Current Call Status - Agent Quick Reference */}
      <div className="px-3 py-2 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="grid grid-cols-3 gap-2 text-[10px]">
          {/* Playbook */}
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-2.5 w-2.5" />
              Playbook
            </span>
            <span className="font-semibold text-foreground truncate">
              {activePlaybookName || 'Not selected'}
            </span>
          </div>
          
          {/* Current Stage */}
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground flex items-center gap-1">
              <Target className="h-2.5 w-2.5" />
              Stage
            </span>
            <span className="font-semibold text-primary truncate">
              {currentStages[currentStageIndex] || 'N/A'}
            </span>
          </div>
          
          {/* Call Type */}
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground flex items-center gap-1">
              <Phone className="h-2.5 w-2.5" />
              Call Type
            </span>
            <span className="font-semibold text-foreground truncate">
              {CALL_TYPES.find(t => t.key === selectedCallType)?.label.split(' ')[0] || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Call Type & Stage Progress */}
      <div className="px-3 py-2 border-b border-border/50 bg-muted/20 space-y-2">
        
        {/* Call Type Selection */}
        <div className="flex gap-1">
          {CALL_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedCallType === type.key;
            return (
              <button
                key={type.key}
                onClick={() => {
                  setSelectedCallType(type.key);
                  setCurrentStageIndex(0);
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 py-1.5 px-1 rounded-md text-[10px] font-medium transition-all border",
                  isSelected 
                    ? type.color 
                    : "bg-background/50 text-muted-foreground border-transparent hover:bg-muted/50"
                )}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline truncate">{type.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Stage Workflow */}
        <div className="space-y-1.5">
          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            <Progress value={progressPercent} className="h-1.5 flex-1" />
            <span className="text-[10px] text-muted-foreground font-medium">
              {currentStageIndex + 1}/{currentStages.length}
            </span>
          </div>

          {/* Stage Steps */}
          <div className="flex items-center justify-between">
            {currentStages.map((stage, idx) => {
              const isCompleted = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              const isPending = idx > currentStageIndex;
              
              return (
                <React.Fragment key={`${stage}-${idx}`}>
                  <button
                    onClick={() => {
                      const diff = idx - currentStageIndex;
                      // Detect stage jumping (skipping stages)
                      if (Math.abs(diff) > 1) {
                        const skippedStages = diff > 0
                          ? currentStages.slice(currentStageIndex + 1, idx)
                          : currentStages.slice(idx + 1, currentStageIndex);
                        setStageJumpAlert({
                          skipped: skippedStages,
                          direction: diff > 0 ? 'forward' : 'backward'
                        });
                        // Auto-dismiss after 4 seconds
                        setTimeout(() => setStageJumpAlert(null), 4000);
                      } else {
                        setStageJumpAlert(null);
                      }
                      setCurrentStageIndex(idx);
                      // Update activeStageId if using playbook stages
                      if (hasPlaybookStages && playbookStages[idx]) {
                        setActiveStageId(playbookStages[idx].id);
                      }
                    }}
                    className={cn(
                      "flex flex-col items-center gap-0.5 group transition-all",
                      isCurrent && "scale-105"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all border",
                        isCompleted && "bg-green-500 text-white border-green-500",
                        isCurrent && "bg-primary text-primary-foreground border-primary ring-2 ring-primary/30",
                        isPending && "bg-muted text-muted-foreground border-border"
                      )}
                    >
                      {isCompleted ? <Check className="h-2.5 w-2.5" /> : idx + 1}
                    </div>
                    <span
                      className={cn(
                        "text-[8px] font-medium truncate max-w-[45px]",
                        isCurrent ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {stage}
                    </span>
                  </button>
                  {idx < currentStages.length - 1 && (
                    <ChevronRight 
                      className={cn(
                        "h-3 w-3 flex-shrink-0 -mx-0.5",
                        idx < currentStageIndex ? "text-green-500" : "text-muted-foreground/40"
                      )} 
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Stage Jump Alert */}
        {stageJumpAlert && (
          <div className="mt-2 p-2 rounded-md bg-amber-500/15 border border-amber-500/30 animate-pulse">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                Stage jumped! Skipped: {stageJumpAlert.skipped.join(' → ')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start h-10 bg-muted/30 border-b border-border rounded-none px-2 gap-1 shrink-0">
          <TabsTrigger 
            value="call" 
            className="text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Phone className="h-3.5 w-3.5" />
            Live Call
          </TabsTrigger>
          <TabsTrigger 
            value="playbook" 
            className="text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Playbook
          </TabsTrigger>
          <TabsTrigger 
            value="summary" 
            className="text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <FileText className="h-3.5 w-3.5" />
            Summary
          </TabsTrigger>
        </TabsList>

        {/* Live Call Tab */}
        <TabsContent value="call" className="flex-1 m-0 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Alerts (if any) */}
            {displayAlerts.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-3 pt-2 pb-1 border-b border-border/30">
                {displayAlerts.map((alert) => (
                  <Badge 
                    key={alert.id}
                    variant="outline"
                    className={cn("text-[10px] border", alert.color)}
                  >
                    <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                    {alert.label}
                  </Badge>
                ))}
              </div>
            )}

            {/* Side by Side Layout */}
            <div className="flex-1 flex gap-2 p-2 overflow-hidden">
              {/* Left: Transcript */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">Transcript</span>
                </div>
                <ScrollArea className="flex-1 border border-border/40 rounded-lg bg-muted/20">
                  <div 
                    ref={scrollRef}
                    className="p-2 space-y-1.5"
                  >
                    {transcript.map((line) => (
                      <div 
                        key={line.id} 
                        className={cn(
                          "text-[11px] p-1.5 rounded-md",
                          line.speaker === 'agent' 
                            ? 'bg-primary/10 ml-3' 
                            : 'bg-background mr-3 border border-border/30'
                        )}
                      >
                        <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                          <Clock className="h-2 w-2" />
                          <span className="font-mono text-[9px]">{line.timestamp}</span>
                          <span className="font-semibold text-[9px]">
                            {line.speaker === 'agent' ? 'You' : 'Customer'}
                          </span>
                        </div>
                        <p className="text-foreground leading-snug">{line.text}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Right: AI Suggestions */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">AI Suggestions</span>
                  {isLoading && useAI && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
                </div>
                <ScrollArea className="flex-1 border border-border/40 rounded-lg bg-muted/20">
                  <div className="p-2 space-y-2">
                    {/* Suggested Responses */}
                    <div className="space-y-1">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wide px-1">Responses</span>
                      {displaySuggestions.slice(0, 3).map((reply: string, index: number) => (
                        <button
                          key={index}
                          className="w-full text-left text-[11px] p-1.5 rounded-md border border-border/40 bg-background hover:bg-primary/5 hover:border-primary/30 transition-all"
                          onClick={() => handleReplyClick(reply)}
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                    
                    {/* Quick Questions */}
                    <div className="pt-2 border-t border-border/30 space-y-1">
                      <span className="text-[9px] text-muted-foreground uppercase tracking-wide px-1">Ask Next</span>
                      {displayQuestions.slice(0, 2).map((q: string, i: number) => (
                        <button
                          key={i}
                          className="w-full text-left text-[10px] p-1.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/15 transition-all"
                          onClick={() => handleReplyClick(q)}
                        >
                          → {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Playbook Tab */}
        <TabsContent value="playbook" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3">
              <PlaybookStageSelector
                selectedPlaybookId={activePlaybookId}
                onPlaybookChange={setActivePlaybookId}
                onStageChange={setActiveStageId}
                onCallTypeChange={(type) => {
                  // Map legacy call types to new call type keys
                  if (type === 'outbound') setSelectedCallType('outbound_sales');
                  else if (type === 'inbound') setSelectedCallType('inbound_sales');
                  else if (type === 'follow_up') setSelectedCallType('outbound_followup');
                }}
                customerContext={customerContext}
                compact={false}
              />
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-3">
              <Card className="border border-border/50 shadow-none">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-green-500" />
                    <span className="text-xs font-medium">Call Summary</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 rounded-lg p-3">
                    {displaySummary}
                  </p>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                {useAI && (
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={handleAnalyzeCall}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Analyze Call
                  </Button>
                )}
                <Button 
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={onSaveToCRM}
                >
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  Save to CRM
                </Button>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LiveAssistantPanel;
