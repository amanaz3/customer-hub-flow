import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ChevronRight } from 'lucide-react';

const AIWorkflows = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-violet-600" />
            <h1 className="text-2xl font-bold">AI Workflows</h1>
            <Badge variant="outline" className="bg-violet-500/10 text-violet-600 border-violet-500/20">
              Sandbox
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Create and manage AI-powered automation workflows
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* AI Books Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 bg-gradient-to-br from-violet-500/10 to-purple-500/10"
          onClick={() => navigate('/ai-bookkeeper')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/20">
                  <Sparkles className="h-5 w-5 text-violet-600" />
                </div>
                <span>AI Books</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Intelligent bookkeeping automation with AI-powered categorization and reconciliation
            </p>
          </CardContent>
        </Card>

        {/* Tax Filing AI Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 bg-gradient-to-br from-violet-500/10 to-purple-500/10"
          onClick={() => navigate('/tax-filing')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/20">
                  <Sparkles className="h-5 w-5 text-violet-600" />
                </div>
                <span>Tax Filing AI</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              UAE Corporate Tax filing with AI assistant and FTA compliance
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIWorkflows;
