
import React, { memo, useMemo } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import OptimizedCustomerTable from '@/components/Customer/OptimizedCustomerTable';
import LazyWrapper from '@/components/Performance/LazyWrapper';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useCustomers } from '@/contexts/CustomerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Memoized stat card component
const StatCard = memo(({ title, count, color }: { 
  title: string; 
  count: number; 
  color: string;
}) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className={`text-3xl font-bold ${color}`}>{count}</div>
    </CardContent>
  </Card>
));

StatCard.displayName = 'StatCard';

const OptimizedDashboard = () => {
  const { user, isAdmin } = useAuth();
  const { customers, getCustomersByUserId } = useCustomers();
  
  const { displayCustomers, stats } = useMemo(() => {
    // For regular users, show only their customers
    // For admins, show all customers that are not paid
    const filteredCustomers = isAdmin 
      ? customers.filter(c => c.status !== 'Paid')
      : getCustomersByUserId(user?.id || '').filter(c => c.status !== 'Paid');

    // Calculate all stats in one pass
    const statusCounts = filteredCustomers.reduce((acc, customer) => {
      acc[customer.status] = (acc[customer.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      displayCustomers: filteredCustomers,
      stats: {
        submitted: statusCounts['Submitted'] || 0,
        returned: statusCounts['Returned'] || 0,
        sentToBank: statusCounts['Sent to Bank'] || 0,
        complete: statusCounts['Complete'] || 0,
        rejected: statusCounts['Rejected'] || 0,
        needMoreInfo: statusCounts['Need More Info'] || 0,
      }
    };
  }, [customers, isAdmin, user?.id, getCustomersByUserId]);

  const statCards = useMemo(() => [
    { title: 'Submitted', count: stats.submitted, color: 'text-blue-600' },
    { title: 'Returned', count: stats.returned, color: 'text-orange-600' },
    { title: 'Sent to Bank', count: stats.sentToBank, color: 'text-purple-600' },
    { title: 'Complete', count: stats.complete, color: 'text-green-600' },
    { title: 'Rejected', count: stats.rejected, color: 'text-red-600' },
    { title: 'Need More Info', count: stats.needMoreInfo, color: 'text-yellow-600' },
  ], [stats]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? 'Overview of all customer applications' 
              : 'Overview of your applications'}
          </p>
        </div>

        <LazyWrapper className="min-h-[150px]">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {statCards.map((stat) => (
              <StatCard 
                key={stat.title}
                title={stat.title}
                count={stat.count}
                color={stat.color}
              />
            ))}
          </div>
        </LazyWrapper>

        <div>
          <h2 className="text-xl font-semibold mb-4">Active Applications</h2>
          <LazyWrapper>
            <OptimizedCustomerTable customers={displayCustomers} />
          </LazyWrapper>
        </div>
      </div>
    </MainLayout>
  );
};

export default memo(OptimizedDashboard);
