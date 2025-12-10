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
import { cn } from '@/lib/utils';

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
}

const LiveAssistantPanel: React.FC<LiveAssistantPanelProps> = ({ 
  onReplySelected,
  onSaveToCRM,
  fullWidth = false
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Placeholder data - will be replaced with real data
  const [transcript] = useState<TranscriptLine[]>([
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
    <div className={cn(
      "bg-card flex flex-col h-full overflow-hidden",
      fullWidth ? "w-full" : "w-[350px] flex-shrink-0 border-l border-border"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border bg-primary/5">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Live Call Assistant
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Real-time AI-powered support</p>
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
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3 space-y-2">
                {suggestedReplies.map((reply, index) => (
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
                  {suggestedQuestions.map((question, index) => (
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
                  {alerts.map((alert) => (
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
                  {callSummary}
                </p>
                <Button 
                  size={fullWidth ? "default" : "sm"}
                  className="w-full"
                  onClick={onSaveToCRM}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save to CRM
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default LiveAssistantPanel;
