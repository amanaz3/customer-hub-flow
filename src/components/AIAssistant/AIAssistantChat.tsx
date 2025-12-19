import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useAuth } from "@/contexts/SecureAuthContext";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SuggestedAction {
  intent: string;
  parameters: Record<string, string | null>;
  suggested_api_call: string;
  ready_to_execute: boolean;
}

const CHAT_URL = `https://gddibkhyhcnejxthsyzu.supabase.co/functions/v1/ai-assistant`;

export function AIAssistantChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Send initial greeting on mount
  useEffect(() => {
    if (messages.length === 0) {
      sendInitialGreeting();
    }
  }, []);

  const sendInitialGreeting = async () => {
    setIsLoading(true);
    let assistantContent = "";

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZGlia2h5aGNuZWp4dGhzeXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3ODgyMDksImV4cCI6MjA2NDM2NDIwOX0.KTJmWfvaeEjg6cI0v9ettbQjg_jDDi323uVNHtI_A-s`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Hello, I just opened the assistant." }],
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get greeting");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages([{ role: "assistant", content: assistantContent }]);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Greeting error:", error);
      setMessages([{
        role: "assistant",
        content: "Hello! I'm your UAE business assistant. I can help you with company formation, bank account setup, and bookkeeping services. How can I assist you today?"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZGlia2h5aGNuZWp4dGhzeXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3ODgyMDksImV4cCI6MjA2NDM2NDIwOX0.KTJmWfvaeEjg6cI0v9ettbQjg_jDDi323uVNHtI_A-s`,
        },
        body: JSON.stringify({
          messages: updatedMessages,
          userId: user?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send message");
      // Remove the failed assistant message if any
      setMessages(prev => prev.filter(m => m.content !== ""));
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  }, [input, messages, isLoading, user?.id]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const extractSuggestedAction = (content: string): SuggestedAction | null => {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        return null;
      }
    }
    return null;
  };

  const renderMessage = (message: Message, index: number) => {
    const suggestedAction = message.role === "assistant" ? extractSuggestedAction(message.content) : null;
    const cleanContent = message.content.replace(/```json\n?[\s\S]*?\n?```/g, "").trim();

    return (
      <div
        key={index}
        className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
      >
        {message.role === "assistant" && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
        )}
        <div className={`flex flex-col gap-2 max-w-[80%]`}>
          <Card
            className={`p-3 ${
              message.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{cleanContent}</ReactMarkdown>
            </div>
          </Card>
          
          {suggestedAction && (
            <Card className="p-3 border-dashed border-2 border-primary/30 bg-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Suggested Action</span>
                {suggestedAction.ready_to_execute && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Ready
                  </span>
                )}
              </div>
              <div className="text-xs space-y-1 text-muted-foreground">
                <p><strong>Intent:</strong> {suggestedAction.intent}</p>
                <p><strong>API:</strong> {suggestedAction.suggested_api_call}</p>
                {Object.entries(suggestedAction.parameters).filter(([_, v]) => v).length > 0 && (
                  <div>
                    <strong>Parameters:</strong>
                    <ul className="ml-4 mt-1">
                      {Object.entries(suggestedAction.parameters)
                        .filter(([_, v]) => v)
                        .map(([k, v]) => (
                          <li key={k}>{k}: {v}</li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
        {message.role === "user" && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-semibold">Business Assistant</h2>
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">AI Powered</span>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message, index) => renderMessage(message, index))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <Card className="p-3 bg-muted">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about company formation, bank accounts, or bookkeeping..."
              className="min-h-[60px] max-h-[120px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="self-end"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </Card>
    </div>
  );
}
