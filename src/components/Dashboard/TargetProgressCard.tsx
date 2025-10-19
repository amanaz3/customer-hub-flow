import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TargetProgressCardProps {
  title: string;
  current: number;
  target: number;
  icon: LucideIcon;
  description: string;
  progress: number;
  status: 'green' | 'yellow' | 'red' | 'gray';
  onClick?: () => void;
  isActive?: boolean;
  formatValue?: (value: number) => string;
}

export const TargetProgressCard = ({
  title,
  current,
  target,
  icon: Icon,
  description,
  progress,
  status,
  onClick,
  isActive,
  formatValue = (v) => v.toString(),
}: TargetProgressCardProps) => {
  const statusColors = {
    green: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-600 dark:text-emerald-400',
      progress: 'bg-emerald-500',
      icon: 'text-emerald-600',
    },
    yellow: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-600 dark:text-amber-400',
      progress: 'bg-amber-500',
      icon: 'text-amber-600',
    },
    red: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      text: 'text-red-600 dark:text-red-400',
      progress: 'bg-red-500',
      icon: 'text-red-600',
    },
    gray: {
      bg: 'bg-muted/50',
      border: 'border-border',
      text: 'text-muted-foreground',
      progress: 'bg-muted-foreground',
      icon: 'text-muted-foreground',
    },
  };

  const colors = statusColors[status];
  const remaining = Math.max(target - current, 0);

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        colors.border,
        isActive && "ring-2 ring-primary shadow-lg"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("p-3 rounded-lg", colors.bg)}>
            <Icon className={cn("h-6 w-6", colors.icon)} />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {formatValue(current)} / {formatValue(target)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {remaining > 0 ? `${formatValue(remaining)} to go` : 'Target reached! 🎉'}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{title}</span>
            <span className={cn("font-semibold", colors.text)}>
              {progress.toFixed(0)}%
            </span>
          </div>
          
          <Progress 
            value={progress} 
            className="h-2"
          />
          
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
