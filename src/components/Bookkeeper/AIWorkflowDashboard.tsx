import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  RefreshCw,
  Search,
  Sparkles,
  ShieldAlert,
  BarChart3,
  ArrowRightLeft,
  Clock,
  DollarSign
} from 'lucide-react';
import { useAIReconciliation, AISuggestion, RiskFlag } from '@/hooks/useAIReconciliation';
import { format } from 'date-fns';

export function AIWorkflowDashboard() {
  const {
    suggestions,
    riskFlags,
    forecasts,
    stats,
    loading,
    processing,
    runAIReconciliation,
    detectGaps,
    approveSuggestion,
    rejectSuggestion,
    resolveRiskFlag,
  } = useAIReconciliation();

  const [selectedSuggestion, setSelectedSuggestion] = useState<AISuggestion | null>(null);
  const [selectedFlag, setSelectedFlag] = useState<RiskFlag | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const openFlags = riskFlags.filter(f => f.status === 'open');

  const handleApprove = async () => {
    if (selectedSuggestion) {
      await approveSuggestion(selectedSuggestion.id, reviewNotes);
      setSelectedSuggestion(null);
      setReviewNotes('');
    }
  };

  const handleReject = async () => {
    if (selectedSuggestion) {
      await rejectSuggestion(selectedSuggestion.id, reviewNotes);
      setSelectedSuggestion(null);
      setReviewNotes('');
    }
  };

  const handleResolveFlag = async (resolution: 'resolved' | 'dismissed') => {
    if (selectedFlag) {
      await resolveRiskFlag(selectedFlag.id, resolution, reviewNotes);
      setSelectedFlag(null);
      setReviewNotes('');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data Completeness</p>
                <p className="text-2xl font-bold">{(stats.dataCompleteness * 100).toFixed(0)}%</p>
              </div>
            </div>
            <Progress value={stats.dataCompleteness * 100} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Risk Score</p>
                <p className="text-2xl font-bold">{stats.riskScore}%</p>
              </div>
            </div>
            <Progress value={stats.riskScore} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">AI Suggestions</p>
                <p className="text-2xl font-bold">{pendingSuggestions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <ShieldAlert className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Risk Flags</p>
                <p className="text-2xl font-bold">{openFlags.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={() => runAIReconciliation('all')}
          disabled={processing}
          className="flex items-center gap-2"
        >
          {processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
          Run AI Reconciliation
        </Button>
        <Button 
          variant="outline"
          onClick={() => detectGaps()}
          disabled={processing}
          className="flex items-center gap-2"
        >
          {processing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Detect Data Gaps
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="suggestions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Suggestions
            {pendingSuggestions.length > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingSuggestions.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="risks" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Risk Flags
            {openFlags.length > 0 && (
              <Badge variant="destructive" className="ml-1">{openFlags.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Cash Flow Forecast
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* AI Suggestions Tab */}
        <TabsContent value="suggestions">
          <Card>
            <CardHeader>
              <CardTitle>AI Match Suggestions</CardTitle>
              <CardDescription>
                Review and approve AI-suggested matches between bills/invoices and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingSuggestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending suggestions</p>
                  <p className="text-sm">Run AI Reconciliation to generate new suggestions</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Reasons</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingSuggestions.map(suggestion => (
                      <TableRow key={suggestion.id}>
                        <TableCell>
                          <Badge variant="outline">
                            <ArrowRightLeft className="h-3 w-3 mr-1" />
                            {suggestion.suggestion_type === 'bill_payment' ? 'Bill → Payment' : 'Invoice → Receipt'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {suggestion.source_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {suggestion.target_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <span className={`font-bold ${getConfidenceColor(suggestion.confidence_score)}`}>
                            {(suggestion.confidence_score * 100).toFixed(0)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(suggestion.match_reasons as any[]).slice(0, 2).map((r, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {r.rule}
                              </Badge>
                            ))}
                            {(suggestion.match_reasons as any[]).length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{(suggestion.match_reasons as any[]).length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-600"
                            onClick={() => setSelectedSuggestion(suggestion)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => {
                              setSelectedSuggestion(suggestion);
                              setReviewNotes('');
                            }}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Flags Tab */}
        <TabsContent value="risks">
          <Card>
            <CardHeader>
              <CardTitle>Risk Flags</CardTitle>
              <CardDescription>
                Issues detected in your financial data requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {openFlags.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShieldAlert className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No open risk flags</p>
                  <p className="text-sm">Your data looks healthy!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Severity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {openFlags.map(flag => (
                      <TableRow key={flag.id}>
                        <TableCell>
                          <Badge className={getSeverityColor(flag.severity)}>
                            {flag.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{flag.flag_type}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {flag.description}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {flag.entity_type}: {flag.entity_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(flag.created_at), 'MMM d, HH:mm')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedFlag(flag)}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow Forecast Tab */}
        <TabsContent value="forecast">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Forecast</CardTitle>
              <CardDescription>
                Projected inflows and outflows based on pending invoices and bills
              </CardDescription>
            </CardHeader>
            <CardContent>
              {forecasts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No forecast data available</p>
                  <p className="text-sm">Run gap detection to generate forecasts</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {forecasts.slice(0, 14).map(forecast => (
                    <div key={forecast.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-medium">
                          {format(new Date(forecast.forecast_date), 'EEE, MMM d')}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {(forecast.confidence_level * 100).toFixed(0)}% confidence
                        </Badge>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Inflow</p>
                          <p className="text-green-600 font-medium">
                            +{Number(forecast.projected_inflow).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Outflow</p>
                          <p className="text-red-600 font-medium">
                            -{Number(forecast.projected_outflow).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <p className="text-xs text-muted-foreground">Net</p>
                          <p className={`font-bold ${Number(forecast.net_position) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {Number(forecast.net_position) >= 0 ? '+' : ''}{Number(forecast.net_position).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Reconciliation History</CardTitle>
              <CardDescription>
                Audit trail of all AI suggestions and user actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suggestions
                    .filter(s => s.status !== 'pending')
                    .slice(0, 20)
                    .map(suggestion => (
                      <TableRow key={suggestion.id}>
                        <TableCell className="text-sm">
                          {format(new Date(suggestion.created_at), 'MMM d, HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {suggestion.suggestion_type === 'bill_payment' ? 'Bill → Payment' : 'Invoice → Receipt'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            suggestion.status === 'approved' || suggestion.status === 'auto_matched' 
                              ? 'default' 
                              : 'secondary'
                          }>
                            {suggestion.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(suggestion.confidence_score * 100).toFixed(0)}%
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {suggestion.review_notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Suggestion Review Dialog */}
      <Dialog open={!!selectedSuggestion} onOpenChange={() => setSelectedSuggestion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review AI Suggestion</DialogTitle>
            <DialogDescription>
              Approve or reject this suggested match
            </DialogDescription>
          </DialogHeader>
          {selectedSuggestion && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Source ({selectedSuggestion.source_type})</p>
                  <p className="font-mono text-sm">{selectedSuggestion.source_id}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Target ({selectedSuggestion.target_type})</p>
                  <p className="font-mono text-sm">{selectedSuggestion.target_id}</p>
                </div>
              </div>
              
              <div className="p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Match Reasons</p>
                <div className="space-y-2">
                  {(selectedSuggestion.match_reasons as any[]).map((reason, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span>{reason.rule}</span>
                      <Badge variant="outline">{(reason.score * 100).toFixed(0)}% - {reason.reason}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Review Notes (optional)</p>
                <Textarea
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSuggestion(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject}>
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button onClick={handleApprove}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Risk Flag Review Dialog */}
      <Dialog open={!!selectedFlag} onOpenChange={() => setSelectedFlag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Risk Flag</DialogTitle>
            <DialogDescription>
              Resolve or dismiss this risk flag
            </DialogDescription>
          </DialogHeader>
          {selectedFlag && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className={getSeverityColor(selectedFlag.severity)}>
                    {selectedFlag.severity}
                  </Badge>
                  <Badge variant="outline">{selectedFlag.flag_type}</Badge>
                </div>
                <p className="text-sm">{selectedFlag.description}</p>
                {selectedFlag.details && Object.keys(selectedFlag.details).length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <pre className="bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(selectedFlag.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Resolution Notes (optional)</p>
                <Textarea
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  placeholder="Describe how this was resolved..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedFlag(null)}>Cancel</Button>
            <Button variant="secondary" onClick={() => handleResolveFlag('dismissed')}>
              Dismiss
            </Button>
            <Button onClick={() => handleResolveFlag('resolved')}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
