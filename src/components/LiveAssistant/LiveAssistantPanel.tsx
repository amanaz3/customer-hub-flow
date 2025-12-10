import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Lightbulb, 
  HelpCircle, 
  AlertTriangle, 
  FileText,
  Save,
  Clock
} from 'lucide-react';

interface TranscriptLine {
  id: string;
  timestamp: string;
  speaker: 'agent' | 'customer';
  text: string;
}

interface LiveAssistantPanelProps {
  onReplySelected?: (text: string) => void;
  onSaveToCRM?: () => void;
}

const LiveAssistantPanel: React.FC<LiveAssistantPanelProps> = ({ 
  onReplySelected,
  onSaveToCRM 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Placeholder data - will be replaced with real data
  const [transcript, setTranscript] = useState<TranscriptLine[]>([
    { id: '1', timestamp: '10:32:15', speaker: 'customer', text: 'Hi, I need help with my account application.' },
    { id: '2', timestamp: '10:32:22', speaker: 'agent', text: 'Of course! I\'d be happy to help. Could you provide your reference number?' },
    { id: '3', timestamp: '10:32:35', speaker: 'customer', text: 'Yes, it\'s CUST-2025-00145.' },
    { id: '4', timestamp: '10:32:42', speaker: 'agent', text: 'Thank you. I can see your application. What would you like to know?' },
    { id: '5', timestamp: '10:32:58', speaker: 'customer', text: 'What documents do I still need to submit?' },
  ]);

  const suggestedReplies = [
    "I can see you need to submit your Emirates ID and proof of address.",
    "Let me check the status of your application for you.",
    "Would you like me to explain the next steps in the process?"
  ];

  const suggestedQuestions = [
    "Would you like to know the estimated completion time?",
    "Do you have any questions about the required documents?",
    "Should I explain our service fees?"
  ];

  const alerts = [
    { id: '1', type: 'objection', label: 'Pricing Objection', color: 'bg-amber-500/20 text-amber-700 border-amber-500/30' },
    { id: '2', type: 'compliance', label: 'ID Verification Pending', color: 'bg-blue-500/20 text-blue-700 border-blue-500/30' },
    { id: '3', type: 'alert', label: 'Compliance Alert', color: 'bg-red-500/20 text-red-700 border-red-500/30' },
  ];

  const callSummary = "Customer inquired about their bank account application (CUST-2025-00145). Discussed required documents including Emirates ID and proof of address. Customer expressed concern about processing time. Recommended expedited processing option.";

  // Auto-scroll to bottom when new transcript lines arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  const handleReplyClick = (text: string) => {
    onReplySelected?.(text);
  };

  return (
    <div className="w-[350px] flex-shrink-0 bg-card border-l border-border flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Live Assistant
        </h2>
        <p className="text-xs text-muted-foreground mt-1">AI-powered call support</p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Live Transcript Section */}
          <Card className="border-0 shadow-sm bg-muted/30">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Live Transcript
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div 
                ref={scrollRef}
                className="h-[150px] overflow-y-auto space-y-2 pr-2"
              >
                {transcript.map((line) => (
                  <div 
                    key={line.id} 
                    className={`text-xs p-2 rounded-lg ${
                      line.speaker === 'agent' 
                        ? 'bg-primary/10 ml-2' 
                        : 'bg-secondary/50 mr-2'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      <Clock className="h-3 w-3" />
                      <span className="font-mono">{line.timestamp}</span>
                      <span className="capitalize font-medium">
                        {line.speaker === 'agent' ? 'You' : 'Customer'}
                      </span>
                    </div>
                    <p className="text-foreground">{line.text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Suggested Replies Section */}
          <Card className="border-0 shadow-sm bg-muted/30">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Suggested Replies
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 space-y-2">
              {suggestedReplies.map((reply, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full h-auto py-2 px-3 text-left justify-start text-xs whitespace-normal hover:bg-primary/10 hover:border-primary/50 transition-all"
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
                {suggestedQuestions.map((question, index) => (
                  <li 
                    key={index}
                    className="text-xs p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-foreground cursor-pointer hover:bg-blue-500/20 transition-colors"
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
                {alerts.map((alert) => (
                  <Badge 
                    key={alert.id}
                    variant="outline"
                    className={`text-xs ${alert.color}`}
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
              <p className="text-xs text-muted-foreground leading-relaxed">
                {callSummary}
              </p>
              <Button 
                size="sm" 
                className="w-full"
                onClick={onSaveToCRM}
              >
                <Save className="h-4 w-4 mr-2" />
                Save to CRM
              </Button>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};

export default LiveAssistantPanel;
