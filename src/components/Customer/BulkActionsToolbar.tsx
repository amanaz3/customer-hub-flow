import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  X, 
  ArrowRightLeft,
  Loader2,
  XCircle,
  CheckCircle,
  DollarSign,
  ChevronDown,
  FileCheck,
  FileX,
  RefreshCw
} from 'lucide-react';

interface BulkActionsToolbarProps {
  selectedCount: number;
  isVisible: boolean;
  onClearSelection: () => void;
  onReassignSelected?: () => void;
  onRejectSelected?: () => void;
  onApproveSelected?: () => void;
  onMarkAsPaidSelected?: () => void;
  onCompletedSelected?: () => void;
  isLoading?: boolean;
  mode?: 'customers' | 'applications';
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  isVisible,
  onClearSelection,
  onReassignSelected,
  onRejectSelected,
  onApproveSelected,
  onMarkAsPaidSelected,
  onCompletedSelected,
  isLoading = false,
  mode = 'customers'
}) => {
  if (!isVisible) return null;

  return (
    <Card className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 shadow-2xl border-2 border-primary/20 bg-background backdrop-blur-md animate-slide-in-right">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Selection Info */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/15 animate-scale-in">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="px-2.5 py-0.5 font-semibold bg-primary text-primary-foreground">
                {selectedCount}
              </Badge>
              <span className="text-sm font-medium text-foreground">
                {selectedCount === 1 ? 'application' : 'applications'} selected
              </span>
            </div>
          </div>
        </div>

        <div className="h-8 w-px bg-border/60" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          {mode === 'customers' && onReassignSelected && (
            <Button
              variant="default"
              size="sm"
              onClick={onReassignSelected}
              disabled={isLoading}
              className="shadow-md hover:shadow-lg transition-all"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowRightLeft className="h-4 w-4 mr-2" />
              )}
              Reassign
            </Button>
          )}

          {mode === 'applications' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  disabled={isLoading}
                  className="shadow-md hover:shadow-lg transition-all bg-primary hover:bg-primary/90"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Change Status
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background border-border z-[60]">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  Update {selectedCount} application{selectedCount !== 1 ? 's' : ''} to:
                </div>
                <DropdownMenuSeparator />
                
                {onApproveSelected && (
                  <DropdownMenuItem
                    onClick={onApproveSelected}
                    disabled={isLoading}
                    className="cursor-pointer focus:bg-green-50 dark:focus:bg-green-950/20"
                  >
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600 dark:text-green-500" />
                    <span className="font-medium">Approve</span>
                  </DropdownMenuItem>
                )}

                {onMarkAsPaidSelected && (
                  <DropdownMenuItem
                    onClick={onMarkAsPaidSelected}
                    disabled={isLoading}
                    className="cursor-pointer focus:bg-green-50 dark:focus:bg-green-950/20"
                  >
                    <DollarSign className="h-4 w-4 mr-2 text-green-700 dark:text-green-600" />
                    <span className="font-medium">Mark as Paid</span>
                  </DropdownMenuItem>
                )}

                {onCompletedSelected && (
                  <DropdownMenuItem
                    onClick={onCompletedSelected}
                    disabled={isLoading}
                    className="cursor-pointer focus:bg-purple-50 dark:focus:bg-purple-950/20"
                  >
                    <FileCheck className="h-4 w-4 mr-2 text-purple-600 dark:text-purple-500" />
                    <span className="font-medium">Mark Completed</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                {onRejectSelected && (
                  <DropdownMenuItem
                    onClick={onRejectSelected}
                    disabled={isLoading}
                    className="cursor-pointer focus:bg-red-50 dark:focus:bg-red-950/20"
                  >
                    <XCircle className="h-4 w-4 mr-2 text-red-600 dark:text-red-500" />
                    <span className="font-medium text-red-600 dark:text-red-400">Reject</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            disabled={isLoading}
            className="shadow-sm hover:shadow-md transition-all"
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>
    </Card>
  );
};