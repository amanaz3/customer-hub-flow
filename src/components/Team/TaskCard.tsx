import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
  X,
  Trash2,
  Flag,
  Paperclip,
  FileText,
} from 'lucide-react';

interface TaskAttachment {
  id: string;
  file_name: string;
  file_path: string | null;
  file_type: string | null;
  attachment_type: 'file' | 'url';
}

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    type: string;
    priority: string;
    status: string;
    assigned_to: string | null;
    assignee_name?: string;
    product_name?: string;
    module?: string | null;
    category?: string | null;
    architectural_component?: string | null;
  };
  attachments?: TaskAttachment[];
  onClick: () => void;
  onRemoveFromProject?: (taskId: string) => void;
  onRemoveFromProduct?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  showActions?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task,
  attachments = [],
  onClick, 
  onRemoveFromProject,
  onRemoveFromProduct, 
  onDelete,
  showActions = false 
}) => {
  const imageAttachments = attachments.filter(
    (att) => att.attachment_type === 'file' && att.file_type?.startsWith('image/')
  );
  const otherAttachments = attachments.filter(
    (att) => att.attachment_type !== 'file' || !att.file_type?.startsWith('image/')
  );
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
      case 'critical': return 'bg-red-500/20 text-red-600 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-600 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      case 'low': return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
    }
  };

  const getPriorityIcon = () => {
    switch (task.priority) {
      case 'critical': return <AlertCircle className="h-3 w-3" />;
      case 'high': return <AlertCircle className="h-3 w-3" />;
      case 'medium': return <Flag className="h-3 w-3" />;
      case 'low': return <Flag className="h-3 w-3" />;
      default: return <Flag className="h-3 w-3" />;
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
      className="group p-3 rounded-lg border bg-card hover:bg-accent/50 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
          <div className="flex items-center gap-2 mb-2">
            <span className={cn('flex-shrink-0', getPriorityColor())}>
              {getTypeIcon()}
            </span>
            <h4 className="text-sm font-medium text-foreground truncate">
              {task.title}
            </h4>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn('text-xs font-semibold', getPriorityColor())}>
              <span className="flex items-center gap-1">
                {getPriorityIcon()}
                {task.priority}
              </span>
            </Badge>

            <Badge variant="outline" className={cn('text-xs', getStatusColor())}>
              <span className="flex items-center gap-1">
                {getStatusIcon()}
                {task.status.replace('_', ' ')}
              </span>
            </Badge>

            <Badge variant="secondary" className="text-xs">
              <span className="flex items-center gap-1">
                {getTypeIcon()}
                {task.type.replace('_', ' ')}
              </span>
            </Badge>

            {task.architectural_component && (
              <Badge variant="default" className="text-xs">
                {task.architectural_component.replace('_', ' ')}
              </Badge>
            )}

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
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {attachments.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-muted-foreground">
              <Paperclip className="h-3 w-3" />
              <span className="text-xs font-medium">{attachments.length}</span>
            </div>
          )}
          
          {task.assigned_to && task.assignee_name && (
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {getInitials(task.assignee_name)}
              </AvatarFallback>
            </Avatar>
          )}
          
          {showActions && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {(onRemoveFromProject || onRemoveFromProduct) && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onRemoveFromProduct) {
                      onRemoveFromProduct(task.id);
                    } else if (onRemoveFromProject) {
                      onRemoveFromProject(task.id);
                    }
                  }}
                  title={onRemoveFromProduct ? "Remove from product" : "Remove from project"}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              {onDelete && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                  title="Delete task"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            {/* Image Thumbnails */}
            {imageAttachments.length > 0 && (
              <div className="flex gap-1">
                {imageAttachments.slice(0, 3).map((att) => (
                  <div
                    key={att.id}
                    className="w-10 h-10 rounded border bg-muted overflow-hidden flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick();
                    }}
                  >
                    <img
                      src={`https://gddibkhyhcnejxthsyzu.supabase.co/storage/v1/object/public/task-attachments/${att.file_path}`}
                      alt={att.file_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {imageAttachments.length > 3 && (
                  <div className="w-10 h-10 rounded border bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                    +{imageAttachments.length - 3}
                  </div>
                )}
              </div>
            )}

            {/* Other Attachments Count */}
            {otherAttachments.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" />
                <span>{otherAttachments.length}</span>
              </div>
            )}

            {/* Total Attachments Badge */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <Paperclip className="h-3 w-3" />
              <span>{attachments.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
