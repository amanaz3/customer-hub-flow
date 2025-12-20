import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Bot, User, Lightbulb, TrendingUp, Shield, FileText } from 'lucide-react';

const AIAdvisory = () => {
  const advisoryTopics = [
    {
      id: '1',
      title: 'Business Strategy',
      description: 'Get AI-powered insights on business growth and market positioning',
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
    },
    {
      id: '2',
      title: 'Risk Assessment',
      description: 'Analyze potential risks and get mitigation recommendations',
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-500/10',
    },
    {
      id: '3',
      title: 'Compliance Guidance',
      description: 'Navigate regulatory requirements with AI assistance',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
    },
    {
      id: '4',
      title: 'Financial Planning',
      description: 'AI-driven financial analysis and forecasting',
      icon: Lightbulb,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-amber-600" />
            <h1 className="text-2xl font-bold">AI Advisory</h1>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
              Sandbox
            </Badge>
          </div>
          <p className="text-muted-foreground">
            AI-powered advisory and consulting assistance for your business
          </p>
        </div>
      </div>

      {/* Advisory Topics */}
      <div className="grid gap-4 md:grid-cols-2">
        {advisoryTopics.map((topic) => (
          <Card key={topic.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${topic.bgColor}`}>
                  <topic.icon className={`h-6 w-6 ${topic.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{topic.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{topic.description}</p>
                  <Button variant="outline" size="sm" className="mt-3">
                    Start Consultation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chat Interface Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-amber-600" />
            Advisory Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Sample messages */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-amber-500/10">
                <Bot className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1 bg-muted/50 rounded-lg p-3">
                <p className="text-sm">
                  Hello! I'm your AI Advisory assistant. How can I help you with your business today?
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 justify-end">
              <div className="flex-1 bg-primary/10 rounded-lg p-3 max-w-[80%]">
                <p className="text-sm">
                  I need advice on expanding my business to new markets.
                </p>
              </div>
              <div className="p-2 rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-amber-500/10">
                <Bot className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1 bg-muted/50 rounded-lg p-3">
                <p className="text-sm">
                  Great question! Market expansion requires careful planning. Let me help you analyze key factors:
                  market size, competition, regulatory requirements, and resource allocation. Would you like to start with a specific market or get a general framework?
                </p>
              </div>
            </div>

            {/* Input area */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <input
                type="text"
                placeholder="Ask your advisory question..."
                className="flex-1 px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <Button className="gap-2">
                <Send className="h-4 w-4" />
                Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAdvisory;