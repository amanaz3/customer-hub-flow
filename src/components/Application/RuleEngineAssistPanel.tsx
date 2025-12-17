import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  FileText, 
  Clock, 
  AlertTriangle, 
  Ban,
  Zap,
  CheckCircle2,
  DollarSign,
  SkipForward,
  ArrowRight
} from 'lucide-react';

interface RuleEngineAssistPanelProps {
  ruleResult: {
    priceMultiplier: number;
    additionalFees: number;
    requiredDocuments: string[];
    warnings: string[];
    blocked: boolean;
    blockMessage?: string;
    processingTimeDays: number | null;
    recommendedBanks: string[];
    appliedRules: string[];
    skippedSteps?: string[];
    visibleSteps?: string[];
    nextStep?: string;
  } | null;
  loading?: boolean;
  isActive?: boolean;
}

export const RuleEngineAssistPanel: React.FC<RuleEngineAssistPanelProps> = ({
  ruleResult,
  loading = false,
  isActive = false
}) => {
  if (!isActive) {
    return (
      <div className="p-4 text-center">
        <Zap className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">
          Rule engine is disabled. Enable it from the toggle above to get AI-powered assistance.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!ruleResult) {
    return (
      <div className="p-4 text-center">
        <FileText className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">
          Fill in service details to see AI-powered recommendations.
        </p>
      </div>
    );
  }

  const hasData = ruleResult.recommendedBanks.length > 0 || 
                  ruleResult.requiredDocuments.length > 0 || 
                  ruleResult.warnings.length > 0 ||
                  ruleResult.processingTimeDays !== null ||
                  ruleResult.appliedRules.length > 0 ||
                  (ruleResult.skippedSteps && ruleResult.skippedSteps.length > 0) ||
                  ruleResult.nextStep;

  if (!hasData) {
    return (
      <div className="p-4 text-center">
        <CheckCircle2 className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">
          No specific rules apply yet. Continue filling the form.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3 overflow-y-auto">
      {/* Blocked Alert */}
      {ruleResult.blocked && (
        <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
          <Ban className="h-4 w-4" />
          <AlertDescription className="text-sm font-medium">
            {ruleResult.blockMessage || 'This combination is not allowed'}
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {ruleResult.warnings.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2 px-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              Warnings ({ruleResult.warnings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <ul className="space-y-1.5">
              {ruleResult.warnings.map((warning, idx) => (
                <li key={idx} className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                  <span className="mt-0.5">•</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recommended Banks */}
      {ruleResult.recommendedBanks.length > 0 && (
        <Card>
          <CardHeader className="pb-2 px-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Recommended Banks
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="flex flex-wrap gap-1.5">
              {ruleResult.recommendedBanks.map((bank, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {bank}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Time */}
      {ruleResult.processingTimeDays !== null && (
        <Card>
          <CardHeader className="pb-2 px-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Estimated Processing
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">
                {ruleResult.processingTimeDays}
              </span>
              <span className="text-sm text-muted-foreground">
                business days
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Flow Control */}
      {((ruleResult.skippedSteps && ruleResult.skippedSteps.length > 0) || ruleResult.nextStep) && (
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardHeader className="pb-2 px-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-600">
              <SkipForward className="h-4 w-4" />
              Step Flow
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-2">
            {ruleResult.skippedSteps && ruleResult.skippedSteps.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Skipped Steps:</p>
                <div className="flex flex-wrap gap-1">
                  {ruleResult.skippedSteps.map((step, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                      {step}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {ruleResult.nextStep && (
              <div className="flex items-center gap-2 text-xs">
                <ArrowRight className="h-3 w-3 text-blue-600" />
                <span className="text-muted-foreground">Next:</span>
                <Badge variant="outline" className="text-xs border-blue-500 text-blue-600">
                  {ruleResult.nextStep}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {(ruleResult.priceMultiplier !== 1 || ruleResult.additionalFees > 0) && (
        <Card>
          <CardHeader className="pb-2 px-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Pricing Adjustments
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-1.5">
            {ruleResult.priceMultiplier !== 1 && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Price Multiplier</span>
                <Badge variant={ruleResult.priceMultiplier > 1 ? "destructive" : "secondary"}>
                  {ruleResult.priceMultiplier}x
                </Badge>
              </div>
            )}
            {ruleResult.additionalFees > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Additional Fees</span>
                <Badge variant="outline">
                  +AED {ruleResult.additionalFees.toLocaleString()}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Required Documents from Rules */}
      {ruleResult.requiredDocuments.length > 0 && (
        <Card>
          <CardHeader className="pb-2 px-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Additional Documents Required
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <ul className="space-y-1">
              {ruleResult.requiredDocuments.map((doc, idx) => (
                <li key={idx} className="text-xs flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Applied Rules (collapsed by default) */}
      {ruleResult.appliedRules.length > 0 && (
        <div className="pt-2 border-t">
          <p className="text-[10px] text-muted-foreground mb-1">
            {ruleResult.appliedRules.length} rule(s) applied
          </p>
          <div className="flex flex-wrap gap-1">
            {ruleResult.appliedRules.slice(0, 3).map((rule, idx) => (
              <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0">
                {rule}
              </Badge>
            ))}
            {ruleResult.appliedRules.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{ruleResult.appliedRules.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
