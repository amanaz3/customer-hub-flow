import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock, FileEdit, TrendingUp, Target } from 'lucide-react';
import { useBankReadinessCases, BankReadinessCaseRecord } from '@/hooks/useBankReadinessCases';
import OutcomeRecordDialog from './OutcomeRecordDialog';

const CasesHistoryTab: React.FC = () => {
  const { cases, loading, updateOutcome, getAccuracyStats } = useBankReadinessCases();
  const [selectedCase, setSelectedCase] = useState<BankReadinessCaseRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const stats = getAccuracyStats();

  const getRiskBadge = (category: string | null) => {
    switch (category) {
      case 'low':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Low Risk</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>;
      case 'high':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">High Risk</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getOutcomeBadge = (outcome: string | null) => {
    switch (outcome) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'withdrawn':
        return <Badge variant="outline">Withdrawn</Badge>;
      default:
        return <Badge variant="outline">No Outcome</Badge>;
    }
  };

  const handleRecordOutcome = (caseData: BankReadinessCaseRecord) => {
    setSelectedCase(caseData);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading cases...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Accuracy Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalCases}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Outcomes</CardTitle>
            <FileEdit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.casesWithOutcome}</p>
            <p className="text-xs text-muted-foreground">
              {stats.approved} approved, {stats.rejected} rejected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prediction Accuracy</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.accuracyRate}%</p>
            <p className="text-xs text-muted-foreground">
              Based on {stats.casesWithOutcome} outcomes
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Why Track?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Recording outcomes helps validate rules and improve accuracy over time.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment History</CardTitle>
          <CardDescription>
            All bank readiness assessments with outcome tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No cases yet. Create assessments to start tracking outcomes.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Nationality</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Top Bank</TableHead>
                  <TableHead>Applied To</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm">
                      {format(new Date(c.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-sm">
                      {c.license_activity}
                    </TableCell>
                    <TableCell className="text-sm">{c.applicant_nationality}</TableCell>
                    <TableCell>{getRiskBadge(c.risk_category)}</TableCell>
                    <TableCell className="text-sm">
                      {(c.recommended_banks as any[])?.[0]?.bank_name || '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {c.bank_applied_to || '-'}
                    </TableCell>
                    <TableCell>{getOutcomeBadge(c.outcome)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRecordOutcome(c)}
                      >
                        {c.outcome ? 'Update' : 'Record'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Outcome Dialog */}
      <OutcomeRecordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        caseData={selectedCase}
        onSubmit={updateOutcome}
      />
    </div>
  );
};

export default CasesHistoryTab;
