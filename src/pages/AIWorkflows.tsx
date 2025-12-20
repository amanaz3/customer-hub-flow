import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

const AIWorkflows = () => {
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
    </div>
  );
};

export default AIWorkflows;
