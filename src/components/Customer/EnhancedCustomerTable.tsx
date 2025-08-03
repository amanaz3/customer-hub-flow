import React, { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Customer } from '@/types/customer';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useTableSelection } from '@/hooks/useTableSelection';
import { useBulkReassignment } from '@/hooks/useBulkReassignment';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { BulkActionsToolbar } from './BulkActionsToolbar';
import { ReassignBulkDialog } from './ReassignBulkDialog';
import { 
  Phone, 
  Building2, 
  Mail, 
  Calendar, 
  DollarSign,
  ChevronRight,
  User,
  AlertTriangle
} from 'lucide-react';

interface EnhancedCustomerTableProps {
  customers: Customer[];
  onDataChange?: () => void;
}

// Hook to fetch user information
const useUserInfo = (userId?: string) => {
  return useQuery({
    queryKey: ['user-info', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', userId)
        .single();
      
      if (error) return null;
      return data;
    },
    enabled: !!userId
  });
};

// Component to display submitted by information
const SubmittedByCell = memo(({ userId }: { userId?: string }) => {
  const { data: userInfo } = useUserInfo(userId);
  
  if (!userInfo) {
    return <span className="text-muted-foreground text-sm">Unknown</span>;
  }
  
  return (
    <div className="text-sm">
      <div className="font-medium">{userInfo.name}</div>
      <div className="text-muted-foreground text-xs">{userInfo.email}</div>
    </div>
  );
});

SubmittedByCell.displayName = 'SubmittedByCell';

// Status badge component
const StatusBadge = memo(({ status }: { status: string }) => {
  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'complete': return 'bg-status-complete text-status-complete-foreground';
      case 'approved': return 'bg-status-approved text-status-approved-foreground';
      case 'submitted': return 'bg-status-submitted text-status-submitted-foreground';
      case 'returned': return 'bg-status-returned text-status-returned-foreground';
      case 'rejected': return 'bg-status-rejected text-status-rejected-foreground';
      default: return 'bg-status-draft text-status-draft-foreground';
    }
  };

  return (
    <Badge 
      variant="outline"
      className={cn(
        "px-3 py-1 text-xs font-medium border-0",
        getStatusVariant(status)
      )}
    >
      {status}
    </Badge>
  );
});

StatusBadge.displayName = 'StatusBadge';

