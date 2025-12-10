import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSalesAssistant } from '@/hooks/useSalesAssistant';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SecureAuthContext';
import PlaybookStageSelector from './PlaybookStageSelector';

interface TranscriptLine {
  id: string;
  timestamp: string;
  speaker: 'agent' | 'customer';
  text: string;
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
  { id: '2', type: 'compliance', label: 'ID Verification Pending', color: 'bg-blue-500/20 text-blue-700 border-blue-500/30' },
];

const mockCallSummary = "Customer inquired about their bank account application (CUST-2025-00145). Discussed required documents including Emirates ID and proof of address. Customer expressed concern about processing time. Recommended expedited processing option.";

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
  const [activePlaybookId, setActivePlaybookId] = useState<string | undefined>(playbookId);
  const [activeStageId, setActiveStageId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('call');
  
  const {
    isLoading,
    suggestions,
    getSuggestions,
    analyzeCall
  } = useSalesAssistant({ customerId });

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
          <ScrollArea className="h-full">
            <div className="p-3 space-y-3">
              {/* Transcript */}
              <Card className="border border-border/50 shadow-none">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium">Transcript</span>
                  </div>
                  <div 
                    ref={scrollRef}
                    className="h-[180px] overflow-y-auto space-y-2 pr-1"
                  >
                    {transcript.map((line) => (
                      <div 
                        key={line.id} 
                        className={cn(
                          "text-xs p-2 rounded-lg",
                          line.speaker === 'agent' 
                            ? 'bg-primary/10 ml-4' 
                            : 'bg-muted mr-4'
                        )}
                      >
                        <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          <span className="font-mono text-[10px]">{line.timestamp}</span>
                          <span className="font-semibold text-[10px]">
                            {line.speaker === 'agent' ? 'You' : 'Customer'}
                          </span>
                        </div>
                        <p className="text-foreground leading-relaxed">{line.text}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Alerts (if any) */}
              {displayAlerts.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
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

              {/* Suggestions */}
              <Card className="border border-border/50 shadow-none">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-medium">Suggested Responses</span>
                    {isLoading && useAI && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
                  </div>
                  <div className="space-y-1.5">
                    {displaySuggestions.slice(0, 3).map((reply: string, index: number) => (
                      <button
                        key={index}
                        className="w-full text-left text-xs p-2 rounded-lg border border-border/50 hover:bg-primary/5 hover:border-primary/30 transition-all"
                        onClick={() => handleReplyClick(reply)}
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                  
                  {/* Quick Questions */}
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Ask Next</span>
                    <div className="mt-1.5 space-y-1">
                      {displayQuestions.slice(0, 2).map((q: string, i: number) => (
                        <button
                          key={i}
                          className="w-full text-left text-[11px] p-1.5 rounded bg-blue-500/5 text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 transition-all"
                          onClick={() => handleReplyClick(q)}
                        >
                          → {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Playbook Tab */}
        <TabsContent value="playbook" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3">
              <PlaybookStageSelector
                selectedPlaybookId={activePlaybookId}
                onPlaybookChange={setActivePlaybookId}
                onStageChange={setActiveStageId}
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
