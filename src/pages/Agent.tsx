import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Landmark, FileSearch, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

const Agent = () => {
  const navigate = useNavigate();

  return (
    <div className={cn(
      "space-y-4 xs:space-y-5 sm:space-y-6 lg:space-y-8",
      "pb-4 xs:pb-6 sm:pb-8",
      "max-w-full overflow-hidden"
    )}>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Agent</h1>
        <p className="text-muted-foreground">Agent tools and management</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Bank Readiness Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 bg-gradient-to-br from-card to-card/50"
          onClick={() => navigate('/bank-readiness')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Landmark className="h-5 w-5 text-primary" />
                </div>
                <span>Bank Readiness</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              UAE bank routing assistant with risk assessment and recommendations
            </p>
          </CardContent>
        </Card>

        {/* Doc Search & Q/A Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 bg-gradient-to-br from-card to-card/50"
          onClick={() => navigate('/doc-search')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileSearch className="h-5 w-5 text-primary" />
                </div>
                <span>Doc Search & Q/A</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              AI-powered document search with hybrid RAG and compliance Q&A
            </p>
          </CardContent>
        </Card>

        {/* Dashboard Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 bg-gradient-to-br from-card to-card/50"
          onClick={() => navigate('/legacy/dashboard')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                </div>
                <span>Dashboard</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Customer-based view of applications, statistics, and data
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Agent;
