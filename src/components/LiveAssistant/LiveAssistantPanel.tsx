import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  MessageSquare, 
  Lightbulb, 
  HelpCircle, 
  AlertTriangle, 
  FileText,
  Save,
  Clock,
  Loader2,
  Sparkles,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSalesAssistant } from '@/hooks/useSalesAssistant';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SecureAuthContext';

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
  "Do you have any questions about the required documents?",
  "Should I explain our service fees?"
];

const mockAlerts = [
  { id: '1', type: 'objection', label: 'Pricing Objection', color: 'bg-amber-500/20 text-amber-700 border-amber-500/30' },
  { id: '2', type: 'compliance', label: 'ID Verification Pending', color: 'bg-blue-500/20 text-blue-700 border-blue-500/30' },
  { id: '3', type: 'alert', label: 'Compliance Alert', color: 'bg-red-500/20 text-red-700 border-red-500/30' },
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
  
  const {
    isLoading,
    suggestions,
    getSuggestions,
    handleObjection,
    getPricing,
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
      fullWidth ? "w-full" : "w-[350px] flex-shrink-0 border-l border-border"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border bg-primary/5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Live Call Assistant
          </h2>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/playbook-editor')}
              title="Configure Playbooks"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-muted-foreground">
            {useAI ? 'AI-powered support' : 'Demo mode'}
          </p>
          <div className="flex items-center gap-2">
            <Label htmlFor="ai-mode" className="text-xs text-muted-foreground">
              {useAI ? <Sparkles className="h-3 w-3 text-primary" /> : 'Mock'}
            </Label>
            <Switch
              id="ai-mode"
              checked={useAI}
              onCheckedChange={setUseAI}
              className="scale-75"
            />
            <Label htmlFor="ai-mode" className="text-xs text-muted-foreground">AI</Label>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className={cn(
          "p-4",
          fullWidth ? "grid grid-cols-2 gap-4" : "space-y-4"
        )}>
          {/* Live Transcript Section */}
          <Card className={cn(
            "border-0 shadow-sm bg-muted/30",
            fullWidth && "col-span-1 row-span-2"
          )}>
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Live Transcript
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div 
                ref={scrollRef}
                className={cn(
                  "overflow-y-auto space-y-2 pr-2",
                  fullWidth ? "h-[450px]" : "h-[150px]"
                )}
              >
                {transcript.map((line) => (
                  <div 
                    key={line.id} 
                    className={cn(
                      "text-sm p-3 rounded-lg",
                      line.speaker === 'agent' 
                        ? 'bg-primary/10 ml-2' 
                        : 'bg-secondary/50 mr-2'
                    )}
                  >
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock className="h-3 w-3" />
                      <span className="font-mono text-xs">{line.timestamp}</span>
                      <span className="capitalize font-semibold text-xs">
                        {line.speaker === 'agent' ? 'You' : 'Customer'}
                      </span>
                    </div>
                    <p className="text-foreground">{line.text}</p>
                  </div>
                ))}
                {/* Live indicator */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Listening...
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column Container for full width */}
          <div className={cn(fullWidth ? "space-y-4" : "contents")}>
            {/* Suggested Replies Section */}
            <Card className="border-0 shadow-sm bg-muted/30">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Suggested Replies
                  {isLoading && useAI && <Loader2 className="h-3 w-3 animate-spin" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-2">
                {displaySuggestions.map((reply: string, index: number) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-full h-auto py-2 px-3 text-left justify-start whitespace-normal hover:bg-primary/10 hover:border-primary/50 transition-all",
                      fullWidth ? "text-sm" : "text-xs"
                    )}
                    onClick={() => handleReplyClick(reply)}
                  >
                    {reply}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Next Suggested Questions Section */}
            <Card className="border-0 shadow-sm bg-muted/30">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-blue-500" />
                  Next Suggested Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <ul className="space-y-2">
                  {displayQuestions.map((question: string, index: number) => (
                    <li 
                      key={index}
                      className={cn(
                        "p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-foreground cursor-pointer hover:bg-blue-500/20 transition-colors",
                        fullWidth ? "text-sm" : "text-xs"
                      )}
                      onClick={() => handleReplyClick(question)}
                    >
                      {question}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Objections & Compliance Alerts Section */}
            <Card className="border-0 shadow-sm bg-muted/30">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Objections & Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="flex flex-wrap gap-2">
                  {displayAlerts.map((alert) => (
                    <Badge 
                      key={alert.id}
                      variant="outline"
                      className={cn("border", alert.color, fullWidth ? "text-sm py-1 px-3" : "text-xs")}
                    >
                      {alert.label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Call Summary Section */}
            <Card className="border-0 shadow-sm bg-muted/30">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-500" />
                  Call Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-3">
                <p className={cn(
                  "text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-3",
                  fullWidth ? "text-sm" : "text-xs"
                )}>
                  {displaySummary}
                </p>
                <div className="flex gap-2">
                  {useAI && (
                    <Button 
                      variant="outline"
                      size={fullWidth ? "default" : "sm"}
                      className="flex-1"
                      onClick={handleAnalyzeCall}
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                      Analyze
                    </Button>
                  )}
                  <Button 
                    size={fullWidth ? "default" : "sm"}
                    className="flex-1"
                    onClick={onSaveToCRM}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save to CRM
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default LiveAssistantPanel;
