import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, ChevronRight, Activity, ListChecks, Headphones, Users, BarChart3, Target, Globe, Landmark, BookOpen, Calculator, Brain, Workflow, FileSearch, Building2, Sparkles, MessageSquare, Bot, Link } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useSandboxCardSettings } from '@/hooks/useSandboxCardSettings';

const Legacy = () => {
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
        <h1 className="text-2xl font-bold">Sandbox</h1>
        <p className="text-muted-foreground">Access sandbox views and tools</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Customer Card */}
        {isCardVisible('customer') && (
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 bg-gradient-to-br from-card to-card/50"
            onClick={() => navigate('/customer')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <span>Customer</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Customer management and insights
              </p>
            </CardContent>
          </Card>
        )}

        {/* Agent Card */}
        {isCardVisible('agent') && (
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 bg-gradient-to-br from-card to-card/50"
            onClick={() => navigate('/agent')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <span>Agent</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Agent tools and management
              </p>
            </CardContent>
          </Card>
        )}

        {/* Company Card */}
        {isCardVisible('company') && (
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 bg-gradient-to-br from-card to-card/50"
            onClick={() => navigate('/company-and-team')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <span>Company</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Company management
              </p>
            </CardContent>
          </Card>
        )}

        {/* Team Card */}
        {isCardVisible('team') && (
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 bg-gradient-to-br from-card to-card/50"
            onClick={() => navigate('/team-page')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <span>Team</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Team management and collaboration
              </p>
            </CardContent>
          </Card>
        )}

        {/* Accounting Card */}
        {isCardVisible('accounting') && (
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 bg-gradient-to-br from-card to-card/50"
            onClick={() => navigate('/accounting')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calculator className="h-5 w-5 text-primary" />
                  </div>
                  <span>Accounting</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Accounting and financial management
              </p>
            </CardContent>
          </Card>
        )}

        {/* Third Party Card */}
        {isCardVisible('fintech') && (
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 bg-gradient-to-br from-card to-card/50"
            onClick={() => navigate('/third-party')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Link className="h-5 w-5 text-primary" />
                  </div>
                  <span>Fintech</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Fintech integrations and services
              </p>
            </CardContent>
          </Card>
        )}

        {/* Sales Card */}
        {isCardVisible('sales') && (
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 bg-gradient-to-br from-card to-card/50"
            onClick={() => navigate('/sales')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <span>Referrals & Leads & Sales & Support</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Referrals, leads, sales and support management
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Legacy;
