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

// Enhanced mobile card with selection and better touch targets
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
        "cursor-pointer transition-all duration-200 active:scale-[0.98]",
        "hover:shadow-lg hover:border-primary/20",
        isSelected && "ring-2 ring-primary bg-accent/30 shadow-md"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="space-y-4">
          {/* Header with selection - touch-friendly */}
          <div className="flex items-start gap-3">
            {showSelection && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="pt-1 min-h-[44px] flex items-center"
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={onToggleSelection}
                  className="h-5 w-5"
                />
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10 flex-shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base text-foreground leading-tight">
                    {customer.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                </div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-2" />
          </div>

          {/* Content with improved spacing */}
          <div className="space-y-3 pl-0">
            <div className="flex items-center gap-2.5 min-h-[44px]">
              <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium">{customer.mobile}</span>
            </div>

            {customer.company && (
              <div className="flex items-center gap-2.5 min-h-[44px]">
                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm">{customer.company}</span>
              </div>
            )}

            {/* Info grid for better mobile layout */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Submitted by
                </div>
                <div className="min-h-[40px] flex items-center">
                  <SubmittedByCell userId={customer.user_id} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Lead Source
                </div>
                <div className="min-h-[40px] flex items-center">
                  <span className="text-sm font-medium">{customer.leadSource || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Status and Amount - prominent display */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <StatusBadge status={customer.status} />
              <div className="flex items-center gap-1.5 text-base font-semibold">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
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
        <span className="text-sm">
          {customer.product_id ? 'Product assigned' : 'No product'}
        </span>
      </TableCell>

      {/* Submitted by */}
      <TableCell>
        <SubmittedByCell userId={customer.user_id} />
      </TableCell>

      {/* Lead Source */}
      <TableCell>
        <span className="text-sm">{customer.leadSource || 'N/A'}</span>
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
      <div className="space-y-3 pb-safe">
        {/* Mobile bulk actions - sticky */}
        {isAdmin && selection && selection.selectedCount > 0 && (
          <div className="sticky top-14 z-30 -mx-4 px-4 pb-3 bg-background/95 backdrop-blur-sm">
            <BulkActionsToolbar
              selectedCount={selection.selectedCount}
              isVisible={true}
              onClearSelection={selection.clearSelection}
              onReassignSelected={() => setIsReassignDialogOpen(true)}
              isLoading={isReassigning}
            />
          </div>
        )}

        {/* Customer cards with touch-optimized spacing */}
        <div className="space-y-3">
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
        </div>

        {/* Empty state for mobile */}
        {customers.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
              <h3 className="font-semibold text-foreground mb-2">No customers found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or create a new customer
              </p>
            </CardContent>
          </Card>
        )}

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
      {/* Bulk Actions Toolbar - sticky on desktop */}
      {isAdmin && selection && selection.selectedCount > 0 && (
        <div className="sticky top-16 z-30 -mx-4 px-4 pb-3 bg-background/95 backdrop-blur-sm">
          <BulkActionsToolbar
            selectedCount={selection.selectedCount}
            isVisible={true}
            onClearSelection={selection.clearSelection}
            onReassignSelected={() => setIsReassignDialogOpen(true)}
            isLoading={isReassigning}
          />
        </div>
      )}

      {/* Desktop Table with horizontal scroll */}
      <Card className="shadow-sm border-0 bg-gradient-to-br from-card to-card/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                <TableRow className="border-b border-border/50">
                  {/* Selection checkbox for admin */}
                  {isAdmin && selection && (
                    <TableHead className="w-12 bg-card">
                      <Checkbox
                        checked={selection.isAllSelected}
                        onCheckedChange={selection.toggleAll}
                        className="h-4 w-4"
                      />
                    </TableHead>
                  )}
                  <TableHead className="min-w-[200px] bg-card">Customer Info</TableHead>
                  <TableHead className="min-w-[120px] bg-card">Product</TableHead>
                  <TableHead className="min-w-[150px] bg-card">Submitted by</TableHead>
                  <TableHead className="min-w-[120px] bg-card">Lead Source</TableHead>
                  <TableHead className="min-w-[100px] text-right bg-card">Amount</TableHead>
                  <TableHead className="min-w-[100px] bg-card">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length > 0 ? (
                  customers.map((customer) => (
                    <CustomerRow 
                      key={customer.id} 
                      customer={customer}
                      isSelected={selection?.isSelected(customer.id) || false}
                      onToggleSelection={() => selection?.toggleItem(customer.id)}
                      showSelection={isAdmin}
                      onClick={(e) => handleRowClick(customer.id, e)}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <User className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                      <h3 className="font-semibold text-foreground mb-2">No customers found</h3>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your filters or create a new customer
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Scroll indicator for narrow viewports */}
          {customers.length > 0 && (
            <div className="lg:hidden px-4 py-2 text-center text-xs text-muted-foreground border-t bg-muted/30">
              <span className="inline-flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                Scroll horizontally to view all columns
              </span>
            </div>
          )}
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