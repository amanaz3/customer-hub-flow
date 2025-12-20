import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  ChevronRight,
  User,
  Bot,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaxFilingJob } from '@/hooks/useTaxFilingJobs';
import { formatDistanceToNow } from 'date-fns';

interface JobCardProps {
  job: TaxFilingJob;
  onClick: () => void;
  selected?: boolean;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  pending: { label: 'Pending', variant: 'outline', icon: <Clock className="h-3 w-3" /> },
  queued: { label: 'Queued', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  processing: { label: 'Processing', variant: 'default', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  awaiting_review: { label: 'Awaiting Review', variant: 'secondary', icon: <User className="h-3 w-3" /> },
  approved: { label: 'Approved', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
  submitted: { label: 'Submitted', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
  completed: { label: 'Completed', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
  failed: { label: 'Failed', variant: 'destructive', icon: <AlertTriangle className="h-3 w-3" /> },
  cancelled: { label: 'Cancelled', variant: 'outline', icon: <AlertTriangle className="h-3 w-3" /> },
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: 'text-muted-foreground', label: 'Low' },
  standard: { color: 'text-foreground', label: 'Standard' },
  high: { color: 'text-amber-600', label: 'High' },
  premium: { color: 'text-purple-600', label: 'Premium' },
  urgent: { color: 'text-red-600', label: 'Urgent' },
};

const modeIcons: Record<string, React.ReactNode> = {
  manual: <User className="h-3 w-3" />,
  ai_orchestrated: <Bot className="h-3 w-3" />,
  background: <Zap className="h-3 w-3" />,
};

export function JobCard({ job, onClick, selected }: JobCardProps) {
  const status = statusConfig[job.status] || statusConfig.pending;
  const priority = priorityConfig[job.priority] || priorityConfig.standard;

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
        selected && "border-primary ring-2 ring-primary/20"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <span className="font-mono font-semibold text-sm truncate">
                {job.reference_number}
              </span>
              <Badge variant={status.variant} className="text-xs gap-1 shrink-0">
                {status.icon}
                {status.label}
              </Badge>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span>Year:</span>
                <span className="font-medium text-foreground">{job.tax_year}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Type:</span>
                <span className="font-medium text-foreground capitalize">
                  {job.filing_period_type.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span>Priority:</span>
                <span className={cn("font-medium", priority.color)}>
                  {priority.label}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span>Mode:</span>
                <span className="font-medium text-foreground flex items-center gap-1">
                  {modeIcons[job.execution_mode]}
                  <span className="capitalize">{job.execution_mode.replace('_', ' ')}</span>
                </span>
              </div>
            </div>

            {/* Risk & Queue */}
            <div className="flex items-center gap-2 mt-2">
              {job.risk_category && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    job.risk_category === 'critical' && "bg-red-500/10 text-red-600 border-red-500/30",
                    job.risk_category === 'high' && "bg-amber-500/10 text-amber-600 border-amber-500/30",
                    job.risk_category === 'medium' && "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
                    job.risk_category === 'low' && "bg-green-500/10 text-green-600 border-green-500/30"
                  )}
                >
                  Risk: {job.risk_category}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                Queue: {job.current_queue}
              </Badge>
            </div>

            {/* Timestamp */}
            <div className="text-xs text-muted-foreground mt-2">
              Created {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
            </div>
          </div>

          <Button variant="ghost" size="icon" className="shrink-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
