import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Building2, 
  CreditCard, 
  ArrowRightLeft, 
  FileText, 
  Settings, 
  FlaskConical,
  Shield,
  Wallet,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus
} from 'lucide-react';
import OpenBankingDashboard from '@/components/openbanking/OpenBankingDashboard';
import BankConnections from '@/components/openbanking/BankConnections';
import TransactionManager from '@/components/openbanking/TransactionManager';
import ReconciliationCenter from '@/components/openbanking/ReconciliationCenter';
import OpenBankingReports from '@/components/openbanking/OpenBankingReports';
import OpenBankingSettings from '@/components/openbanking/OpenBankingSettings';
import OnboardingWizard from '@/components/openbanking/OnboardingWizard';

const OpenBanking = () => {
  const [demoMode, setDemoMode] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Demo data for progress tracker
  const progressSteps = [
    { id: 'kyc', label: 'KYC Complete', status: 'completed' as const },
    { id: 'bank', label: 'Bank Connected', status: 'completed' as const },
    { id: 'transactions', label: 'Transactions Synced', status: 'in_progress' as const },
    { id: 'categorization', label: 'Categorization', status: 'pending' as const },
    { id: 'reconciliation', label: 'Reconciliation', status: 'pending' as const },
  ];

  const getStatusIcon = (status: 'completed' | 'in_progress' | 'pending') => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-amber-500 animate-pulse" />;
      case 'pending':
        return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Open Banking</h1>
                <p className="text-sm text-muted-foreground">UAE Bank Integration & Bookkeeping</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Progress Tracker */}
              <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
                {progressSteps.map((step, index) => (
                  <React.Fragment key={step.id}>
                    <div className="flex items-center gap-1.5">
                      {getStatusIcon(step.status)}
                      <span className="text-xs font-medium">{step.label}</span>
                    </div>
                    {index < progressSteps.length - 1 && (
                      <div className="w-6 h-px bg-border" />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Demo Toggle */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
                <FlaskConical className="h-4 w-4 text-purple-500" />
                <Label htmlFor="demo-mode" className="text-sm cursor-pointer">Demo</Label>
                <Switch
                  id="demo-mode"
                  checked={demoMode}
                  onCheckedChange={setDemoMode}
                />
              </div>

              <Button 
                onClick={() => setShowOnboarding(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Connect Bank
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Quick Stats */}
        {demoMode && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Balance</p>
                    <p className="text-2xl font-bold">AED 847,250</p>
                    <p className="text-xs text-emerald-600">+12.5% from last month</p>
                  </div>
                  <Wallet className="h-10 w-10 text-emerald-500/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold">AED 156,400</p>
                    <p className="text-xs text-blue-600">142 transactions</p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-blue-500/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Review</p>
                    <p className="text-2xl font-bold">23</p>
                    <p className="text-xs text-amber-600">8 flagged items</p>
                  </div>
                  <AlertTriangle className="h-10 w-10 text-amber-500/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Connected Banks</p>
                    <p className="text-2xl font-bold">3</p>
                    <p className="text-xs text-purple-600">Last sync: 5 min ago</p>
                  </div>
                  <CreditCard className="h-10 w-10 text-purple-500/50" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1 h-auto flex-wrap">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-background gap-2">
              <Building2 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="banks" className="data-[state=active]:bg-background gap-2">
              <CreditCard className="h-4 w-4" />
              Bank Accounts
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-background gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="reconciliation" className="data-[state=active]:bg-background gap-2">
              <Shield className="h-4 w-4" />
              Reconciliation
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-background gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-background gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <OpenBankingDashboard demoMode={demoMode} />
          </TabsContent>

          <TabsContent value="banks">
            <BankConnections demoMode={demoMode} onConnect={() => setShowOnboarding(true)} />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionManager demoMode={demoMode} />
          </TabsContent>

          <TabsContent value="reconciliation">
            <ReconciliationCenter demoMode={demoMode} />
          </TabsContent>

          <TabsContent value="reports">
            <OpenBankingReports demoMode={demoMode} />
          </TabsContent>

          <TabsContent value="settings">
            <OpenBankingSettings demoMode={demoMode} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Onboarding Wizard Modal */}
      {showOnboarding && (
        <OnboardingWizard 
          isOpen={showOnboarding} 
          onClose={() => setShowOnboarding(false)} 
          demoMode={demoMode}
        />
      )}
    </div>
  );
};

export default OpenBanking;
