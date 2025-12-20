import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  RefreshCw,
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeanSyncStatusProps {
  leanEnabled: boolean;
  demoMode?: boolean;
}

export function LeanSyncStatus({ leanEnabled, demoMode = false }: LeanSyncStatusProps) {
  // Demo sync stats
  const syncStats = demoMode ? {
    lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    nextScheduledSync: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
    totalTransactions: 156,
    pendingCategorization: 12,
    pendingReconciliation: 8,
    connectedBanks: 2,
    creditsToday: 73500,
    debitsToday: 24850
  } : null;

  if (!leanEnabled) {
    return null;
  }

  const formatTime = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 0) {
      // Future time
      const futureMins = Math.abs(diffMins);
      const futureHours = Math.floor(futureMins / 60);
      if (futureHours < 1) return `in ${futureMins}m`;
      return `in ${futureHours}h`;
    }
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const categorizationProgress = syncStats 
    ? ((syncStats.totalTransactions - syncStats.pendingCategorization) / syncStats.totalTransactions) * 100
    : 0;
    
  const reconciliationProgress = syncStats 
    ? ((syncStats.totalTransactions - syncStats.pendingReconciliation) / syncStats.totalTransactions) * 100
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Sync Status */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium">Sync Status</span>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Active
            </Badge>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last sync</span>
              <span className="font-medium">{syncStats ? formatTime(syncStats.lastSync) : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Next sync</span>
              <span className="font-medium">{syncStats ? formatTime(syncStats.nextScheduledSync) : '-'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Banks */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Landmark className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Connected Banks</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{syncStats?.connectedBanks ?? 0}</span>
            <span className="text-sm text-muted-foreground">UAE banks</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {syncStats?.totalTransactions ?? 0} transactions fetched
          </p>
        </CardContent>
      </Card>

      {/* Today's Flow */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Today's Flow</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-green-600">
                <ArrowDownLeft className="h-3 w-3" />
                <span className="text-xs">In</span>
              </div>
              <span className="font-mono text-sm font-medium text-green-600">
                +AED {(syncStats?.creditsToday ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-red-600">
                <ArrowUpRight className="h-3 w-3" />
                <span className="text-xs">Out</span>
              </div>
              <span className="font-mono text-sm font-medium text-red-600">
                -AED {(syncStats?.debitsToday ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Status */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Processing</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Categorized</span>
                <span>{Math.round(categorizationProgress)}%</span>
              </div>
              <Progress value={categorizationProgress} className="h-1.5" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Reconciled</span>
                <span>{Math.round(reconciliationProgress)}%</span>
              </div>
              <Progress value={reconciliationProgress} className="h-1.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