// Enhanced mobile card with selection
const CustomerMobileCard = memo(({ 
  customer, 
  isSelected = false,
  onToggleSelection,
  showSelection = false,
  onClick 
}: { 
  customer: Customer; 
  isSelected?: boolean;
  onToggleSelection?: () => void;
  showSelection?: boolean;
  onClick: (e: React.MouseEvent) => void;
}) => {
  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-all duration-200",
        isSelected && "ring-2 ring-primary/50 bg-muted/30"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header with selection */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              {showSelection && (
                <div onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={onToggleSelection}
                  />
                </div>
              )}
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground">{customer.name}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{customer.email}</span>
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
          </div>

          {/* Content */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{customer.mobile}</span>
            </div>

            {customer.company && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{customer.company}</span>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Submitted by:</div>
              <SubmittedByCell userId={customer.user_id} />
            </div>

            <div className="flex items-center justify-between">
              <StatusBadge status={customer.status} />
              <div className="flex items-center gap-1 text-sm font-medium">
                <DollarSign className="h-3 w-3" />
                <span>{customer.amount?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

CustomerMobileCard.displayName = 'CustomerMobileCard';

// Enhanced customer row with selection
const CustomerRow = memo(({ 
  customer, 
  isSelected = false,
  onToggleSelection,
  showSelection = false,
  onClick 
}: { 
  customer: Customer; 
  isSelected?: boolean;
  onToggleSelection?: () => void;
  showSelection?: boolean;
  onClick: (e: React.MouseEvent) => void;
}) => {
  return (
    <TableRow 
      className={cn(
        "cursor-pointer hover:bg-muted/50 transition-colors",
        isSelected && "bg-muted/30 border-l-4 border-l-primary"
      )}
      onClick={onClick}
    >
      {/* Selection checkbox */}
      {showSelection && (
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelection}
          />
        </TableCell>
      )}
      
      {/* Customer Info */}
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium">{customer.name}</div>
          <div className="text-sm text-muted-foreground">{customer.mobile}</div>
          {customer.company && (
            <div className="text-sm text-muted-foreground">{customer.company}</div>
          )}
        </div>
      </TableCell>

      {/* Product */}
      <TableCell>
        <span className="text-sm">No product</span>
      </TableCell>

      {/* Submitted by */}
      <TableCell>
        <SubmittedByCell userId={customer.user_id} />
      </TableCell>

      {/* Amount */}
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1 font-medium">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span>{customer.amount?.toLocaleString() || '0'}</span>
        </div>
      </TableCell>

      {/* Status */}
      <TableCell>
        <StatusBadge status={customer.status} />
      </TableCell>
    </TableRow>
  );
});

CustomerRow.displayName = 'CustomerRow';

const EnhancedCustomerTable: React.FC<EnhancedCustomerTableProps> = ({ 
  customers, 
  onDataChange 
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isAdmin } = useAuth();
  
  // Selection management - only for admin users
  const selection = isAdmin ? useTableSelection(customers) : null;
  const { reassignCustomers, isLoading: isReassigning } = useBulkReassignment();
  
  // Dialog state
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);

  const handleRowClick = (customerId: string, event: React.MouseEvent) => {
    // Don't navigate if clicking on checkbox or other interactive elements
    if ((event.target as HTMLElement).closest('input, button')) {
      return;
    }
    navigate(`/customers/${customerId}`);
  };

  const handleBulkReassign = async (customerIds: string[], newUserId: string, reason: string) => {
    try {
      await reassignCustomers(customerIds, newUserId, reason);
      selection?.clearSelection();
      onDataChange?.();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const selectedCustomers = selection?.getSelectedItems() || [];

  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Mobile bulk actions */}
        {isAdmin && selection && (
          <BulkActionsToolbar
            selectedCount={selection.selectedCount}
            isVisible={selection.selectedCount > 0}
            onClearSelection={selection.clearSelection}
            onReassignSelected={() => setIsReassignDialogOpen(true)}
            isLoading={isReassigning}
          />
        )}

        {customers.map((customer) => (
          <CustomerMobileCard 
            key={customer.id} 
            customer={customer}
            isSelected={selection?.isSelected(customer.id) || false}
            onToggleSelection={() => selection?.toggleItem(customer.id)}
            showSelection={isAdmin}
            onClick={(e) => handleRowClick(customer.id, e)}
          />
        ))}

        {/* Reassignment Dialog */}
        {isAdmin && (
          <ReassignBulkDialog
            isOpen={isReassignDialogOpen}
            onClose={() => setIsReassignDialogOpen(false)}
            selectedCustomers={selectedCustomers}
            onReassign={handleBulkReassign}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Toolbar */}
      {isAdmin && selection && (
        <BulkActionsToolbar
          selectedCount={selection.selectedCount}
          isVisible={selection.selectedCount > 0}
          onClearSelection={selection.clearSelection}
          onReassignSelected={() => setIsReassignDialogOpen(true)}
          isLoading={isReassigning}
        />
      )}

      {/* Desktop Table */}
      <Card className="shadow-sm border-0 bg-gradient-to-br from-card to-card/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50">
                {/* Selection checkbox for admin */}
                {isAdmin && selection && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selection.isAllSelected}
                      onCheckedChange={selection.toggleAll}
                    />
                  </TableHead>
                )}
                <TableHead className="min-w-[200px]">Customer Info</TableHead>
                <TableHead className="min-w-[120px]">Product</TableHead>
                <TableHead className="min-w-[150px]">Submitted by</TableHead>
                <TableHead className="min-w-[100px] text-right">Amount</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <CustomerRow 
                  key={customer.id} 
                  customer={customer}
                  isSelected={selection?.isSelected(customer.id) || false}
                  onToggleSelection={() => selection?.toggleItem(customer.id)}
                  showSelection={isAdmin}
                  onClick={(e) => handleRowClick(customer.id, e)}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reassignment Dialog */}
      {isAdmin && (
        <ReassignBulkDialog
          isOpen={isReassignDialogOpen}
          onClose={() => setIsReassignDialogOpen(false)}
          selectedCustomers={selectedCustomers}
          onReassign={handleBulkReassign}
        />
      )}
    </div>
  );
};

export default EnhancedCustomerTable;