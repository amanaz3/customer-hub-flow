import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Building2, 
  Plus, 
  RefreshCw, 
  Settings, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  CreditCard,
  Wallet,
  ArrowRightLeft,
  Shield,
  ExternalLink
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  demoMode: boolean;
  onConnect: () => void;
}

const BankConnections: React.FC<Props> = ({ demoMode, onConnect }) => {
  const [showAccountDetails, setShowAccountDetails] = useState<string | null>(null);

  const connectedBanks = [
    {
      id: 'enbd-1',
      name: 'Emirates NBD',
      logo: '🏦',
      status: 'active',
      connectedDate: '2023-11-15',
      lastSync: '5 minutes ago',
      nextSync: 'In 55 minutes',
      accounts: [
        { id: 'acc-1', type: 'Current', number: '****4521', balance: 325000, currency: 'AED' },
        { id: 'acc-2', type: 'Savings', number: '****7834', balance: 100000, currency: 'AED' },
      ],
      consentExpiry: '2024-11-15',
      permissions: ['Account Balance', 'Transaction History', 'Account Details'],
    },
    {
      id: 'adcb-1',
      name: 'ADCB',
      logo: '🏛️',
      status: 'active',
      connectedDate: '2023-12-01',
      lastSync: '12 minutes ago',
      nextSync: 'In 48 minutes',
      accounts: [
        { id: 'acc-3', type: 'Business', number: '****9012', balance: 312500, currency: 'AED' },
      ],
      consentExpiry: '2024-12-01',
      permissions: ['Account Balance', 'Transaction History'],
    },
    {
      id: 'fab-1',
      name: 'First Abu Dhabi Bank',
      logo: '🏦',
      status: 'pending',
      connectedDate: '2024-01-10',
      lastSync: 'Syncing...',
      nextSync: '-',
      accounts: [
        { id: 'acc-4', type: 'Current', number: '****3456', balance: 109750, currency: 'AED' },
      ],
      consentExpiry: '2025-01-10',
      permissions: ['Account Balance', 'Transaction History', 'Account Details', 'Payments'],
    },
  ];

  const availableBanks = [
    { id: 'mashreq', name: 'Mashreq Bank', logo: '🏦', popular: true },
    { id: 'cbd', name: 'Commercial Bank of Dubai', logo: '🏛️', popular: true },
    { id: 'dib', name: 'Dubai Islamic Bank', logo: '🕌', popular: false },
    { id: 'rakbank', name: 'RAKBANK', logo: '🏦', popular: false },
    { id: 'nbd', name: 'National Bank of Dubai', logo: '🏛️', popular: false },
  ];

  if (!demoMode) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <CreditCard className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Banks Connected</h3>
          <p className="text-muted-foreground mb-4">
            Enable demo mode to see sample bank connections or connect your UAE bank account
          </p>
          <Button onClick={onConnect}>
            <Plus className="h-4 w-4 mr-2" />
            Connect Bank Account
          </Button>
        </CardContent>
      </Card>
    );
  }

  const selectedBank = connectedBanks.find(b => b.id === showAccountDetails);

  return (
    <div className="space-y-6">
      {/* Connected Banks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Connected Banks</h2>
          <Button onClick={onConnect} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Bank
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectedBanks.map((bank) => (
            <Card 
              key={bank.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setShowAccountDetails(bank.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{bank.logo}</div>
                    <div>
                      <CardTitle className="text-base">{bank.name}</CardTitle>
                      <CardDescription>{bank.accounts.length} account(s)</CardDescription>
                    </div>
                  </div>
                  <Badge 
                    variant={bank.status === 'active' ? 'default' : 'secondary'}
                    className={bank.status === 'active' ? 'bg-emerald-500' : ''}
                  >
                    {bank.status === 'active' ? (
                      <><CheckCircle2 className="h-3 w-3 mr-1" /> Active</>
                    ) : (
                      <><Clock className="h-3 w-3 mr-1" /> Syncing</>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Total Balance */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Total Balance</p>
                    <p className="text-xl font-bold">
                      AED {bank.accounts.reduce((sum, acc) => sum + acc.balance, 0).toLocaleString()}
                    </p>
                  </div>

                  {/* Sync Status */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <RefreshCw className="h-3 w-3" />
                      <span>Last sync: {bank.lastSync}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Consent Expiry */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="h-3 w-3" />
                    <span>Consent expires: {bank.consentExpiry}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Available Banks to Connect */}
      <Card>
        <CardHeader>
          <CardTitle>Add More Banks</CardTitle>
          <CardDescription>Connect additional UAE bank accounts via Lean Technologies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {availableBanks.map((bank) => (
              <Button
                key={bank.id}
                variant="outline"
                className="h-auto py-4 flex-col gap-2 hover:border-primary"
                onClick={onConnect}
              >
                <span className="text-2xl">{bank.logo}</span>
                <span className="text-xs text-center">{bank.name}</span>
                {bank.popular && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Popular
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border-emerald-500/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-emerald-500/10">
              <Shield className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Secure Bank Connection via Lean Technologies</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Your bank credentials are never stored on our servers. We use Lean's secure Open Banking 
                infrastructure that is compliant with UAE Central Bank regulations. You can revoke access 
                at any time from your bank's portal or through this dashboard.
              </p>
              <div className="flex items-center gap-4">
                <Button variant="link" className="h-auto p-0 text-emerald-600">
                  Learn more about security <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
                <Button variant="link" className="h-auto p-0 text-emerald-600">
                  View consent details <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Details Dialog */}
      <Dialog open={!!showAccountDetails} onOpenChange={() => setShowAccountDetails(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-2xl">{selectedBank?.logo}</span>
              {selectedBank?.name}
            </DialogTitle>
            <DialogDescription>
              Connected on {selectedBank?.connectedDate}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Accounts List */}
            <div>
              <h4 className="font-medium mb-3">Connected Accounts</h4>
              <div className="space-y-2">
                {selectedBank?.accounts.map((account) => (
                  <div 
                    key={account.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Wallet className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{account.type} Account</p>
                        <p className="text-sm text-muted-foreground">{account.number}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{account.currency} {account.balance.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Available Balance</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Permissions */}
            <div>
              <h4 className="font-medium mb-3">Data Permissions</h4>
              <div className="flex flex-wrap gap-2">
                {selectedBank?.permissions.map((perm) => (
                  <Badge key={perm} variant="secondary" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {perm}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Sync Settings */}
            <div>
              <h4 className="font-medium mb-3">Sync Settings</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Auto-sync transactions</p>
                    <p className="text-xs text-muted-foreground">Fetch new transactions every hour</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Auto-categorize</p>
                    <p className="text-xs text-muted-foreground">Automatically categorize new transactions</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Notifications</p>
                    <p className="text-xs text-muted-foreground">Alert on large transactions (&gt; AED 10,000)</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Disconnect Bank
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </Button>
                <Button size="sm">
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  View Transactions
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BankConnections;
