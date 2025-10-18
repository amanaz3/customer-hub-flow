
import React, { memo, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer } from '@/types/customer';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useCustomers } from '@/contexts/CustomerContext';
import { useTableSelection } from '@/hooks/useTableSelection';
import { useBulkReassignment } from '@/hooks/useBulkReassignment';
import AdminFilters from '@/components/Admin/AdminFilters';
import CustomerStatusFilter from '@/components/Customer/CustomerStatusFilter';
import OptimizedCustomerTable from '@/components/Customer/OptimizedCustomerTable';
import { BulkActionsToolbar } from '@/components/Customer/BulkActionsToolbar';
import { ReassignBulkDialog } from '@/components/Customer/ReassignBulkDialog';
import LazyWrapper from '@/components/Performance/LazyWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

const CustomerList = () => {
  const { user, isAdmin } = useAuth();
  const { customers, getCustomersByUserId } = useCustomers();
  const navigate = useNavigate();
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [userFilteredCustomers, setUserFilteredCustomers] = useState<Customer[]>([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);

  // Initialize bulk reassignment functionality for admins only
  const { reassignCustomers, isLoading: isBulkLoading } = useBulkReassignment();

  const { userCustomers, activeCustomers } = useMemo(() => {
    let baseCustomers: Customer[];
    
    if (isAdmin) {
      // For admins, use admin-filtered customers or all customers
      baseCustomers = filteredCustomers.length > 0 ? filteredCustomers : customers;
    } else {
      // For regular users, get their own customers first
      const ownCustomers = getCustomersByUserId(user?.id || '');
      // Then apply user status filter if any
      baseCustomers = userFilteredCustomers.length > 0 ? userFilteredCustomers : ownCustomers;
    }
    
    // Get current month and year for comparison
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Filter customers to exclude:
    // 1. All rejected applications
    // 2. Paid/Complete from previous months (keep current month)
    const active = baseCustomers.filter(customer => {
      // Always exclude rejected
      if (customer.status === 'Rejected') {
        return false;
      }
      
      // For Paid and Complete status, check if it's from current month
      if (customer.status === 'Paid' || customer.status === 'Complete') {
        const customerDate = new Date(customer.updated_at || customer.created_at || '');
        const customerMonth = customerDate.getMonth();
        const customerYear = customerDate.getFullYear();
        
        // Only show if it's from current month
        return customerMonth === currentMonth && customerYear === currentYear;
      }
      
      // Show all other statuses (Draft, Submitted, In Progress, etc.)
      return true;
    });

    return {
      userCustomers: baseCustomers,
      activeCustomers: active
    };
  }, [customers, filteredCustomers, userFilteredCustomers, isAdmin, user?.id, getCustomersByUserId]);

  // Table selection for bulk operations (admin only)
  const activeSelection = useTableSelection(activeCustomers);

  const handleNewApplication = () => navigate('/customers/new');

  const handleBulkReassign = async (customerIds: string[], newUserId: string, reason: string) => {
    await reassignCustomers(customerIds, newUserId, reason);
    // Clear selections after successful reassignment
    activeSelection.clearSelection();
    setShowBulkDialog(false);
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {isAdmin ? 'All Applications' : 'My Applications'}
            </h1>
            <p className="text-muted-foreground">
              {isAdmin 
                ? 'Manage all customer applications' 
                : 'View and manage your applications'
              }
            </p>
          </div>
          <Button
            onClick={handleNewApplication}
            className="mt-4 md:mt-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Application
          </Button>
        </div>
        
        {/* Admin Filters */}
        {isAdmin && (
          <AdminFilters
            customers={customers}
            onFilteredCustomers={setFilteredCustomers}
          />
        )}

        {/* User Status Filter - only for non-admin users */}
        {!isAdmin && (
          <CustomerStatusFilter
            customers={getCustomersByUserId(user?.id || '')}
            onFilteredCustomers={setUserFilteredCustomers}
          />
        )}

        <LazyWrapper>
          <Card>
            <CardHeader>
              <CardTitle>Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <OptimizedCustomerTable 
                customers={activeCustomers} 
                enableBulkSelection={isAdmin}
                selection={activeSelection}
              />
            </CardContent>
          </Card>
        </LazyWrapper>

        {/* Bulk Actions Toolbar - Only for admins */}
        {isAdmin && (
          <>
            <BulkActionsToolbar
              selectedCount={activeSelection.selectedCount}
              isVisible={activeSelection.selectedCount > 0}
              onClearSelection={() => {
                activeSelection.clearSelection();
              }}
              onReassignSelected={() => setShowBulkDialog(true)}
              isLoading={isBulkLoading}
            />

            <ReassignBulkDialog
              isOpen={showBulkDialog}
              onClose={() => setShowBulkDialog(false)}
              selectedCustomers={activeSelection.getSelectedItems()}
              onReassign={handleBulkReassign}
            />
          </>
        )}
      </div>
    );
  };

export default memo(CustomerList);
