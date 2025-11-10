import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Users, 
  X, 
  ArrowRightLeft,
  Loader2,
  XCircle,
  CheckCircle,
  DollarSign,
  FileText,
  Send,
  RotateCcw,
  CheckCheck
} from 'lucide-react';
import { ApplicationStatus } from '@/types/application';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface BulkActionsToolbarProps {
  selectedCount: number;
  isVisible: boolean;
  onClearSelection: () => void;
  onReassignSelected?: () => void;
  onStatusChange?: (status: ApplicationStatus) => void;
  isLoading?: boolean;
  mode?: 'customers' | 'applications';
  selectedStatuses?: ApplicationStatus[];
  isAdmin?: boolean;
}

// Status configuration with UI labels and styling
const STATUS_CONFIG: Record<ApplicationStatus, {
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  hoverColor: string;
}> = {
  draft: {
    label: 'Draft',
    icon: FileText,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    hoverColor: 'hover:bg-yellow-200 dark:hover:bg-yellow-800'
  },
  submitted: {
    label: 'Submitted',
    icon: Send,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    hoverColor: 'hover:bg-blue-200 dark:hover:bg-blue-800'
  },
  returned: {
    label: 'Returned',
    icon: RotateCcw,
    color: 'text-orange-700',
    bgColor: 'bg-orange-100 dark:bg-orange-900',
    hoverColor: 'hover:bg-orange-200 dark:hover:bg-orange-800'
  },
  'need more info': {
    label: 'Need More Info',
    icon: FileText,
    color: 'text-amber-700',
    bgColor: 'bg-amber-100 dark:bg-amber-900',
    hoverColor: 'hover:bg-amber-200 dark:hover:bg-amber-800'
  },
  paid: {
    label: 'Paid',
    icon: DollarSign,
    color: 'text-green-700',
    bgColor: 'bg-green-100 dark:bg-green-900',
    hoverColor: 'hover:bg-green-200 dark:hover:bg-green-800'
  },
  completed: {
    label: 'Completed',
    icon: CheckCheck,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
    hoverColor: 'hover:bg-purple-200 dark:hover:bg-purple-800'
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    color: 'text-red-700',
    bgColor: 'bg-red-100 dark:bg-red-900',
    hoverColor: 'hover:bg-red-200 dark:hover:bg-red-800'
  },
  under_review: {
    label: 'Under Review',
    icon: FileText,
    color: 'text-orange-700',
    bgColor: 'bg-orange-100 dark:bg-orange-900',
    hoverColor: 'hover:bg-orange-200 dark:hover:bg-orange-800'
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    color: 'text-green-700',
    bgColor: 'bg-green-100 dark:bg-green-900',
    hoverColor: 'hover:bg-green-200 dark:hover:bg-green-800'
  }
};

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  isVisible,
  onClearSelection,
  onReassignSelected,
  onStatusChange,
  isLoading = false,
  mode = 'customers',
  selectedStatuses = [],
  isAdmin = false
}) => {
  if (!isVisible) return null;

  // Determine available statuses based on current selection and permissions
  const getAvailableStatuses = (): ApplicationStatus[] => {
    if (mode === 'customers') {
      // For customers mode, keep existing logic
      return (Object.keys(STATUS_CONFIG) as ApplicationStatus[])
        .filter(status => !selectedStatuses.includes(status));
    }

    // For applications mode, enforce specific rules
    const uniqueStatuses = Array.from(new Set(selectedStatuses));
    
    // If all selected applications are rejected
    if (uniqueStatuses.length === 1 && uniqueStatuses[0] === 'rejected') {
      // Only admin can change rejected to submitted
      return isAdmin ? ['submitted'] : [];
    }
    
    // If all selected applications are submitted
    if (uniqueStatuses.length === 1 && uniqueStatuses[0] === 'submitted') {
      // Both admin and users can change submitted to rejected
      return ['rejected'];
    }
    
    // For mixed or other statuses, no bulk status change allowed
    return [];
  };

  const availableStatuses = getAvailableStatuses();
  
  // Hide the entire toolbar if:
  // - Non-admin trying to change rejected applications
  // - No available status options
  if (mode === 'applications') {
    const uniqueStatuses = Array.from(new Set(selectedStatuses));
    const hasRejected = uniqueStatuses.includes('rejected');
    
    // Non-admin cannot bulk change rejected applications
    if (!isAdmin && hasRejected) {
      return null;
    }
    
    // Only show toolbar if applications are rejected or submitted
    const validStatuses = uniqueStatuses.every(s => s === 'rejected' || s === 'submitted');
    if (!validStatuses) {
      return null;
    }
  }

  return (
    <Card className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 shadow-2xl border-2 border-primary bg-gradient-to-r from-primary/95 to-primary/90 backdrop-blur-md">
      <div className="flex items-center gap-4 p-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
            <Users className="h-4 w-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1 bg-white text-primary font-bold">
              {selectedCount} selected
            </Badge>
            <span className="text-sm text-white/90 font-medium">
              {selectedCount === 1 ? 'application' : 'applications'}
            </span>
          </div>
        </div>

        <div className="h-8 w-px bg-white/20" />

        <div className="flex items-center gap-2">
          {mode === 'customers' && onReassignSelected && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onReassignSelected}
              disabled={isLoading}
              className="shadow-md bg-white hover:bg-white/90 text-primary font-semibold"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowRightLeft className="h-4 w-4 mr-2" />
              )}
              Reassign
            </Button>
          )}

          {mode === 'applications' && onStatusChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isLoading}
                  className="shadow-md bg-white hover:bg-white/90 text-primary font-semibold"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                  )}
                  Change Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-64 bg-card/95 backdrop-blur-xl border-2 border-primary/30 shadow-2xl z-[100] p-3 animate-scale-in"
                sideOffset={12}
              >
                <div className="text-xs font-bold text-foreground/70 px-3 py-2 mb-2 uppercase tracking-wider">
                  Select New Status
                </div>
                <DropdownMenuSeparator className="mb-3 bg-border/50" />
                <div className="space-y-1.5">
                  {availableStatuses.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                      No other statuses available
                    </div>
                  ) : (
                    availableStatuses.map((status) => {
                      const config = STATUS_CONFIG[status];
                      const Icon = config.icon;
                      return (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => onStatusChange(status)}
                          className={`
                            ${config.bgColor} ${config.hoverColor} 
                            cursor-pointer rounded-lg px-3 py-2.5
                            border-2 border-transparent
                            hover:border-current hover:shadow-md hover:scale-[1.02]
                            transition-all duration-200 ease-out
                            focus:ring-2 focus:ring-primary/50 focus:outline-none
                            active:scale-[0.98]
                          `}
                        >
                          <Icon className={`h-4 w-4 mr-3 ${config.color}`} />
                          <span className={`${config.color} font-semibold text-sm`}>{config.label}</span>
                        </DropdownMenuItem>
                      );
                    })
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={onClearSelection}
            disabled={isLoading}
            className="shadow-md bg-white/80 hover:bg-white text-primary border border-white/20"
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>
    </Card>
  );
};