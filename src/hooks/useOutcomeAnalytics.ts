import { useMemo } from 'react';
import { BankReadinessCaseRecord } from './useBankReadinessCases';

export interface SimilarCaseStats {
  totalSimilar: number;
  approvedCount: number;
  rejectedCount: number;
  approvalRate: number;
  bankStats: {
    bank: string;
    approved: number;
    rejected: number;
    rate: number;
  }[];
  topRejectionReasons: string[];
}

export function useOutcomeAnalytics(
  cases: BankReadinessCaseRecord[],
  currentInput?: {
    applicant_nationality: string;
    license_activity: string;
    risk_category?: string;
    company_jurisdiction?: string;
  }
) {
  // Get similar case statistics based on current input
  const getSimilarCaseStats = useMemo(() => {
    if (!currentInput) return null;

    const casesWithOutcome = cases.filter(
      c => c.outcome === 'approved' || c.outcome === 'rejected'
    );

    // Find similar cases by nationality OR activity type
    const similarCases = casesWithOutcome.filter(c => {
      const nationalityMatch = c.applicant_nationality === currentInput.applicant_nationality;
      const activityMatch = c.license_activity.toLowerCase().includes(
        currentInput.license_activity.toLowerCase().split(' ')[0]
      );
      const riskMatch = currentInput.risk_category 
        ? c.risk_category === currentInput.risk_category 
        : true;
      
      return (nationalityMatch || activityMatch) && riskMatch;
    });

    if (similarCases.length === 0) return null;

    const approved = similarCases.filter(c => c.outcome === 'approved');
    const rejected = similarCases.filter(c => c.outcome === 'rejected');

    // Bank-specific stats
    const bankMap = new Map<string, { approved: number; rejected: number }>();
    similarCases.forEach(c => {
      if (c.bank_applied_to) {
        const current = bankMap.get(c.bank_applied_to) || { approved: 0, rejected: 0 };
        if (c.outcome === 'approved') current.approved++;
        if (c.outcome === 'rejected') current.rejected++;
        bankMap.set(c.bank_applied_to, current);
      }
    });

    const bankStats = Array.from(bankMap.entries())
      .map(([bank, data]) => ({
        bank,
        ...data,
        rate: data.approved + data.rejected > 0
          ? Math.round((data.approved / (data.approved + data.rejected)) * 100)
          : 0
      }))
      .sort((a, b) => b.rate - a.rate);

    // Top rejection reasons
    const reasonMap = new Map<string, number>();
    rejected.forEach(c => {
      if (c.rejection_reason) {
        reasonMap.set(c.rejection_reason, (reasonMap.get(c.rejection_reason) || 0) + 1);
      }
    });
    const topRejectionReasons = Array.from(reasonMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason]) => formatReason(reason));

    const stats: SimilarCaseStats = {
      totalSimilar: similarCases.length,
      approvedCount: approved.length,
      rejectedCount: rejected.length,
      approvalRate: Math.round((approved.length / similarCases.length) * 100),
      bankStats,
      topRejectionReasons,
    };

    return stats;
  }, [cases, currentInput]);

  // Get bank-specific historical success rate
  const getBankSuccessRate = (bankName: string): { rate: number; total: number } | null => {
    const casesWithBank = cases.filter(
      c => c.bank_applied_to === bankName && 
           (c.outcome === 'approved' || c.outcome === 'rejected')
    );

    if (casesWithBank.length === 0) return null;

    const approved = casesWithBank.filter(c => c.outcome === 'approved').length;
    return {
      rate: Math.round((approved / casesWithBank.length) * 100),
      total: casesWithBank.length,
    };
  };

  // Get insights for rule improvement
  const getLearningInsights = useMemo(() => {
    const casesWithOutcome = cases.filter(
      c => c.outcome === 'approved' || c.outcome === 'rejected'
    );

    const insights: string[] = [];

    // Find banks that were recommended but frequently rejected
    const recommendedRejections = new Map<string, number>();
    casesWithOutcome.forEach(c => {
      if (c.outcome === 'rejected' && c.bank_applied_to) {
        const recommended = (c.recommended_banks as any[]) || [];
        if (recommended.some(b => b.bank_name === c.bank_applied_to)) {
          recommendedRejections.set(
            c.bank_applied_to,
            (recommendedRejections.get(c.bank_applied_to) || 0) + 1
          );
        }
      }
    });

    recommendedRejections.forEach((count, bank) => {
      if (count >= 2) {
        insights.push(`${bank} has rejected ${count} recommended cases. Consider adjusting matching criteria.`);
      }
    });

    // Find avoided banks that frequently approved
    const avoidedApprovals = new Map<string, number>();
    casesWithOutcome.forEach(c => {
      if (c.outcome === 'approved' && c.bank_applied_to) {
        const avoided = (c.banks_to_avoid as any[]) || [];
        if (avoided.some(b => b.bank_name === c.bank_applied_to)) {
          avoidedApprovals.set(
            c.bank_applied_to,
            (avoidedApprovals.get(c.bank_applied_to) || 0) + 1
          );
        }
      }
    });

    avoidedApprovals.forEach((count, bank) => {
      if (count >= 2) {
        insights.push(`${bank} approved ${count} cases despite being flagged to avoid. May be more flexible.`);
      }
    });

    // Nationality-specific insights
    const nationalityRejections = new Map<string, number>();
    casesWithOutcome.filter(c => c.outcome === 'rejected').forEach(c => {
      nationalityRejections.set(
        c.applicant_nationality,
        (nationalityRejections.get(c.applicant_nationality) || 0) + 1
      );
    });

    nationalityRejections.forEach((count, nat) => {
      const total = casesWithOutcome.filter(c => c.applicant_nationality === nat).length;
      const rate = Math.round((count / total) * 100);
      if (rate > 60 && total >= 3) {
        insights.push(`${nat} nationality has ${rate}% rejection rate. Consider higher risk weighting.`);
      }
    });

    return insights;
  }, [cases]);

  return {
    getSimilarCaseStats,
    getBankSuccessRate,
    getLearningInsights,
  };
}

function formatReason(reason: string): string {
  const map: Record<string, string> = {
    'high_risk_activity': 'High Risk Activity',
    'nationality_restrictions': 'Nationality Restrictions',
    'insufficient_documents': 'Insufficient Documents',
    'source_of_funds': 'Source of Funds Concerns',
    'previous_rejection': 'Previous Rejection History',
    'turnover_too_low': 'Turnover Too Low',
    'compliance_concerns': 'Compliance Concerns',
    'other': 'Other',
  };
  return map[reason] || reason;
}
