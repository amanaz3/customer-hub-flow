import React, { useState } from 'react';
import { useWebflow } from '@/contexts/WebflowContext';
import { SimpleStepLayout } from '@/components/WebflowSimple/SimpleStepLayout';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Check, AlertTriangle, Ban, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const activities = [
  { code: 'IT001', name: 'Software Development', category: 'Technology', risk: 'low', emoji: '💻' },
  { code: 'IT002', name: 'IT Consulting', category: 'Technology', risk: 'low', emoji: '🖥️' },
  { code: 'IT003', name: 'E-commerce', category: 'Technology', risk: 'low', emoji: '🛒' },
  { code: 'TR001', name: 'General Trading', category: 'Trading', risk: 'medium', emoji: '📦' },
  { code: 'TR002', name: 'Import/Export', category: 'Trading', risk: 'medium', emoji: '🚢' },
  { code: 'TR003', name: 'Gold & Precious Metals Trading', category: 'Trading', risk: 'high', emoji: '💎' },
  { code: 'CS001', name: 'Management Consulting', category: 'Consulting', risk: 'low', emoji: '📊' },
  { code: 'CS002', name: 'Business Consulting', category: 'Consulting', risk: 'low', emoji: '💼' },
  { code: 'RE001', name: 'Real Estate Brokerage', category: 'Real Estate', risk: 'medium', emoji: '🏠' },
  { code: 'RE002', name: 'Property Management', category: 'Real Estate', risk: 'low', emoji: '🏢' },
  { code: 'FN001', name: 'Money Exchange', category: 'Financial', risk: 'high', blocked: true, emoji: '💱' },
  { code: 'FN002', name: 'Cryptocurrency Trading', category: 'Financial', risk: 'high', blocked: true, emoji: '₿' },
  { code: 'MK001', name: 'Digital Marketing', category: 'Marketing', risk: 'low', emoji: '📱' },
  { code: 'MK002', name: 'Advertising Agency', category: 'Marketing', risk: 'low', emoji: '📣' },
  { code: 'ED001', name: 'Training & Education', category: 'Education', risk: 'low', emoji: '📚' },
  { code: 'HC001', name: 'Health & Wellness', category: 'Healthcare', risk: 'medium', emoji: '🏥' },
];

export const ActivityPage: React.FC = () => {
  const { state, updateState } = useWebflow();
  const [search, setSearch] = useState('');

  const filteredActivities = activities.filter(
    a => a.name.toLowerCase().includes(search.toLowerCase()) ||
         a.category.toLowerCase().includes(search.toLowerCase())
  );

  const selectedActivity = activities.find(a => a.code === state.activityCode);

  return (
    <SimpleStepLayout
      step={4}
      title="What will you do?"
      subtitle="Select your primary business activity"
      nextPath="/webflow-simple/plans"
      prevPath="/webflow-simple/jurisdiction"
      backgroundVariant="gradient"
    >
      <div className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-14 text-lg border-2"
          />
        </div>

        {/* Selected Activity Preview */}
        {selectedActivity && (
          <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-xl animate-fade-in">
            <span className="text-2xl">{selectedActivity.emoji}</span>
            <div>
              <p className="font-medium">{selectedActivity.name}</p>
              <p className="text-sm text-muted-foreground">{selectedActivity.category}</p>
            </div>
            <Sparkles className="w-5 h-5 text-primary ml-auto" />
          </div>
        )}

        {/* Activities List */}
        <div className="max-h-[320px] overflow-y-auto space-y-2 pr-2">
          {filteredActivities.map(activity => {
            const isSelected = state.activityCode === activity.code;

            return (
              <button
                key={activity.code}
                onClick={() => !activity.blocked && updateState({ 
                  activityCode: activity.code, 
                  activityName: activity.name 
                })}
                disabled={activity.blocked}
                className={cn(
                  "w-full p-4 rounded-xl border-2 text-left transition-all",
                  activity.blocked && "opacity-50 cursor-not-allowed bg-destructive/5 border-destructive/20",
                  isSelected && !activity.blocked && "border-primary bg-primary/5 scale-[1.01]",
                  !isSelected && !activity.blocked && "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{activity.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{activity.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                      {activity.blocked && <Ban className="w-4 h-4 text-destructive" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{activity.code}</span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{activity.category}</span>
                      {activity.risk === 'high' && !activity.blocked && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          High Risk
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {selectedActivity?.risk === 'high' && !selectedActivity.blocked && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              This activity may require additional compliance checks and could affect bank account eligibility.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </SimpleStepLayout>
  );
};
