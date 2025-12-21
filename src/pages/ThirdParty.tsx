import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSandboxCardSettings } from '@/hooks/useSandboxCardSettings';

const ThirdParty = () => {
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
        <h1 className="text-2xl font-bold">Third Party</h1>
        <p className="text-muted-foreground">Third party integrations and services</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Open Banking Card */}
        {isCardVisible('fintech_open_banking') && (
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10"
            onClick={() => navigate('/open-banking')}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <span>Open Banking</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                UAE bank integration via Lean Technologies with auto-categorization & VAT reports
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ThirdParty;
