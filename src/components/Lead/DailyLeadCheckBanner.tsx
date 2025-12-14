import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Bell, Flame, ThermometerSun, Snowflake, Phone, MessageSquare, Mail, CheckCircle, Users } from 'lucide-react';
import { useAuth } from '@/contexts/SecureAuthContext';

interface DailyLeadCheckBannerProps {
  hotCount: number;
  warmCount: number;
  coldCount: number;
  convertedCount?: number;
  onDismiss?: () => void;
}

export function DailyLeadCheckBanner({ hotCount, warmCount, coldCount, convertedCount = 0, onDismiss }: DailyLeadCheckBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const { user } = useAuth();
  
  const totalCount = hotCount + warmCount + coldCount;
  const conversionRate = totalCount > 0 ? ((convertedCount / totalCount) * 100).toFixed(1) : '0.0';
  
  // Check if banner was dismissed today
  useEffect(() => {
    const dismissedDate = localStorage.getItem(`lead_check_dismissed_${user?.id}`);
    const today = new Date().toDateString();
    if (dismissedDate === today) {
      setDismissed(true);
    }
  }, [user?.id]);

  const handleDismiss = () => {
    const today = new Date().toDateString();
    localStorage.setItem(`lead_check_dismissed_${user?.id}`, today);
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed) return null;

  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">Daily Lead Check</h3>
                <Badge variant="secondary" className="text-xs">Reminder</Badge>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Review your assigned leads and take action:</p>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
                  {/* Total Leads */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <Users className="h-4 w-4 text-primary" />
                    <div>
                      <span className="font-semibold text-primary">{totalCount} Total</span>
                      <span className="text-xs block text-primary/80">Active leads</span>
                    </div>
                  </div>
                  
                  {/* Hot Leads Action */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <Flame className="h-4 w-4 text-red-500" />
                    <div>
                      <span className="font-semibold text-red-700 dark:text-red-400">{hotCount} Hot</span>
                      <span className="text-xs block text-red-600/80">→ Immediate outreach</span>
                    </div>
                  </div>
                  
                  {/* Warm Leads Action */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <ThermometerSun className="h-4 w-4 text-amber-500" />
                    <div>
                      <span className="font-semibold text-amber-700 dark:text-amber-400">{warmCount} Warm</span>
                      <span className="text-xs block text-amber-600/80">→ Schedule follow-up</span>
                    </div>
                  </div>
                  
                  {/* Cold Leads Action */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Snowflake className="h-4 w-4 text-blue-500" />
                    <div>
                      <span className="font-semibold text-blue-700 dark:text-blue-400">{coldCount} Cold</span>
                      <span className="text-xs block text-blue-600/80">→ Add to nurture</span>
                    </div>
                  </div>

                  {/* Conversion Rate */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <span className="font-semibold text-green-700 dark:text-green-400">{conversionRate}%</span>
                      <span className="text-xs block text-green-600/80">Conversion rate</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">Log all activities:</span>
                  <div className="flex items-center gap-1 text-xs">
                    <Phone className="h-3 w-3" /> Calls
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <MessageSquare className="h-3 w-3" /> WhatsApp
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Mail className="h-3 w-3" /> Emails
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
