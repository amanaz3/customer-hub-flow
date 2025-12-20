import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface TaxFilingAssistantProps {
  filingId?: string;
}

const quickPrompts = [
  "What is UAE Corporate Tax?",
  "Am I eligible for Small Business Relief?",
  "What expenses are deductible?",
  "How to calculate taxable income?",
];

export function TaxFilingAssistant({ filingId }: TaxFilingAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your UAE Corporate Tax Assistant. I can help you understand tax obligations, calculate liabilities, and prepare your filing. How can I assist you today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tax-filing-assistant`;
      
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          message: messageText,
          context: { filingId }
        }),
      });

      if (resp.status === 429) {
        toast({ title: "Rate limit exceeded", description: "Please try again later.", variant: "destructive" });
        setIsLoading(false);
        return;
      }
      
      if (resp.status === 402) {
        toast({ title: "Credits required", description: "Please add credits to continue.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      if (!resp.ok || !resp.body) {
        throw new Error("Failed to start stream");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";
      let streamDone = false;

      // Add initial empty assistant message
      const assistantId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => prev.map((m) =>
                m.id === assistantId ? { ...m, content: assistantContent } : m
              ));
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error: any) {
      console.error('Tax assistant error:', error);
      
      // Fallback response for demo
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getFallbackResponse(messageText),
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('corporate tax') || lowerQuery.includes('what is')) {
      return "UAE Corporate Tax is a federal tax imposed on business profits. Key points:\n\n• **Rate**: 9% on taxable income exceeding AED 375,000\n• **0% Rate**: On taxable income up to AED 375,000\n• **Effective Date**: Financial years starting on or after 1 June 2023\n• **Registration**: Mandatory for all taxable persons\n\nWould you like more details on any specific aspect?";
    }
    
    if (lowerQuery.includes('small business') || lowerQuery.includes('relief')) {
      return "**Small Business Relief** is available for:\n\n• Resident persons with revenue ≤ AED 3 million\n• Must elect for relief in tax return\n• Taxable income treated as zero\n• Cannot carry forward losses\n• Not available for Free Zone persons\n\nBased on your financials, I can help determine if you qualify. Shall I check?";
    }
    
    if (lowerQuery.includes('deductible') || lowerQuery.includes('expense')) {
      return "**Deductible Expenses** for UAE Corporate Tax:\n\n✅ **Fully Deductible**:\n• Business operating expenses\n• Employee salaries and benefits\n• Rent and utilities\n• Professional fees\n• Depreciation\n\n❌ **Non-Deductible**:\n• Entertainment expenses (50% only)\n• Fines and penalties\n• Dividends paid\n• Personal expenses\n\nNeed help categorizing your expenses?";
    }
    
    if (lowerQuery.includes('taxable income') || lowerQuery.includes('calculate')) {
      return "**Calculating Taxable Income**:\n\n```\nAccounting Profit/Loss\n+ Non-deductible expenses\n- Exempt income\n- Reliefs and deductions\n= Taxable Income\n```\n\nThen apply:\n• 0% on first AED 375,000\n• 9% on amount exceeding AED 375,000\n\nShall I walk through your specific calculation?";
    }
    
    return "I can help you with:\n\n• Understanding UAE Corporate Tax regulations\n• Calculating your tax liability\n• Identifying deductible expenses\n• Checking Small Business Relief eligibility\n• Preparing FTA-compliant documents\n\nWhat would you like to explore?";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="space-y-4 py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === 'user' && "flex-row-reverse"
              )}
            >
              <div className={cn(
                "p-2 rounded-full shrink-0",
                message.role === 'assistant' 
                  ? "bg-primary/10" 
                  : "bg-muted"
              )}>
                {message.role === 'assistant' ? (
                  <Bot className="h-4 w-4 text-primary" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>
              <div className={cn(
                "rounded-lg px-3 py-2 max-w-[85%]",
                message.role === 'assistant' 
                  ? "bg-muted" 
                  : "bg-primary text-primary-foreground"
              )}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-lg px-3 py-2 bg-muted">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Prompts */}
      {messages.length === 1 && (
        <div className="px-4 py-2 border-t">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Quick questions:
          </p>
          <div className="flex flex-wrap gap-1">
            {quickPrompts.map((prompt) => (
              <Badge
                key={prompt}
                variant="outline"
                className="cursor-pointer hover:bg-primary/10 text-xs"
                onClick={() => sendMessage(prompt)}
              >
                {prompt}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about UAE Corporate Tax..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            size="icon" 
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
