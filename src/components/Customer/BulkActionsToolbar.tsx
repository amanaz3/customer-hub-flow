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
  DollarSign
} from 'lucide-react';

interface BulkActionsToolbarProps {
  selectedCount: number;
  isVisible: boolean;
  onClearSelection: () => void;
  onReassignSelected?: () => void;
  onRejectSelected?: () => void;
  onApproveSelected?: () => void;
  onMarkAsPaidSelected?: () => void;
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

          {mode === 'applications' && (
            <>
              {onRejectSelected && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onRejectSelected}
                  disabled={isLoading}
                  className="shadow-sm bg-red-600 hover:bg-red-700"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject
                </Button>
              )}

              {onApproveSelected && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onApproveSelected}
                  disabled={isLoading}
                  className="shadow-sm bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Approve
                </Button>
              )}

              {onMarkAsPaidSelected && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onMarkAsPaidSelected}
                  disabled={isLoading}
                  className="shadow-sm bg-green-700 hover:bg-green-800"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <DollarSign className="h-4 w-4 mr-2" />
                  )}
                  Mark as Paid
                </Button>
              )}
            </>
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