import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Phone,
  MessageCircle,
  Mail,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { differenceInDays, format, addDays } from 'date-fns';

interface FollowupStep {
  id: string;
  day_offset: number;
  action_type: 'whatsapp' | 'call' | 'email' | 'note';
  action_title: string;
  action_description: string | null;
  auto_mark_cold: boolean;
  is_enabled: boolean;
}

interface LeadActivity {
  id: string;
  activity_type: string;
  description: string | null;
  created_at: string;
}

interface Props {
  leadId: string;
  leadCreatedAt: string;
  activities: LeadActivity[];
  onLogActivity: (type: string, description: string) => Promise<boolean>;
}

const actionIcons: Record<string, React.ReactNode> = {
  call: <Phone className="h-4 w-4" />,
  whatsapp: <MessageCircle className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  note: <FileText className="h-4 w-4" />,
};

const actionColors: Record<string, string> = {
  call: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  whatsapp: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  email: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  note: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
};

export function LeadFollowupTimeline({ leadId, leadCreatedAt, activities, onLogActivity }: Props) {
  const [steps, setSteps] = useState<FollowupStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingStep, setLoggingStep] = useState<string | null>(null);

  useEffect(() => {
    const fetchSteps = async () => {
      try {
        const { data, error } = await supabase
          .from('lead_followup_sequence')
          .select('*')
          .eq('is_enabled', true)
          .order('day_offset', { ascending: true });

        if (error) throw error;
        setSteps((data || []) as FollowupStep[]);
      } catch (error) {
        console.error('Error fetching sequence:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSteps();
  }, []);

  const daysSinceCreation = useMemo(() => {
    return differenceInDays(new Date(), new Date(leadCreatedAt));
  }, [leadCreatedAt]);

  const stepStatus = useMemo(() => {
    const status: Record<string, { completed: boolean; activity?: LeadActivity }> = {};

    steps.forEach((step) => {
      // Find matching activity for this step
      const matchingActivity = activities.find((a) => {
        const activityDay = differenceInDays(new Date(a.created_at), new Date(leadCreatedAt));
        return (
          a.activity_type === step.action_type &&
          activityDay >= step.day_offset
        );
      });

      status[step.id] = {
        completed: !!matchingActivity,
        activity: matchingActivity,
      };
    });

    return status;
  }, [steps, activities, leadCreatedAt]);

  const handleQuickLog = async (step: FollowupStep) => {
    setLoggingStep(step.id);
    try {
      await onLogActivity(step.action_type, `${step.action_title}: ${step.action_description || ''}`);
    } finally {
      setLoggingStep(null);
    }
  };

  if (loading) {
    return null;
  }

  if (steps.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Follow-up Sequence</span>
          <Badge variant="outline" className="font-normal">
            Day {daysSinceCreation}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[22px] top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-4">
            {steps.map((step, index) => {
              const status = stepStatus[step.id];
              const isToday = step.day_offset === daysSinceCreation;
              const isPast = step.day_offset < daysSinceCreation;
              const isOverdue = isPast && !status?.completed;
              const dueDate = addDays(new Date(leadCreatedAt), step.day_offset);

              return (
                <div key={step.id} className="relative flex gap-3">
                  {/* Timeline dot */}
                  <div
                    className={`relative z-10 flex-shrink-0 w-11 h-11 rounded-full border-2 flex items-center justify-center ${
                      status?.completed
                        ? 'bg-green-100 border-green-500 text-green-600 dark:bg-green-900/30'
                        : isOverdue
                        ? 'bg-red-100 border-red-500 text-red-600 dark:bg-red-900/30'
                        : isToday
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-muted border-muted-foreground/30 text-muted-foreground'
                    }`}
                  >
                    {status?.completed ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : isOverdue ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : (
                      actionIcons[step.action_type]
                    )}
                  </div>

                  {/* Content */}
                  <div
                    className={`flex-1 p-3 rounded-lg border ${
                      status?.completed
                        ? 'bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800'
                        : isToday
                        ? 'bg-primary/5 border-primary/30'
                        : isOverdue
                        ? 'bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-800'
                        : 'bg-muted/30 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`text-xs font-mono ${actionColors[step.action_type]}`}
                          >
                            Day {step.day_offset}
                          </Badge>
                          <span className="font-medium text-sm">{step.action_title}</span>
                          {isToday && (
                            <Badge className="bg-primary text-primary-foreground text-xs">
                              Today
                            </Badge>
                          )}
                          {isOverdue && !status?.completed && (
                            <Badge variant="destructive" className="text-xs">
                              Overdue
                            </Badge>
                          )}
                          {step.auto_mark_cold && (
                            <Badge variant="secondary" className="text-xs">
                              Auto Cold
                            </Badge>
                          )}
                        </div>
                        {step.action_description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {step.action_description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {format(dueDate, 'MMM d, yyyy')}
                          {status?.activity && (
                            <span className="ml-2 text-green-600 dark:text-green-400">
                              ✓ Completed {format(new Date(status.activity.created_at), 'MMM d')}
                            </span>
                          )}
                        </p>
                      </div>
                      {!status?.completed && (isPast || isToday) && (
                        <Button
                          size="sm"
                          variant={isOverdue ? 'destructive' : 'default'}
                          onClick={() => handleQuickLog(step)}
                          disabled={loggingStep === step.id}
                        >
                          {loggingStep === step.id ? 'Logging...' : 'Log Action'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}