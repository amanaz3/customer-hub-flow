import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Users, AlertTriangle, CheckCircle, History } from 'lucide-react';
import { SimilarCaseStats } from '@/hooks/useOutcomeAnalytics';

interface SmartBankInsightsProps {
  similarStats: SimilarCaseStats | null;
  getBankSuccessRate: (bank: string) => { rate: number; total: number } | null;
  recommendedBanks: { bank_name: string; fit_score: number }[];
}

const SmartBankInsights: React.FC<SmartBankInsightsProps> = ({
  similarStats,
  getBankSuccessRate,
  recommendedBanks,
}) => {
  if (!similarStats || similarStats.totalSimilar < 2) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
          <History className="h-5 w-5" />
          Historical Insights
          <Badge variant="outline" className="ml-2 text-xs">
            Based on {similarStats.totalSimilar} similar cases
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Success Rate */}
        <div className="flex items-center gap-4 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
          <div className="flex-shrink-0">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
              similarStats.approvalRate >= 70 ? 'bg-green-100 text-green-600' :
              similarStats.approvalRate >= 40 ? 'bg-amber-100 text-amber-600' :
              'bg-red-100 text-red-600'
            }`}>
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Similar Profile Approval Rate</p>
            <div className="flex items-center gap-2">
              <Progress value={similarStats.approvalRate} className="h-2 flex-1" />
              <span className="text-lg font-bold">{similarStats.approvalRate}%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {similarStats.approvedCount} approved, {similarStats.rejectedCount} rejected
            </p>
          </div>
        </div>

        {/* Bank-Specific Stats */}
        {similarStats.bankStats.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-1">
              <Users className="h-4 w-4" />
              Bank Success for Similar Profiles
            </p>
            <div className="space-y-2">
              {similarStats.bankStats.slice(0, 4).map((bank) => {
                const isRecommended = recommendedBanks.some(b => b.bank_name === bank.bank);
                return (
                  <div key={bank.bank} className="flex items-center gap-2 text-sm">
                    <span className="w-28 truncate">{bank.bank}</span>
                    <Progress value={bank.rate} className="h-1.5 flex-1" />
                    <span className={`w-12 text-right font-medium ${
                      bank.rate >= 70 ? 'text-green-600' :
                      bank.rate >= 40 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {bank.rate}%
                    </span>
                    {isRecommended && (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top Rejection Reasons */}
        {similarStats.topRejectionReasons.length > 0 && (
          <div className="flex items-start gap-2 pt-2 border-t">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
            <div className="text-sm">
              <span className="font-medium">Common rejection reasons: </span>
              <span className="text-muted-foreground">
                {similarStats.topRejectionReasons.join(', ')}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartBankInsights;
