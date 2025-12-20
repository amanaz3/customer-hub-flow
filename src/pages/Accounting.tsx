import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Sparkles, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const Accounting = () => {
  const navigate = useNavigate();

  return (
    <div className={cn(
      "space-y-4 xs:space-y-5 sm:space-y-6 lg:space-y-8",
      "pb-4 xs:pb-6 sm:pb-8",
      "max-w-full overflow-hidden"
    )}>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Accounting</h1>
        <p className="text-muted-foreground">Accounting and financial management</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* AI Workflows Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 bg-gradient-to-br from-violet-500/10 to-purple-500/10"
          onClick={() => navigate('/ai-workflows')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/20">
                  <Sparkles className="h-5 w-5 text-violet-600" />
                </div>
                <span>AI Workflows</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              AI-powered automation workflows for business processes
            </p>
          </CardContent>
        </Card>

        {/* AI Advisory Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10"
          onClick={() => navigate('/ai-advisory')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <MessageSquare className="h-5 w-5 text-amber-600" />
                </div>
                <span>AI Advisory</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              AI-powered advisory and consulting assistance
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Accounting;
