
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/SecureAuthContext';
import { 
  Users, 
  FileText, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    totalCustomers: number;
    completedCases: number;
    pendingCases: number;
    totalRevenue: number;
  };
  selectedMonths?: number[];
  revenueYear?: number;
  onWidgetClick?: (widget: 'applications' | 'revenue') => void;
  activeWidget?: 'applications' | 'revenue';
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ 
  stats, 
  selectedMonths, 
  revenueYear, 
  onWidgetClick,
  activeWidget = 'applications'
}) => {
  const { isAdmin } = useAuth();
  const completionRate = stats.totalCustomers > 0 ? (stats.completedCases / stats.totalCustomers) * 100 : 0;
  
  // Generate description for admin revenue based on selected months
  const getRevenueDescription = () => {
    if (!isAdmin) return "From your completed cases only";
    
    if (!selectedMonths || selectedMonths.length === 0) {
      return "No months selected";
    }
    
    if (selectedMonths.length === 1) {
      const monthName = new Date(2000, selectedMonths[0] - 1).toLocaleString('default', { month: 'long' });
      return `${monthName} ${revenueYear} completed cases`;
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
      title: isAdmin ? "Total Active Applications" : "My Active Applications",
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
    },
    // Keep these stats for display but not as clickable widgets
    {
      id: 'completed-display',
      title: "Completed Cases",
      value: stats.completedCases,
      icon: CheckCircle,
      description: `${completionRate.toFixed(1)}% completion rate`,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/50",
      borderColor: "border-green-200 dark:border-green-800",
      trend: stats.completedCases > 0 ? "up" : null,
      subtitle: "Successfully processed",
      badge: null
    },
    {
      id: 'pending-display',
      title: "Active Cases",
      value: stats.pendingCases,
      icon: Clock,
      description: "Currently in progress",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/50",
      borderColor: "border-orange-200 dark:border-orange-800",
      trend: stats.pendingCases > 5 ? "attention" : null,
      subtitle: "In progress",
      badge: null
    }
  ];

  const handleCardClick = (cardId: string) => {
    if (onWidgetClick && (cardId === 'applications' || cardId === 'revenue')) {
      onWidgetClick(cardId as 'applications' | 'revenue');
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => {
        const isActive = activeWidget === stat.id;
        const isClickable = onWidgetClick !== undefined && (stat.id === 'applications' || stat.id === 'revenue');
        
        return (
          <Card 
            key={`stat-${stat.title.replace(/\s+/g, '-').toLowerCase()}`}
            className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg border-l-4 ${stat.borderColor} bg-gradient-to-br from-background to-muted/20 ${
              isClickable ? 'cursor-pointer hover:scale-105' : ''
            } ${
              isActive ? 'ring-2 ring-primary ring-offset-2 shadow-lg scale-105' : ''
            }`}
            onClick={() => isClickable && handleCardClick(stat.id)}
          >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  {stat.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {stat.badge}
                    </Badge>
                  )}
                  {isActive && (
                    <Badge variant="default" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>
              <p className="text-xs text-muted-foreground/70">
                {stat.subtitle}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${stat.bgColor} ring-1 ring-border/20`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-3xl font-bold tracking-tight">
                  {typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {stat.description}
                </p>
              </div>
              {stat.trend && (
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                  stat.trend === 'up' 
                    ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/20' 
                    : stat.trend === 'attention'
                    ? 'text-orange-700 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20'
                    : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStats;
