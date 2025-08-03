
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  const { userCustomers, activeCustomers, completedCustomers } = useMemo(() => {
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
    
    // Filter customers by status for tabs
    const active = baseCustomers.filter(customer => 
      customer.status !== 'Complete' && 
      customer.status !== 'Paid' && 
      customer.status !== 'Rejected'
    );
    const completed = baseCustomers.filter(customer => 
      customer.status === 'Complete'
    );

    return {
      userCustomers: baseCustomers,
      activeCustomers: active,
      completedCustomers: completed
    };
  }, [customers, filteredCustomers, userFilteredCustomers, isAdmin, user?.id, getCustomersByUserId]);

  // Table selection for bulk operations (admin only)
  const activeSelection = useTableSelection(activeCustomers);
  const completedSelection = useTableSelection(completedCustomers);

  const handleNewApplication = () => navigate('/customers/new');

  const handleBulkReassign = async (customerIds: string[], newUserId: string, reason: string) => {
    await reassignCustomers(customerIds, newUserId, reason);
    // Clear selections after successful reassignment
    activeSelection.clearSelection();
    completedSelection.clearSelection();
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
          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">Active Applications</TabsTrigger>
              <TabsTrigger value="completed">Completed Applications</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active">
              <Card>
                <CardHeader>
                  <CardTitle>Active Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <OptimizedCustomerTable 
                    customers={activeCustomers} 
                    enableBulkSelection={isAdmin}
                    selection={activeSelection}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="completed">
              <Card>
                <CardHeader>
                  <CardTitle>Completed Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <OptimizedCustomerTable 
                    customers={completedCustomers} 
                    enableBulkSelection={isAdmin}
                    selection={completedSelection}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </LazyWrapper>

        {/* Bulk Actions Toolbar - Only for admins */}
        {isAdmin && (
          <>
            <BulkActionsToolbar
              selectedCount={activeSelection.selectedCount + completedSelection.selectedCount}
              isVisible={(activeSelection.selectedCount + completedSelection.selectedCount) > 0}
              onClearSelection={() => {
                activeSelection.clearSelection();
                completedSelection.clearSelection();
              }}
              onReassignSelected={() => setShowBulkDialog(true)}
              isLoading={isBulkLoading}
            />

            <ReassignBulkDialog
              isOpen={showBulkDialog}
              onClose={() => setShowBulkDialog(false)}
              selectedCustomers={[
                ...activeSelection.getSelectedItems(),
                ...completedSelection.getSelectedItems()
              ]}
              onReassign={handleBulkReassign}
            />
          </>
        )}
      </div>
    );
  };

export default memo(CustomerList);
