import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  Bug,
  Lightbulb,
  CheckCircle2,
  Circle,
  Clock,
  Eye,
  Ban,
  Zap,
} from 'lucide-react';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    type: string;
    priority: string;
    status: string;
    assigned_to: string | null;
    assignee_name?: string;
    project_name?: string;
    module?: string | null;
    category?: string | null;
  };
  onClick: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const getTypeIcon = () => {
    switch (task.type) {
      case 'bug': return <Bug className="h-4 w-4" />;
      case 'feature': return <Lightbulb className="h-4 w-4" />;
      case 'enhancement': return <Zap className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const getStatusIcon = () => {
    switch (task.status) {
      case 'done': return <CheckCircle2 className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'in_review': return <Eye className="h-4 w-4" />;
      case 'blocked': return <Ban className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = () => {
    switch (task.priority) {
      case 'critical': return 'text-destructive';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusColor = () => {
    switch (task.status) {
      case 'done': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'in_progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'in_review': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'blocked': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      onClick={onClick}
      className="group p-3 rounded-lg border bg-card hover:bg-accent/50 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={cn('flex-shrink-0', getPriorityColor())}>
              {getTypeIcon()}
            </span>
            <h4 className="text-sm font-medium text-foreground truncate">
              {task.title}
            </h4>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn('text-xs', getStatusColor())}>
              <span className="flex items-center gap-1">
                {getStatusIcon()}
                {task.status.replace('_', ' ')}
              </span>
            </Badge>

            {task.module && (
              <Badge variant="secondary" className="text-xs">
                {task.module}
              </Badge>
            )}

            {task.category && (
              <Badge variant="outline" className="text-xs bg-accent/50">
                {task.category.replace('_', ' ')}
              </Badge>
            )}

            {task.project_name && (
              <Badge variant="outline" className="text-xs">
                {task.project_name}
              </Badge>
            )}
          </div>
        </div>

        {task.assigned_to && task.assignee_name && (
          <Avatar className="h-6 w-6 flex-shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials(task.assignee_name)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
};
