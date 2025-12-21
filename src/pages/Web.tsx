import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, ChevronRight, Layers, Bot, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useSandboxCardSettings } from '@/hooks/useSandboxCardSettings';

const Web = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { isCardVisible } = useSandboxCardSettings();

  return (
    <div className={cn(
      "space-y-4 xs:space-y-5 sm:space-y-6 lg:space-y-8",
      "pb-4 xs:pb-6 sm:pb-8",
      "max-w-full overflow-hidden"
    )}>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Web</h1>
        <p className="text-muted-foreground">Self-serve customer flows and web applications</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Webflow Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 bg-gradient-to-br from-card to-card/50"
          onClick={() => navigate('/webflow')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <span>Webflow</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Original multi-step company formation wizard
            </p>
          </CardContent>
        </Card>

        {/* Webflow Simple Card */}
        {isCardVisible('customer_web_webflow_simple') && (
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 bg-gradient-to-br from-card to-card/50"
            onClick={() => navigate('/webflow-simple')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <span>Webflow Simple</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Consumer-friendly step-by-step business setup flow
              </p>
            </CardContent>
          </Card>
        )}

        {/* AI Assistant Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 bg-gradient-to-br from-card to-card/50"
          onClick={() => navigate('/ai-assistant')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Bot className="h-5 w-5 text-green-500" />
                </div>
                <span>AI Assistant</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              AI-powered chatbot to guide customers through company formation
            </p>
          </CardContent>
        </Card>

        {/* AI Assistant Config Card - Admin Only */}
        {isAdmin && (
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 bg-gradient-to-br from-card to-card/50"
            onClick={() => navigate('/ai-assistant-config')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Settings2 className="h-5 w-5 text-orange-500" />
                  </div>
                  <span>AI Assistant Config</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure AI chatbot prompts, behavior, and settings
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Web;