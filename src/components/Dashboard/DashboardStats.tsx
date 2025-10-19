import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/SecureAuthContext';
import { 
  Users, 
  FileText, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Settings
} from 'lucide-react';
import { useMonthlyTargets } from '@/hooks/useMonthlyTargets';
import { TargetProgressCard } from './TargetProgressCard';
import { TargetSettingsDialog } from './TargetSettingsDialog';

interface DashboardStatsProps {
  stats: {
    totalCustomers: number;
    completedApplications: number;
    submittedApplications: number;
    totalRevenue: number;
  };
  selectedMonths?: number[];
  revenueYear?: number;
  onWidgetClick?: (widget: 'applications' | 'completed' | 'pending' | 'revenue') => void;
  activeWidget?: 'applications' | 'completed' | 'pending' | 'revenue';
  userId?: string;
}

const DashboardStats = ({ 
  stats, 
  selectedMonths, 
  revenueYear, 
  onWidgetClick,
  activeWidget = 'applications',
  userId
}: DashboardStatsProps) => {
  const { isAdmin } = useAuth();
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const completionRate = stats.totalCustomers > 0 ? (stats.completedApplications / stats.totalCustomers) * 100 : 0;
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const { target, performance, progress, setTarget, isSettingTarget } = useMonthlyTargets(
    userId,
    currentMonth,
    currentYear
  );
  
  // Generate description for admin revenue based on selected months
  const getRevenueDescription = () => {
    if (!isAdmin) {
      // Regular users now see CURRENT MONTH only
      const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
      return `From ${currentMonth} completed applications`;
    }
    
    // Admins see dynamic description based on selected months
    if (!selectedMonths || selectedMonths.length === 0) {
      return "All-time completed applications";
    }
    
    if (selectedMonths.length === 1) {
      const monthName = new Date(2000, selectedMonths[0] - 1).toLocaleString('default', { month: 'long' });
      return `${monthName} ${revenueYear} completed applications`;
    }
    
    if (selectedMonths.length === 12) {
      return `All months of ${revenueYear}`;
    }
    
    return `${selectedMonths.length} months of ${revenueYear}`;
  };
  
  const revenueDescription = getRevenueDescription();
  
  const statCards = [
    {
      id: 'applications' as const,
      title: isAdmin ? "Total Applications" : "My Applications",
      value: stats.totalCustomers,
      icon: Users,
      description: isAdmin ? "System-wide applications" : "Applications you submitted",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/50",
      borderColor: "border-blue-200 dark:border-blue-800",
      trend: null,
      subtitle: isAdmin ? "All users" : "Personal",
      badge: isAdmin ? "Admin View" : "User View"
    },
    {
      id: 'completed' as const,
      title: "This Month's Completed",
      value: stats.completedApplications,
      icon: CheckCircle,
      description: `${completionRate.toFixed(1)}% completion rate this month`,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/50",
      borderColor: "border-green-200 dark:border-green-800",
      trend: stats.completedApplications > 0 ? "up" : null,
      subtitle: "This month only",
      badge: null
    },
    {
      id: 'pending' as const,
      title: "Submitted Applications",
      value: stats.submittedApplications,
      icon: Clock,
      description: "Submitted and in progress",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/50",
      borderColor: "border-orange-200 dark:border-orange-800",
      trend: stats.submittedApplications > 5 ? "attention" : null,
      subtitle: "In progress",
      badge: null
    },
    {
      id: 'revenue' as const,
      title: isAdmin ? "Total Revenue" : "My Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      description: revenueDescription,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      trend: stats.totalRevenue > 0 ? "up" : null,
      subtitle: "Revenue generated",
      badge: isAdmin ? "All Users" : "Personal"
    }
  ];

  const handleCardClick = (cardId: 'applications' | 'completed' | 'pending' | 'revenue') => {
    if (onWidgetClick) {
      onWidgetClick(cardId);
    }
  };

  const hasTargets = target && (target.target_applications > 0 || target.target_completed > 0 || target.target_revenue > 0);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {hasTargets ? 'Monthly Progress' : 'Dashboard Overview'}
        </h2>
        {userId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Set Targets
          </Button>
        )}
      </div>

      {hasTargets && userId ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <TargetProgressCard
            title="Total Applications"
            current={performance?.actual_applications || 0}
            target={target.target_applications}
            icon={Users}
            description="Applications created this month"
            progress={progress.applicationsProgress}
            status={progress.applicationsStatus}
            onClick={() => onWidgetClick?.('applications')}
            isActive={activeWidget === 'applications'}
          />
          
          <TargetProgressCard
            title="Completed"
            current={performance?.actual_completed || 0}
            target={target.target_completed || target.target_applications}
            icon={CheckCircle}
            description="Successfully completed applications"
            progress={progress.completedProgress}
            status={progress.completedStatus}
            onClick={() => onWidgetClick?.('completed')}
            isActive={activeWidget === 'completed'}
          />
          
          <TargetProgressCard
            title="Submitted"
            current={stats.submittedApplications}
            target={Math.max(target.target_applications - (performance?.actual_completed || 0), 0)}
            icon={Clock}
            description="Applications in progress"
            progress={progress.applicationsProgress}
            status={progress.applicationsStatus}
            onClick={() => onWidgetClick?.('pending')}
            isActive={activeWidget === 'pending'}
          />
          
          <TargetProgressCard
            title="Revenue"
            current={Number(performance?.actual_revenue || 0)}
            target={target.target_revenue}
            icon={DollarSign}
            description="Total revenue generated"
            progress={progress.revenueProgress}
            status={progress.revenueStatus}
            onClick={() => onWidgetClick?.('revenue')}
            isActive={activeWidget === 'revenue'}
            formatValue={(v) => `AED ${v.toLocaleString()}`}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => {
            const isActive = activeWidget === stat.id;
            const isClickable = onWidgetClick !== undefined;
            
            return (
              <Card 
                key={`stat-${stat.title.replace(/\s+/g, '-').toLowerCase()}`}
                className={`group relative overflow-hidden transition-all duration-300 ease-out border ${stat.borderColor} shadow-sm hover:shadow-lg bg-gradient-to-br from-background to-muted/5 ${
                  isClickable ? 'cursor-pointer hover:-translate-y-1 hover:shadow-xl' : ''
                } ${
                  isActive ? 'ring-2 ring-primary/50 ring-offset-2 shadow-lg -translate-y-1 border-primary/50' : ''
                }`}
                onClick={() => isClickable && handleCardClick(stat.id)}
              >
                {/* Animated gradient overlay */}
                <div className={`absolute inset-0 ${stat.bgColor} opacity-0 group-hover:opacity-30 transition-opacity duration-300`} />
                
                {/* Left accent border */}
                <div className={`absolute left-0 top-0 w-1 h-full ${stat.bgColor.replace('bg-', 'bg-').replace('/50', '')} transition-all duration-300 ${
                  isActive ? 'w-2' : 'group-hover:w-2'
                }`} />
              <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                        {stat.title}
                      </CardTitle>
                      {stat.badge && (
                        <Badge variant="secondary" className="text-xs px-2 py-1 bg-muted/80 text-muted-foreground">
                          {stat.badge}
                        </Badge>
                      )}
                      {isActive && (
                        <Badge variant="default" className="text-xs px-2 py-1 bg-primary/20 text-primary animate-pulse">
                          Active
                        </Badge>
                      )}
                    </div>
                  <p className="text-xs text-muted-foreground/80 font-medium">
                    {stat.subtitle}
                  </p>
                </div>
                <div className={`relative p-3 rounded-xl ${stat.bgColor.replace('/50', '/80')} ring-1 ring-border/30 transition-all duration-300 group-hover:scale-110 group-hover:ring-2 ${
                  isActive ? 'ring-2 ring-primary/50' : ''
                }`}>
                  <stat.icon className={`h-6 w-6 ${stat.color} transition-all duration-300 group-hover:scale-105`} />
                  {isActive && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4 pt-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className={`text-3xl sm:text-4xl font-bold tracking-tight transition-all duration-300 ${
                      isActive ? 'text-primary' : 'text-foreground group-hover:text-primary'
                    }`}>
                      {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground/90 leading-relaxed font-medium max-w-[200px]">
                        {stat.description}
                      </p>
                      {(stat.id === 'completed' || stat.id === 'revenue') && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                          <Clock className="h-3 w-3" />
                          <span>{new Date().toLocaleString('default', { month: 'short', year: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {stat.trend && (
                    <div className={`flex items-center space-x-1 px-3 py-2 rounded-full text-xs font-semibold transition-all duration-300 group-hover:scale-105 ${
                      stat.trend === 'up' 
                        ? 'text-green-700 bg-green-100/80 dark:text-green-400 dark:bg-green-900/30 border border-green-200/50 dark:border-green-800/50' 
                        : stat.trend === 'attention'
                        ? 'text-orange-700 bg-orange-100/80 dark:text-orange-400 dark:bg-orange-900/30 border border-orange-200/50 dark:border-orange-800/50'
                        : 'text-red-700 bg-red-100/80 dark:text-red-400 dark:bg-red-900/30 border border-red-200/50 dark:border-red-800/50'
                    }`}>
                      {stat.trend === 'up' ? (
                        <>
                          <TrendingUp className="h-3 w-3" />
                          <span>Active</span>
                        </>
                      ) : stat.trend === 'attention' ? (
                        <>
                          <Clock className="h-3 w-3" />
                          <span>Review</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-3 w-3" />
                          <span>Down</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Interactive bottom section */}
                <div className={`pt-2 border-t border-border/20 transition-all duration-300 ${
                  isActive ? 'border-primary/30' : 'group-hover:border-primary/20'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground/70 font-medium">
                      {isClickable ? 'Click to view details' : 'Widget data'}
                    </div>
                    {isClickable && (
                      <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        isActive ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30 group-hover:bg-primary'
                      }`} />
                    )}
                  </div>
                </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {userId && (
        <TargetSettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          currentTargets={target || undefined}
          onSave={setTarget}
          isLoading={isSettingTarget}
        />
      )}
    </>
  );
};

export default DashboardStats;
