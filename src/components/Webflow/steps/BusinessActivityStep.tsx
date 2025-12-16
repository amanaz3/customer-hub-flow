import React, { useState } from 'react';
import { useWebflow } from '@/contexts/WebflowContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, AlertTriangle, Check, Info, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const activities = [
  { code: 'IT001', name: 'Software Development', category: 'Technology', risk: 'low' },
  { code: 'IT002', name: 'IT Consulting', category: 'Technology', risk: 'low' },
  { code: 'IT003', name: 'E-commerce', category: 'Technology', risk: 'low' },
  { code: 'TR001', name: 'General Trading', category: 'Trading', risk: 'medium' },
  { code: 'TR002', name: 'Import/Export', category: 'Trading', risk: 'medium' },
  { code: 'TR003', name: 'Gold & Precious Metals Trading', category: 'Trading', risk: 'high' },
  { code: 'CS001', name: 'Management Consulting', category: 'Consulting', risk: 'low' },
  { code: 'CS002', name: 'Business Consulting', category: 'Consulting', risk: 'low' },
  { code: 'RE001', name: 'Real Estate Brokerage', category: 'Real Estate', risk: 'medium' },
  { code: 'RE002', name: 'Property Management', category: 'Real Estate', risk: 'low' },
  { code: 'FN001', name: 'Money Exchange', category: 'Financial', risk: 'high', blocked: true },
  { code: 'FN002', name: 'Cryptocurrency Trading', category: 'Financial', risk: 'high', blocked: true },
  { code: 'MK001', name: 'Digital Marketing', category: 'Marketing', risk: 'low' },
  { code: 'MK002', name: 'Advertising Agency', category: 'Marketing', risk: 'low' },
  { code: 'ED001', name: 'Training & Education', category: 'Education', risk: 'low' },
  { code: 'HC001', name: 'Health & Wellness', category: 'Healthcare', risk: 'medium' },
];

export const BusinessActivityStep: React.FC = () => {
  const { state, updateState } = useWebflow();
  const [search, setSearch] = useState('');

  const filteredActivities = activities.filter(
    a => a.name.toLowerCase().includes(search.toLowerCase()) ||
         a.category.toLowerCase().includes(search.toLowerCase()) ||
         a.code.toLowerCase().includes(search.toLowerCase())
  );

  const selectedActivity = activities.find(a => a.code === state.activityCode);

  return (
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

        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
          {filteredActivities.map(activity => (
            <button
              key={activity.code}
              onClick={() => !activity.blocked && updateState({ 
                activityCode: activity.code, 
                activityName: activity.name 
              })}
              disabled={activity.blocked}
              className={cn(
                "w-full p-4 rounded-lg border text-left transition-all",
                activity.blocked && "opacity-50 cursor-not-allowed",
                state.activityCode === activity.code
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{activity.name}</span>
                    {state.activityCode === activity.code && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{activity.code}</span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">{activity.category}</span>
                  </div>
                </div>
                {activity.risk === 'high' && (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                )}
              </div>
            </button>
          ))}
        </div>

        {selectedActivity?.risk === 'high' && !selectedActivity.blocked && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This activity may require additional compliance checks and could affect bank account eligibility.
            </AlertDescription>
          </Alert>
        )}

        {filteredActivities.some(a => a.blocked) && (
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Some activities require special licensing and are not available through self-service. Contact our team for assistance.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
