import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, differenceInDays } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StatusChange {
  previous_status: string;
  new_status: string;
  created_at: string;
  changed_by_role: string;
}

interface Application {
  id: string;
  reference_number: number;
  status: string;
  created_at: string;
  customer?: {
    name: string;
    company: string;
  } | null;
  statusChanges?: StatusChange[];
}

interface ApplicationsGanttChartProps {
  applications: Application[];
}

const statusColors: Record<string, string> = {
  draft: "hsl(var(--chart-1))",
  submitted: "hsl(var(--chart-2))",
  "under_review": "hsl(var(--chart-3))",
  approved: "hsl(var(--chart-4))",
  paid: "hsl(var(--chart-5))",
  completed: "hsl(142 76% 36%)",
  rejected: "hsl(0 84% 60%)",
  returned: "hsl(25 95% 53%)",
  "need more info": "hsl(262 83% 58%)",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  "under_review": "Under Review",
  approved: "Approved",
  paid: "Paid",
  completed: "Completed",
  rejected: "Rejected",
  returned: "Returned",
  "need more info": "Need More Info",
};

export const ApplicationsGanttChart = ({ applications }: ApplicationsGanttChartProps) => {
  if (!applications || applications.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">No applications to display</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate timeline bounds
  const allDates = applications.flatMap(app => {
    const dates = [new Date(app.created_at)];
    if (app.statusChanges) {
      dates.push(...app.statusChanges.map(sc => new Date(sc.created_at)));
    }
    return dates;
  });
  
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
  const totalDays = differenceInDays(maxDate, minDate) || 1;

  // Process each application into segments
  const processedApps = applications.map(app => {
    const changes = app.statusChanges || [];
    const sortedChanges = [...changes].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const segments: Array<{
      status: string;
      startDate: Date;
      endDate: Date;
      durationDays: number;
      isDelay: boolean;
    }> = [];

    let currentStatus = 'draft';
    let currentStartDate = new Date(app.created_at);

    sortedChanges.forEach((change, index) => {
      const changeDate = new Date(change.created_at);
      const duration = differenceInDays(changeDate, currentStartDate);
      
      segments.push({
        status: currentStatus,
        startDate: currentStartDate,
        endDate: changeDate,
        durationDays: duration,
        isDelay: duration > 7,
      });

      currentStatus = change.new_status;
      currentStartDate = changeDate;
    });

    // Add final segment (current status)
    const finalDuration = differenceInDays(maxDate, currentStartDate);
    segments.push({
      status: currentStatus,
      startDate: currentStartDate,
      endDate: maxDate,
      durationDays: finalDuration,
      isDelay: finalDuration > 7,
    });

    return {
      ...app,
      segments,
    };
  });

  // Calculate position percentages for segments
  const getPosition = (date: Date) => {
    const daysFromStart = differenceInDays(date, minDate);
    return (daysFromStart / totalDays) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Timeline</CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{format(minDate, 'MMM d, yyyy')}</span>
          <span>→</span>
          <span>{format(maxDate, 'MMM d, yyyy')}</span>
          <span className="ml-2">({totalDays} days)</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {processedApps.map((app) => (
            <div key={app.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">#{app.reference_number}</span>
                  <span className="text-sm text-muted-foreground">
                    {app.customer?.name} - {app.customer?.company}
                  </span>
                </div>
                <Badge variant="outline">{statusLabels[app.status] || app.status}</Badge>
              </div>
              
              {/* Gantt bar */}
              <div className="relative h-8 bg-muted rounded-md overflow-hidden">
                {app.segments.map((segment, idx) => {
                  const left = getPosition(segment.startDate);
                  const width = getPosition(segment.endDate) - left;
                  
                  return (
                    <div
                      key={idx}
                      className="absolute top-0 bottom-0 flex items-center justify-center text-xs font-medium text-white transition-opacity hover:opacity-90"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        backgroundColor: statusColors[segment.status] || 'hsl(var(--muted))',
                      }}
                      title={`${statusLabels[segment.status] || segment.status}: ${segment.durationDays} days`}
                    >
                      {width > 8 && (
                        <span className="truncate px-1">
                          {statusLabels[segment.status] || segment.status}
                          {segment.isDelay && (
                            <AlertTriangle className="inline-block ml-1 h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Segment details */}
              <div className="flex flex-wrap gap-2 text-xs">
                {app.segments.map((segment, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 px-2 py-1 rounded"
                    style={{
                      backgroundColor: statusColors[segment.status] + '20',
                      borderLeft: `3px solid ${statusColors[segment.status]}`,
                    }}
                  >
                    <span>{statusLabels[segment.status] || segment.status}</span>
                    <span className="text-muted-foreground">
                      {segment.durationDays}d
                    </span>
                    {segment.isDelay && (
                      <AlertTriangle className="h-3 w-3 text-destructive" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <p className="text-sm font-medium mb-2">Status Legend</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusLabels).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2 text-sm">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: statusColors[key] }}
                />
                <span>{label}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 text-sm ml-4">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span>Delay (7+ days)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
