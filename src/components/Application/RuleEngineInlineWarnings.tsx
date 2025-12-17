import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Ban, Clock, Building2 } from 'lucide-react';

interface RuleEngineInlineWarningsProps {
  ruleResult: {
    warnings: string[];
    blocked: boolean;
    blockMessage?: string;
    processingTimeDays: number | null;
    recommendedBanks: string[];
  } | null;
  isActive: boolean;
  showProcessingTime?: boolean;
  showBanks?: boolean;
  className?: string;
}

export const RuleEngineInlineWarnings: React.FC<RuleEngineInlineWarningsProps> = ({
  ruleResult,
  isActive,
  showProcessingTime = false,
  showBanks = false,
  className = ''
}) => {
  if (!isActive || !ruleResult) {
    return null;
  }

  const hasContent = ruleResult.blocked || 
                     ruleResult.warnings.length > 0 || 
                     (showProcessingTime && ruleResult.processingTimeDays !== null) ||
                     (showBanks && ruleResult.recommendedBanks.length > 0);

  if (!hasContent) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Blocked - Critical Alert */}
      {ruleResult.blocked && (
        <Alert variant="destructive" className="py-2">
          <Ban className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {ruleResult.blockMessage || 'This selection is not allowed'}
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {ruleResult.warnings.length > 0 && (
        <Alert className="py-2 border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm text-amber-700 dark:text-amber-400">
            {ruleResult.warnings.length === 1 ? (
              ruleResult.warnings[0]
            ) : (
              <ul className="list-disc list-inside space-y-0.5">
                {ruleResult.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Processing Time Hint */}
      {showProcessingTime && ruleResult.processingTimeDays !== null && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span>Est. processing: <strong className="text-foreground">{ruleResult.processingTimeDays} days</strong></span>
        </div>
      )}

      {/* Recommended Banks Quick View */}
      {showBanks && ruleResult.recommendedBanks.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <span>Recommended:</span>
          </div>
          {ruleResult.recommendedBanks.slice(0, 3).map((bank, idx) => (
            <Badge key={idx} variant="outline" className="text-xs py-0">
              {bank}
            </Badge>
          ))}
          {ruleResult.recommendedBanks.length > 3 && (
            <span className="text-muted-foreground">+{ruleResult.recommendedBanks.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
};
