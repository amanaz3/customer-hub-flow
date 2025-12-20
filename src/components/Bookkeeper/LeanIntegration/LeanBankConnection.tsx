import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ExternalLink,
  Trash2,
  Landmark,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LinkedBank {
  id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountType: string;
  status: 'active' | 'pending' | 'expired' | 'error';
  lastSynced: string | null;
  balance?: number;
  currency?: string;
}

interface LeanBankConnectionProps {
  leanEnabled: boolean;
  onLeanToggle: (enabled: boolean) => void;
  demoMode?: boolean;
}

// Demo UAE banks data
const demoLinkedBanks: LinkedBank[] = [
  {
    id: 'lean-1',
    bankName: 'Emirates NBD',
    bankCode: 'EBILAEAD',
    accountNumber: '****4521',
    accountType: 'Business Current',
    status: 'active',
    lastSynced: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    balance: 245000,
    currency: 'AED'
  },
  {
    id: 'lean-2',
    bankName: 'ADCB',
    bankCode: 'ADCBAEAA',
    accountNumber: '****8832',
    accountType: 'Business Savings',
    status: 'active',
    lastSynced: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    balance: 89500,
    currency: 'AED'
  },
  {
    id: 'lean-3',
    bankName: 'Mashreq',
    bankCode: 'BOMLAEAD',
    accountNumber: '****2214',
    accountType: 'Business Current',
    status: 'pending',
    lastSynced: null,
    balance: undefined,
    currency: 'AED'
  }
];

export function LeanBankConnection({ leanEnabled, onLeanToggle, demoMode = false }: LeanBankConnectionProps) {
  const [linkedBanks, setLinkedBanks] = useState<LinkedBank[]>(demoMode ? demoLinkedBanks : []);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  const handleConnectBank = async () => {
    if (!leanEnabled) {
      toast.error('Please enable Lean Integration first');
      return;
    }

    setIsConnecting(true);
    
    // In production, this would redirect to Lean's OAuth flow
    // For demo, simulate the connection process
    if (demoMode) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add a new demo bank account
      const newBank: LinkedBank = {
        id: `lean-${Date.now()}`,
        bankName: 'FAB (First Abu Dhabi Bank)',
        bankCode: 'NBADAEAA',
        accountNumber: `****${Math.floor(1000 + Math.random() * 9000)}`,
        accountType: 'Business Current',
        status: 'active',
        lastSynced: new Date().toISOString(),
        balance: Math.floor(50000 + Math.random() * 200000),
        currency: 'AED'
      };
      
      setLinkedBanks(prev => [...prev, newBank]);
      toast.success('Bank account connected successfully!');
    } else {
      toast.info('Lean OAuth integration required. Configure LEAN_API_KEY in secrets to enable production banking.');
    }
    
    setIsConnecting(false);
  };

  const handleSyncBank = async (bankId: string) => {
    if (!leanEnabled) return;
    
    setIsSyncing(bankId);
    
    if (demoMode) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setLinkedBanks(prev => prev.map(bank => 
        bank.id === bankId 
          ? { ...bank, lastSynced: new Date().toISOString() }
          : bank
      ));
      toast.success('Transactions synced successfully');
    }
    
    setIsSyncing(null);
  };

  const handleSyncAll = async () => {
    if (!leanEnabled) return;
    
    for (const bank of linkedBanks.filter(b => b.status === 'active')) {
      await handleSyncBank(bank.id);
    }
  };

  const handleDisconnectBank = (bankId: string) => {
    if (demoMode) {
      setLinkedBanks(prev => prev.filter(b => b.id !== bankId));
      toast.success('Bank account disconnected');
    }
  };

  const getStatusBadge = (status: LinkedBank['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30"><CheckCircle2 className="h-3 w-3 mr-1" /> Connected</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'expired':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Expired</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Error</Badge>;
    }
  };

  const formatLastSynced = (isoDate: string | null) => {
    if (!isoDate) return 'Never';
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Landmark className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Lean Open Banking
                <Badge variant="outline" className="text-xs font-normal">UAE</Badge>
              </CardTitle>
              <CardDescription>
                Connect UAE bank accounts to auto-fetch transactions
              </CardDescription>
            </div>
          </div>
          
          {/* Lean Integration Toggle */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
            <Zap className={cn("h-4 w-4", leanEnabled ? "text-emerald-600" : "text-muted-foreground")} />
            <Label htmlFor="lean-toggle" className="text-sm font-medium cursor-pointer">
              Lean Integration
            </Label>
            <Switch
              id="lean-toggle"
              checked={leanEnabled}
              onCheckedChange={onLeanToggle}
            />
            {leanEnabled && (
              <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
                Active
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!leanEnabled && (
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertDescription>
              Enable Lean Integration to connect UAE bank accounts and automatically fetch transactions. 
              Your existing bookkeeping workflow remains unchanged.
            </AlertDescription>
          </Alert>
        )}

        {leanEnabled && (
          <>
            {/* Actions Bar */}
            <div className="flex items-center justify-between">
              <Button onClick={handleConnectBank} disabled={isConnecting} className="gap-2">
                {isConnecting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Connect Bank Account
              </Button>
              
              {linkedBanks.filter(b => b.status === 'active').length > 0 && (
                <Button variant="outline" onClick={handleSyncAll} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Sync All
                </Button>
              )}
            </div>

            <Separator />

            {/* Linked Banks List */}
            {linkedBanks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No bank accounts connected</p>
                <p className="text-sm">Connect your UAE bank account to start fetching transactions automatically</p>
              </div>
            ) : (
              <div className="space-y-3">
                {linkedBanks.map(bank => (
                  <div 
                    key={bank.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{bank.bankName}</p>
                          {getStatusBadge(bank.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {bank.accountType} • {bank.accountNumber}
                        </p>
                        {bank.balance !== undefined && (
                          <p className="text-sm font-medium text-emerald-600">
                            {bank.currency} {bank.balance.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right text-sm text-muted-foreground">
                        <p>Last synced</p>
                        <p className="font-medium">{formatLastSynced(bank.lastSynced)}</p>
                      </div>
                      
                      {bank.status === 'active' && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleSyncBank(bank.id)}
                          disabled={isSyncing === bank.id}
                        >
                          <RefreshCw className={cn("h-4 w-4", isSyncing === bank.id && "animate-spin")} />
                        </Button>
                      )}
                      
                      {bank.status === 'expired' && (
                        <Button variant="outline" size="sm" className="gap-1">
                          <ExternalLink className="h-3 w-3" />
                          Re-authorize
                        </Button>
                      )}
                      
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDisconnectBank(bank.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Info Footer */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <ShieldCheck className="h-3 w-3" />
              <span>Transactions are fetched via Lean's secure Open Banking APIs. Your credentials are never stored.</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
