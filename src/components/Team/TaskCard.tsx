import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
  CornerDownRight,
  ListTree,
  Plus,
  Sparkles,
  Loader2,
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
    description?: string | null;
    type: string;
    priority: string;
    status: string;
    assigned_to: string | null;
    assignee_name?: string;
    product_name?: string;
    cycle_id?: string | null;
    cycle_name?: string | null;
    module?: string | null;
    category?: string | null;
    architectural_component?: string | null;
    parent_id?: string | null;
    github_repo?: string | null;
    github_branch?: string | null;
    importance?: string | null;
    importance_reason?: string | null;
  };
  attachments?: TaskAttachment[];
  onClick: (taskId: string) => void;
  onRemoveFromProject?: (taskId: string) => void;
  onRemoveFromProduct?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  showActions?: boolean;
  subtasks?: TaskCardProps['task'][];
  subtaskAttachments?: Record<string, TaskAttachment[]>;
  onAddSubtask?: (parentTaskId: string) => void;
  onImportanceChange?: (taskId: string, importance: string | null) => void;
  onAIAssignImportance?: (parentTaskId: string) => void;
  isAssigningImportance?: boolean;
}

// Helper functions for status and priority icons/colors
const getTypeIcon = (type: string) => {
  switch (type) {
    case 'bug': return <Bug className="h-4 w-4" />;
    case 'feature': return <Lightbulb className="h-4 w-4" />;
    case 'enhancement': return <Zap className="h-4 w-4" />;
    default: return <Circle className="h-4 w-4" />;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'done': return <CheckCircle2 className="h-4 w-4" />;
    case 'in_progress': return <Clock className="h-4 w-4" />;
    case 'in_review': return <Eye className="h-4 w-4" />;
    case 'blocked': return <Ban className="h-4 w-4" />;
    default: return <Circle className="h-4 w-4" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return 'bg-red-500/20 text-red-600 border-red-500/30';
    case 'high': return 'bg-orange-500/20 text-orange-600 border-orange-500/30';
    case 'medium': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
    case 'low': return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
    default: return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
  }
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'critical': return <AlertCircle className="h-3 w-3" />;
    case 'high': return <AlertCircle className="h-3 w-3" />;
    case 'medium': return <Flag className="h-3 w-3" />;
    case 'low': return <Flag className="h-3 w-3" />;
    default: return <Flag className="h-3 w-3" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'done': return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'in_progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'in_review': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    case 'blocked': return 'bg-red-500/10 text-red-500 border-red-500/20';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

const getImportanceColor = (importance: string) => {
  switch (importance) {
    case 'must': return 'bg-red-100 text-red-800 border-red-200';
    case 'should': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'good-to-have': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'nice-to-have': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getImportanceLabel = (importance: string) => {
  switch (importance) {
    case 'must': return 'Must';
    case 'should': return 'Should';
    case 'good-to-have': return 'Good-to-have';
    case 'nice-to-have': return 'Nice-to-have';
    default: return importance;
  }
};

const getInitials = (name?: string) => {
  if (!name) return '??';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Helper to recursively count all subtasks
const countAllSubtasks = (taskId: string, allSubtasks: TaskCardProps['task'][]): number => {
  const directChildren = allSubtasks.filter(t => t.parent_id === taskId);
  let total = directChildren.length;
  
  directChildren.forEach(child => {
    total += countAllSubtasks(child.id, allSubtasks);
  });
  
  return total;
};

// Recursive Subtask Component
const SubtaskCard: React.FC<{
  subtask: TaskCardProps['task'];
  depth: number;
  onClick: (taskId: string) => void;
  subtaskAttachments: Record<string, TaskAttachment[]>;
  allSubtasks: TaskCardProps['task'][];
}> = ({
  subtask,
  depth,
  onClick,
  subtaskAttachments,
  allSubtasks,
}) => {
  const childSubtasks = allSubtasks.filter(t => t.parent_id === subtask.id);
  const totalNestedSubtasks = countAllSubtasks(subtask.id, allSubtasks);
  const marginLeft = depth * 16; // 16px per depth level

  return (
    <div
      className="border-l-2 border-muted hover:border-primary/50 transition-colors"
      style={{ marginLeft: `${marginLeft}px` }}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          onClick(subtask.id);
        }}
        className="flex items-start gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
      >
        <CornerDownRight className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{subtask.title}</div>
          {subtask.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {subtask.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className={cn('text-xs', getStatusColor(subtask.status))}>
              {getStatusIcon(subtask.status)}
              <span className="ml-1">{subtask.status.replace('_', ' ')}</span>
            </Badge>
            <Badge variant="outline" className={cn('text-xs border', getPriorityColor(subtask.priority))}>
              {getPriorityIcon(subtask.priority)}
              <span className="ml-1 capitalize">{subtask.priority}</span>
            </Badge>
            {subtask.importance && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className={cn('text-xs border cursor-help', getImportanceColor(subtask.importance))}>
                      {getImportanceLabel(subtask.importance)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">{subtask.importance_reason || 'No reason available'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {!subtask.importance && (
              <Badge variant="outline" className="text-xs border-dashed text-muted-foreground">
                No importance
              </Badge>
            )}
            {subtask.assignee_name && (
              <span className="text-xs text-muted-foreground truncate">
                → {subtask.assignee_name}
              </span>
            )}
            {subtaskAttachments[subtask.id] && subtaskAttachments[subtask.id].length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Paperclip className="h-3 w-3" />
                {subtaskAttachments[subtask.id].length}
              </div>
            )}
            {totalNestedSubtasks > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ListTree className="h-3 w-3" />
                {totalNestedSubtasks}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Recursively render child subtasks with Accordion */}
      {childSubtasks.length > 0 && (
        <Accordion type="single" collapsible className="mt-1">
          <AccordionItem value="child-subtasks" className="border-none">
            <AccordionTrigger className="px-2 py-1 hover:no-underline hover:bg-muted/30 text-xs">
              <div className="flex items-center gap-1">
                <ListTree className="h-3 w-3" />
                <span>{childSubtasks.length} subtask{childSubtasks.length !== 1 ? 's' : ''}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-1">
              <div className="space-y-2">
                {childSubtasks.map((child) => (
                  <SubtaskCard
                    key={child.id}
                    subtask={child}
                    depth={depth + 1}
                    onClick={onClick}
                    subtaskAttachments={subtaskAttachments}
                    allSubtasks={allSubtasks}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  attachments = [],
  onClick, 
  onRemoveFromProject,
  onRemoveFromProduct, 
  onDelete,
  showActions = false,
  subtasks = [],
  subtaskAttachments = {},
  onAddSubtask,
  onImportanceChange,
  onAIAssignImportance,
  isAssigningImportance = false,
}) => {
  const imageAttachments = attachments.filter(
    (att) => att.attachment_type === 'file' && att.file_type?.startsWith('image/')
  );
  const otherAttachments = attachments.filter(
    (att) => att.attachment_type !== 'file' || !att.file_type?.startsWith('image/')
  );
  
  // Calculate total nested subtasks count
  const totalSubtasksCount = countAllSubtasks(task.id, subtasks);
  
  // Count importance levels in subtasks - only for THIS task's subtasks
  const importanceCounts = React.useMemo(() => {
    const counts = { must: 0, should: 0, 'good-to-have': 0, 'nice-to-have': 0, none: 0 };
    const countImportance = (parentId: string) => {
      const children = subtasks.filter(t => t.parent_id === parentId);
      children.forEach(subtask => {
        if (subtask.importance) {
          counts[subtask.importance as keyof typeof counts]++;
        } else {
          counts.none++;
        }
        // Recursively count nested subtasks
        countImportance(subtask.id);
      });
    };
    // Start counting from THIS task's children only
    countImportance(task.id);
    return counts;
  }, [subtasks, task.id]);

  const handleImportanceChange = async (value: string) => {
    if (onImportanceChange) {
      onImportanceChange(task.id, value === 'none' ? null : value);
    }
  };

  return (
    <div className="rounded-lg border bg-card transition-all hover:bg-accent/50">
      <div className="group p-3 cursor-pointer" onClick={() => onClick(task.id)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn('flex-shrink-0', getPriorityColor(task.priority))}>
                {getTypeIcon(task.type)}
              </span>
              <h4 className="text-sm font-medium text-foreground truncate">
                {task.title}
              </h4>
              {totalSubtasksCount > 0 && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <ListTree className="h-3 w-3" />
                  {totalSubtasksCount}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Module badge */}
              {task.module && (
                <Badge variant="secondary" className="text-xs">
                  {task.module}
                </Badge>
              )}
              
              {/* Show importance counts for parent tasks with subtasks */}
              {!task.parent_id && totalSubtasksCount > 0 && (
                <>
                  {importanceCounts.must > 0 && (
                    <Badge className="text-xs border bg-red-100 text-red-800 border-red-200">
                      Must: {importanceCounts.must}
                    </Badge>
                  )}
                  {importanceCounts.should > 0 && (
                    <Badge className="text-xs border bg-orange-100 text-orange-800 border-orange-200">
                      Should: {importanceCounts.should}
                    </Badge>
                  )}
                  {importanceCounts['good-to-have'] > 0 && (
                    <Badge className="text-xs border bg-blue-100 text-blue-800 border-blue-200">
                      Good: {importanceCounts['good-to-have']}
                    </Badge>
                  )}
                  {importanceCounts['nice-to-have'] > 0 && (
                    <Badge className="text-xs border bg-gray-100 text-gray-800 border-gray-200">
                      Nice: {importanceCounts['nice-to-have']}
                    </Badge>
                  )}
                </>
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

            {/* Subtask count indicator */}
            {!task.parent_id && totalSubtasksCount > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                <ListTree className="h-3 w-3" />
                <span className="text-xs font-medium">{totalSubtasksCount}</span>
              </div>
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
      </div>

      {/* Subtasks - Accordion (collapsed by default) */}
      {!task.parent_id && totalSubtasksCount > 0 && (
        <Accordion type="single" collapsible className="border-t border-border/50">
          <AccordionItem value="subtasks" className="border-none">
            <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-muted/30">
              <div className="flex items-center gap-2 text-sm">
                <ListTree className="h-4 w-4" />
                <span className="font-medium">{totalSubtasksCount} Subtask{totalSubtasksCount !== 1 ? 's' : ''}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-2">
              <div className="ml-3 pl-3 border-l-2 border-muted space-y-2">
                {subtasks.filter(st => st.parent_id === task.id).map((subtask) => (
                  <SubtaskCard
                    key={subtask.id}
                    subtask={subtask}
                    depth={0}
                    onClick={onClick}
                    subtaskAttachments={subtaskAttachments}
                    allSubtasks={subtasks}
                  />
                ))}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 mt-2">
                {onAddSubtask && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-7 text-xs text-muted-foreground hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddSubtask(task.id);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Subtask
                  </Button>
                )}
                {onAIAssignImportance && importanceCounts.none > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-7 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAIAssignImportance(task.id);
                    }}
                    disabled={isAssigningImportance}
                  >
                    {isAssigningImportance ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3 mr-1" />
                    )}
                    AI Assign ({importanceCounts.none})
                  </Button>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Add Subtask Button for tasks without subtasks */}
      {!task.parent_id && totalSubtasksCount === 0 && onAddSubtask && (
        <div className="border-t border-border/50 px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs text-muted-foreground hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              onAddSubtask(task.id);
            }}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Subtask
          </Button>
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50 px-3 pb-3">
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
                      onClick(task.id);
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
