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
  mode = 'customers'
}) => {
  if (!isVisible) return null;

  return (
    <Card className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 shadow-xl border-primary/20 bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-4 p-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1">
              {selectedCount} selected
            </Badge>
            <span className="text-sm text-muted-foreground">
              {selectedCount === 1 ? 'application' : 'applications'}
            </span>
          </div>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          {mode === 'customers' && onReassignSelected && (
            <Button
              variant="default"
              size="sm"
              onClick={onReassignSelected}
              disabled={isLoading}
              className="shadow-sm"
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
                  variant="default"
                  size="sm"
                  disabled={isLoading}
                  className="shadow-sm"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                  )}
                  Change Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {(Object.keys(STATUS_CONFIG) as ApplicationStatus[]).map((status) => {
                  const config = STATUS_CONFIG[status];
                  const Icon = config.icon;
                  return (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => onStatusChange(status)}
                      className={`${config.bgColor} ${config.hoverColor} cursor-pointer`}
                    >
                      <Icon className={`h-4 w-4 mr-2 ${config.color}`} />
                      <span className={config.color}>{config.label}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            disabled={isLoading}
            className="shadow-sm"
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>
    </Card>
  );
};