import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowRightLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Link2,
  Link2Off,
  FileText,
  ArrowRight,
  Search,
  Filter,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Eye
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Props {
  demoMode: boolean;
}

const ReconciliationCenter: React.FC<Props> = ({ demoMode }) => {
  const [activeTab, setActiveTab] = useState('unmatched');

  const unmatchedTransactions = [
    {
      id: 'tx-101',
      date: '2024-01-13',
      description: 'DEWA Electricity Bill - Dec 2023',
      amount: -2850,
      type: 'debit',
      bank: 'ADCB',
      suggestedMatches: [
        { id: 'bill-001', type: 'Bill', reference: 'BILL-2024-015', amount: 2850, vendor: 'DEWA', confidence: 95 },
        { id: 'bill-002', type: 'Bill', reference: 'BILL-2024-012', amount: 2750, vendor: 'DEWA', confidence: 72 },
      ],
    },
    {
      id: 'tx-102',
      date: '2024-01-09',
      description: 'Amazon UAE - Office Supplies',
      amount: -1250,
      type: 'debit',
      bank: 'Emirates NBD',
      suggestedMatches: [
        { id: 'exp-001', type: 'Expense', reference: 'EXP-2024-089', amount: 1250, vendor: 'Amazon', confidence: 98 },
      ],
    },
    {
      id: 'tx-103',
      date: '2024-01-11',
      description: 'Payment Received - XYZ Global FZE',
      amount: 15750,
      type: 'credit',
      bank: 'FAB',
      suggestedMatches: [
        { id: 'inv-001', type: 'Invoice', reference: 'INV-2024-078', amount: 15750, customer: 'XYZ Global FZE', confidence: 100 },
      ],
    },
  ];

  const flaggedItems = [
    {
      id: 'flag-001',
      type: 'Large Transaction',
      description: 'Payment exceeds AED 10,000 threshold',
      transaction: 'Payment Received - XYZ Global FZE',
      amount: 15750,
      date: '2024-01-11',
      severity: 'medium',
    },
    {
      id: 'flag-002',
      type: 'Possible Duplicate',
      description: 'Similar transaction found on same date',
      transaction: 'Amazon UAE - Office Supplies',
      amount: -1250,
      date: '2024-01-09',
      severity: 'high',
    },
    {
      id: 'flag-003',
      type: 'Unusual Amount',
      description: 'Amount differs from typical pattern for this vendor',
      transaction: 'Etisalat Services',
      amount: -2150,
      date: '2024-01-08',
      severity: 'low',
    },
  ];

  const reconciliationStats = {
    totalTransactions: 142,
    matched: 111,
    pending: 23,
    flagged: 8,
    matchRate: 78,
  };

  if (!demoMode) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Link2 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Reconciliation Center</h3>
          <p className="text-muted-foreground mb-4">
            Enable demo mode to see the reconciliation interface
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{reconciliationStats.totalTransactions}</p>
              </div>
              <ArrowRightLeft className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Matched</p>
                <p className="text-2xl font-bold text-emerald-600">{reconciliationStats.matched}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-amber-600">{reconciliationStats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-rose-500/5 border-rose-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Flagged</p>
                <p className="text-2xl font-bold text-rose-600">{reconciliationStats.flagged}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-rose-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">January 2024 Reconciliation Progress</span>
            <span className="text-sm font-bold text-emerald-600">{reconciliationStats.matchRate}%</span>
          </div>
          <Progress value={reconciliationStats.matchRate} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{reconciliationStats.matched} matched</span>
            <span>{reconciliationStats.pending + reconciliationStats.flagged} remaining</span>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="unmatched" className="gap-2">
            <Link2Off className="h-4 w-4" />
            Unmatched ({unmatchedTransactions.length})
          </TabsTrigger>
          <TabsTrigger value="flagged" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Flagged ({flaggedItems.length})
          </TabsTrigger>
          <TabsTrigger value="matched" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Recently Matched
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unmatched" className="space-y-4 mt-4">
          {/* Search & Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search unmatched transactions..." className="pl-9" />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" />
              Auto-Match All
            </Button>
          </div>

          {/* Unmatched Transactions */}
          <div className="space-y-4">
            {unmatchedTransactions.map((tx) => (
              <Card key={tx.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        tx.type === 'credit' 
                          ? 'bg-emerald-500/10 text-emerald-600' 
                          : 'bg-rose-500/10 text-rose-600'
                      }`}>
                        <ArrowRightLeft className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{tx.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {tx.date} • {tx.bank}
                        </p>
                      </div>
                    </div>
                    <p className={`text-lg font-bold ${tx.type === 'credit' ? 'text-emerald-600' : ''}`}>
                      {tx.type === 'credit' ? '+' : '-'}AED {Math.abs(tx.amount).toLocaleString()}
                    </p>
                  </div>

                  {/* Suggested Matches */}
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      AI Suggested Matches
                    </p>
                    <div className="space-y-2">
                      {tx.suggestedMatches.map((match) => (
                        <div 
                          key={match.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{match.reference}</p>
                                <Badge variant="outline" className="text-xs">
                                  {match.type}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {match.vendor || match.customer} • AED {match.amount.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={match.confidence >= 90 ? 'default' : 'secondary'}
                              className={match.confidence >= 90 ? 'bg-emerald-500' : ''}
                            >
                              {match.confidence}% match
                            </Badge>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <ThumbsDown className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button size="sm" className="h-8">
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Search className="h-4 w-4 mr-2" />
                        Find Manual Match
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Create New Entry
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="flagged" className="space-y-4 mt-4">
          {flaggedItems.map((item) => (
            <Card key={item.id} className={`border-l-4 ${
              item.severity === 'high' ? 'border-l-rose-500' :
              item.severity === 'medium' ? 'border-l-amber-500' :
              'border-l-blue-500'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      item.severity === 'high' ? 'bg-rose-500/10 text-rose-600' :
                      item.severity === 'medium' ? 'bg-amber-500/10 text-amber-600' :
                      'bg-blue-500/10 text-blue-600'
                    }`}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{item.type}</p>
                        <Badge variant={
                          item.severity === 'high' ? 'destructive' :
                          item.severity === 'medium' ? 'default' :
                          'secondary'
                        }>
                          {item.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span>{item.transaction}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="font-medium">
                          AED {Math.abs(item.amount).toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">{item.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                    <Button size="sm" variant="default">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Resolve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="matched" className="mt-4">
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Great Progress!</h3>
              <p className="text-muted-foreground mb-4">
                111 transactions have been successfully matched this month.
              </p>
              <Button variant="outline">
                View Matched Transactions
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReconciliationCenter;
