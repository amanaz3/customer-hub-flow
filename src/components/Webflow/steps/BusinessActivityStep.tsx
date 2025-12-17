import React, { useState, useMemo } from 'react';
import { useWebflow } from '@/contexts/WebflowContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, AlertTriangle, Check, Info, HelpCircle, ShieldAlert, Loader2, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWebflowData, filterActivitiesByJurisdiction } from '@/hooks/useWebflowData';

const getRiskBadgeVariant = (riskLevel: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (riskLevel) {
    case 'high': return 'destructive';
    case 'standard': return 'secondary';
    default: return 'outline';
  }
};

export const BusinessActivityStep: React.FC = () => {
  const { state, updateState } = useWebflow();
  const [search, setSearch] = useState('');
  const { activities, loading } = useWebflowData();

  // Filter activities by jurisdiction (uses allowed_jurisdictions from DB)
  const jurisdictionFilteredActivities = useMemo(() => {
    return filterActivitiesByJurisdiction(activities, state.locationType);
  }, [activities, state.locationType]);

  // Then filter by search
  const filteredActivities = useMemo(() => {
    return jurisdictionFilteredActivities.filter(
      a => a.activity_name.toLowerCase().includes(search.toLowerCase()) ||
           a.category.toLowerCase().includes(search.toLowerCase()) ||
           a.activity_code.toLowerCase().includes(search.toLowerCase())
    );
  }, [jurisdictionFilteredActivities, search]);

  const selectedActivity = activities.find(a => a.activity_code === state.activityCode);

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2">
            <CardTitle className="text-2xl">What will your business do?</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Choose your primary business activity. This helps with compliance and banking.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription className="text-base">
            Select your primary business activity from our approved list
            {state.locationType && (
              <span className="block text-xs mt-1 text-muted-foreground">
                Showing activities available for {state.locationType} setup
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          {filteredActivities.length === 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No activities found matching your search or jurisdiction. Try a different search term or contact support.
              </AlertDescription>
            </Alert>
          )}

          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
            {filteredActivities.map(activity => (
              <button
                key={activity.id}
                onClick={() => !activity.is_restricted && updateState({ 
                  activityCode: activity.activity_code, 
                  activityName: activity.activity_name 
                })}
                disabled={activity.is_restricted}
                className={cn(
                  "w-full p-4 rounded-lg border text-left transition-all",
                  activity.is_restricted && "opacity-50 cursor-not-allowed bg-muted/50",
                  state.activityCode === activity.activity_code
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{activity.activity_name}</span>
                      {state.activityCode === activity.activity_code && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                      {activity.risk_level !== 'low' && (
                        <Badge variant={getRiskBadgeVariant(activity.risk_level)} className="text-xs">
                          {activity.risk_level === 'high' ? 'High Risk' : 'Standard'}
                        </Badge>
                      )}
                      {activity.is_restricted && (
                        <Badge variant="destructive" className="text-xs">
                          Restricted
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">{activity.activity_code}</span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{activity.category}</span>
                      {activity.price_modifier > 0 && (
                        <span className="text-xs text-amber-600 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          +AED {activity.price_modifier.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {activity.is_restricted && activity.restriction_reason && (
                      <p className="text-xs text-destructive mt-1">{activity.restriction_reason}</p>
                    )}
                  </div>
                  {activity.risk_level === 'high' && !activity.is_restricted && (
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 ml-2" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Warning Alert */}
      {selectedActivity?.risk_level === 'high' && !selectedActivity.is_restricted && (
        <Alert variant="default" className="border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">High-Risk Activity Selected</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            <p className="mb-2">
              This activity may require additional compliance checks and could affect bank account eligibility.
            </p>
            {selectedActivity.price_modifier > 0 && (
              <p className="text-sm">
                <strong>Additional fee:</strong> AED {selectedActivity.price_modifier.toLocaleString()} will be added to your total.
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Enhanced Due Diligence Warning */}
      {selectedActivity?.enhanced_due_diligence && selectedActivity.edd_requirements.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800">
          <ShieldAlert className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800 dark:text-orange-200">Enhanced Due Diligence Required</AlertTitle>
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            <p className="mb-2">You will need to provide additional documentation:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              {selectedActivity.edd_requirements.map((req, i) => (
                <li key={i}>{req}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Restricted Activities Info */}
      {filteredActivities.some(a => a.is_restricted) && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Some activities require special licensing and are not available through self-service. Contact our team for assistance with restricted activities.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
