import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, Calendar } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type ApplicationStatus = 'draft' | 'submitted' | 'returned' | 'paid' | 'completed' | 'rejected' | 'under_review' | 'approved' | 'need more info';

interface StatusChange {
  previous_status: string;
  new_status: string;
  created_at: string;
  changed_by_role: string;
}

interface Application {
  id: string;
  reference_number: number;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  statusChanges?: StatusChange[];
}

interface ApplicationTimelineProps {
  application: Application;
}

const statusColors = {
  predraft: { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))', label: 'Pre-Draft' },
  draft: { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))', label: 'Draft' },
  submitted: { bg: 'hsl(var(--chart-1))', text: 'hsl(var(--chart-1-foreground))', label: 'Submitted' },
  returned: { bg: 'hsl(var(--chart-3))', text: 'hsl(var(--chart-3-foreground))', label: 'Returned' },
  paid: { bg: 'hsl(var(--chart-2))', text: 'hsl(var(--chart-2-foreground))', label: 'Paid' },
  completed: { bg: 'hsl(var(--chart-2))', text: 'hsl(var(--chart-2-foreground))', label: 'Completed' },
  rejected: { bg: 'hsl(var(--destructive))', text: 'hsl(var(--destructive-foreground))', label: 'Rejected' },
  under_review: { bg: 'hsl(var(--chart-4))', text: 'hsl(var(--chart-4-foreground))', label: 'Under Review' },
  approved: { bg: 'hsl(var(--chart-5))', text: 'hsl(var(--chart-5-foreground))', label: 'Approved' },
  'need more info': { bg: 'hsl(var(--chart-3))', text: 'hsl(var(--chart-3-foreground))', label: 'Need More Info' }
} as Record<ApplicationStatus, { bg: string; text: string; label: string }>;

const ApplicationTimeline = ({ application }: ApplicationTimelineProps) => {
  const statusChanges = application.statusChanges || [];
  
  // Build timeline segments
  const segments: Array<{
    status: ApplicationStatus;
    startDate: Date;
    endDate: Date | null;
    durationDays: number;
    isDelay: boolean;
  }> = [];

  // Create initial draft segment (app creation to first status change or now)
  const createdDate = new Date(application.created_at);
  
  if (statusChanges.length === 0) {
    // Only one segment - from creation to now
    const now = new Date();
    const durationMs = now.getTime() - createdDate.getTime();
    const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));
    
    segments.push({
      status: application.status,
      startDate: createdDate,
      endDate: null,
      durationDays,
      isDelay: durationDays > 7
    });
  } else {
    // Sort status changes chronologically
    const sortedChanges = [...statusChanges].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Create segments from status changes
    sortedChanges.forEach((change, index) => {
      const changeDate = new Date(change.created_at);
      const startDate = index === 0 ? createdDate : new Date(sortedChanges[index - 1].created_at);
      const endDate = changeDate;
      const durationMs = endDate.getTime() - startDate.getTime();
      const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));
      
      const previousStatus = (index === 0 ? 'draft' : sortedChanges[index - 1].new_status) as ApplicationStatus;
      
      segments.push({
        status: previousStatus,
        startDate,
        endDate,
        durationDays,
        isDelay: durationDays > 7 && !['completed', 'rejected', 'paid'].includes(previousStatus)
      });
    });

    // Add current status segment (last status change to now)
    const lastChange = sortedChanges[sortedChanges.length - 1];
    const lastChangeDate = new Date(lastChange.created_at);
    const now = new Date();
    const durationMs = now.getTime() - lastChangeDate.getTime();
    const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));
    
    segments.push({
      status: application.status,
      startDate: lastChangeDate,
      endDate: null,
      durationDays,
      isDelay: durationDays > 7 && !['completed', 'rejected', 'paid'].includes(application.status)
    });
  }

  // Calculate total duration and percentages
  const totalDurationMs = new Date().getTime() - createdDate.getTime();
  const totalDays = Math.floor(totalDurationMs / (1000 * 60 * 60 * 24));

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDuration = (days: number) => {
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    if (days < 7) return `${days} days`;
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    if (remainingDays === 0) return weeks === 1 ? '1 week' : `${weeks} weeks`;
    return `${weeks}w ${remainingDays}d`;
  };

  return (
    <Card className="border-none shadow-none">
      <CardContent className="p-4 space-y-4">
        {/* Timeline Header */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Started: {formatDate(createdDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Total: {formatDuration(totalDays)}</span>
          </div>
        </div>

        {/* Timeline Bar */}
        <div className="relative h-12 bg-muted/30 rounded-lg overflow-hidden">
          <TooltipProvider delayDuration={0}>
            <div className="absolute inset-0 flex">
              {segments.map((segment, index) => {
                const segmentDurationMs = segment.endDate
                  ? segment.endDate.getTime() - segment.startDate.getTime()
                  : new Date().getTime() - segment.startDate.getTime();
                const widthPercent = (segmentDurationMs / totalDurationMs) * 100;
                const colors = statusColors[segment.status];

                return (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <div
                        className="relative h-full flex items-center justify-center border-r border-background"
                        style={{
                          width: `${widthPercent}%`,
                          backgroundColor: colors.bg,
                          color: colors.text
                        }}
                      >
                        {/* Delay indicator */}
                        {segment.isDelay && (
                          <div className="absolute top-0 right-0 p-1">
                            <AlertTriangle className="h-3 w-3 text-destructive animate-pulse" />
                          </div>
                        )}
                        
                        {/* Duration label (only show if segment is wide enough) */}
                        {widthPercent > 15 && (
                          <span className="text-xs font-semibold px-2 py-1 bg-background/20 rounded">
                            {formatDuration(segment.durationDays)}
                          </span>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: colors.bg }}
                          />
                          <span className="font-semibold">{colors.label}</span>
                        </div>
                        <div className="text-xs space-y-1 text-muted-foreground">
                          <div>Started: {formatDate(segment.startDate)}</div>
                          {segment.endDate && <div>Ended: {formatDate(segment.endDate)}</div>}
                          <div className="font-medium">Duration: {formatDuration(segment.durationDays)}</div>
                          {segment.isDelay && (
                            <div className="flex items-center gap-1 text-destructive font-medium">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Delayed (over 7 days)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </div>

        {/* Timeline Legend */}
        <div className="flex flex-wrap gap-3 pt-2">
          {segments.map((segment, index) => {
            const colors = statusColors[segment.status];
            return (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: colors.bg }}
                />
                <span className="text-muted-foreground">
                  {colors.label} ({formatDuration(segment.durationDays)})
                </span>
                {segment.isDelay && (
                  <AlertTriangle className="h-3 w-3 text-destructive" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationTimeline;
