
import React from 'react';
import DashboardHeader from '@/components/Dashboard/DashboardHeader';
import ApplicationStatusSummary from '@/components/Dashboard/ApplicationStatusSummary';
import { MonthComparisonWidget } from '@/components/Dashboard/MonthComparisonWidget';
import { TrendChart } from '@/components/Dashboard/TrendChart';
import { ForecastWidget } from '@/components/Dashboard/ForecastWidget';
import { InsightsBanner } from '@/components/Dashboard/InsightsBanner';
import { useMonthComparison } from '@/hooks/useMonthComparison';
import { useMonthlyTargets } from '@/hooks/useMonthlyTargets';
import { useForecast } from '@/hooks/useForecast';
import { useAuth } from '@/contexts/SecureAuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const OptimizedDashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // Month-over-month comparison data
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  const { comparison, trend, isLoading: isComparisonLoading } = useMonthComparison(
    isAdmin ? null : user?.id || null,
    currentMonth,
    currentYear
  );
  
  // Get monthly targets for forecast
  const { target, performance } = useMonthlyTargets(
    user?.id,
    currentMonth,
    currentYear
  );
  
  // Calculate forecast
  const forecast = useForecast(
    performance?.actual_applications || 0,
    performance?.actual_completed || 0,
    Number(performance?.actual_revenue || 0),
    target?.target_applications || 0,
    target?.target_completed || 0,
    target?.target_revenue || 0
  );

  const handleCreateCustomer = () => {
    navigate('/customers/new');
  };

  return (
    <div className={cn(
      "space-y-4 xs:space-y-5 sm:space-y-6 lg:space-y-8",
      "pb-4 xs:pb-6 sm:pb-8",
      "max-w-full overflow-hidden"
    )}>
      {/* Enhanced Header */}
      <DashboardHeader
        userName={user?.profile?.name}
        userEmail={user?.email}
        onCreateCustomer={handleCreateCustomer}
      />

      {/* Application Status Summary - Last 30 days counts with link */}
      <ApplicationStatusSummary />

      {/* Insights Banner */}
      {(forecast || comparison) && (
        <InsightsBanner forecast={forecast || undefined} comparison={comparison || undefined} />
      )}

      {/* Month-over-Month Comparison */}
      {comparison && !isComparisonLoading && (
        <MonthComparisonWidget comparison={comparison} />
      )}

      {/* 6-Month Trend Chart */}
      {trend && trend.length > 0 && !isComparisonLoading && (
        <TrendChart data={trend} />
      )}

      {/* Forecast Widget */}
      {forecast && (
        <ForecastWidget forecast={forecast} />
      )}
    </div>
  );
};

export default OptimizedDashboard;
