import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Target, Users, BarChart3, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSandboxCardSettings } from '@/hooks/useSandboxCardSettings';

const Sales = () => {
  const navigate = useNavigate();
  const { data: cardSettings } = useSandboxCardSettings();

  const isCardVisible = (cardKey: string) => {
    if (!cardSettings) return true;
    const setting = cardSettings.find(s => s.card_key === cardKey);
    return setting?.is_visible ?? true;
  };

  return (
    <div className={cn(
      "space-y-4 xs:space-y-5 sm:space-y-6 lg:space-y-8",
      "pb-4 xs:pb-6 sm:pb-8",
      "max-w-full overflow-hidden"
    )}>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Sales</h1>
        <p className="text-muted-foreground">Sales management and tracking tools</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Lead Workflow Card */}
        {isCardVisible('sales_lead_workflow') && (
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 bg-gradient-to-br from-card to-card/50"
            onClick={() => navigate('/lead-workflow')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <span>Lead Workflow</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Stepper workflow from import to customer conversion
              </p>
            </CardContent>
          </Card>
        )}

        {/* Leads Card */}
        {isCardVisible('sales_leads') && (
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 bg-gradient-to-br from-card to-card/50"
            onClick={() => navigate('/lead-workflow')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <span>Leads</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage leads, track follow-ups, and convert to customers
              </p>
            </CardContent>
          </Card>
        )}

        {/* Data Analysis Card */}
        {isCardVisible('sales_data_analysis') && (
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 bg-gradient-to-br from-card to-card/50"
            onClick={() => navigate('/analysis')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <span>Data Analysis</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Analyze data, generate insights, and track performance metrics
              </p>
            </CardContent>
          </Card>
        )}

        {/* Live Assistant Card */}
        {isCardVisible('sales_live_assistant') && (
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 bg-gradient-to-br from-card to-card/50"
            onClick={() => navigate('/live-assistant')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Headphones className="h-5 w-5 text-primary" />
                  </div>
                  <span>Live Assistant</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                AI-powered live voice assistant for real-time support
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Sales;
