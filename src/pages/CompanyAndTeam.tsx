import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSandboxCardSettings } from '@/hooks/useSandboxCardSettings';

const CompanyAndTeam = () => {
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
        <h1 className="text-2xl font-bold">Company</h1>
        <p className="text-muted-foreground">Company management</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Tracker Card */}
        {isCardVisible('company_tracker') && (
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 bg-gradient-to-br from-card to-card/50"
            onClick={() => navigate('/tracker')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <span>Tracker</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track applications by stage, team, pipeline, and monitor progress
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CompanyAndTeam;
