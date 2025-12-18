import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock, FileEdit, TrendingUp, Target, Beaker } from 'lucide-react';
import { useBankReadinessCases, BankReadinessCaseRecord } from '@/hooks/useBankReadinessCases';
import OutcomeRecordDialog from './OutcomeRecordDialog';

// Demo cases data - using Partial since we only need display fields
const DEMO_CASES: Partial<BankReadinessCaseRecord>[] = [
  {
    id: 'demo-1',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    license_activity: 'E-commerce Trading',
    applicant_nationality: 'British',
    company_jurisdiction: 'DMCC',
    business_model: 'B2C',
    expected_monthly_inflow: '100000-500000',
    source_of_funds: 'business_revenue',
    uae_residency: true,
    previous_rejection: false,
    risk_category: 'low',
    risk_score: 25,
    recommended_banks: [
      { bank_name: 'Emirates NBD', match_score: 92, recommendation: 'Excellent match' },
      { bank_name: 'RAKBANK', match_score: 88, recommendation: 'Good match' }
    ],
    banks_to_avoid: [],
    outcome: 'approved',
    bank_applied_to: 'Emirates NBD',
    outcome_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    outcome_notes: 'Approved within 5 business days',
    status: 'completed'
  },
  {
    id: 'demo-2',
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    license_activity: 'Cryptocurrency Consulting',
    applicant_nationality: 'Iranian',
    company_jurisdiction: 'Freezone',
    business_model: 'B2B',
    expected_monthly_inflow: '50000-100000',
    source_of_funds: 'consulting_fees',
    uae_residency: false,
    previous_rejection: true,
    risk_category: 'high',
    risk_score: 78,
    recommended_banks: [
      { bank_name: 'Mashreq', match_score: 65, recommendation: 'May consider with documentation' }
    ],
    banks_to_avoid: [{ bank_name: 'Emirates NBD', reason: 'High-risk nationality' }],
    outcome: 'rejected',
    bank_applied_to: 'Emirates NBD',
    outcome_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    outcome_notes: 'Rejected due to business activity',
    rejection_reason: 'high_risk_activity',
    status: 'completed'
  },
  {
    id: 'demo-3',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    license_activity: 'Restaurant Management',
    applicant_nationality: 'Indian',
    company_jurisdiction: 'Dubai Mainland',
    business_model: 'B2C',
    expected_monthly_inflow: '50000-100000',
    source_of_funds: 'business_revenue',
    uae_residency: true,
    previous_rejection: false,
    risk_category: 'medium',
    risk_score: 42,
    recommended_banks: [
      { bank_name: 'ADCB', match_score: 85, recommendation: 'Good match' },
      { bank_name: 'FAB', match_score: 82, recommendation: 'Good match' }
    ],
    banks_to_avoid: [],
    outcome: 'pending',
    bank_applied_to: 'ADCB',
    status: 'in_progress'
  },
  {
    id: 'demo-4',
    created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    license_activity: 'Software Development',
    applicant_nationality: 'American',
    company_jurisdiction: 'DIFC',
    business_model: 'B2B',
    expected_monthly_inflow: '500000+',
    source_of_funds: 'venture_capital',
    uae_residency: true,
    previous_rejection: false,
    risk_category: 'low',
    risk_score: 18,
    recommended_banks: [
      { bank_name: 'HSBC', match_score: 95, recommendation: 'Excellent match for tech companies' },
      { bank_name: 'Emirates NBD', match_score: 90, recommendation: 'Good match' }
    ],
    banks_to_avoid: [],
    outcome: 'approved',
    bank_applied_to: 'HSBC',
    outcome_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    outcome_notes: 'Fast-tracked approval for DIFC entity',
    status: 'completed'
  }
];

const DEMO_STATS = {
  totalCases: 4,
  casesWithOutcome: 3,
  approved: 2,
  rejected: 1,
  accuracyRate: 75
};

interface CasesHistoryTabProps {
  showDemo?: boolean;
}

const CasesHistoryTab: React.FC<CasesHistoryTabProps> = ({ showDemo = false }) => {
  const { cases: realCases, loading, updateOutcome, getAccuracyStats } = useBankReadinessCases();
  const [selectedCase, setSelectedCase] = useState<BankReadinessCaseRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const cases = showDemo ? DEMO_CASES : realCases;
  const stats = showDemo ? DEMO_STATS : getAccuracyStats();

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

  if (loading && !showDemo) {
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
      {showDemo && (
        <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
          <Beaker className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-purple-800 dark:text-purple-200">
            Demo Mode: Showing sample case history with outcomes for demonstration purposes.
          </AlertDescription>
        </Alert>
      )}

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
                        onClick={() => handleRecordOutcome(c as BankReadinessCaseRecord)}
                        disabled={showDemo}
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
